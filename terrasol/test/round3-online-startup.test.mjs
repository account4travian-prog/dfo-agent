import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('runtime account file uses handle/password; errors never disclose input',async()=>{
 const {readAccount}=await import('../src/player/online.mjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rowan-online-account-')),file=path.join(dir,'account.json');
 try{
  assert.throws(()=>readAccount({DFO_ROWAN_ACCOUNT_FILE:file}),e=>e.code==='account-missing'&&!e.message.includes(file));
  fs.writeFileSync(file,JSON.stringify({handle:'fixture-handle',password:'fixture-only-password'}));
  assert.deepEqual(readAccount({DFO_ROWAN_ACCOUNT_FILE:file}),{handle:'fixture-handle',password:'fixture-only-password'});
  fs.writeFileSync(file,'{"password":"fixture-secret"');
  assert.throws(()=>readAccount({DFO_ROWAN_ACCOUNT_FILE:file}),e=>e.code==='account-missing'&&!e.message.includes('fixture-secret'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('Rowan selection is exact and account-scoped; ambiguity and Tiger Fist are refused',async()=>{
 const {rowanAction}=await import('../src/player/online.mjs');
 const ui={account:{signedIn:true},realmReady:true,characters:[{name:'Tiger Fist',playId:1},{name:'Rowan',playId:2}],controls:[{id:1,text:'Play'},{id:2,text:'Play'},{id:3,text:'New online character'}]};
 assert.deepEqual(rowanAction(ui),{kind:'click',controlId:2});
 assert.throws(()=>rowanAction(ui,{name:'Tiger Fist'}),e=>e.code==='character-refused');
 assert.throws(()=>rowanAction({...ui,characters:[...ui.characters,{name:'Rowan',playId:4}]}),e=>e.code==='character-ambiguous');
 assert.throws(()=>rowanAction({...ui,realmReady:false}),e=>e.code==='realm-unavailable');
 assert.deepEqual(rowanAction({...ui,characters:[ui.characters[0]]},{allowCreate:true}),{kind:'click',controlId:3});
});
test('sign-in executor skips a signed-in profile and confines credentials to trusted fill',async()=>{
 const {executeSignIn}=await import('../src/player/online.mjs');let reads=0;const writes=[];
 assert.equal((await executeSignIn({ui:{account:{signedIn:true}},read:()=>{reads++;}})).skipped,true);assert.equal(reads,0);
 const ui={account:{login:true,handleId:2,passwordId:3,submitId:4}};
 const result=await executeSignIn({ui,read:()=>({handle:'fixture-user',password:'fixture-password'}),fill:async(id,value)=>writes.push([id,value]),click:async id=>writes.push([id]),waitSignedIn:async()=>true,check:()=>{}});
 assert.deepEqual(writes,[[2,'fixture-user'],[3,'fixture-password'],[4]]);
 assert.doesNotMatch(JSON.stringify(result),/fixture-user|fixture-password/);
 await assert.rejects(()=>executeSignIn({ui,read:()=>({handle:'x',password:'y'}),fill:async()=>{throw Error('leaked y');},check:()=>{}}),e=>e.message==='Account sign-in input failed');
});
test('online workflows are advertised and resolve without exposing account values',async()=>{
 const {WORKFLOWS,resolveActivation}=await import('../src/player/workflows.mjs');
 for(const id of ['startup.sign-in','startup.select-rowan','online.respawn','online.rest'])assert.ok(WORKFLOWS.some(w=>w.id===id));
 const selected=resolveActivation({workflowId:'startup.sign-in',version:1,maxMs:4000,args:{uiObservationId:'1'}},{observationId:'1',account:{login:true,handleId:1,passwordId:2,submitId:3}});
 assert.equal(selected.action.kind,'account-sign-in');assert.doesNotMatch(JSON.stringify(selected),/password.*:/);
});
test('ordinary UI cannot bypass account privacy or select another character with coordinates or focus',async()=>{
 const {validatePlayerInput}=await import('../src/player/online.mjs');
 for(const a of [{kind:'type',text:'anything'},{kind:'key',keys:['Enter']},{kind:'click',x:1,y:1}])assert.throws(()=>validatePlayerInput(a,{accountField:true}),e=>e.code==='account-private');
 assert.throws(()=>validatePlayerInput({kind:'click',x:1,y:1},{characterName:'Tiger Fist'}),e=>e.code==='character-refused');
 assert.throws(()=>validatePlayerInput({kind:'type',text:'Other'},{creationName:true}),e=>e.code==='character-refused');
 assert.doesNotThrow(()=>validatePlayerInput({kind:'type',text:'Rowan'},{creationName:true}));
 assert.throws(()=>validatePlayerInput({kind:'click'},{accountAction:'Continue as guest'}),e=>e.code==='account-private');
});
test('runtime-only private values are scrubbed from nested observation strings and receipts',async()=>{
 const {createAccountInput}=await import('../src/player/online.mjs');
 const input=createAccountInput(()=>({handle:'fixture-handle',password:'fixture-secret'}));input.read();
 const result=input.redact({text:'Profile fixture-handle',controls:[{value:'fixture-secret'}]});
 assert.doesNotMatch(JSON.stringify(result),/fixture-handle|fixture-secret/);assert.match(result.text,/redacted/);
});

test('account panel labels match whatever case the engine renders them in',async()=>{
 // Engine 10e43fd0 renders the account panel's buttons in capitals (CLOSE, SIGN IN, CREATE ACCOUNT).
 const {validatePlayerInput}=await import('../src/player/online.mjs');
 for(const label of ['CLOSE','Close','BACK','SIGN IN'])assert.doesNotThrow(()=>validatePlayerInput({kind:'click',controlId:1},{accountAction:label}));
 for(const label of ['CREATE ACCOUNT','Create account','Continue as guest'])assert.throws(()=>validatePlayerInput({kind:'click',controlId:1},{accountAction:label}),e=>e.code==='account-private');
 assert.throws(()=>validatePlayerInput({kind:'click',controlId:1},{accountAction:'SIGN IN',loginSubmit:true}),e=>e.code==='account-private');
});
