import test from 'node:test';
import assert from 'node:assert/strict';
import {rig} from './support/control-http-fixture.mjs';

test('player HTTP surface fences UI retries and preserves unknown outcomes',async()=>{
 const r=await rig();try{
  const health=(await r.request('/health')).data;assert.equal(health.playerContractVersion,'dfo-player.v1');assert.equal(health.capabilities.tasks,true);
  assert.equal((await r.request('/workflows')).data.workflows[0].id,'ui.activate-observed');
  const s=(await r.request('/snapshot?ui=1')).data;
  const body={requestId:'ui-1',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'s'},task:{kind:'ui',payload:{action:{kind:'click',controlId:1},uiObservationId:s.ui.observationId}}};
  const first=await r.request('/task',body);assert.equal(first.status,200);assert.equal(first.data.evidence.status,'unknown');assert.equal(first.data.taskId,'ui-1');assert.equal(first.data.generation,s.basis.generation);assert.equal(first.data.frame,s.basis.frame);assert.deepEqual(first.data.authority,body.authority);assert.equal(r.uiWrites,1);assert.equal((await r.request('/health')).data.stopped,true);
  const retry=await r.request('/task',body);assert.equal(retry.data.replayed,true);assert.equal(r.uiWrites,1);
  const conflict=structuredClone(body);conflict.task.payload.action.controlId=2;assert.equal((await r.request('/task',conflict)).data.code,'REQUEST_CONFLICT');
  assert.equal((await r.request('/task?requestId=ui-1')).data.task.outcome,'completed');
  assert.equal((await r.request('/task/cancel',{requestId:'ui-1'})).data.outcome,'completed');
  await r.request('/resume',{});const fresh=(await r.request('/snapshot?ui=1')).data;const bad=structuredClone(body);bad.basis={observationId:fresh.observationId,...fresh.basis};bad.requestId='ui-2';bad.task.payload.uiObservationId='wrong';assert.equal((await r.request('/task',bad)).data.code,'STALE_CONTROL');assert.equal(r.uiWrites,1);
  const unsupported=structuredClone(body);unsupported.basis=bad.basis;unsupported.requestId='w';unsupported.task={kind:'workflow',payload:{workflowId:'buy'}};assert.equal((await r.request('/task',unsupported)).data.code,'UNSUPPORTED_WORKFLOW');
 }finally{await r.close();}
});

test('player UI cannot replace an active native request',async()=>{
 const r=await rig();try{const s=(await r.request('/snapshot?ui=1')).data;const basis={observationId:s.observationId,...s.basis};const authority={planId:'p',planVersion:1,stepId:'s'};
 await r.request('/task',{requestId:'native',basis,authority,task:{kind:'intent',payload:{kind:'turn',degrees:10}}});
 const ui=await r.request('/task',{requestId:'ui',basis,authority,task:{kind:'ui',payload:{action:{kind:'click',controlId:1},uiObservationId:s.ui.observationId}}});assert.equal(ui.data.code,'TASK_BUSY');assert.equal(r.uiWrites,0);
 }finally{await r.close();}
});

test('pre-world UI and unknown action outcome remain fenced',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let writes=0,generation=1;
 const c=createNativeController({timeoutMs:15,basis:()=>({pageId:'p',generation}),readNative:async()=>({ready:false}),readUI:async()=>({id:1,text:'Select character'}),runUI:async()=>{writes++;return new Promise(()=>{});},start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true}),latchStop:()=>generation++});
 const s=await c.snapshot({ui:true});assert.equal(s.player.phase,'frontdoor');
 const b={requestId:'once',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'s'},task:{kind:'ui',payload:{uiObservationId:s.ui.observationId,action:{kind:'click',controlId:0}}}};
 const first=await c.submitTask(b);assert.equal(first.outcome,'failed');assert.equal(first.cleanupPending,true);assert.equal(writes,1);
 assert.equal((await c.submitTask(b)).replayed,true);assert.equal(writes,1);assert.equal(c.health().stopped,true);
});

