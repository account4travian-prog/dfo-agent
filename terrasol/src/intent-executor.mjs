import { readBody, commandBody, stopBody } from './body-runtime.mjs';
import { readNative } from './native-bridge.mjs';
import { createPlaceMemory } from '../vendor/legacy-agent/mind/memory.mjs';
import { createAutopilot } from '../vendor/legacy-agent/mind/autopilot.mjs';
import { navigationFor, walkable, frontiers } from '../vendor/legacy-agent/mind/route.mjs';
const angle = d => ((d + 180) % 360 + 360) % 360 - 180;
const point = p => p && Number.isFinite(p.x) && Number.isFinite(p.z);
const hostiles = state => (state.foes ?? []).filter(f => f.hostile && Number.isFinite(f.dist));
const nearest = state => [...hostiles(state)].sort((a,b)=>a.dist-b.dist)[0] ?? null;
const sameFoe = (a,b) => !!a && !!b && (a.targetId != null || b.targetId != null ? a.targetId != null && a.targetId === b.targetId : JSON.stringify(a)===JSON.stringify(b));
const hpPercent = state => {const v=state.vitals ?? {}; const max=v.maxHealth ?? v.healthMax; return Number.isFinite(v.health) && Number.isFinite(max) && max>0 ? 100*v.health/max : null;};
export { createPlaceMemory };
// `memory` is the caller's so that what Rowan has seen outlives this executor: a hold, pause or stop replaces the
// executor, and a fresh map would leave explore with no known ground right after every resume.
export function createIntentExecutor({page, emit = () => {}, now = () => Date.now(), transport, exploration, memory = createPlaceMemory()} = {}) {
  const io = transport ?? {native: after => readNative(page, after), body: after => readBody(page, after), command: (m,a,expected) => commandBody(page,m,a,expected), stop: () => stopBody(page)};
  const hand=exploration??createAutopilot({now});
  let task=null, counter=0, cursor=0, nativeCursor=0, savedPolicy=null, initial=null, identity=null, snapshot=null;
  function publish() {try {emit({type:'intent',task:structuredClone(task)});}catch(e){task.loggingError=e.message;}}
  async function command(method,arg) { const r=await io.command(method,arg,identity); if (!r?.ok) throw Error((r?.errors ?? ['Body command failed']).join('; ')); return r; }
  async function cleanup() {
    const errors=[];
    try { const r=await io.stop(); if(r?.ok!==true)throw Error('stop not acknowledged'); }
    catch(e) { errors.push(`stop: ${e.message}`); }
    // Never restore an executing policy until physical stop has been acknowledged.
    if(!errors.length) {
      if(identity && ['fight','retreat'].includes(task.kind)) {
        try { const r=await io.command('setCombatGuard',null,{...identity,allowSceneChange:true}); if(r?.ok===false && !r.errors?.some(x=>/changed/.test(x)))throw Error(r.errors?.join('; ')||'guard cleanup refused'); }
        catch(e) {errors.push(`combat guard: ${e.message}`);}
      }
      if(identity&&task.kind==='use'){try{const r=await io.command('setUseTarget',null,{...identity,allowSceneChange:true});if(r?.ok===false&&!r.errors?.some(x=>/changed/.test(x)))throw Error('use target cleanup refused');}catch(e){errors.push(e.message);}}
      if(savedPolicy) {
        try { const r=await io.command('setPolicy',savedPolicy,{...identity,allowSceneChange:true}); if(r?.ok===false && !r.errors?.some(x=>/changed/.test(x)))throw Error(r.errors?.join('; ')||'policy cleanup refused'); savedPolicy=null; }
        catch(e) {errors.push(`policy: ${e.message}`);}
      }
    }
    task.cleanupPending=errors.length>0;
    if(errors.length)task.cleanupErrors=[...new Set([...(task.cleanupErrors??[]),...errors])];
    publish();return task;
  }
  async function finish(outcome,reason) {
    if (!task || task.status==='terminal') return task;
    hand.cancel(reason);
    // Retain a terminal receipt even if page teardown makes release/restore fail.
    task={...task,status:'terminal',outcome,reason,endedAt:now(),cleanupPending:true,
      evidence:{schemaVersion:'dfo.evidence.v1',frame:identity?.frame,generation:identity?.generation,observations:structuredClone(task.progress),killVerified:false,gameGoalVerified:false}};
    publish();
    return cleanup();
  }
  async function sample() {
    const [n,b]=await Promise.all([io.native(nativeCursor),io.body(cursor)]);
    if (!n?.ready || !b?.ready) throw Error(n?.reason || b?.reason || 'native bridge or Body unavailable');
    const state=n.state;
    if (!state || !Array.isArray(state.pos) || !Number.isFinite(state.yaw) || state.frame == null) throw Error('native state incomplete');
    const eventLoss=Number.isFinite(b.events?.lostThroughSeq) && b.events.lostThroughSeq>cursor;
    const lines=b.events?.lines ?? []; for(const e of lines) cursor=Math.max(cursor,e.seq ?? 0);
    for(const e of n.events?.lines??[])nativeCursor=Math.max(nativeCursor,e.seq??0);
    memory.observe(state);
    for(const e of lines) if(e.kind==='scan' && e.data?.scan) memory.ingestScan(state,e.data.scan);
    const scan=n.view?.scan;
    if (scan && scan.page===state.scan?.page && scan.frame===state.frame && scan.id===state.scan?.id && state.scan?.fresh!==false) memory.ingestScan(state,scan);
    snapshot=memory.snapshot(state); hand.hear(lines,{place:snapshot.key});
    return {n,b,state,lines,eventLoss};
  }
  async function setWalk(state, target, navigation) {
    await command('setGoal',{kind:'goto',x:target.x,z:target.z});
    const b=await io.body(cursor);
    const nav=navigation ?? navigationFor(state,snapshot,{kind:'goto',...target},b.status.goalRevision);
    nav.goalRevision=b.status.goalRevision;
    if(nav.route.status!=='complete') throw Error('no complete route over observed ground');
    await command('setNavigation',nav);
  }
  async function start(intent,basis) {
    if(task?.cleanupPending)throw Error('Previous control cleanup is unverified; retry cancellation before starting');
    if(task?.status==='running') await finish('cancelled','replaced by a new intent');
    if(task?.cleanupPending)throw Error('Replacement control cleanup is unverified; retry cancellation before starting');
    if(!intent || !['turn','look','goto','use','explore','fight','retreat','stop'].includes(intent.kind)) throw Error('unknown intent');
    const s=await sample(), {state,b,n}=s;
    if (!basis || basis.frame!==state.frame || basis.generation==null || (n.generation!=null && n.generation!==basis.generation)) throw Error('stale frame or generation');
    if(state.overlay || state.paused || state.loading) throw Error('game UI, pause, or loading blocks control');
    const maxMs=intent.maxMs ?? (intent.kind==='explore'?90000:30000); if(!Number.isFinite(maxMs) || maxMs<=0 || maxMs>90000) throw Error('maxMs must be within 1 to 90000');
    cursor=b.status.lastSeq ?? cursor;
    initial=structuredClone(state); identity={id:b.status.id,frame:state.frame,mode:state.mode,page:state.scan?.page,generation:basis.generation};
    task={id:++counter,generation:basis.generation,frame:state.frame,kind:intent.kind,status:'running',startedAt:now(),progress:{displacement:0,healthChange:0,dispatch:false}};
    task.deadline=task.startedAt+maxMs;
    try {
      if(intent.kind==='stop') return await finish('completed','stopped');
      if (!b.policy) throw Error('Body policy unavailable');
      savedPolicy=b.policy;
      if (!['fight','retreat'].includes(intent.kind)) await command('setPolicy',{rules:[{id:'chosen-goal',when:{},do:{act:'followGoal'}}],settings:savedPolicy.settings});
      if(intent.kind==='turn') {
        if(!Number.isFinite(intent.degrees) || Math.abs(intent.degrees)>180) throw Error('turn requires signed degrees within 180');
        task.targetYaw=state.yaw+intent.degrees;
        task.progress.turnToleranceDeg=b.status.settings?.faceToleranceDeg ?? b.policy.settings?.faceToleranceDeg ?? 12;
        await command('setGoal',{kind:'turn',by:intent.degrees});
      } else if(intent.kind==='look') await command('setGoal',{kind:'look'});
      else if(intent.kind==='goto' || intent.kind==='use') {
        const t=intent.target; if(!point(t)) throw Error('target requires observed coordinates');
        const scan=n.view?.scan;
        const things=(scan?.page===state.scan?.page && scan?.frame===state.frame && scan?.id===state.scan?.id && state.scan?.fresh!==false) ? scan.things ?? [] : [];
        const observedThing=things.some(x=>t.targetId?x.targetId===t.targetId:x.kind===t.kind && Math.hypot(x.x-t.x,x.z-t.z)<0.05);
        const graph=walkable(null,snapshot); const observedGround=graph.nodes.some(x=>Math.hypot((x.x ?? (x.ix+.5)*.5)-t.x,(x.z ?? (x.iz+.5)*.5)-t.z)<.5);
        if(intent.kind==='use' ? !observedThing : !(observedThing||observedGround)) throw Error('target is not in current observations or observed ground');
        task.target={x:t.x,z:t.z};
        task.targetId=t.targetId??null;
        if(intent.kind==='goto') await setWalk(state,task.target);
        else {await command('setUseTarget',task.targetId);await command('setGoal',{kind:'use',...task.target}); const bs=await io.body(cursor); const nav=navigationFor(state,snapshot,{kind:'use',...task.target},bs.status.goalRevision); if(nav.route.status==='complete') await command('setNavigation',nav); }
      } else if(intent.kind==='explore') {
        const ticket=hand.prepare({state,snapshot}); if(ticket.refuse) throw Error(ticket.refuse);
        await setWalk(state,ticket,ticket.navigation); hand.commit(ticket,{rev:task.id,epoch:basis.generation,bodyId:identity.id,state});
      } else {
        const f=intent.target?hostiles(state).find(x=>sameFoe(intent.target,x)):nearest(state);
        if(state.scan?.fresh===false || !f) throw Error('chosen hostile is not currently observed');
        if (typeof f.targetId!=='string' || !f.targetId) throw Error('combat requires a frame-scoped target identity');
        const floor=intent.stopHpPct ?? 35; if(!Number.isFinite(floor) || floor<0 || floor>100) throw Error('stopHpPct must be within 0 to 100');
        const hp=hpPercent(state); if(hp==null || hp<=floor || state.vitals.health<=0) throw Error('combat requires health above the selected floor');
        task.stopHpPct=floor; task.chosenFoe=structuredClone(f);
        await command('setCombatGuard',{targetId:f.targetId,page:identity.page,frame:identity.frame,stopHpPct:floor});
        const act=intent.kind==='fight' ? {act:'fight',target:'nearestHostile'} : {act:'keepAway',target:'nearestHostile',range:intent.range ?? 6};
        await command('setPolicy',{rules:[{id:'chosen',when:{},do:act}],settings:savedPolicy.settings});
        task.range=intent.range ?? 6;
      }
      await command('enable',[true,2000]); task.progress.dispatch=true; emit({type:'intent',task}); return task;
    } catch(e) { await finish('failed',e.message); return task; }
  }
  async function poll() {
    if(!task || task.status==='terminal') return {task,events:[]};
    let s; try { s=await sample(); } catch(e) { await finish('interrupted',e.message); return {task,events:[]}; }
    const {state,b,n,lines,eventLoss}=s;
    task.arrived=task.arrived || lines.some(e=>e.kind==='arrived');
    task.progress.displacement=Math.hypot(state.pos[0]-initial.pos[0],state.pos[2]-initial.pos[2]);
    task.progress.healthChange=(state.vitals?.health ?? 0)-(initial.vitals?.health ?? 0);
    if(task.targetYaw!=null) task.progress.angularError=Math.abs(angle(task.targetYaw-state.yaw));
    if(task.target) task.progress.remaining=Math.hypot(state.pos[0]-task.target.x,state.pos[2]-task.target.z);
    if(b.status.id!==identity.id) savedPolicy=null;
    const sceneChanged=state.frame!==identity.frame || state.mode!==identity.mode || state.scan?.page!==identity.page;
    const placeReceipt=lines.find(e=>e.kind==='used' && e.data?.outcome==='place');
    if(eventLoss)await finish('interrupted','Body event history lost unread events');
    else if (task.kind==='use' && sceneChanged && placeReceipt && b.status.id===identity.id && (n.generation==null || n.generation===identity.generation)) {task.progress.interaction='place'; await finish('completed',placeReceipt.text);}
    else if(b.status.id!==identity.id || state.frame!==identity.frame || state.mode!==identity.mode || state.scan?.page!==identity.page || (n.generation!=null && n.generation!==identity.generation)) await finish('interrupted','Body, bridge, or scene changed');
    else if (task.kind==='use' && state.overlay && !initial.overlay && lines.some(e=>e.kind==='used' && e.data?.outcome==='window')) { task.progress.interaction='window'; await finish('completed','interaction opened a window'); }
    else if(state.overlay || state.paused || state.loading) await finish('interrupted','UI, pause, or loading');
    else if (['fight','retreat'].includes(task.kind)) {
      if (b.status.combatGuardFailure) await finish('interrupted',b.status.combatGuardFailure);
      const hp=hpPercent(state), f=hostiles(state).find(x=>sameFoe(task.chosenFoe,x));
      if (task.status==='terminal') {}
      else if (hp==null || hp<=task.stopHpPct || state.vitals.health<=0) await finish('interrupted','health at or below combat floor or unavailable');
      else if(state.scan?.fresh===false||!f){task.targetLostAt??=now();task.progress.targetVisible=false;if(now()-task.targetLostAt>=750)await finish('interrupted','chosen hostile absent beyond observation grace');}
      else {task.targetLostAt=null;task.progress.targetVisible=true;task.progress.targetDistance=f.dist;}
    } else if(Number.isFinite(state.vitals?.health) && state.vitals.health < initial.vitals?.health) await finish('interrupted','health decreased');
    if(task.status==='running') {
      if(task.kind==='use'&&task.targetId&&!b.status.goal?.checking){
        const target=n.view?.scan?.things?.find(t=>t.targetId===task.targetId);
        if(!target){task.useLostAt??=now();if(now()-task.useLostAt>=750)await finish('interrupted','selected interaction target is no longer visible');}
        else if(Math.hypot(target.x-task.target.x,target.z-task.target.z)>.25){
          task.useLostAt=null;
          task.target={x:target.x,z:target.z};
          try{await command('setGoal',{kind:'use',...task.target});}catch(e){await finish('interrupted',e.message);}
        }else task.useLostAt=null;
      }
    }
    if(task.status==='running') {
      const failed=lines.find(e=>e.kind==='goal-failed' || e.kind==='use-failed');
      const used=lines.find(e=>e.kind==='used');
      if(failed) await finish('blocked',failed.text);
      else if(task.kind==='turn' && task.progress.angularError<=task.progress.turnToleranceDeg && task.arrived) await finish('completed','observed heading reached within Body tolerance');
      else if(task.kind==='look' && lines.some(e=>e.kind==='looked')) await finish('completed','look observations collected');
      else if(task.kind==='goto' && task.progress.remaining<=1 && task.arrived) await finish('completed','observed arrival');
      else if(task.kind==='use' && used) { task.progress.interaction=used.data?.outcome ?? 'unknown';await finish(['place','window','moved'].includes(used.data?.outcome)?'completed':used.data?.outcome==='text'?'interrupted':'failed',used.text); }
      else if(task.kind==='retreat' && task.progress.targetVisible && task.progress.targetDistance>=task.range && task.progress.displacement>0.25) await finish('completed','observed separation');
      else if(task.kind==='explore') {
        const step=hand.step({readAt:now(),status:b.status,state,snapshot,task:{rev:task.id,status:'running'},epoch:identity.generation,bodyId:identity.id});
        if(step?.kind==='goto') { try { await setWalk(state,step.target,step.navigation); hand.sent(step); } catch(e) { hand.refused(step,e.message); } }
        else if(step?.kind==='finish' || step?.kind==='ended') {task.progress.exploration={visits:step.visits??null,seconds:step.seconds??null};await finish(step.kind==='finish'&&step.status==='succeeded'?'completed':step.status==='failed'?'blocked':'interrupted',step.reason);}
      }
      if(task.status==='running' && now()>=task.deadline) await finish('expired','execution deadline');
      if(task.status==='running') { try { await command('enable',[true,2000]); } catch(e) { await finish('interrupted',e.message); } }
    }
    return {task,events:lines};
  }
  // Serialize physical authority: no late poll/start may renew a lease after cancellation.
  let queue=Promise.resolve();
  const serial=fn => { const next=queue.then(fn); queue=next.catch(()=>{}); return next; };
  return {
    start:(intent,basis)=>serial(()=>start(intent,basis)), poll:()=>serial(poll),
    placeSnapshot:()=>snapshot?structuredClone(snapshot):null,
    // The picture's white dots are where known floor runs out and could be walked to, as the old harness drew them.
    placeEdges:()=>{const at=snapshot?.last??snapshot?.start;return at?frontiers(walkable(null,snapshot),at[0],at[1],null,{level:snapshot.level??0}):[];},
    cancel:(reason='operator stop')=>serial(async()=>task?.status==='running' ? finish('cancelled',reason) : task?.cleanupPending ? cleanup() : (await io.stop(),task)),
  };
}
