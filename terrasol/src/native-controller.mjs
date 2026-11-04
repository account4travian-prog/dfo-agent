import {inventoryEvidence,vitalsEvidence} from './player/evidence.mjs';
import {WORKFLOWS,resolveActivation,visibleLine,navigationOnly,visibleSignature,matchesExpected,modeWord} from './player/workflows.mjs';
import {randomUUID,createHash} from 'node:crypto';

export const CONTRACT_VERSION='dfo-control.v1';
export const INTENTS=Object.freeze(['turn','look','goto','use','explore','fight','retreat','stop']);
const copy=x=>structuredClone(x);
const error=(status,message,code)=>Object.assign(Error(message),{status,code:code??(message.includes('Stale')||message.includes('Observation basis')?'STALE_BASIS':message.includes('Operator stopped')?'OPERATOR_STOPPED':message.includes('cleanup')||message.includes('release')?'UNVERIFIED_CLEANUP':'TASK_ERROR')});
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export async function withDeadline(work,ms,label='control operation') {
  let timer;
  try {return await Promise.race([Promise.resolve().then(work),new Promise((_,reject)=>{timer=setTimeout(()=>reject(error(504,`${label} timed out`)),ms);})]);}
  finally {clearTimeout(timer);}
}

export function playerPhase(native,ui) {
  const state=native?.state??{}, text=[ui?.text??'',...(ui?.controls??[]).map(c=>c.text??'')].join(' ').toLowerCase();
  if(state.loading||/loading|please wait/.test(text))return 'loading';
  if(state.vitals?.health===0||ui?.ownVitals?.health===0||/respawn|you (?:have )?died/.test(text))return 'death';
  if(native?.ready&&(state.overlay||state.paused||ui?.legacyWindow?.window))return 'modal';
  if(native?.ready)return 'world';
  const labels=new Set((ui?.controls??[]).map(c=>modeWord(c.text)));
  // Engine 10e43fd0's Offline menu: Continue, New Game, Load Game, Test Room, Back.
  if((labels.has('offline')&&labels.has('online'))||(labels.has('new game')&&labels.has('load game'))||/character|login|log in|sign in|start game/.test(text))return 'frontdoor';
  return 'unknown';
}