test('phase uses current player state and visible title and death controls',async()=>{
 const {playerPhase}=await import('../src/native-controller.mjs');
 assert.equal(playerPhase({ready:true,state:{vitals:{health:0}}},null),'death');
 assert.equal(playerPhase({ready:true,state:{loading:true}},null),'loading');
 assert.equal(playerPhase({ready:true,state:{paused:true}},null),'modal');
 assert.equal(playerPhase({ready:true,state:{overlay:true}},null),'modal');
 assert.equal(playerPhase({ready:false}, {controls:[{text:'Select character'}]}),'frontdoor');
 assert.equal(playerPhase({ready:false}, {controls:[{text:'Respawn'}]}),'death');
 assert.equal(playerPhase({ready:false}, {text:'Unknown'}),'unknown');
});

test('trusted UI quiesces legacy Body and refuses a running legacy executor',async()=>{
 const {prepareTrustedUI}=await import('../src/browser.mjs');let stopped=0,released=0;
 const ops={poll:async()=>({task:{status:'running'}}),stopBody:async()=>{stopped++;return {ok:true}},release:async()=>{released++}};
 await assert.rejects(()=>prepareTrustedUI(ops),e=>e.code==='TASK_BUSY');assert.equal(stopped,0);assert.equal(released,0);
 ops.poll=async()=>({task:{status:'terminal'}});await prepareTrustedUI(ops);assert.equal(stopped,1);assert.equal(released,1);
 ops.stopBody=async()=>({ok:false});await assert.rejects(()=>prepareTrustedUI(ops),e=>e.code==='UNVERIFIED_CLEANUP');assert.equal(released,1);
});

test('workflow activates only a unique observed control and reports observed text, never a transaction',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let writes=0,after=false;
 const c=createNativeController({basis:()=>({pageId:'p',generation:1}),readNative:async()=>({ready:false}),readUI:async()=>({id:after?2:1,text:after?'Ready':'Select character',controls:[{id:3,text:'Continue',disabled:false}]}),runUI:async({action})=>{assert.deepEqual(action,{kind:'click',controlId:3});writes++;after=true;return {issued:true}},start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true})});
 const s=await c.snapshot({ui:true});const b={requestId:'wf',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'s'},task:{kind:'workflow',payload:{workflowId:'ui.activate-observed',version:1,maxMs:1000,args:{controlLabel:'Continue',uiObservationId:s.ui.observationId,expectedText:'Ready'}}}};
 const t=await c.submitTask(b);assert.equal(t.outcome,'completed');assert.equal(t.evidence.eventType,'visible-text-observed');assert.equal(t.evidence.status,'observed');assert.equal((await c.submitTask(b)).replayed,true);assert.equal(writes,1);
});

test('workflow refuses ambiguous controls and cannot use an already visible line as success',async()=>{
 const {resolveActivation,visibleLine}=await import('../src/player/workflows.mjs');const payload={workflowId:'ui.activate-observed',version:1,maxMs:1000,args:{controlLabel:'Buy',uiObservationId:'1',expectedText:'Bought'}};
 assert.throws(()=>resolveActivation(payload,{observationId:'1',controls:[{id:1,text:'Buy'},{id:2,text:'Buy'}]}),e=>e.code==='STALE_CONTROL');
 assert.throws(()=>resolveActivation({...payload,args:{...payload.args,script:'arbitrary'}},{observationId:'1',controls:[]}),e=>e.code==='INVALID_WORKFLOW_ARGS');
 assert.equal(visibleLine({text:'Already Bought'},'Bought'),false);
});

test('unknown workflow effect holds and prevents a fresh request from blindly repeating',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let writes=0,generation=1;
 const c=createNativeController({basis:()=>({pageId:'p',generation}),readNative:async()=>({ready:false}),readUI:async()=>({id:1,text:'Buy',controls:[{id:1,text:'Buy'}]}),runUI:async()=>{writes++;return {issued:true}},start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true}),latchStop:()=>generation++});
 const s=await c.snapshot({ui:true});const b={requestId:'buy',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'s'},task:{kind:'workflow',payload:{workflowId:'ui.activate-observed',version:1,maxMs:500,args:{controlLabel:'Buy',uiObservationId:'1',expectedText:'Bought'}}}};
 assert.equal((await c.submitTask(b)).outcome,'blocked');assert.equal(c.health().stopped,true);assert.equal((await c.submitTask(b)).replayed,true);
 await assert.rejects(()=>c.submitTask({...b,requestId:'buy-again'}),e=>e.code==='OPERATOR_STOPPED');assert.equal(writes,1);
});

