import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {rig} from './support/control-http-fixture.mjs';
import {createMindRuntime} from '../src/mind/runtime.mjs';
import {resolveMindConfig} from '../src/mind/config.mjs';
import {createMemory} from '../src/memory.mjs';
import {fakeModels} from './support/fake-control.mjs';

test('actual mind reconciles an unknown UI effect with a fresh decision and safe continuation',async()=>{
 const driver=await rig({completeAfterPolls:1}),dir=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-joint-')),memory=createMemory(dir),events=[];
 const config=resolveMindConfig({roles:{luna:{enabled:false,model:null},terra:{cooldownMs:0,maxCallsPerWindow:100,timeoutMs:1000,decisionTtlMs:600000},sol:{enabled:false,model:null}},scheduler:{pollIntervalMs:1,snapshotRetries:0,snapshotRetryDelayMs:1,localRetries:1,failureThreshold:2,planTtlMs:600000,maxCycles:20,continueAfterPlan:false,requestSolReviewOnComplete:false,reviewAtSessionEnd:false},budget:{maxInputTokens:null,maxCalls:null},models:{allowlist:['gpt-6.1-terra','gpt-6.1-sol']}});
 const model=fakeModels([{json:{schemaVersion:'dfo-mind.v1',goal:'Inspect UI',memory:'',handbookQuery:'',baseVersion:0,complete:false,sessionComplete:false,reason:'',ttlMs:600000,reassessOn:[],steps:[{id:'ui',task:{kind:'ui',payload:{action:{kind:'key',keys:['Escape']},uiObservationId:null}}}]}},{json:{schemaVersion:'dfo-mind.v1',goal:'Continue safely',memory:'',handbookQuery:'',baseVersion:1,complete:false,sessionComplete:false,reason:'',ttlMs:600000,reassessOn:[],steps:[{id:'turn',skill:'turn',args:{degrees:10}}]}}]);
 const request=async(url,body)=>{const r=await driver.request(url,body);if(r.status>=400)throw Object.assign(Error(r.data.error),{status:r.status,code:r.data.code});return r.data};
 const runtime=createMindRuntime({config,memory,logger:{event:(kind,data)=>events.push({kind,...data}),flush(){}},request,askModel:model.askModel,searchHandbook:()=>[]});
 try{const result=await runtime.scheduler.run();assert.equal(result.pauseReason,'session-complete');assert.equal(driver.uiWrites,1);assert.equal(driver.starts,1);assert.equal(model.calls.length,2);assert.ok(events.some(e=>e.kind==='ui-effect-reconciled'));assert.ok(events.some(e=>e.kind==='task-dispatch'&&e.task.uiObservationId));}finally{memory.close();await driver.close();}
});

test('active native task receives repair hold during polling and acknowledges cancellation',async()=>{
 const driver=await rig(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-joint-hold-')),memory=createMemory(dir);let taskId=null,delivered=false;
 const config=resolveMindConfig({roles:{luna:{enabled:false,model:null},terra:{cooldownMs:0,maxCallsPerWindow:100,timeoutMs:1000,decisionTtlMs:600000},sol:{enabled:false,model:null}},scheduler:{pollIntervalMs:5,snapshotRetries:0,snapshotRetryDelayMs:1,localRetries:1,failureThreshold:2,planTtlMs:600000,maxCycles:50,continueAfterPlan:false,requestSolReviewOnComplete:false,reviewAtSessionEnd:false},budget:{maxInputTokens:null,maxCalls:null},models:{allowlist:['gpt-6.1-terra','gpt-6.1-sol']}});
 const model=fakeModels([{json:{schemaVersion:'dfo-mind.v1',goal:'Turn',memory:'',handbookQuery:'',baseVersion:0,complete:false,sessionComplete:false,reason:'',ttlMs:600000,reassessOn:[],steps:[{id:'turn',skill:'turn',args:{degrees:10}}]}}]);
 const request=async(url,body)=>{if(url==='/task')taskId=body.requestId;const r=await driver.request(url,body);if(r.status>=400)throw Object.assign(Error(r.data.error),{status:r.status});return r.data};
 const runtime=createMindRuntime({config,memory,logger:{event(){},flush(){}},request,askModel:model.askModel,searchHandbook:()=>[],initialRepair:{proposalId:'current',hold:false},readRepairStatus:()=>{if(driver.starts&&!delivered){delivered=true;return {proposalId:'current',phase:'applying'}}return null;}});
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),100);
 try{await runtime.scheduler.run({signal:abort.signal});assert.equal(delivered,true);assert.equal((await driver.request(`/task?requestId=${taskId}`)).data.task.outcome,'cancelled');assert.equal(runtime.scheduler.summary().repair.hold,true);}finally{clearTimeout(timer);memory.close();await driver.close();}
});

