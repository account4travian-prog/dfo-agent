import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {rig} from './support/control-http-fixture.mjs';
import {fakeModels,terraPlan} from './support/fake-control.mjs';
import {resolveMindConfig} from '../src/mind/config.mjs';
import {createMindRuntime} from '../src/mind/runtime.mjs';
import {createMemory} from '../src/memory.mjs';
import {validatePlan} from '../src/mind/plan.mjs';
import {createBudget} from '../src/mind/budget.mjs';
import {createModelRouter} from '../src/mind/router.mjs';

async function scenario({budget={},hangPoll=false,steps=[{id:'move',skill:'goto',args:{x:1,z:2}},{id:'look',skill:'look',args:{}}]}={}){
 const driver=await rig({completeAfterPolls:2,timeoutMs:50,hangPoll});const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-reconciled-'));
 const memory=createMemory(dir),events=[],checkpoints=[],models=fakeModels([{json:terraPlan({steps})}]);
 const config=resolveMindConfig({roles:{luna:{enabled:false,model:null},terra:{cooldownMs:0,maxCallsPerWindow:100,decisionTtlMs:600000},sol:{enabled:false}},scheduler:{pollIntervalMs:1,snapshotRetries:0,maxCycles:20,requestSolReviewOnComplete:false,continueAfterPlan:false},budget:{maxCalls:null,maxInputTokens:null,...budget}});
 const request=async(route,body)=>{const response=await driver.request(route,body);if(response.status>=400)throw Object.assign(Error(response.data.error),{status:response.status});return response.data;};
 const runtime=createMindRuntime({config,memory,logger:{event:(kind,data)=>events.push({kind,...data})},request,askModel:models.askModel,searchHandbook:()=>[],onCheckpoint:(summary,why,durable)=>checkpoints.push({summary,why,durable})});
 return {driver,runtime,models,events,checkpoints,close:async()=>{await driver.controller.stopAll('test end');await driver.close();memory.close();fs.rmSync(dir,{recursive:true,force:true});}};
}

test('reconciled scheduler runs two plan steps through actual HTTP contract with one model call',async()=>{
 const r=await scenario();try{const result=await r.runtime.scheduler.run();assert.equal(result.pauseReason,'session-complete');assert.equal(r.driver.starts,2);assert.equal(r.driver.polls,4);assert.equal(r.models.calls.length,1);assert.equal(r.driver.images,0);
 const saved=r.checkpoints.at(-1).durable.plan;assert.deepEqual(validatePlan(saved),[]);assert.deepEqual(saved.steps[0].args,{x:1,z:2});assert.equal(saved.stepStates.move,'completed');
 }finally{await r.close();}
});

test('reconciled budget gate holds before dispatch instead of exceeding its configured call cap',async()=>{
 const r=await scenario({budget:{maxCalls:0}});try{const result=await r.runtime.scheduler.run();assert.match(result.pauseReason,/budget/);assert.equal(r.models.calls.length,0);assert.equal(r.driver.starts,0);}finally{await r.close();}
});

test('reconciled driver poll fault becomes cleanup hold rather than another model decision',async()=>{
 const r=await scenario({hangPoll:true});try{const result=await r.runtime.scheduler.run();assert.equal(result.status,'paused');assert.equal(r.models.calls.length,1);assert.equal(r.driver.starts,1);assert.ok(r.events.some(e=>e.kind==='intent-outcome'&&e.task.cleanupPending));assert.equal(r.driver.controller.health().stopped,true);}finally{await r.close();}
});

test('session budget counters and unknown usage survive a worker checkpoint',()=>{
 const limits={maxCalls:2,maxInputTokens:500};const before=createBudget({limits});before.record({role:'terra',usage:{input_tokens:100,cached_input_tokens:40}});
 const after=createBudget({limits,initialStatus:JSON.parse(JSON.stringify(before.status()))});assert.equal(after.status().totals.calls,1);assert.equal(after.status().totals.input_tokens,100);
 after.record({role:'luna',usageReported:false});assert.equal(after.check('terra').ok,false);assert.equal(after.status().totals.calls,2);assert.equal(after.status().totals.unreportedCalls,1);
 after.resume({operator:true});assert.equal(after.check('terra').ok,false,'operator resume does not reset a session cap');
});

test('failed model attempts consume the call budget and retain unknown token accounting',async()=>{
 const config=resolveMindConfig({budget:{maxCalls:1}}),budget=createBudget({limits:config.budget});let attempts=0;
 const router=createModelRouter({config,budget,askModel:async()=>{attempts++;throw Error('transport disconnected')}});
 assert.equal((await router.call({role:'terra',prompt:'test'})).ok,false);
 assert.equal((await router.call({role:'terra',prompt:'test again'})).ok,false);
 assert.equal(attempts,1);assert.equal(budget.status().totals.calls,1);assert.equal(budget.status().totals.unreportedCalls,1);
});
