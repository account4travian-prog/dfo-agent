import test from 'node:test';
import assert from 'node:assert/strict';
import {createBody} from '../vendor/legacy-agent/body/core.mjs';

test('typed use presses only for the selected, unambiguous observed target',()=>{
 for(const scenario of ['chosen','other','blocked']){
  const calls=[],state={frame:1,mode:'interior',pos:[0,0,0],yaw:0,pitch:0,scan:{page:'p',frame:1,id:1,fresh:true},vitals:{health:10,maxHealth:10},foes:[],front:1};
  const chosen={targetId:scenario==='other'?'other':'chosen',kind:'person',x:0,z:1,dist:1,bearing:0};
  const scan={...state.scan,things:[chosen,...(scenario==='blocked'?[{targetId:'blocking',x:0,z:.4,dist:.4,bearing:0}]:[])]};
  const b=createBody({state:()=>structuredClone(state),view:()=>({scan}),press:a=>{calls.push(a);return {ok:true}},release(){},releaseAll(){},look(){}},{now:()=>0});
  b.setUseTarget('chosen');b.setGoal({kind:'use',x:0,z:1});b.enable(true,1000);b.tick();
  assert.equal(calls.includes('ActivateCenterObject'),scenario==='chosen',scenario);
 }
});
