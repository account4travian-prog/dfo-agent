import test from 'node:test';
import assert from 'node:assert/strict';
import {installBody,readBody,commandBody,stopBody} from '../src/body-runtime.mjs';
test('replacement retires old Body and releases inputs',async()=>{
 const previousAgent=globalThis.__agent, previousBody=globalThis.__body; let releases=0,disposed=0;
 const page={evaluate:async(fn,arg)=>fn(arg)};
 globalThis.__agent={releaseAll:()=>releases++};
 globalThis.__body={dispose:()=>disposed++};
 try { const first=await installBody(page); assert.equal(first.ready,true); assert.equal(disposed,1); await commandBody(page,'enable',[true,100]); const old=globalThis.__body; const second=await installBody(page); assert.notEqual(first.id,second.id); assert.equal(old.status().enabled,false); assert.equal((await readBody(page)).status.enabled,false); await stopBody(page); assert.ok(releases>=3); }
 finally {globalThis.__body?.dispose();globalThis.__body=previousBody;globalThis.__agent=previousAgent;}
});

test('generation fence prevents old asynchronous commands from enabling a replacement epoch',async()=>{
 const oldAgent=globalThis.__agent,oldBody=globalThis.__body,oldEpoch=globalThis.__dfoControlGeneration;
 let enabled=false;globalThis.__dfoControlGeneration=2;globalThis.__agent={state:()=>({frame:1,mode:'dungeon',scan:{page:'p'}})};
 globalThis.__body={status:()=>({id:'b'}),enable:on=>{enabled=on;return {ok:true}}};
 try{const expected={id:'b',frame:1,mode:'dungeon',page:'p',generation:1};assert.equal((await commandBody({evaluate:async(fn,arg)=>fn(arg)},'enable',[true,2000],expected)).ok,false);assert.equal(enabled,false);}
 finally{globalThis.__agent=oldAgent;globalThis.__body=oldBody;if(oldEpoch===undefined)delete globalThis.__dfoControlGeneration;else globalThis.__dfoControlGeneration=oldEpoch;}
});
