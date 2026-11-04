import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {ENGINE} from '../src/config.mjs';
import {ensureNativePort, readNative} from '../src/native-bridge.mjs';

test('installer is idempotent and engine bridge resolves', async () => {
  const a = ensureNativePort(), b = ensureNativePort();
  assert.deepEqual(a, b);
  const mod = await import(pathToFileURL(path.join(ENGINE,'src/agent/agentBridge.js')).href);
  assert.equal(typeof mod.createAgentBridge, 'function');
});
test('bridge dispatches player hooks and compensates coordinates and frames', async () => {
  const {createAgentBridge} = await import(pathToFileURL(path.join(ENGINE,'src/agent/agentBridge.js')).href);
  const {journeyEvent} = await import(pathToFileURL(path.join(ENGINE,'src/agent/agentJourneyEvents.js')).href);
  const calls=[]; const document = {querySelector:()=>null, querySelectorAll:()=>[]};
  const agent=createAgentBridge({cam:{pos:[12,4,27],yaw:0,pitch:0},feet:()=>[12,4,27],compensation:()=>[10,1,20],mode:()=> 'exterior',foes:()=>[],paused:()=>false,overlay:()=>false,loading:()=>false,document:()=>document,entity:{},hooks:{look:(...a)=>calls.push(['look',...a]),attack:(...a)=>calls.push(['attack',...a])},codeFor:()=> 'KeyW',dispatch:(...a)=>calls.push(a)});
  const a=agent.state(); assert.deepEqual(a.pos,[2,3,7]);
  agent.press('MoveForwards'); agent.look(3,-2); agent.releaseAll();
  assert.deepEqual(calls,[['keydown','KeyW'],['look',3,-2],['attack',0,0,false],['keyup','KeyW']]);
  journeyEvent('frame'); const b=agent.state(); assert.notEqual(a.frame,b.frame); assert.equal(b.scan.fresh,false);
  agent._disposeJudge();
});
test('readNative makes missing and thrown bridges explicit', async () => {
  const page={evaluate:async fn=>fn(0)};
  assert.equal((await readNative(page)).ready,false);
  assert.match((await readNative({evaluate:async()=>{throw Error('closed')}})).reason,/closed/);
});
test('target list is tied to a matching fresh scan', async () => {
  const foe={type:'rat',dist:2}, thing={kind:'door',x:3,z:4};
  const scan={page:'p',frame:7,id:2};
  globalThis.__agent={state:()=>({frame:7,scan:{...scan,fresh:true},foes:[foe]}),view:()=>({scan,things:[thing]}),events:()=>({lines:[],dropped:0}),press(){},release(){},releaseAll(){},look(){},swing(){},_scan(){}};
  try {
    const page={evaluate:async(fn,arg)=>fn(arg)};
    assert.deepEqual((await readNative(page)).targets,[{kind:'foe',target:foe},{kind:'thing',target:thing}]);
    scan.frame=8;
    assert.deepEqual((await readNative(page)).targets,[]);
  } finally {delete globalThis.__agent;}
});
test('visible moving foes retain separate IDs only within the current frame', async () => {
  const imp = async p => import(pathToFileURL(path.join(ENGINE,'src',p)).href);
  const {createAgentBridge} = await imp('agent/agentBridge.js');
  const {journeyEvent} = await imp('agent/agentJourneyEvents.js');
  const {mirrorProjectionX,perspective,lookAt} = await imp('world/mat4.js');
  let now=0;
  const eye=[0,1.7,0], renderer={_proj:mirrorProjectionX(perspective(Math.PI/2,1,0.01,800)),_view:lookAt(eye,[0,1.7,1],[0,1,0]),_camPos:eye,canvas:{width:800,height:800}};
  const f1={mobileType:'rat',ai:{feet:[0,0,5]}}, f2={mobileType:'rat',ai:{feet:[1,0,6]}}, hidden={mobileType:'rat',ai:{feet:[0,0,-5]}};
  const person={pos:[.2,0,4]},otherPerson={pos:[.8,0,6]};
  const doc={querySelector:()=>null,querySelectorAll:()=>[]};
  const bridge=createAgentBridge({cam:{pos:eye,yaw:0,pitch:0},feet:()=>[0,0,0],mode:()=> 'exterior',foes:()=>[f1,f2,hidden],renderer:()=>renderer,collider:()=>({raycastHit:()=>({dist:Infinity})}),heightAt:()=>0,outdoorWaterAt:()=>false,exterior:()=>({people:[person,otherPerson],pixels:[{_visible:true}],pixelTranslation:()=>[-400,0,-400]}),skyMinute:()=>720,entity:{},paused:()=>false,overlay:()=>false,loading:()=>false,document:()=>doc,hooks:{look(){},attack(){}},now:()=>now});
  try {
    const first=bridge.state().foes;
    assert.equal(first.length,2);
    assert.notEqual(first[0].targetId,first[1].targetId);
    assert.deepEqual(first,bridge.view().scan.foes);
    // The idle outdoor scan period is 1s, but target freshness lasts only 200ms.
    now=350;assert.equal(bridge.state().scan.fresh,false);
    const previous=globalThis.__agent;globalThis.__agent=bridge;
    try {const n=await readNative({evaluate:async(fn,arg)=>fn(arg)});assert.equal(n.state.scan.fresh,true);assert.equal(n.targets.length,4);assert.equal(n.targets[0].target.targetId,first[0].targetId);
      const persons=n.targets.filter(t=>t.kind==='thing');assert.notEqual(persons[0].target.targetId,persons[1].target.targetId);
      person.pos[0]=.4;now+=1100;const moved=await readNative({evaluate:async(fn,arg)=>fn(arg)});assert.equal(moved.targets.find(t=>t.kind==='thing').target.targetId,persons[0].target.targetId);
    }
    finally {if(previous)globalThis.__agent=previous;else delete globalThis.__agent;}
    f1.ai.feet[2]=4; now+=1100;
    const moved=bridge.state().foes;
    assert.equal(moved[0].targetId,first[0].targetId);
    assert.notEqual(moved[0].dist,first[0].dist);
    journeyEvent('frame'); now+=1100;
    const next=bridge.state().foes;
    assert.notEqual(next[0].targetId,moved[0].targetId);
  } finally {bridge._disposeJudge();}
});

