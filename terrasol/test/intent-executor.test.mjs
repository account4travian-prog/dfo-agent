import test from 'node:test';
import assert from 'node:assert/strict';
import {createIntentExecutor} from '../src/intent-executor.mjs';
import {createBody} from '../vendor/legacy-agent/body/core.mjs';
function rig(options={}) {
 let time=0, seq=0, enabled=false, stops=0, policy={rules:[{id:'default',when:{},do:{act:'followGoal'}}],settings:{}};
 const state={pos:[0,0,0],yaw:0,frame:1,mode:'dungeon',scan:{page:'p',id:1,frame:1,fresh:true},vitals:{health:10,maxHealth:10},foes:[]};
 let scan=null;
 let status={id:'body1',goalRevision:0,lastSeq:0,goal:{kind:'idle'}}; let lines=[];
 const io={native:async()=>({ready:true,state:structuredClone(state),view:{scan}}),body:async after=>({ready:true,status:structuredClone(status),policy:structuredClone(policy),events:{lines:lines.filter(e=>e.seq>after)}}),command:async(m,a)=>{if(m==='enable') enabled=a[0]; if(m==='setPolicy') policy=a; if(m==='setGoal') {status.goal=a;status.goalRevision++} return {ok:true}},stop:async()=>{enabled=false;stops++;return {ok:true}}};
 const executor=createIntentExecutor({transport:io,now:()=>time,...options});
 return {state,status,executor,io,setScan(x){scan=x},get enabled(){return enabled},get stops(){return stops},event(kind,text='',data){lines.push({seq:++seq,kind,text,data});status.lastSeq=seq},advance(ms){time+=ms}};
}
test('turn runs through polls and completes only with observed heading and arrival',async()=>{const r=rig();await r.executor.start({kind:'turn',degrees:90},{generation:1,frame:1});assert.equal(r.enabled,true);r.state.yaw=50;assert.equal((await r.executor.poll()).task.status,'running');r.event('arrived');assert.equal((await r.executor.poll()).task.status,'running');r.state.yaw=90;r.event('arrived');assert.equal((await r.executor.poll()).task.outcome,'completed');assert.equal(r.enabled,false)});
test('damage, scene change, expiry and cancellation release input',async()=>{for(const mode of ['damage','scene','expiry','cancel']){const r=rig();await r.executor.start({kind:'look',maxMs:100},{generation:1,frame:1});if(mode==='damage')r.state.vitals.health=9;if(mode==='scene')r.state.frame=2;if(mode==='expiry')r.advance(100);const result=mode==='cancel'?await r.executor.cancel(): (await r.executor.poll()).task;assert.equal(result.outcome,mode==='cancel'?'cancelled':mode==='expiry'?'expired':'interrupted');assert.equal(r.enabled,false)}});
test('attack dispatch is not a kill and policy is restored on expiry',async()=>{const r=rig();r.state.foes=[{targetId:'rat',hostile:true,type:'Rat',dist:1,bearing:0}];const t=await r.executor.start({kind:'fight',maxMs:100},{generation:1,frame:1});assert.equal(t.progress.dispatch,true);assert.equal((await r.executor.poll()).task.status,'running');r.advance(100);assert.equal((await r.executor.poll()).task.outcome,'expired');assert.equal(r.enabled,false)});
test('old frame and unobserved destinations are refused',async()=>{const r=rig();await assert.rejects(r.executor.start({kind:'look'},{generation:1,frame:2}),/stale/);const t=await r.executor.start({kind:'goto',target:{x:99,z:99}},{generation:1,frame:1});assert.equal(t.outcome,'failed');assert.match(t.reason,/observed/)});
test('Body replacement interrupts and does not restore old policy on replacement',async()=>{const r=rig();r.state.foes=[{targetId:'rat',hostile:true,type:'Rat',dist:1,bearing:0}];await r.executor.start({kind:'fight'},{generation:1,frame:1});r.status.id='body2';const {task}=await r.executor.poll();assert.equal(task.outcome,'interrupted');assert.equal(r.enabled,false)});

test('use dispatch with no observed effect fails',async()=>{const r=rig();r.setScan({page:'p',frame:1,id:1,things:[{kind:'door',x:0,z:1}]});await r.executor.start({kind:'use',target:{kind:'door',x:0,z:1}},{generation:1,frame:1});r.event('used','nothing happened',{outcome:'nothing'});const {task}=await r.executor.poll();assert.equal(task.outcome,'failed');assert.equal(task.progress.interaction,'nothing')});
test('an opened UI interrupts the running task',async()=>{const r=rig();await r.executor.start({kind:'look'},{generation:1,frame:1});r.state.overlay=true;assert.equal((await r.executor.poll()).task.outcome,'interrupted');assert.equal(r.enabled,false)});

