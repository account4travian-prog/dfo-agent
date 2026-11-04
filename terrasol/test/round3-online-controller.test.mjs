import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeController} from '../src/native-controller.mjs';
import {executeSignIn} from '../src/player/online.mjs';

function rig({native:initial,ui:visible,run,identity='same-rowan'}={}){
 let native=initial??{ready:false},ui={id:1,text:'Account Sign in',controls:[],...visible};
 const controller=createNativeController({basis:()=>({pageId:'p',generation:1}),readNative:async()=>native,readUI:async()=>ui,readIdentity:async()=>identity,
  runUI:async request=>run(request,{native:v=>native=v,ui:v=>ui={id:2,...v}}),start:async()=>{},poll:async()=>{},cancel:async()=>{},forceStop:async()=>({ok:true})});
 const submit=async workflowId=>{const snap=await controller.snapshot({ui:true});return controller.submitTask({requestId:'once',basis:{observationId:snap.observationId,...snap.basis},authority:{planId:'p',planVersion:1,stepId:'s'},task:{kind:'workflow',payload:{workflowId,version:1,maxMs:15000,args:{uiObservationId:snap.ui.observationId}}}});};
 return {controller,submit};
}
test('sign-in through the task controller retains only redacted input receipts',async()=>{
 let writes=0;
 const r=rig({ui:{account:{login:true,handleId:1,passwordId:2,submitId:3},controls:[{id:1,text:'Username'},{id:2,text:'Password'},{id:3,text:'Sign in'}]},run:async(_,set)=>{
  const receipt=await executeSignIn({ui:{account:{login:true,handleId:1,passwordId:2,submitId:3}},read:()=>({handle:'fixture-user',password:'fixture-password'}),fill:async()=>writes++,click:async()=>writes++,waitSignedIn:async()=>true});
  set.ui({text:'Account signed in',account:{signedIn:true},controls:[{id:4,text:'Close'}]});return receipt;
 }});
 const task=await r.submit('startup.sign-in');assert.equal(task.outcome,'completed');assert.equal(writes,3);
 assert.doesNotMatch(JSON.stringify(task),/fixture-user|fixture-password/);
});
test('account-missing is an explicit task hold without a trusted write',async()=>{
 const r=rig({run:async()=>{throw Object.assign(Error('account-missing: readable account JSON required'),{code:'account-missing'});}});
 const task=await r.submit('startup.sign-in');assert.equal(task.outcome,'failed');assert.match(task.reason,/account-missing/);assert.equal(r.controller.health().stopped,true);
});
test('online rest uses own-vital evidence and online respawn permits the same-character frame change',async()=>{
 const native=health=>({ready:true,sessionMode:'online',state:{frame:1,vitals:{health}}});
 const rest=rig({native:native(20),ui:{text:'World',sessionMode:'online'},run:async(_,set)=>{set.native(native(50));return {issued:true,rest:'own-vital-gain-observed'};}});
 const rested=await rest.submit('online.rest');assert.equal(rested.outcome,'completed');assert.equal(rested.evidence.eventType,'health-changed');assert.equal(rest.controller.isQuarantined(),false);
 const respawn=rig({native:native(0),ui:{text:'You died',sessionMode:'online'},run:async(_,set)=>{set.native({...native(50),state:{frame:2,vitals:{health:50}}});set.ui({text:'World'});return {issued:true,recovery:'observed'};}});
 const risen=await respawn.submit('online.respawn');assert.equal(risen.outcome,'completed');assert.equal(risen.evidence.eventType,'scene-transition-observed');
});
test('controller observes trusted startup across frames and an already-signed-in no-op',async()=>{
 const startup=rig({ui:{text:'Your online characters',account:{signedIn:true},realmReady:true,characters:[{name:'Rowan',playId:1}],controls:[{id:1,text:'Play'}]},run:async(_,set)=>{set.native({ready:true,sessionMode:'online',character:{name:'Rowan',idHash:'same-rowan'},state:{frame:2,vitals:{health:50}}});set.ui({text:'World'});return {issued:true,character:'Rowan'};}});
 const task=await startup.submit('startup.select-rowan');assert.equal(task.outcome,'completed');assert.equal(task.reconciliationRequired,undefined);assert.equal(task.evidence.after.character.idHash,'same-rowan');
 const signedIn=rig({ui:{text:'Your online characters',account:{signedIn:true}},run:async()=>({issued:false,skipped:true,account:'redacted'})});
 const skipped=await signedIn.submit('startup.sign-in');assert.equal(skipped.outcome,'completed');assert.equal(skipped.reconciliationRequired,undefined);
});