test('reconciliation uses fresh evidence and keeps all risky input fenced',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let generation=1,writes=0;
 const c=createNativeController({basis:()=>({pageId:'p',generation}),readNative:async()=>({ready:false}),readUI:async()=>({id:generation,text:'Shop',controls:[{id:1,text:'Buy'},{id:2,text:'Close'}]}),runUI:async()=>{writes++;return {issued:true}},start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true}),latchStop:()=>generation++,resume:()=>{}});
 const s=await c.snapshot({ui:true}),authority={planId:'p',planVersion:1,stepId:'buy'},b={requestId:'buy',basis:{observationId:s.observationId,...s.basis},authority,task:{kind:'ui',payload:{uiObservationId:s.ui.observationId,action:{kind:'click',controlId:1}}}};
 const result=await c.submitTask(b);assert.equal(result.reconciliationRequired,true);const fresh=await c.snapshot({ui:true});
 const resolution=await c.reconcile({requestId:'buy',basis:{observationId:fresh.observationId,...fresh.basis},authority:{...authority,planVersion:2,stepId:'continue'},reason:'Observe shop and continue safely'});assert.equal(resolution.quarantined,true);assert.equal(c.health().stopped,false);
 const next=await c.snapshot({ui:true});await assert.rejects(()=>c.submitTask({...b,requestId:'buy-again',basis:{observationId:next.observationId,...next.basis},task:{kind:'ui',payload:{uiObservationId:next.ui.observationId,action:{kind:'click',controlId:1}}}}),e=>e.code==='UNCERTAIN_EFFECT');assert.equal(writes,1);
});

test('a visible close transition is a UI observation without a reconciliation hold',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let closed=false;
 const c=createNativeController({basis:()=>({pageId:'p',generation:1}),readNative:async()=>({ready:true,state:{frame:1}}),readUI:async()=>({id:closed?2:1,text:closed?'World':'Inventory',controls:closed?[]:[{id:0,text:'Close'}]}),runUI:async()=>{closed=true;return {issued:true}},start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true})});
 const s=await c.snapshot({ui:true});const t=await c.submitTask({requestId:'close',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'s'},task:{kind:'ui',payload:{uiObservationId:s.ui.observationId,action:{kind:'click',controlId:0}}}});
 assert.equal(t.evidence.eventType,'ui-transition-observed');assert.equal(t.evidence.status,'observed');assert.equal(t.reconciliationRequired,undefined);assert.equal(c.health().stopped,false);
});

test('uncertain risky input is persisted before dispatch and fenced after driver replacement',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let persisted=null,writes=0;
 const options={basis:()=>({pageId:'p',generation:1}),readNative:async()=>({ready:false}),readUI:async()=>({id:1,text:'Shop',controls:[{id:1,text:'Buy'}]}),loadUncertain:()=>persisted,saveUncertain:value=>{persisted=value},runUI:async()=>{assert.equal(persisted.requestId,'buy');writes++;return {issued:true}},start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true})};
 let c=createNativeController(options),s=await c.snapshot({ui:true});const body={requestId:'buy',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'s'},task:{kind:'ui',payload:{uiObservationId:s.ui.observationId,action:{kind:'click',controlId:1}}}};await c.submitTask(body);
 c=createNativeController(options);s=await c.snapshot({ui:true});await assert.rejects(()=>c.submitTask({...body,basis:{observationId:s.observationId,...s.basis}}),e=>e.code==='UNCERTAIN_EFFECT');assert.equal(writes,1);
});

