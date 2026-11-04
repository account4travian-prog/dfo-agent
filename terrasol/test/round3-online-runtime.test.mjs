import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createMindRuntime} from '../src/mind/runtime.mjs';
import {resolveMindConfig} from '../src/mind/config.mjs';
import {createMemory} from '../src/memory.mjs';
import {createFakeDriver,fakeModels,terraPlan} from './support/fake-control.mjs';

function rig(mode,snapshot){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rowan-online-runtime-')),memory=createMemory(dir),events=[];
 const config=resolveMindConfig({roles:{luna:{enabled:false,model:null},sol:{enabled:false,model:null},terra:{cooldownMs:0}},models:{allowlist:['gpt-6.1-terra']},scheduler:{reviewAtSessionEnd:false,requestSolReviewOnComplete:false,snapshotRetries:0,maxCycles:4}});
 const driver=createFakeDriver({snapshots:[snapshot]}),models=fakeModels([{json:{...terraPlan({goal:'Finished',steps:[]}),complete:true,sessionComplete:true}}]);
 const runtime=createMindRuntime({config,memory,logger:{event:(kind,data)=>events.push({kind,...data})},request:driver.request,askModel:models.askModel,searchHandbook:()=>[],session:{mode}});
 return {runtime,models,events,driver,close:()=>{memory.close();fs.rmSync(dir,{recursive:true,force:true});}};
}
test('actual scheduler sends offline rules and rebound keys, and labels its plans and logs',async()=>{
 const r=rig('offline',{native:{sessionMode:'offline',character:{name:'Rowan'},bindings:{source:'engine-live',bindings:{Rest:['KeyK']}}}});
 try{
  const summary=await r.runtime.scheduler.run();
  assert.equal(summary.mode,'offline');assert.equal(summary.plan.mode,'offline');
  assert.match(r.models.calls[0].prompt,/OFFLINE session/);assert.match(r.models.calls[0].prompt,/KeyK/);
  assert.doesNotMatch(r.models.calls[0].prompt,/Use startup.sign-in/);
  assert.ok(r.events.every(e=>e.mode==='offline'));
 }finally{r.close();}
});
test('wrong-mode world and Tiger Fist hold before any model call or physical input',async()=>{
 for(const snapshot of [{native:{sessionMode:'offline',character:{name:'Rowan'}}},{native:{sessionMode:'online',character:{name:'Tiger Fist'}}}]){
  const r=rig('online',snapshot);
  try{const result=await r.runtime.scheduler.run();assert.equal(result.paused,true);assert.equal(r.models.calls.length,0);assert.ok(!r.driver.calls.some(c=>c.path==='/intent'&&c.body));}finally{r.close();}
 }
});
