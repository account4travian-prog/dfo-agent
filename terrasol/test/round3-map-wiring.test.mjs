import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createMindRuntime } from '../src/mind/runtime.mjs';
import { createPlan } from '../src/mind/plan.mjs';
import { resolveMindConfig } from '../src/mind/config.mjs';
import { createMemory } from '../src/memory.mjs';
import { createFakeDriver, fakeHealth, fakeModels, terraPlan, completePlan, lunaLook, solReview } from './support/fake-control.mjs';

const mapMemory = { start:[0,0],last:[1,0],route:[[0,0],[1,0]],level:0,heading:90,cell:1,cells:[[0,0]],leads:[],things:[],openings:[],surfaces:[] };
function config({ images = 'always', reviewAtSessionEnd = false } = {}) {
  return resolveMindConfig({
    roles: {
      luna:{enabled:true,model:'fake-luna',cooldownMs:0,maxCallsPerWindow:100,timeoutMs:1000,decisionTtlMs:600000,images:'never'},
      terra:{cooldownMs:0,maxCallsPerWindow:100,timeoutMs:1000,decisionTtlMs:600000,images,contextBytes:12000},
      sol:{cooldownMs:0,maxCallsPerWindow:100,timeoutMs:1000,decisionTtlMs:600000,images:'never'},
    },
    scheduler:{pollIntervalMs:1,snapshotRetries:0,snapshotRetryDelayMs:1,localRetries:0,failureThreshold:2,planTtlMs:1000,maxCycles:20,requestSolReviewOnComplete:reviewAtSessionEnd,continueAfterPlan:false,reviewAtSessionEnd},
    budget:{maxInputTokens:null,maxCalls:null},models:{allowlist:['fake-luna','gpt-6.1-terra','gpt-6.1-sol']},
  });
}
function seedPlan() {
  const plan=createPlan({goal:'Explore the eastern passage',steps:[{id:'nav',skill:'goto',args:{x:1,z:0}}],ttlMs:1000,now:()=>0,basis:{pageId:'page-1',generation:1,frame:1}});
  plan.updatedAt=new Date(0).toISOString();
  return plan;
}
function setup({ script, plan = null, images = 'always', reviewAtSessionEnd = false, placeValue = null, writer = null } = {}) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-map-wiring-'));
  const health=fakeHealth({capabilities:{...fakeHealth().capabilities,place:true}});
  const driver=createFakeDriver({health});
  let placeCalls=0;
  const request=async(url,body)=>{
    if(url==='/place'){placeCalls++;return placeValue??{available:true,revision:'r1',place:mapMemory,automap:{cell:1,cells:[[2,0]]},edges:[{x:2,z:0}]};}
    return driver.request(url,body);
  };
  const memory=createMemory(dir),models=fakeModels(script),events=[];
  let writes=0;
  const placePictureWriter=writer??{write:async()=>{writes++;return {path:path.join(dir,'map-picture.png'),sha256:'map-hash',caption:'Map caption'};}};
  const runtime=createMindRuntime({config:config({images,reviewAtSessionEnd}),memory,logger:{event:(kind,data)=>events.push({kind,...data}),flush(){}},request,askModel:models.askModel,plan,clock:()=>5000,session:{run:dir,mode:'online'},placePictureWriter});
  return {dir,runtime,models,driver,events,get placeCalls(){return placeCalls;},get writes(){return writes;},cleanup(){memory.close();fs.rmSync(dir,{recursive:true,force:true});}};
}

test('Terra navigation context gets the map path and caption from the driver HTTP place route',async()=>{
  const h=setup({plan:seedPlan(),script:[{json:completePlan({baseVersion:1,goal:'Explore the eastern passage'})}]});
  try {
    const result=await h.runtime.scheduler.run();
    assert.equal(result.pauseReason,'session-complete');
    assert.equal(h.placeCalls,1);
    assert.deepEqual(h.models.calls[0].images,[path.join(h.dir,'map-picture.png')]);
    assert.match(h.models.calls[0].prompt,/Map caption/);
  } finally {h.cleanup();}
});

test('Luna and routine intent polls do not call the place route',async()=>{
  const h=setup({script:[
    {json:terraPlan({steps:[{id:'tactical',skill:'tactical',objective:'Look around',allowedSkills:['look'],fallbackIntent:{kind:'look'},args:{}}]})},
    {json:lunaLook()},
  ]});
  try {
    const result=await h.runtime.scheduler.run();
    assert.equal(result.pauseReason,'session-complete');
    assert.equal(h.models.calls.length,2);
    assert.equal(h.placeCalls,0);
    assert.ok(h.driver.counts().polls>=1);
  } finally {h.cleanup();}
});

test('an unavailable place response leaves navigation planning image-free without error',async()=>{
  const h=setup({plan:seedPlan(),placeValue:{available:false,reason:'no native world'},script:[{json:completePlan({baseVersion:1,goal:'Explore the eastern passage'})}]});
  try {
    const result=await h.runtime.scheduler.run();
    assert.equal(result.pauseReason,'session-complete');
    assert.equal(h.placeCalls,1);
    assert.deepEqual(h.models.calls[0].images,[]);
    assert.doesNotMatch(h.models.calls[0].prompt,/mapPicture|Map caption/);
    assert.equal(h.events.some(event=>event.kind==='mind-run-error'),false);
  } finally {h.cleanup();}
});

test('a repeated place revision reuses the PNG writer output',async()=>{
  const h=setup({plan:seedPlan(),reviewAtSessionEnd:true,script:[
    {json:completePlan({baseVersion:1,goal:'Explore the eastern passage'})},
    {json:solReview()},
  ]});
  try {
    const result=await h.runtime.scheduler.run();
    assert.equal(result.pauseReason,'session-complete');
    assert.equal(h.placeCalls,2);
    assert.equal(h.writes,1);
  } finally {h.cleanup();}
});