test('reordered UI cannot reuse a prior control index or bind a decision to a later snapshot',async()=>{
 const {bindUIObservation}=await import('../src/mind/scheduler.mjs');
 const task={kind:'ui',payload:{action:{kind:'click',controlId:0},uiObservationId:'ui-old'}};
 const current={observationId:'obs-new',ui:{observationId:'ui-new',controls:[{id:0,text:'Buy'},{id:1,text:'Cancel'}]}};
 assert.throws(()=>bindUIObservation(task,current,{observationId:'obs-old'}),e=>e.code==='stale-ui-control');
 assert.throws(()=>bindUIObservation({...task,payload:{...task.payload,uiObservationId:null}},current,{observationId:'obs-old'}),e=>e.code==='stale-ui-control');
 assert.equal(bindUIObservation({...task,payload:{...task.payload,uiObservationId:null}},current,{observationId:'obs-new'}).payload.uiObservationId,'ui-new');
});

test('actual HTTP controller executes three simulated state-evidenced plans and modal to world recovery',async()=>{
 const {createNativeController,nativeControlRoute}=await import('../src/native-controller.mjs');const {createServer}=await import('node:http');let obs=0,equipped=false,hp=10,modal=true,writes=0;
 const ctrl=createNativeController({basis:()=>({pageId:'page',generation:1}),readNative:async()=>({ready:true,state:{frame:1,overlay:modal,vitals:{health:hp}},inventory:{items:[{name:'Sword',count:1,equipped}]},targets:[],events:{lines:[]}}),readUI:async()=>({id:++obs,text:modal?'Inventory':'World',controls:modal?[{id:0,text:'Sword'},{id:1,text:'Heal'},{id:2,text:'Close'}]:[]}),runUI:async({action})=>{writes++;if(action.controlId===0)equipped=true;else if(action.controlId===1)hp=15;else if(action.controlId===2)modal=false;return {issued:true}},start:async()=>{},poll:async()=>{},cancel:async()=>({status:'terminal',outcome:'cancelled',cleanupPending:false}),forceStop:async()=>({ok:true}),saveUncertain:()=>{},clearUncertain:()=>{}});
 const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),data=url.pathname==='/health'?ctrl.health():await nativeControlRoute(req,url,ctrl);res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(data));}catch(e){res.writeHead(e.status??500,{'content-type':'application/json'});res.end(JSON.stringify({error:e.message,code:e.code}));}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const request=async(url,body)=>{const r=await fetch(base+url,{method:body?'POST':'GET',headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error),{status:r.status});return data};
 const config=resolveMindConfig({roles:{luna:{enabled:false,model:null},terra:{cooldownMs:0,maxCallsPerWindow:100,timeoutMs:1000,decisionTtlMs:600000},sol:{enabled:false,model:null}},scheduler:{pollIntervalMs:1,snapshotRetries:0,snapshotRetryDelayMs:1,localRetries:1,failureThreshold:2,planTtlMs:600000,maxCycles:50,continueAfterPlan:true,maxEmptyPlanBoundaries:2,requestSolReviewOnComplete:false,reviewAtSessionEnd:false},budget:{maxInputTokens:null,maxCalls:null},models:{allowlist:['gpt-6.1-terra','gpt-6.1-sol']}});
 const defs=[['Equip sword','inventory.equip',{controlLabel:'Sword',itemName:'Sword'}],['Recover health','vitals.change',{controlLabel:'Heal',vital:'health',delta:5}],['Close inventory','ui.activate-observed',{controlLabel:'Close',expectedText:'World'}]];let calls=0;
 const askModel=async options=>{const context=JSON.parse(options.prompt.split('\n').at(-1)),index=calls++,d=defs[index];const json=d?{schemaVersion:'dfo-mind.v1',goal:d[0],memory:'',handbookQuery:'',baseVersion:index,complete:false,sessionComplete:false,reason:'',ttlMs:600000,reassessOn:[],steps:[{id:`s${index}`,task:{kind:'workflow',payload:{workflowId:d[1],version:1,maxMs:4000,args:{...d[2],uiObservationId:context.world.ui.observationId}}}}]}:{schemaVersion:'dfo-mind.v1',goal:'Finish',memory:'',handbookQuery:'',baseVersion:3,complete:true,sessionComplete:true,reason:'done',ttlMs:600000,reassessOn:[],steps:[]};return {json,text:JSON.stringify(json),usage:{input_tokens:10,output_tokens:10},ms:1};};
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-joint-three-')),memory=createMemory(dir),events=[];const runtime=createMindRuntime({config,memory,request,askModel,searchHandbook:()=>[],logger:{event:(kind,data)=>events.push({kind,...data}),flush(){}}});
 try{const result=await runtime.scheduler.run();assert.equal(result.pauseReason,'session-finished');assert.equal(writes,3);assert.equal(result.planHistory.length,3);assert.equal(equipped,true);assert.equal(hp,15);assert.equal(modal,false);assert.ok(events.some(e=>e.kind==='task-outcome'&&e.task.evidence.eventType==='item-equipped'));assert.ok(events.some(e=>e.kind==='task-outcome'&&e.task.evidence.eventType==='health-changed'));}finally{memory.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
});

