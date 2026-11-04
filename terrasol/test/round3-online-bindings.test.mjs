import test from 'node:test';
import assert from 'node:assert/strict';

test('binding reader uses current engine registry and labels fallback explicitly',async()=>{
 const {readLiveBindings,bindingKey}=await import('../src/player/bindings.mjs');
 const live=await readLiveBindings({evaluate:async()=>({source:'engine-live',bindings:{Rest:['KeyK'],QuickSave:['F2']}})});
 assert.equal(bindingKey(live,'Rest'),'k');assert.equal(live.bindings.QuickSave[0],'F2');
 const fallback=await readLiveBindings({evaluate:async()=>{throw Error('unavailable');}});
 assert.equal(fallback.source,'fallback');assert.match(fallback.reason,/unavailable/);
});
test('online recovery predicates require living same Rowan and rest gains; dispatch proves neither',async()=>{
 const {recoveryObserved,restObserved}=await import('../src/player/online.mjs');
 const before={mode:'online',character:{name:'Rowan',idHash:'a'},phase:'death',vitals:{health:0,fatigue:1}};
 const after={...before,phase:'world',vitals:{health:50,fatigue:80}};
 assert.equal(recoveryObserved(before,after),true);
 assert.equal(recoveryObserved(before,{...after,character:{name:'Tiger Fist',idHash:'b'}}),false);
 assert.equal(recoveryObserved(before,{...after,mode:'offline'}),false);
 assert.equal(recoveryObserved({...before,vitals:{health:null}},after),false);
 assert.equal(restObserved({...before,phase:'modal',vitals:{health:20,fatigue:1}},after),true);
 assert.equal(restObserved(after,after),false);
});
test('rest executor uses the rebound key and waits for the channel to end before returning',async()=>{
 const {executeOnlineUI}=await import('../src/player/online.mjs');
 const states=[{mode:'online',character:{name:'Rowan',idHash:'a'},phase:'world',vitals:{health:20,fatigue:1}},
  {mode:'online',character:{name:'Rowan',idHash:'a'},phase:'world',restEnded:false,vitals:{health:25,fatigue:1}},
  {mode:'online',character:{name:'Rowan',idHash:'a'},phase:'world',restEnded:true,vitals:{health:50,fatigue:80}}];
 const keys=[];let sleeps=0;
 const result=await executeOnlineUI({page:{evaluate:async()=>({source:'engine-live',bindings:{Rest:['KeyK']}}),keyboard:{press:async key=>keys.push(key)}},ui:{controls:[]},action:{kind:'online-rest'},readState:async()=>states.shift(),sleep:async()=>sleeps++});
 assert.deepEqual(keys,['k']);assert.equal(sleeps,1);assert.equal(result.rest,'own-vital-gain-observed');
});
