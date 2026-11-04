import test from 'node:test';
import assert from 'node:assert/strict';
import {rig} from './support/control-http-fixture.mjs';
const command=(snapshot,requestId='one')=>({requestId,basis:{...snapshot.basis,observationId:snapshot.observationId},authority:{planId:'plan',planVersion:1,stepId:'step'},intent:{kind:'turn',degrees:90}});

test('HTTP contract advertises capabilities; native snapshots do not capture UI/images',async()=>{
 const r=await rig();try{const h=await r.request('/health');assert.equal(h.data.contractVersion,'dfo-control.v1');assert.equal(h.data.capabilities.requestFencing,true);
 const {data:s}=await r.request('/snapshot');assert.equal(s.captured.coherent,true);assert.equal(r.images,0);assert.equal(r.uiCaptures,0);
 await r.request('/snapshot?ui=1');assert.equal(r.uiCaptures,1);assert.equal(r.images,0);
 await r.request('/snapshot?image=1');assert.equal(r.images,1);
 }finally{await r.close();}
});

test('HTTP retries are idempotent; conflicting IDs and implicit replacements are rejected',async()=>{
 const r=await rig();try{const {data:s}=await r.request('/snapshot'),body=command(s);
 const first=await r.request('/intent',body);assert.equal(first.status,200);assert.equal(first.data.authority.planVersion,1);
 const again=await r.request('/intent',body);assert.equal(again.data.replayed,true);assert.equal(r.starts,1);
 assert.equal((await r.request('/intent',{...body,intent:{kind:'turn',degrees:45}})).status,409);
 assert.equal((await r.request('/intent',command(s,'two'))).status,409);
 assert.equal((await r.request('/intent?requestId=unknown')).status,404);
 r.complete();assert.equal((await r.request('/intent?requestId=one')).data.task.outcome,'completed');
 assert.equal((await r.request('/intent',command(s,'two'))).status,200);
 await r.request('/intent/cancel',{requestId:'one'});assert.equal((await r.request('/intent?requestId=two')).data.task.status,'running');
 }finally{await r.close();}
});

test('HTTP target and frame fences reject stale or fabricated decisions before dispatch',async()=>{
 const r=await rig();try{const {data:s}=await r.request('/snapshot');const body=command(s);
 assert.equal((await r.request('/intent',{...body,basis:{...body.basis,frame:999}})).status,409);
 assert.equal((await r.request('/intent',{...body,observedTarget:true,intent:{kind:'use',target:{kind:'door',x:999,z:999}}})).status,409);
 assert.equal(r.starts,0);
 await r.request('/stop',{});assert.equal((await r.request('/intent',body)).status,409);
 await r.request('/resume',{});assert.equal((await r.request('/intent',body)).status,409);
 }finally{await r.close();}
});

test('HTTP stop invalidates a queued/in-flight start and releases without waiting for it',async()=>{
 let unblock;const delayStart=new Promise(r=>unblock=r);const r=await rig({delayStart,timeoutMs:300});
 try{const {data:s}=await r.request('/snapshot');const pending=r.request('/intent',command(s));
 await new Promise(r=>setTimeout(r,15));const stopped=await r.request('/stop',{});assert.equal(stopped.data.stopped,true);assert.ok(r.stops>0);
 unblock();assert.equal((await pending).status,409);assert.equal(r.starts,0);
 assert.equal((await r.request('/intent',command(s,'two'))).status,409);
 }finally{unblock();await r.close();}
});

test('HTTP hung poll becomes a terminal fault and holds further control',async()=>{
 const r=await rig({hangPoll:true,timeoutMs:20});try{const {data:s}=await r.request('/snapshot');await r.request('/intent',command(s));
 const {data:p}=await r.request('/intent?requestId=one');assert.equal(p.task.status,'terminal');assert.equal(p.task.cleanupPending,true);assert.match(p.task.reason,/timed out/);
 assert.equal((await r.request('/intent',command(s,'two'))).status,409);assert.equal((await r.request('/health')).data.stopped,true);
 }finally{await r.close();}
});

test('HTTP explicit resume cannot bypass unverified physical release',async()=>{
 const r=await rig({releaseFails:true});try{await r.request('/stop',{});assert.equal((await r.request('/resume',{})).status,409);assert.equal((await r.request('/health')).data.fault,true);}finally{await r.close();}
});

test('HTTP snapshot refuses mixed frames and translates only captured UI identities',async()=>{
 const r=await rig({changeSceneDuringUI:true});try{assert.equal((await r.request('/snapshot?ui=1')).status,409);assert.equal((await r.request('/snapshot?after=-1')).status,400);}finally{await r.close();}
 const s=await rig();try{const {data:world}=await s.request('/snapshot?ui=1');assert.equal(s.controller.uiObservationId(world.observationId,world.basis.generation),world.ui.id);assert.throws(()=>s.controller.uiObservationId(world.observationId,999),/basis/);}finally{await s.close();}
});

test('HTTP UI authority cannot silently replace native execution',async()=>{
 const r=await rig();try{const {data:s}=await r.request('/snapshot');await r.request('/intent',command(s));
 const result=await r.request('/action',{});assert.equal(result.status,409);assert.equal(r.uiWrites,0);
 assert.equal((await r.request('/intent?requestId=one')).data.task.status,'running');
 await r.request('/intent/cancel',{requestId:'one'});assert.equal((await r.request('/action',{})).status,200);
 }finally{await r.close();}
});