test('own inventory evidence reports aggregated count/equipment changes, not transaction causes',async()=>{
 const {inventoryEvidence}=await import('../src/player/evidence.mjs');const ctx={requestId:'r',authority:{planId:'p',planVersion:1},basis:{generation:1}};
 const before={items:[{name:'Sword',count:1,equipped:false},{name:'Potion',count:2,equipped:false}]},after={items:[{name:'Sword',count:1,equipped:true},{name:'Potion',count:3,equipped:false}]};
 const rows=inventoryEvidence(before,after,ctx);assert.deepEqual(rows.map(x=>x.eventType),['item-equipped','inventory-changed']);assert.ok(rows.every(x=>x.status==='observed'&&x.source==='player-state'&&x.reason.includes('cause is not established')));assert.deepEqual(inventoryEvidence(null,after,ctx),[]);
});

test('inventory and vitals changes appear in actual task receipt without claiming causality',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let changed=false,generation=1;
 const c=createNativeController({basis:()=>({pageId:'p',generation}),readNative:async()=>({ready:true,state:{frame:1,vitals:{health:10,magicka:changed?4:8}},inventory:{items:[{name:'Sword',count:1,equipped:changed}]}}),readUI:async()=>({id:1,text:'Inventory',controls:[{id:0,text:'Sword'}]}),runUI:async()=>{changed=true;return {issued:true}},start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true}),latchStop:()=>generation++});
 const s=await c.snapshot({ui:true}),t=await c.submitTask({requestId:'equip',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'equip'},task:{kind:'ui',payload:{uiObservationId:s.ui.observationId,action:{kind:'click',controlId:0}}}});
 assert.deepEqual(t.evidenceRecords.map(x=>x.eventType),['item-equipped','magicka-changed']);assert.equal(t.reconciliationRequired,true);assert.ok(t.evidenceRecords.every(x=>x.status==='observed'));
});

test('two independently observed inventory changes clear their own pending records; unresolved effects persist',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let item=0,id=0,pending=null,cleared=0,writes=0,generation=1;
 const c=createNativeController({basis:()=>({pageId:'p',generation}),readNative:async()=>({ready:true,state:{frame:1,overlay:true},inventory:{items:item?[{name:'Potion',count:item,equipped:false}]:[]}}),readUI:async()=>({id:++id,text:'Shop',controls:[{id:0,text:'Buy Potion'}]}),runUI:async()=>{writes++;item++;return {issued:true}},loadUncertain:()=>pending,saveUncertain:v=>pending=v,clearUncertain:()=>{assert.ok(pending);pending=null;cleared++},start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true}),latchStop:()=>generation++});
 for(let n=1;n<=2;n++){const s=await c.snapshot({ui:true});const task={requestId:`buy-${n}`,basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:n,stepId:'buy'},task:{kind:'workflow',payload:{workflowId:'inventory.change',version:1,maxMs:1000,args:{controlLabel:'Buy Potion',uiObservationId:s.ui.observationId,itemName:'Potion',countDelta:1}}}};
  const r=await c.submitTask(task);assert.equal(r.evidence.eventType,'inventory-changed');assert.equal(r.evidence.status,'observed');assert.equal(r.reconciliationRequired,undefined);assert.equal(pending,null);assert.equal((await c.submitTask(task)).replayed,true);
 }
 assert.equal(writes,2);assert.equal(cleared,2);
});

test('chat draft and send use trusted controls once, clearing only on an observed own echo',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let draft='',lines=[],id=0,pending=null,writes=0,generation=1;
 const c=createNativeController({basis:()=>({pageId:'p',generation}),readNative:async()=>({ready:true,state:{frame:1,overlay:true}}),readUI:async()=>({id:++id,text:'Chat',chatLines:[...lines],controls:[{id:0,tag:'input',type:'text',text:'Message',value:draft,context:'chat-input'},{id:1,tag:'button',text:'Send',context:'chat-send'}]}),runUI:async({action})=>{writes++;if(action.kind==='type')draft=action.text;else{lines.push(draft);draft='';}return {issued:true}},loadUncertain:()=>pending,saveUncertain:v=>pending=v,clearUncertain:()=>pending=null,start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true}),latchStop:()=>generation++});
 let s=await c.snapshot({ui:true});const task=(id,w,args)=>({requestId:id,basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:id},task:{kind:'workflow',payload:{workflowId:w,version:1,maxMs:1000,args:{uiObservationId:s.ui.observationId,...args}}}});
 const typed=await c.submitTask(task('type','ui.type-field',{controlLabel:'Message',text:'Hello'}));assert.equal(typed.evidence.eventType,'field-value-observed');assert.equal(pending,null);
 s=await c.snapshot({ui:true});const send=task('send','chat.send',{controlLabel:'Send',text:'Hello'}),sent=await c.submitTask(send);assert.equal(sent.evidence.eventType,'chat-line-observed');assert.equal(sent.evidence.status,'observed');assert.equal(pending,null);assert.equal((await c.submitTask(send)).replayed,true);assert.equal(writes,2);
});

