import test from 'node:test';
import assert from 'node:assert/strict';
import * as browser from '../src/browser.mjs';
import {createNativeController} from '../src/native-controller.mjs';

test('physical input reader covers native and browser keys and mouse buttons',async()=>{
 const held=new Set(),buttons=new Set();let native=[],body=[],attackHeld=false;
 const context=await import('node:vm');
 const page={evaluate:async fn=>context.runInNewContext(`(${fn})()`,{__agent:{state:()=>({held:native,inputHeld:attackHeld})},__body:{status:()=>({held:body})}})};
 assert.equal(typeof browser.readHeldInput,'function');
 const read=()=>browser.readHeldInput(page,held,buttons);
 assert.equal(await read(),false);
 held.add('W');assert.equal(await read(),true);held.clear();
 buttons.add('right');assert.equal(await read(),true);buttons.clear();
 native=['Attack'];assert.equal(await read(),true);native=[];
 body=['MoveForwards'];assert.equal(await read(),true);body=[];assert.equal(await read(),false);
 attackHeld=true;assert.equal(await read(),true);attackHeld=false;assert.equal(await read(),false);
});
test('browser health exposes held keys, mouse, native input and leases, clearing after release',async()=>{
 assert.equal(typeof browser.createHealthReader,'function');
 let held=false,task=null,at=100;
 const health=browser.createHealthReader({readPhysical:async()=>held,readTask:()=>task,now:()=>at});
 assert.deepEqual(await health(),{inputHeld:false,activeTask:null,inputLease:null});
 task={id:'ui-1',kind:'swing',startedAt:90};held=true;
 assert.deepEqual(await health(),{inputHeld:true,activeTask:{id:'ui-1',kind:'swing'},inputLease:{startedAt:90,holder:'ui-1'}});
 at=200;assert.equal((await health()).inputLease.startedAt,90);
 held=false;task=null;assert.deepEqual(await health(),{inputHeld:false,activeTask:null,inputLease:null});
 held=true;assert.deepEqual(await health(),{inputHeld:true,activeTask:null,inputLease:{startedAt:200,holder:null}});
});
test('controller health has live task ownership during start, poll and cancellation',async()=>{
 const c=createNativeController({basis:()=>({pageId:'p',generation:1}),readNative:async()=>({ready:true,state:{frame:1}}),
  start:async()=>({id:7,kind:'fight',status:'running',startedAt:10}),poll:async()=>({task:{id:7,kind:'fight',status:'terminal',outcome:'completed'}}),cancel:async()=>({id:7,kind:'fight',status:'terminal',outcome:'cancelled'}),forceStop:async()=>({ok:true})});
 const s=await c.snapshot(),body={requestId:'fight-1',basis:{...s.basis,observationId:s.observationId},intent:{kind:'fight'}};
 await c.submit(body);assert.deepEqual(c.health().activeTask,{id:'fight-1',kind:'fight',startedAt:10});
 await c.inspect('fight-1');assert.equal(c.health().activeTask,null);
 await c.submit({...body,requestId:'fight-2'});await c.cancelRequest({requestId:'fight-2'});assert.equal(c.health().activeTask,null);
});