// Protocol state only. Every physical writer is an injected driver operation;
// there is no second keyboard/mouse controller here.
export function createNativeController({basis,readNative,readUI,runUI,readIdentity=null,start,poll,cancel,forceStop,latchStop=()=>{},resume=()=>{},enabled=true,loadUncertain=()=>null,loadCompleted=()=>[],saveUncertain=()=>{},clearUncertain=()=>{},now=()=>Date.now(),timeoutMs=4000,snapshotTtlMs=45000,maxRequests=4096}={}) {
  const snapshots=new Map(),requests=new Map(),completed=new Map(loadCompleted().map(x=>[x.requestId,x]));
  let chain=Promise.resolve(),active=null,stopped=false,revision=0,fault=false,uncertain=null,quarantined=!!loadUncertain();
  const serial=fn=>{const next=chain.then(fn);chain=next.catch(()=>{});return next;};
  const timed=(fn,label)=>withDeadline(fn,timeoutMs,label);
  const current=()=>basis();
  const validateId=id=>{if(typeof id!=='string'||!/^[\w:.-]{1,128}$/.test(id))throw error(400,'Invalid requestId');};
  function record(task) {
    if(!active)return task;
    const r=requests.get(active);if(!r)return task;
    r.task={...copy(task),requestId:active,authority:copy(r.authority)};
    return copy(r.task);
  }
  function stopLatch(reason) {stopped=true;revision++;latchStop(reason);}
  async function release(reason) {
    try {const result=await timed(()=>forceStop(reason),'physical release');if(result?.ok!==true)throw error(503,'Physical release not acknowledged');return [];}
    catch(e){fault=true;return [e.message];}
  }
  async function failClosed(e) {
    stopLatch(e.message);const errors=await release(e.message);
    if(active) {const r=requests.get(active);r.task={...(r.task??{}),requestId:active,authority:copy(r.authority),status:'terminal',outcome:'interrupted',reason:e.message,endedAt:now(),cleanupPending:true,cleanupErrors:errors.length?errors:['Execution completion unverified after driver failure']};}
    fault=true;
  }
  function health() {const task=active?requests.get(active)?.task:null;return {contractVersion:CONTRACT_VERSION,playerContractVersion:'dfo-player.v1',...current(),stopped,fault,activeTask:task?.status==='running'?{id:active,kind:task.kind,startedAt:task.startedAt}:null,capabilities:{intents:enabled?[...INTENTS]:[],snapshot:enabled,requestFencing:enabled,ui:true,images:true,tasks:true,uiActions:!!runUI,workflows:runUI?WORKFLOWS.filter(w=>w.id!=='ui.scene-transition'||readIdentity).map(w=>w.id):[]}};}
  function workflows(){return {schemaVersion:'dfo-workflows.v1',workflows:runUI?copy(WORKFLOWS.filter(w=>w.id!=='ui.scene-transition'||readIdentity)):[]};}
  async function snapshot({ui=false,image=false,after=0}={}) {return serial(async()=>{
    if(!Number.isSafeInteger(after)||after<0)throw error(400,'Invalid event cursor');
    const before=current(),startedAt=new Date(now()).toISOString();
    const first=await timed(()=>readNative(after),'native observation');
    const visible=(ui||image)?await withDeadline(()=>readUI({image}),15000,'UI observation'):null;
    const last=(ui||image)?await timed(()=>readNative(after),'native observation'):first;
    const end=current();
    if(before.generation!==end.generation||before.pageId!==end.pageId||first.state?.frame!==last.state?.frame)throw error(409,'Snapshot scene changed during capture');
    const observationId=randomUUID(),result={contractVersion:CONTRACT_VERSION,observationId,basis:{...end,frame:last.state?.frame??0},captured:{startedAt,endedAt:new Date(now()).toISOString(),coherent:true},native:last,ui:visible?{...visible,observationId:String(visible.id)}:null};
    result.player={phase:playerPhase(last,visible),facts:[]};
    snapshots.set(observationId,{at:now(),snapshot:copy(result)});
    while(snapshots.size>64)snapshots.delete(snapshots.keys().next().value);
    return result;
  });}
  async function submit(body) {
    validateId(body?.requestId);
    const atRevision=revision;
    return serial(async()=>{
      if(!enabled)throw error(503,'Native control disabled');
      if(stopped||atRevision!==revision)throw error(409,'Operator stopped control');
      const b=body.basis,c=current();
      if(!b||b.generation!==c.generation||b.pageId!==c.pageId)throw error(409,'Stale driver basis');
      const key=canonical({basis:b,authority:body.authority??null,intent:body.intent,observedTarget:!!body.observedTarget});
      const prior=requests.get(body.requestId);
      if(completed.has(body.requestId))throw error(409,'Conflicting requestId reuse','REQUEST_CONFLICT');
      if(prior){if(prior.key!==key)throw error(409,'Conflicting requestId reuse');return {...copy(prior.task),replayed:true};}
      if(active) {const old=requests.get(active)?.task;if(old?.status==='running'||old?.cleanupPending)throw error(409,'Cancel the active task before starting another');}
      if(requests.size>=maxRequests)throw error(429,'Request registry full; hold and replace driver');
      const captured=snapshots.get(b.observationId);
      if(!captured||now()-captured.at>snapshotTtlMs)throw error(409,'Unknown or expired observation');
      const source=captured.snapshot;
      if(source.basis.generation!==b.generation||source.basis.pageId!==b.pageId||source.basis.frame!==b.frame)throw error(409,'Observation basis mismatch');
      if(!source.native?.ready)throw error(503,'Native bridge unavailable in observation');
      if(body.observedTarget) {
        const t=body.intent?.target;
        if(!source.native.targets?.some(w=>canonical(w.target)===canonical(t)))throw error(409,'Target is not from the captured observation');
      }
      if(!INTENTS.includes(body.intent?.kind))throw error(400,'Unsupported intent');
      if(body.authority!=null&&(!body.authority.planId||!Number.isSafeInteger(body.authority.planVersion)||body.authority.planVersion<0||!body.authority.stepId))throw error(400,'Invalid plan authority');
      active=body.requestId;requests.set(active,{key,authority:copy(body.authority??null),task:{requestId:active,kind:body.intent.kind,status:'running',startedAt:now()}});
      try {
        const task=await timed(()=>start({...body,generation:b.generation,frame:b.frame}),'intent start');
        if(atRevision!==revision||stopped)throw error(409,'Intent invalidated during start');
        return record(task);
      } catch(e) {await failClosed(e);throw e;}
    });
  }
  async function submitTask(body) {
    if(!body?.authority?.planId||!Number.isSafeInteger(body.authority.planVersion)||body.authority.planVersion<0||!body.authority.stepId)throw error(400,'Invalid plan authority','INVALID_AUTHORITY');
    if(body?.task?.kind==='intent')return submit({...body,intent:body.task.payload?.intent??body.task.payload,observedTarget:!!body.task.payload?.observedTarget});
    validateId(body?.requestId);
    if(!['ui','workflow'].includes(body?.task?.kind)||!runUI)throw error(400,'Unsupported task','UNSUPPORTED_TASK');
    const atRevision=revision;
    return serial(async()=>{
      const b=body.basis,c=current(),payload=body.task.payload;
      const key=canonical({basis:b,authority:body.authority??null,task:body.task});
      const prior=requests.get(body.requestId),durable=completed.get(body.requestId);
      if(prior){if(prior.key!==key)throw error(409,'Conflicting requestId reuse','REQUEST_CONFLICT');return {...copy(prior.task),replayed:true};}
      if(durable){if(durable.keyHash!==createHash('sha256').update(key).digest('hex'))throw error(409,'Conflicting requestId reuse','REQUEST_CONFLICT');return {...copy(durable.task),replayed:true};}
      if(stopped||atRevision!==revision)throw error(409,'Operator stopped control');
      if(fault)throw error(409,'Input cleanup unverified','UNVERIFIED_CLEANUP');
      if(active&&(requests.get(active)?.task?.status==='running'||requests.get(active)?.task?.cleanupPending))throw error(409,'Active task owns input','TASK_BUSY');
      if(requests.size>=maxRequests)throw error(429,'Request registry full','REGISTRY_FULL');
      if(!b||b.pageId!==c.pageId||b.generation!==c.generation)throw error(409,'Stale driver basis');
      const captured=snapshots.get(b.observationId);
      if(!captured||now()-captured.at>snapshotTtlMs||canonical(captured.snapshot.basis)!==canonical({pageId:b.pageId,generation:b.generation,frame:b.frame}))throw error(409,'Stale observation basis');
      const ui=captured.snapshot.ui;
      if(!ui)throw error(409,'Stale UI control','STALE_CONTROL');
      let selected;
      if(body.task.kind==='workflow'){const def=WORKFLOWS.find(w=>w.id===payload?.workflowId&&w.version===payload?.version);if(def?.id==='ui.scene-transition'&&!readIdentity)throw error(400,'Workflow is not implemented','UNSUPPORTED_WORKFLOW');if(def&&!def.allowedPhases.includes(captured.snapshot.player.phase))throw error(409,'Workflow is not available in this phase','WORKFLOW_PREREQUISITE');selected=resolveActivation(payload,ui,captured.snapshot.native);}
      else {if(String(payload?.uiObservationId)!==String(ui.observationId))throw error(409,'Stale UI control','STALE_CONTROL');selected={action:payload.action};}
      const safeNavigation=navigationOnly(selected.action,ui)||selected.safeStartup===true;
      if(quarantined&&!safeNavigation)throw error(409,'Prior side effect is unresolved; risky UI input remains fenced','UNCERTAIN_EFFECT');
      if(!body.authority?.planId||!Number.isSafeInteger(body.authority.planVersion)||body.authority.planVersion<0||!body.authority.stepId)throw error(400,'Invalid plan authority','INVALID_AUTHORITY');
      active=body.requestId;const r={key,authority:copy(body.authority),task:{taskId:active,requestId:active,authority:copy(body.authority),kind:body.task.kind,generation:b.generation,frame:b.frame,basis:copy(b),status:'running',startedAt:now()}};requests.set(active,r);
      try {
        const initialIdentity=selected.transition?await timed(readIdentity,'character identity'):null;if(selected.transition&&!initialIdentity)throw error(409,'Stable character identity unavailable','WORKFLOW_PREREQUISITE');
        if(!safeNavigation){saveUncertain({schemaVersion:'dfo-uncertain-ui.v1',requestId:body.requestId,authority:copy(body.authority),at:new Date(now()).toISOString()});quarantined=true;}
        const limit=body.task.kind==='workflow'?(selected.transition?payload.maxMs:Math.min(timeoutMs,payload.maxMs)):timeoutMs;
        const deadline=Date.now()+limit;
        const remaining=()=>{const ms=deadline-Date.now();if(ms<=0)throw error(504,'Workflow deadline expired','WORKFLOW_DEADLINE');return ms;};
        const receipt=await withDeadline(()=>runUI({action:selected.action,observationId:ui.id,generation:b.generation,actionId:body.requestId}),Math.min(timeoutMs,limit),'UI action');
        if(stopped||atRevision!==revision)throw error(409,'Action invalidated');
        if(selected.transition){
          let transition=null;
          while(Date.now()<deadline&&!stopped&&revision===atRevision){
            const first=await withDeadline(()=>readNative(0),remaining(),'transition native observation'),visible=await withDeadline(()=>readUI({image:false}),remaining(),'transition UI observation'),last=await withDeadline(()=>readNative(0),remaining(),'transition native observation'),end=current();
            const id=await withDeadline(readIdentity,remaining(),'character identity');
            if(end.pageId!==b.pageId||end.generation!==b.generation||id!==initialIdentity)break;
            const phase=playerPhase(last,visible),frame=last.state?.frame??0;
            if(first.state?.frame===last.state?.frame&&!last.state?.loading&&phase===selected.transition&&(frame!==b.frame||phase!==captured.snapshot.player.phase)){transition={phase,frame};break;}
            await new Promise(r=>setTimeout(r,Math.min(250,remaining())));
          }
          const e={schemaVersion:'dfo-player-evidence.v1',evidenceId:randomUUID(),eventType:'scene-transition-observed',taskId:body.requestId,requestId:body.requestId,planId:body.authority.planId,planVersion:body.authority.planVersion,basis:copy(b),observedAt:new Date(now()).toISOString(),source:'player-state',status:transition?'observed':'unknown',before:{phase:captured.snapshot.player.phase,frame:b.frame},after:transition,reason:transition?'Stable phase and scene with same character and page':'Transition not established',artifactRefs:[]};
          r.task={...r.task,status:'terminal',outcome:transition?'completed':'blocked',endedAt:now(),receipt,evidence:e,evidenceRecords:[e]};
          if(transition&&!safeNavigation){const entry={requestId:body.requestId,keyHash:createHash('sha256').update(key).digest('hex'),task:copy(r.task),at:new Date(now()).toISOString()};clearUncertain(entry);completed.set(body.requestId,entry);quarantined=false;}
          if(!transition){r.task.reconciliationRequired=true;stopLatch('UI outcome unknown; reconcile before resume');uncertain={requestId:body.requestId,revision,authority:copy(body.authority)};const errors=await release('UI outcome unknown');r.task.cleanupPending=errors.length>0;if(errors.length){fault=true;r.task.cleanupErrors=errors;}}
          return copy(r.task);
        }
        let evidence={status:'unknown',reason:'Input receipt does not establish a gameplay outcome'};
        let evidenceRecords=[],uiExpected=null;
        {
          let after=null,reason='No outcome predicate supplied';
          try {
            const n=await withDeadline(()=>readNative(0),remaining(),'post-action native observation');
            after=await withDeadline(()=>readUI({image:false}),remaining(),'post-action UI observation');
            const last=await withDeadline(()=>readNative(0),remaining(),'post-action native observation'),end=current();
            if(stopped||revision!==atRevision||end.pageId!==b.pageId||end.generation!==b.generation||n.state?.frame!==last.state?.frame)throw Error('Post-action scene changed');
            const startup=selected.action.kind==='rowan-start'&&captured.snapshot.player.phase==='frontdoor'&&!captured.snapshot.native?.ready;
            let startupExpected=null;
            if(startup&&receipt?.issued===true&&receipt.character==='Rowan'&&receipt.creationOpened!==true&&n.ready&&last.ready&&Number.isSafeInteger(last.state?.frame)&&last.state.frame>=0&&playerPhase(last,after)==='world'&&n.sessionMode==='online'&&last.sessionMode==='online'&&n.character?.name==='Rowan'&&last.character?.name==='Rowan'&&typeof last.character?.idHash==='string'&&last.character.idHash.length>0&&n.character?.idHash===last.character.idHash){
              const identity=readIdentity?await withDeadline(readIdentity,remaining(),'startup character identity'):null,endIdentity=current();
              if(stopped||revision!==atRevision||endIdentity.pageId!==b.pageId||endIdentity.generation!==b.generation||identity!==last.character.idHash)throw Error('Startup character identity changed or unavailable');
              startupExpected={eventType:'startup-world-observed',before:{phase:captured.snapshot.player.phase,frame:b.frame},after:{phase:'world',frame:last.state?.frame,mode:'online',character:copy(last.character)}};
            }
            if(startup&&last.ready&&!startupExpected)throw Error('Online Rowan startup outcome unverified');
            if(!startupExpected&&(last.state?.frame??0)!==b.frame)throw Error('Post-action scene changed');
            if(selected.action.kind==='account-sign-in'&&ui.account?.signedIn===true&&after.account?.signedIn===true&&receipt?.issued===false&&receipt.skipped===true)startupExpected={eventType:'account-signed-in-observed',before:{signedIn:true},after:{signedIn:true}};
            const evidenceContext={requestId:body.requestId,authority:body.authority,basis:copy(b)};
            evidenceRecords=[...inventoryEvidence(captured.snapshot.native?.inventory,last.inventory,evidenceContext),...vitalsEvidence(captured.snapshot.native?.state?.vitals,last.state?.vitals,evidenceContext)];
            if(selected.expected?.eventType==='field-value-observed'){
              const fields=(after.controls??[]).filter(c=>c.text===selected.expected.fieldLabel&&!c.disabled),beforeField=(ui.controls??[]).find(c=>c.text===selected.expected.fieldLabel);
              if(fields.length===1&&fields[0].value===selected.expected.text&&beforeField?.value!==selected.expected.text)uiExpected={eventType:'field-value-observed',before:{valueHash:createHash('sha256').update(String(beforeField?.value??'')).digest('hex')},after:{valueHash:createHash('sha256').update(selected.expected.text).digest('hex')}};
            }
            if(selected.expected?.eventType==='chat-line-observed'){
              const count=v=>(v.chatLines??[]).filter(x=>x===selected.expected.text).length,a=count(ui),z=count(after);
              if(z===a+1)uiExpected={eventType:'chat-line-observed',before:{matchingLines:a},after:{matchingLines:z}};
            }
            uiExpected=startupExpected??uiExpected;
            if(uiExpected)evidenceRecords.push({schemaVersion:'dfo-player-evidence.v1',evidenceId:randomUUID(),...uiExpected,taskId:body.requestId,requestId:body.requestId,planId:body.authority.planId,planVersion:body.authority.planVersion,basis:copy(b),observedAt:new Date(now()).toISOString(),source:startupExpected?'player-state':'visible-ui',status:'observed',reason:startupExpected?'Trusted startup result observed on the same page and generation.':'Visible UI state changed; delivery or external outcome is not inferred.',artifactRefs:[]});
            const beforeHas=visibleLine(ui,selected.expectedText),afterHas=visibleLine(after,selected.expectedText),transition=safeNavigation&&visibleSignature(ui)!==visibleSignature(after);
            reason=transition?'Visible UI transition observed':beforeHas?'Expected text already visible before action':afterHas?'New visible text observed':'Expected text not observed';
            evidence={schemaVersion:'dfo-player-evidence.v1',evidenceId:randomUUID(),eventType:transition?'ui-transition-observed':'visible-text-observed',taskId:body.requestId,requestId:body.requestId,planId:body.authority.planId,planVersion:body.authority.planVersion,basis:copy(b),observedAt:new Date(now()).toISOString(),source:'visible-ui',status:transition||(!beforeHas&&afterHas)?'observed':'unknown',before:{present:beforeHas},after:{present:afterHas},reason,artifactRefs:[]};
          } catch(e){reason=`Post-action observation unavailable: ${e.message}`;evidence={status:'unknown',reason};}
        }
        const matched=uiExpected?evidenceRecords.at(-1):matchesExpected(evidenceRecords,selected.expected);
        if(matched)evidence=matched;
        r.task={...r.task,status:'terminal',outcome:body.task.kind==='workflow'&&evidence.status!=='observed'?'blocked':'completed',endedAt:now(),receipt,evidence,evidenceRecords};
        if(matched&&!safeNavigation){const entry={requestId:body.requestId,keyHash:createHash('sha256').update(key).digest('hex'),task:copy(r.task),at:new Date(now()).toISOString()};clearUncertain(entry);completed.set(body.requestId,entry);quarantined=false;}
        if(evidence.status!=='observed'||(!safeNavigation&&!matched)){
          r.task.reconciliationRequired=true;if(!safeNavigation)quarantined=true;stopLatch('UI outcome unknown; reconcile before resume');uncertain={requestId:body.requestId,revision,authority:copy(body.authority)};const errors=await release('UI outcome unknown');
          r.task.cleanupPending=errors.length>0;if(errors.length){fault=true;r.task.cleanupErrors=errors;}
        }
        return copy(r.task);
      } catch(e){await failClosed(e);r.task.reason=e.message;r.task.code=e.code??'UI_OUTCOME_UNKNOWN';r.task.outcome='failed';return copy(r.task);}
    });
  }
  async function reconcile({requestId,basis:b,authority,reason}={}) {return serial(async()=>{
    validateId(requestId);const u=uncertain,c=current(),snap=snapshots.get(b?.observationId);
    if(!u||u.requestId!==requestId||u.revision!==revision||!stopped)throw error(409,'No matching uncertainty hold','RECONCILIATION_STALE');
    if(!authority?.planId||!Number.isSafeInteger(authority.planVersion)||!authority.stepId||typeof reason!=='string'||!reason.trim()||reason.length>500)throw error(400,'Reconciliation requires plan authority and reason','INVALID_AUTHORITY');
    if(!snap||!snap.snapshot.ui||snap.at<requests.get(requestId).task.endedAt||now()-snap.at>snapshotTtlMs||b.pageId!==c.pageId||b.generation!==c.generation||canonical(snap.snapshot.basis)!==canonical({pageId:b.pageId,generation:b.generation,frame:b.frame}))throw error(409,'Fresh UI observation required for reconciliation','STALE_BASIS');
    const errors=await release('reconcile unknown UI outcome');if(errors.length)throw error(409,'Input release unverified','UNVERIFIED_CLEANUP');
    await resume();stopped=false;fault=false;revision++;uncertain=null;
    return {requestId,reconciled:true,resolution:'continue-safe',quarantined,observationId:b.observationId,authority:copy(authority),reason};
  });}
  async function inspect(requestId) {validateId(requestId);return serial(async()=>{
    const r=requests.get(requestId);if(!r)throw error(404,'Unknown requestId');
    if(r.task?.generation!=null&&r.task.generation!==current().generation&&r.task.status==='running')throw error(409,'Task belongs to an old generation');
    if(requestId!==active||r.task.status==='terminal')return {task:copy(r.task),events:[]};
    try {const result=await timed(poll,'intent poll');if(!result.task)throw error(409,'Native task disappeared');return {...result,task:record(result.task)};}
    catch(e){await failClosed(e);return {task:copy(r.task),events:[]};}
  });}
  async function cancelRequest({requestId,reason='request cancelled'}={}) {
    validateId(requestId);return serial(async()=>{
      const r=requests.get(requestId);if(!r)throw error(404,'Unknown requestId');
      if(r.task?.status==='terminal'&&!r.task?.cleanupPending)return copy(r.task);
      if(requestId!==active) {if(r.task?.status==='terminal')return copy(r.task);throw error(409,'Cancellation does not own the active task');}
      try {return record(await timed(()=>cancel(reason),'intent cancellation'));}
      catch(e){await failClosed(e);return copy(r.task);}
    });
  }
  async function stopAll(reason='operator stop') {
    stopLatch(reason);
    // Bypass the protocol queue so a blocked request cannot prevent the latch.
    let errors=[];
    const owns=()=>active&&(requests.get(active)?.task?.status==='running'||requests.get(active)?.task?.cleanupPending);
    const ownedRequest=owns()?active:null;
    try {const task=await timed(()=>cancel(reason),'intent cancellation');if(owns()&&task)record(task);if(task?.cleanupPending)errors.push('Executor cleanup unverified');}
    catch(e){errors.push(e.message);}
    errors.push(...await release(reason));
    if(ownedRequest){const r=requests.get(ownedRequest);r.task={...(r.task??{}),requestId:ownedRequest,authority:copy(r.authority),status:'terminal',outcome:r.task?.status==='terminal'?r.task.outcome:'cancelled',reason,endedAt:now(),cleanupPending:errors.length>0,...(errors.length?{cleanupErrors:errors}:{})};}
    fault=errors.length>0;return {stopped:true,...current(),cleanupPending:fault,cleanupErrors:errors};
  }
  async function resumeControl() {return serial(async()=>{
    const errors=await release('verify release before resume');if(errors.length)throw error(409,'Cannot resume: input release unverified');
    if(active){const r=requests.get(active);if(r?.task?.status==='running')throw error(409,'Cannot resume a running task');if(r?.task)r.task.cleanupPending=false;}
    await resume();stopped=false;fault=false;revision++;return {resumed:true,...current()};
  });}
  const uiObservationId=(id,generation)=>{const captured=snapshots.get(id);if(captured){if(captured.snapshot.basis.generation!==generation||!captured.snapshot.ui)throw error(409,'No UI observation on that basis');return captured.snapshot.ui.id;}return typeof id==='string'&&/^\d+$/.test(id)?Number(id):id;};
  const isBusy=()=>!!active&&(requests.get(active)?.task?.status==='running'||requests.get(active)?.task?.cleanupPending);
  return {health,workflows,snapshot,submit,submitTask,reconcile,inspect,cancelRequest,stopAll,resume:resumeControl,uiObservationId,isQuarantined:()=>quarantined,cancelCurrent:reason=>isBusy()?cancelRequest({requestId:active,reason}):cancel(reason),isBusy};
}

