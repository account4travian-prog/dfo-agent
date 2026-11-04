import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeController} from '../src/native-controller.mjs';

function rig({signedIn=false,after={},change=null,receipt={issued:true,character:'Rowan'},identity='rowan-hash'}={}){
 let native={ready:false},ui={id:1,text:'Your online characters',account:{signedIn:true},realmReady:true,characters:[{name:'Rowan',playId:1}],controls:[{id:1,text:'Play'}]},basis={pageId:'p',generation:1},writes=0;
 const controller=createNativeController({basis:()=>basis,readNative:async()=>native,readUI:async()=>ui,readIdentity:async()=>identity,
  runUI:async()=>{writes++;if(!signedIn){native={ready:true,sessionMode:'online',character:{name:'Rowan',idHash:'rowan-hash'},state:{frame:2,vitals:{health:50}},...after};ui={id:2,text:'World',controls:[]};}if(change)basis={...basis,...change};return signedIn?{issued:false,skipped:true,account:'redacted'}:receipt;},
  start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true})});
 const request=async()=>{const s=await controller.snapshot({ui:true});return {requestId:'once',basis:{observationId:s.observationId,...s.basis},authority:{planId:'p',planVersion:1,stepId:'s'},task:{kind:'workflow',payload:{workflowId:signedIn?'startup.sign-in':'startup.select-rowan',version:1,maxMs:15000,args:{uiObservationId:s.ui.observationId}}}};};
 return {controller,request,writes:()=>writes};
}
test('startup establishes online Rowan across the pre-world frame and replays without another write',async()=>{
 const r=rig(),body=await r.request(),task=await r.controller.submitTask(body);
 assert.equal(task.outcome,'completed');assert.equal(task.reconciliationRequired,undefined);assert.equal(task.evidence.eventType,'startup-world-observed');assert.equal(task.evidence.after.character.idHash,'rowan-hash');assert.equal(r.controller.health().stopped,false);
 assert.equal((await r.controller.submitTask(body)).replayed,true);assert.equal(r.writes(),1);
 await assert.rejects(r.controller.submitTask({...body,task:{...body.task,payload:{...body.task.payload,args:{...body.task.payload.args,allowCreate:true}}}}),/Conflicting/);
});
test('already signed in is an evidenced no-op without a reconciliation hold',async()=>{
 const r=rig({signedIn:true}),task=await r.controller.submitTask(await r.request());
 assert.equal(task.outcome,'completed');assert.equal(task.evidence.eventType,'account-signed-in-observed');assert.equal(task.reconciliationRequired,undefined);assert.equal(r.controller.health().stopped,false);
});
for(const [name,options] of [
 ['wrong character',{after:{character:{name:'Tiger Fist',idHash:'other'}}}],
 ['wrong mode',{after:{sessionMode:'offline'}}],
 ['missing identity',{after:{character:{name:'Rowan'}}}],
 ['missing frame',{after:{state:{vitals:{health:50}}}}],
 ['identity disagreement',{identity:'different-hash'}],
 ['changed page',{change:{pageId:'other'}}],
 ['changed generation',{change:{generation:2}}],
 ['unknown receipt',{receipt:{issued:true}}],
 ['wrong character without a frame change',{after:{character:{name:'Tiger Fist',idHash:'other'},state:{frame:0,vitals:{health:50}}}}],
])test(`startup holds on ${name}`,async()=>{
 const r=rig(options),task=await r.controller.submitTask(await r.request());
 assert.equal(task.outcome,'blocked');assert.equal(task.reconciliationRequired,true);assert.equal(r.controller.health().stopped,true);
});