test('repair retry uses the original failed turn and measures the actual controller receipt',async()=>{
 const {selectTurnRetry,retryTurn}=await import('../src/repair/retry.mjs');const authority={planId:'p',planVersion:2,stepId:'turn'},continuation={plan:{planId:'p',version:2,steps:[{id:'turn',skill:'turn',args:{degrees:30}}],stepStates:{turn:'failed'}},lastOutcome:{authority,outcome:'failed',targetYaw:30,progress:{turnToleranceDeg:12}}};const step=selectTurnRetry(continuation);
 for(const badTurn of [false,true]){const r=await rig({completeAfterPolls:1,badTurn,initialYaw:15});try{const result=await retryTurn({baseUrl:r.base,step,maxMs:1000});assert.equal(result.verified,!badTurn);assert.equal(result.dispatchedDelta,15);assert.equal(result.release.cleanupPending,false);assert.equal(r.starts,1);}finally{await r.close();}}
 assert.throws(()=>selectTurnRetry({...continuation,lastOutcome:{...continuation.lastOutcome,outcome:'completed'}}),/failed plan/);
 const r=await rig();try{const result=await retryTurn({baseUrl:r.base,step,maxMs:1000,stillOwned:()=>false});assert.equal(result.verified,false);assert.equal(r.starts,0);}finally{await r.close();}
});

test('actual scheduler checkpoint retains failed plan authority and absolute turn target',async()=>{
 const {selectTurnRetry}=await import('../src/repair/retry.mjs');const driver=await rig({completeAfterPolls:1,failTurn:true}),dir=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-checkpoint-')),memory=createMemory(dir),saved=[];
 const config=resolveMindConfig({roles:{luna:{enabled:false,model:null},terra:{cooldownMs:0,maxCallsPerWindow:100,timeoutMs:1000,decisionTtlMs:600000},sol:{enabled:false,model:null}},scheduler:{pollIntervalMs:1,snapshotRetries:0,snapshotRetryDelayMs:1,localRetries:1,failureThreshold:2,planTtlMs:600000,maxCycles:10,continueAfterPlan:false,requestSolReviewOnComplete:false,reviewAtSessionEnd:false},budget:{maxInputTokens:null,maxCalls:null},models:{allowlist:['gpt-6.1-terra','gpt-6.1-sol']}});
 const model=fakeModels([{json:{schemaVersion:'dfo-mind.v1',goal:'Turn',memory:'',handbookQuery:'',baseVersion:0,complete:false,sessionComplete:false,reason:'',ttlMs:600000,reassessOn:[],steps:[{id:'turn',skill:'turn',args:{degrees:30}}]}}]);
 const request=async(url,body)=>{const r=await driver.request(url,body);if(r.status>=400)throw Object.assign(Error(r.data.error),{status:r.status});return r.data};
 const runtime=createMindRuntime({config,memory,logger:{event(){},flush(){}},request,askModel:model.askModel,searchHandbook:()=>[],onCheckpoint:(summary,reason,durable)=>saved.push({summary,reason,durable})});
 try{await runtime.scheduler.stepOnce();const receipt=saved.find(x=>x.reason==='retry:turn');assert.ok(receipt);const selected=selectTurnRetry({plan:receipt.durable.plan,lastOutcome:receipt.summary.lastOutcome});assert.equal(selected.targetYaw,30);assert.equal(selected.authority.stepId,'turn');}finally{memory.close();await driver.close();}
});

test('repair resume uses a separate request and refuses a racing operator stop or budget hold',async()=>{
 const {mayResumeRepair}=await import('../src/repair/resume-policy.mjs');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-resume-race-')),commandFile=path.join(dir,'command.json'),requestFile=path.join(dir,'request.json'),request={proposalId:'repair',expectedHoldAt:10};
 const status={phase:'verified',proposalId:'repair',holdCommandAt:10,originalHold:null,run:'r',afterRevision:'rev',invariants:{pagePreserved:true,characterPreserved:true,memoryPreserved:true,planPreserved:true,budgetPreserved:true}},continuation={repair:{proposalId:'repair',hold:true},budget:{paused:false,limits:{maxCalls:100},totals:{calls:2}}};fs.writeFileSync(commandFile,JSON.stringify({command:'hold',at:10}));fs.writeFileSync(requestFile,JSON.stringify(request),{flag:'wx'});
 const evalPolicy=()=>mayResumeRepair({request:JSON.parse(fs.readFileSync(requestFile)),status,continuation,command:JSON.parse(fs.readFileSync(commandFile)),commandAt:10,run:'r',effectiveRevision:'rev',deadline:Date.now()+10000});
 assert.equal(evalPolicy(),true);fs.writeFileSync(commandFile,JSON.stringify({command:'stop',at:11}));assert.equal(evalPolicy(),false);assert.equal(JSON.parse(fs.readFileSync(commandFile)).command,'stop');
 fs.writeFileSync(commandFile,JSON.stringify({command:'hold',at:10}));continuation.budget.paused=true;assert.equal(evalPolicy(),false);
});