export async function runTrustedUI(control,action) {
  if(control.isQuarantined?.())throw error(409,'Prior side effect is unresolved','UNCERTAIN_EFFECT');
  if(control.isBusy())throw error(409,'Active task owns input; cancel it explicitly','TASK_BUSY');
  const receipt=await control.cancelCurrent('browser UI action');
  if(receipt?.cleanupPending)throw error(409,'Native cleanup must be verified before UI input');
  return action();
}

// Used by the real browser server and actual HTTP tests with injected adapters.
export async function nativeControlRoute(req,url,control) {
  if(req.method==='GET'&&url.pathname==='/workflows')return control.workflows();
  if(req.method==='GET'&&url.pathname==='/task')return control.inspect(url.searchParams.get('requestId'));
  if(req.method==='POST'&&['/task','/task/cancel','/task/reconcile'].includes(url.pathname)){let raw='';for await(const c of req){raw+=c;if(raw.length>20000)throw error(413,'Request too large');}let body;try{body=JSON.parse(raw||'{}');}catch{throw error(400,'Invalid JSON');}return url.pathname==='/task'?control.submitTask(body):url.pathname==='/task/reconcile'?control.reconcile(body):control.cancelRequest(body);}
  if(req.method==='GET'&&url.pathname==='/snapshot')return control.snapshot({ui:url.searchParams.get('ui')==='1',image:url.searchParams.get('image')==='1',after:Number(url.searchParams.get('after')||0)});
  if(req.method==='GET'&&url.pathname==='/intent'&&url.searchParams.has('requestId'))return control.inspect(url.searchParams.get('requestId'));
  if(req.method==='POST'&&['/intent','/intent/cancel'].includes(url.pathname)) {
    let raw='';for await(const c of req){raw+=c;if(raw.length>20000)throw error(413,'Request too large');}
    let body;try{body=JSON.parse(raw||'{}');}catch{throw error(400,'Invalid JSON');}
    if(body.requestId)return url.pathname==='/intent'?control.submit(body):control.cancelRequest(body);
    return {legacyBody:body};
  }
  return undefined;
}
