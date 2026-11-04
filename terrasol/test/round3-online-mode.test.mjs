import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('online is the default; invalid and missing mode values fail closed',async()=>{
 const {sessionMode}=await import('../src/mode.mjs');
 assert.equal(sessionMode([],{}),'online');
 assert.equal(sessionMode(['--mode','offline'],{}),'offline');
 assert.equal(sessionMode([],{DFO_MODE:'offline'}),'offline');
 for(const argv of [['--mode'],['--mode','lan']])assert.throws(()=>sessionMode(argv,{}));
});
test('all active prompts carry selected rules, live bindings and the shared identity boundary',async()=>{
 const {rolePrompt}=await import('../src/brain.mjs');
 for(const role of ['native','luna','terra','sol']){
  const online=rolePrompt(role,'online',{source:'live',bindings:{Rest:['KeyK']}});
  assert.match(online,/ONLINE/);assert.match(online,/server-held/);assert.match(online,/Portal Stones/);
  assert.match(online,/QuickSave.*server checkpoint/);assert.doesNotMatch(online,/no manual quick-save/);
  assert.match(online,/KeyK/);assert.match(online,/AI adventurer/);assert.match(online,/data/);
  assert.doesNotMatch(online,/Save early with F9|Stay offline|all bundled mods.*forced/i);
  assert.match(rolePrompt(role,'offline'),/OFFLINE/);
  assert.match(rolePrompt(role,'offline'),/save.*load/i);
 }
});
test('mode reports refuse mixed and unlabelled epochs before aggregating',async()=>{
 const {buildModeReport}=await import('../src/mode.mjs');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rowan-online-report-'));
 try{
  const trace=(where,events)=>{fs.mkdirSync(where,{recursive:true});fs.writeFileSync(path.join(where,'trace.jsonl'),events.map(e=>JSON.stringify({at:new Date().toISOString(),...e})).join('\n')+'\n');};
  trace(dir,[{kind:'session-start',mode:'online'}]);trace(path.join(dir,'epoch-1'),[{kind:'epoch-start',mode:'offline'}]);
  assert.throws(()=>buildModeReport(dir,'online'),/mode/i);
  trace(path.join(dir,'epoch-1'),[{kind:'epoch-start'}]);assert.throws(()=>buildModeReport(dir,'online'),/mode/i);
  trace(path.join(dir,'epoch-1'),[{kind:'epoch-start',mode:'online'}]);assert.equal(buildModeReport(dir,'online').mode,'online');
  trace(path.join(dir,'epoch-1'),[{kind:'epoch-start',mode:'online'},{kind:'native-outcome',mode:'offline'}]);assert.throws(()=>buildModeReport(dir,'online'),/mode/i);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('matched efficiency comparisons cannot combine online and offline reports',async()=>{
 const {measurementFromReport,compareMeasurements}=await import('../src/mind/efficiency.mjs');
 const online=measurementFromReport({mode:'online'},{routing:'two-tier',scenarioId:'same'});
 const offline=measurementFromReport({mode:'offline'},{routing:'three-tier',scenarioId:'same'});
 assert.equal(online.mode,'online');assert.throws(()=>compareMeasurements({twoTier:online,threeTier:offline}),/mode/i);
});
test('context and stored plans carry mode and live bindings; cross-mode restore is rejected',async()=>{
 const {createPlanStore}=await import('../src/mind/plan.mjs');
 const store=createPlanStore({mode:'offline'});
 const result=store.apply({baseVersion:0,goal:'Explore',steps:[{id:'look',skill:'look',args:{}}]});
 assert.equal(result.plan.mode,'offline');
 assert.throws(()=>createPlanStore({mode:'online',plan:result.plan}),/mode/);
 const {createContextBuilder}=await import('../src/mind/context.mjs');
 const memory={persona:{name:'Rowan'},snapshot:()=>({}),context:()=>[]};
 const context=createContextBuilder({mode:'offline',memory,config:{roles:{terra:{contextBytes:12000,images:'never'}}}});
 const built=context.build({role:'terra',plan:result.plan,snapshot:{native:{bindings:{source:'engine-live',bindings:{Rest:['KeyK']}}}}});
 assert.equal(built.payload.mode,'offline');assert.equal(built.payload.bindings.bindings.Rest[0],'KeyK');
});