test('bounded authorized key action can observe a vital delta without asserting a spell effect',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let magic=10,id=0,pending=null;
 const c=createNativeController({basis:()=>({pageId:'p',generation:1}),readNative:async()=>({ready:true,state:{frame:1,vitals:{magicka:magic}}}),readUI:async()=>({id:++id,text:'World',controls:[]}),runUI:async({action})=>{assert.deepEqual(action,{kind:'key',keys:['q']});magic=8;return {issued:true}},saveUncertain:v=>pending=v,clearUncertain:()=>pending=null,start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true})});
 const s=await c.snapshot({ui:true}),r=await c.submitTask({requestId:'magic',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'magic'},task:{kind:'workflow',payload:{workflowId:'vitals.key-change',version:1,maxMs:1000,args:{uiObservationId:s.ui.observationId,key:'q',vital:'magicka',delta:-2}}}});
 assert.equal(r.evidence.eventType,'magicka-changed');assert.equal(r.evidence.status,'observed');assert.equal(pending,null);assert.equal(r.reconciliationRequired,undefined);
});

test('observed successful side effect stays request-idempotent after driver replacement',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let item=0,id=0,pending=null,entries=[],writes=0;
 const options={basis:()=>({pageId:'p',generation:1}),readNative:async()=>({ready:true,state:{frame:1,overlay:true},inventory:{items:item?[{name:'Potion',count:item,equipped:false}]:[]}}),readUI:async()=>({id:++id,text:'Shop',controls:[{id:0,text:'Buy Potion'}]}),runUI:async()=>{writes++;item++;return {issued:true}},loadUncertain:()=>pending,loadCompleted:()=>entries,saveUncertain:v=>pending=v,clearUncertain:v=>{entries.push(v);pending=null},start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true})};
 let c=createNativeController(options),s=await c.snapshot({ui:true});const task={requestId:'purchase',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'buy'},task:{kind:'workflow',payload:{workflowId:'inventory.change',version:1,maxMs:1000,args:{controlLabel:'Buy Potion',uiObservationId:s.ui.observationId,itemName:'Potion',countDelta:1}}}};
 assert.equal((await c.submitTask(task)).outcome,'completed');c=createNativeController(options);const retry=await c.submitTask(task);assert.equal(retry.replayed,true);assert.equal(writes,1);
});

test('authorized scene transition waits for loading and preserves character across frame change',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let frame=1,loading=false,reads=0,id=0,pending=null,identity='character';
 const c=createNativeController({basis:()=>({pageId:'p',generation:1}),readIdentity:async()=>identity,readNative:async()=>{if(loading&&++reads>=3)loading=false;return {ready:true,state:{frame,loading,overlay:frame===1}}},readUI:async()=>({id:++id,text:frame===1?'Travel':'World',controls:frame===1?[{id:0,text:'Travel'}]:[]}),runUI:async()=>{frame=2;loading=true;return {issued:true}},saveUncertain:v=>pending=v,clearUncertain:()=>pending=null,start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true})});
 const s=await c.snapshot({ui:true}),t=await c.submitTask({requestId:'travel',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'travel'},task:{kind:'workflow',payload:{workflowId:'ui.scene-transition',version:1,maxMs:2000,args:{controlLabel:'Travel',uiObservationId:s.ui.observationId,expectedPhase:'world'}}}});
 assert.equal(t.outcome,'completed');assert.equal(t.evidence.eventType,'scene-transition-observed');assert.equal(t.evidence.after.frame,2);assert.equal(pending,null);
});