test('combat tracks selected id, tolerates damage above floor and stops at floor',async()=>{const r=rig();r.state.foes=[{targetId:'rat',hostile:true,dist:1,bearing:0}];const task=await r.executor.start({kind:'fight',target:{targetId:'rat'}},{generation:1,frame:1});assert.equal(task.status,'running');r.state.vitals.health=5;r.state.foes[0].dist=1.5;assert.equal((await r.executor.poll()).task.status,'running');r.state.vitals.health=3;const end=(await r.executor.poll()).task;assert.equal(end.outcome,'interrupted');assert.equal(end.progress.healthChange,-7)});
test('combat waits through short loss, retains selected actor on crossings, and rejects unknown actors',async()=>{for(const change of ['lost','nearer']){const r=rig();r.state.foes=[{targetId:'a',hostile:true,dist:2}];await r.executor.start({kind:'fight'},{generation:1,frame:1});r.state.foes=change==='lost'?[]:[{targetId:'b',hostile:true,dist:1},{targetId:'a',hostile:true,dist:2}];assert.equal((await r.executor.poll()).task.status,'running');if(change==='lost'){r.advance(800);assert.equal((await r.executor.poll()).task.outcome,'interrupted')}} const r=rig();r.state.foes=[{targetId:'a',hostile:true,dist:1}];assert.equal((await r.executor.start({kind:'fight',target:{targetId:'b'}},{generation:1,frame:1})).outcome,'failed')});
test('retreat uses chosen hostile rather than a nonhostile',async()=>{const r=rig();r.state.foes=[{targetId:'a',hostile:true,dist:2},{targetId:'npc',hostile:false,dist:20}];await r.executor.start({kind:'retreat',range:6},{generation:1,frame:1});r.state.pos=[0,0,1];r.state.foes=[{targetId:'npc',hostile:false,dist:20},{targetId:'a',hostile:true,dist:3}];assert.equal((await r.executor.poll()).task.status,'running');r.state.foes[1].dist=7;assert.equal((await r.executor.poll()).task.outcome,'completed')});
test('scene transition requires explicit successful use receipt',async()=>{for(const receipt of [true,false]){const r=rig();r.setScan({page:'p',frame:1,id:1,things:[{kind:'door',x:0,z:1}]});await r.executor.start({kind:'use',target:{kind:'door',x:0,z:1}},{generation:1,frame:1});if(receipt)r.event('used','entered',{outcome:'place'});r.state.frame=2;assert.equal((await r.executor.poll()).task.outcome,receipt?'completed':'interrupted')}});

test('turn accepts the actual Body tolerance and retains an arrival receipt across polls',async()=>{
 const r=rig();r.status.settings={faceToleranceDeg:12};
 await r.executor.start({kind:'turn',degrees:90},{generation:1,frame:1});
 r.state.yaw=70;r.event('arrived');assert.equal((await r.executor.poll()).task.status,'running');
 r.state.yaw=80;const {task}=await r.executor.poll();
 assert.equal(task.outcome,'completed');assert.equal(task.progress.angularError,10);assert.equal(task.progress.turnToleranceDeg,12);
});

test('stop failure still records a terminal task and blocks new input until cleanup succeeds',async()=>{
 const r=rig();await r.executor.start({kind:'look'},{generation:1,frame:1});
 const stop=r.io.stop;r.io.stop=async()=>{throw Error('page disconnected')};
 const ended=await r.executor.cancel('operator');assert.equal(ended.status,'terminal');assert.equal(ended.cleanupPending,true);
 assert.match(ended.cleanupErrors.join(' '),/page disconnected/);
 assert.equal((await r.executor.poll()).task.status,'terminal');
 await assert.rejects(r.executor.start({kind:'look'},{generation:1,frame:1}),/cleanup/i);
 r.io.stop=stop;const retried=await r.executor.cancel();assert.equal(retried.cleanupPending,false);
 assert.equal((await r.executor.start({kind:'look'},{generation:1,frame:1})).status,'running');
 await r.executor.cancel();
});

test('replacing a running task cannot bypass failed stop cleanup',async()=>{
 const r=rig();await r.executor.start({kind:'look'},{generation:1,frame:1});
 const stop=r.io.stop;r.io.stop=async()=>{throw Error('page disconnected')};
 await assert.rejects(r.executor.start({kind:'turn',degrees:90},{generation:1,frame:1}),/cleanup/i);
 assert.equal((await r.executor.poll()).task.kind,'look');
 r.io.stop=stop;await r.executor.cancel();
});

test('unread lost Body events interrupt rather than silently expiring or reporting completion',async()=>{
 const r=rig();await r.executor.start({kind:'turn',degrees:90},{generation:1,frame:1});
 const body=r.io.body;r.io.body=async after=>({...await body(after),events:{lines:[],dropped:1,lostThroughSeq:1}});
 const {task}=await r.executor.poll();assert.equal(task.outcome,'interrupted');assert.match(task.reason,/event.*lost/i);
});