test('managed updates preserve edits and reject conflicts before any write', () => {
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rowan-native-test-'));
  try {
    const engine=path.join(tmp,'engine'), vendor=path.join(tmp,'vendor');
    fs.mkdirSync(path.join(engine,'src','scenes'),{recursive:true});
    for (const name of ['scenes/world.js','scenes/worldModes.js','player/motor.js']) {
      const bytes=execFileSync('git',['show',`HEAD:src/${name}`],{cwd:ENGINE,maxBuffer:20*1024*1024});
      const target=path.join(engine,'src',name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
    }
    fs.cpSync(path.resolve('vendor/native-agent'),vendor,{recursive:true});
    execFileSync('git',['init','-q'],{cwd:engine});
    execFileSync('git',['add','src'],{cwd:engine});
    execFileSync('git',['-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','fixture'],{cwd:engine});
    const engineCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:engine,encoding:'utf8'}).trim();
    const opts={engine,vendor,engineCommit};
    ensureNativePort(opts);
    const source=path.join(vendor,'agentBridge.js'), installed=path.join(engine,'src','agent','agentBridge.js');
    fs.appendFileSync(source,'\n// managed upgrade\n');
    ensureNativePort(opts);
    assert.deepEqual(fs.readFileSync(installed),fs.readFileSync(source));
    fs.appendFileSync(path.join(vendor,'world-install.txt'),'\n// managed host revision\n');
    ensureNativePort(opts);
    const host=fs.readFileSync(path.join(engine,'src/scenes/world.js'),'utf8');
    assert.match(host,/managed host revision/);assert.equal(host.split("if (params.has('agent')) import('../agent/agentBridge.js')").length,2);
    fs.appendFileSync(installed,'\n// independent edit\n');
    fs.appendFileSync(source,'\n// another upgrade\n');
    const before=fs.readFileSync(installed), receipt=fs.readFileSync(path.join(engine,'.rowan-native-manifest.json'));
    assert.throws(()=>ensureNativePort(opts),/target differs/);
    assert.deepEqual(fs.readFileSync(installed),before);
    assert.deepEqual(fs.readFileSync(path.join(engine,'.rowan-native-manifest.json')),receipt);
  } finally {fs.rmSync(tmp,{recursive:true,force:true});}
});

test('normal motor placement invalidates the frame even for a small ladder displacement',async()=>{
 const {PlayerMotor}=await import(pathToFileURL(path.join(ENGINE,'src/player/motor.js')).href);
 const {journeyFrame}=await import(pathToFileURL(path.join(ENGINE,'src/agent/agentJourneyEvents.js')).href);
 const body={pos:[0,0,0],_heightReset(){},holdFrame(){}};
 const old=journeyFrame();PlayerMotor.prototype.spawn.call(body,0,1,0);assert.ok(journeyFrame()>old);assert.deepEqual(body.pos,[0,1,0]);
});