test('scene transition cannot establish success after character replacement',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let frame=1,id=0,identity='one',generation=1;
 const c=createNativeController({basis:()=>({pageId:'p',generation}),readIdentity:async()=>identity,readNative:async()=>({ready:true,state:{frame,overlay:frame===1}}),readUI:async()=>({id:++id,text:frame===1?'Load':'World',controls:[{id:0,text:'Load'}]}),runUI:async()=>{frame=2;identity='two';return {issued:true}},start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true}),latchStop:()=>generation++});
 const s=await c.snapshot({ui:true}),t=await c.submitTask({requestId:'load',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'load'},task:{kind:'workflow',payload:{workflowId:'ui.scene-transition',version:1,maxMs:1000,args:{controlLabel:'Load',uiObservationId:s.ui.observationId,expectedPhase:'world'}}}});
 assert.equal(t.outcome,'blocked');assert.equal(t.evidence.status,'unknown');assert.equal(t.reconciliationRequired,true);
});

test('title mode selection is bounded and does not claim a character was loaded',async()=>{
 const {createNativeController}=await import('../src/native-controller.mjs');let mode=false,id=0,writes=0;
 const c=createNativeController({basis:()=>({pageId:'p',generation:1}),readNative:async()=>({ready:false}),readUI:async()=>({id:++id,text:mode?'Select character':'Choose character mode',controls:mode?[]:[{id:0,text:'Offline'},{id:1,text:'Online'}]}),runUI:async({action})=>{assert.equal(action.controlId,0);writes++;mode=true;return {issued:true}},start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true})});
 const s=await c.snapshot({ui:true}),t=await c.submitTask({requestId:'mode',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'mode'},task:{kind:'workflow',payload:{workflowId:'startup.select-mode',version:1,maxMs:1000,args:{uiObservationId:s.ui.observationId,mode:'Offline',expectedText:'Select character'}}}});
 assert.equal(t.outcome,'completed');assert.equal(t.evidence.status,'observed');assert.equal(t.reconciliationRequired,undefined);assert.equal(writes,1);
});

test('title mode selection reads the engine 10e43fd0 mode buttons by their first word',async()=>{
 const {resolveActivation}=await import('../src/player/workflows.mjs');
 const ui={observationId:7,controls:[{id:0,text:'◆\nONLINE\nPlay with others in the shared world\n◆'},{id:1,text:'◆\nOFFLINE\nYour own game, kept on this device\n◆'},{id:2,text:'Offline mode help'}]};
 const pick=mode=>resolveActivation({workflowId:'startup.select-mode',version:1,maxMs:1000,args:{uiObservationId:'7',mode,expectedText:'Select character'}},ui).action.controlId;
 assert.equal(pick('Offline'),1);assert.equal(pick('Online'),0);
});

test('the engine 10e43fd0 main menu is the front door',async()=>{
 const {playerPhase}=await import('../src/native-controller.mjs');
 const ui={text:'◆\nOnline\nPlay with others in the shared world\n◆\n◆\nOffline\nYour own game, kept on this device\n◆\nTutorials',controls:[{id:0,text:'◆\nONLINE\nPlay with others in the shared world\n◆'},{id:1,text:'◆\nOFFLINE\nYour own game, kept on this device\n◆'},{id:6,text:'TUTORIALS'}]};
 assert.equal(playerPhase({ready:false},ui),'frontdoor');
});

test('the engine 10e43fd0 Offline menu is the front door',async()=>{
 const {playerPhase}=await import('../src/native-controller.mjs');
 const ui={text:'Offline\nYour own game, kept on this device\n◆\nContinue\n◆',controls:['CONTINUE','NEW GAME','LOAD GAME','TEST ROOM','BACK'].map((t,id)=>({id,text:`◆\n${t}\n◆`}))};
 assert.equal(playerPhase({ready:false},ui),'frontdoor');
});