test('a checking flag plus unrelated overlay is not a completed interaction',async()=>{
 const r=rig();r.setScan({page:'p',frame:1,id:1,things:[{kind:'door',x:0,z:1}]});
 await r.executor.start({kind:'use',target:{kind:'door',x:0,z:1}},{generation:1,frame:1});
 r.status.goal.checking=true;r.state.overlay=true;
 assert.equal((await r.executor.poll()).task.outcome,'interrupted');
});

test('real Body and executor agree on turn completion without perfect heading',async()=>{
 let time=0;
 const state={pos:[0,0,0],yaw:0,pitch:0,frame:1,mode:'dungeon',scan:{page:'p',id:1,frame:1,fresh:true},vitals:{health:10,maxHealth:10},foes:[]};
 const agent={state:()=>structuredClone(state),view:()=>null,look:dx=>{state.yaw+=dx/3.5;},press:()=>({ok:true}),release(){},releaseAll(){}};
 const body=createBody(agent,{now:()=>time});
 const io={native:async()=>({ready:true,state:agent.state(),view:null}),body:async after=>({ready:true,status:body.status(),policy:body.getPolicy(),events:body.events(after)}),command:async(m,a)=>m==='enable'?body.enable(...a):body[m](a),stop:async()=>{body.enable(false);return {ok:true}}};
 const executor=createIntentExecutor({transport:io,now:()=>time});
 await executor.start({kind:'turn',degrees:90},{generation:1,frame:1});
 let task;
 for(let i=0;i<80;i++){time+=50;body.tick();task=(await executor.poll()).task;if(task.status==='terminal')break;}
 assert.equal(task.outcome,'completed');assert.ok(task.progress.angularError<=12);assert.equal(body.status().enabled,false);
});

test('a logging failure cannot prevent cancellation from releasing physical input',async()=>{
 const r=rig();const executor=createIntentExecutor({transport:r.io,emit:e=>{if(e.task.status==='terminal')throw Error('log unavailable')}});
 assert.equal((await executor.start({kind:'look'},{generation:1,frame:1})).status,'running');
 const task=await executor.cancel();assert.equal(task.status,'terminal');assert.equal(task.cleanupPending,false);assert.equal(r.enabled,false);assert.match(task.loggingError,/log unavailable/);
});

test('exploration success is completed and its default deadline permits the bounded 90s hand',async()=>{
 const r=rig();const hand={hear(){},prepare:()=>({x:1,z:1,navigation:{route:{status:'complete'}}}),commit(){},cancel(){},step:()=>({kind:'finish',status:'succeeded',reason:'new door observed',visits:2,seconds:3})};
 const executor=createIntentExecutor({transport:r.io,now:()=>0,exploration:hand});
 assert.equal((await executor.start({kind:'explore'},{generation:1,frame:1})).deadline,90000);
 const {task}=await executor.poll();assert.equal(task.outcome,'completed');assert.equal(task.progress.exploration.visits,2);assert.equal(r.enabled,false);
});

test('real Body reports exactly which sequence range was lost to log overflow',()=>{
 const body=createBody({state:()=>null,releaseAll(){}});
 for(let i=0;i<350;i++)body.setPolicy({rules:[{id:'hold',when:{},do:{act:'stop'}}],settings:{}});
 const events=body.events(0);assert.ok(events.dropped>0);assert.ok(events.lostThroughSeq>0);assert.ok(events.lines.every(e=>e.seq>events.lostThroughSeq));
 assert.equal(body.events(events.lostThroughSeq).lostThroughSeq,events.lostThroughSeq);
});

test('a moving interaction target refreshes coordinates by identity without changing actor',async()=>{
 const r=rig(),person={kind:'person',targetId:'person-1',x:0,z:1};
 r.setScan({page:'p',frame:1,id:1,things:[person]});
 await r.executor.start({kind:'use',target:person},{generation:1,frame:1});
 r.state.scan.id=2;r.setScan({page:'p',frame:1,id:2,things:[{...person,x:.5}]});
 const {task}=await r.executor.poll();assert.equal(task.status,'running');assert.equal(task.target.x,.5);assert.equal(r.status.goal.x,.5);assert.equal(task.targetId,'person-1');
 await r.executor.cancel();
});

test('a replacement executor records into the place memory the driver kept',async()=>{
 const {createPlaceMemory}=await import('../src/intent-executor.mjs');
 const real=createPlaceMemory(),used=[];
 const memory=new Proxy(real,{get(t,k){const v=t[k];return typeof v==='function'?(...a)=>{used.push(k);return v.apply(t,a);}:v;}});
 const first=rig({memory});await first.executor.start({kind:'look'},{generation:1,frame:1});await first.executor.poll();
 const seen=used.length;assert.ok(seen>0);const key=first.executor.placeSnapshot().key;
 await first.executor.cancel('operator hold');
 const second=rig({memory});await second.executor.start({kind:'look'},{generation:1,frame:1});await second.executor.poll();
 assert.ok(used.length>seen);assert.equal(second.executor.placeSnapshot().key,key);
});
