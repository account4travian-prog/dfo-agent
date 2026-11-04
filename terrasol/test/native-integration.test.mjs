import test from 'node:test';
import assert from 'node:assert/strict';
import {runNativeIntent} from '../src/main.mjs';
import {normalizeNativeDecision} from '../src/protocol.mjs';

test('one model decision runs through local progress to a verified outcome',async()=>{
  let calls=0,polls=0;
  const model=async()=>{calls++;return {kind:'turn',degrees:90};};
  const intent=await model();
  const result=await runNativeIntent({intent,generation:4,frame:7,sleep:async()=>{},request:async(route,body)=>{
    if(route==='/intent'&&body){assert.equal(body.generation,4);return {status:'running'};}
    polls++;return {task:polls<4?{status:'running',progress:{angularError:90-polls*20}}:{kind:'turn',status:'terminal',outcome:'completed',progress:{angularError:1}}};
  }});
  assert.equal(calls,1);assert.equal(polls,4);assert.equal(result.outcome,'completed');
});
test('worker cancellation releases the running routine without another decision',async()=>{
  let cancelled=false,stop=false;
  const result=await runNativeIntent({intent:{kind:'explore'},generation:1,frame:2,aborted:()=>stop,sleep:async()=>{stop=true;},request:async(route,body)=>{
    if(route==='/intent/cancel'){cancelled=true;return {};}
    return body?{}:{task:{status:'running'}};
  }});
  assert.equal(cancelled,true);assert.equal(result.outcome,'cancelled');
});
test('only current observed targets resolve and ambiguous responses fail',()=>{
  const target={kind:'door',x:3,z:5};const intent={kind:'use',targetIndex:0,x:null,z:null,degrees:null,range:null,maxMs:null};
  assert.deepEqual(normalizeNativeDecision({intent,action:null},[{kind:'thing',target}]).intent.target,target);
  assert.throws(()=>normalizeNativeDecision({intent,action:null},[]),/current observation/);
  assert.throws(()=>normalizeNativeDecision({intent,action:{}},[{target}]),/exactly one/);
});

import {createControlGate, refreshObservedTarget} from '../src/browser.mjs';
test('moving foe refreshes by stable observed identity; missing foe never retargets',()=>{
  const old={targetId:'foe-frame-1',x:1,z:1}, moved={...old,x:9,z:3};
  assert.equal(refreshObservedTarget(old,[{kind:'foe',target:moved}]),moved);
  assert.equal(refreshObservedTarget(old,[{kind:'foe',target:{...moved,targetId:'other'}}]),null);
  assert.equal(refreshObservedTarget({kind:'door',x:2,z:3},[{kind:'thing',target:{kind:'door',x:3,z:3}}]),null);
});
test('stop invalidates a pending start before releasing it; UI follows cancellation',async()=>{
  const gate=createControlGate(), order=[];let release,entered;
  const entering=new Promise(r=>entered=r), wait=new Promise(r=>release=r);
  const revision=gate.revision;
  const start=gate.run(async()=>{order.push('start');entered();await wait;if(revision!==gate.revision){order.push('stale');return;}order.push('write');});
  await entering;gate.invalidate();
  const stop=gate.run(async()=>{order.push('cancel-and-release');});
  const ui=gate.run(async()=>{order.push('ui');});
  release();await Promise.all([start,stop,ui]);
  assert.deepEqual(order,['start','stale','cancel-and-release','ui']);
});
test('combat health floor is bounded and scoped to combat',()=>{
  const base={targetIndex:null,x:null,z:null,degrees:null,range:null,maxMs:null};
  assert.equal(normalizeNativeDecision({action:null,intent:{...base,kind:'fight',stopHpPct:35}}).intent.stopHpPct,35);
  assert.throws(()=>normalizeNativeDecision({action:null,intent:{...base,kind:'fight',stopHpPct:101}}),/floor/);
  // Changed 2026-10-29: a floor on a non-combat intent is ignored (Luna adds them to explore), not refused.
  assert.equal(normalizeNativeDecision({action:null,intent:{...base,kind:'goto',x:1,z:1,stopHpPct:20}}).intent.stopHpPct,undefined);
});
