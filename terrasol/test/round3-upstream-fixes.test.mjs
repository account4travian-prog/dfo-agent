import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {parseBuildTag} from '../src/upstream/meta.mjs';
// The real game ports may be open while tests run; sync logic is tested with an idle machine.
const idle=async()=>({busy:false,reasons:[]});

const git=(cwd,...args)=>{const r=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
function repo(dir){fs.mkdirSync(dir,{recursive:true});git(dir,'init','-q');git(dir,'config','user.name','Fixture');git(dir,'config','user.email','fixture@example.invalid');}
function commitFile(dir,file,content,message){const target=path.join(dir,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);git(dir,'add','.');git(dir,'commit','-m',message);return git(dir,'rev-parse','HEAD');}
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-upstream-fix-')),engine=path.join(root,'engine'),clone=path.join(root,'clone'),data=path.join(root,'data');repo(engine);repo(clone);const a=commitFile(engine,'src/buildTag.js',"export const BUILD_TAG = 'a';\n",'a');const b=commitFile(engine,'src/buildTag.js',"export const BUILD_TAG = 'b';\n",'b');const c=commitFile(engine,'src/buildTag.js',"export const BUILD_TAG = 'c';\n",'c');const d=commitFile(engine,'src/buildTag.js',"export const BUILD_TAG = 'd';\n",'d');git(engine,'update-ref','refs/remotes/upstream/main',d);git(clone,'fetch',engine,`${d}:refs/remotes/upstream/main`);git(engine,'checkout','--detach',a);git(engine,'remote','add','origin',clone);git(clone,'remote','add','upstream','https://github.com/Lattymoy/daggerfall-js-source.git');fs.mkdirSync(path.join(clone,'node_modules'));fs.writeFileSync(path.join(root,'engine-pin.json'),JSON.stringify({commit:a,previousCommit:null,liveBuildTag:null,updatedAt:null}));return {root,engine,clone,data,a,b,c,d};}

test('build tag meta parser accepts either attribute order',()=>{
 assert.equal(parseBuildTag('<meta name="build-tag" content="abc123">'),'abc123');
 assert.equal(parseBuildTag('<meta content="def456" name="build-tag">'),'def456');
 assert.equal(parseBuildTag('<meta charset="utf-8"><meta content="ghi789" name="build-tag">'),'ghi789');
});

test('sync targets a valid live sha and falls back for unknown or non-ancestor shas',async()=>{
 const {runSync}=await import('../src/upstream/sync.mjs');
 for(const live of ['valid','unknown','non-ancestor']){
  const f=fixture();let sha=live==='valid'?f.b:live==='unknown'?'not-a-commit':commitFile(f.engine,'side.js','side','side');
  let body=`<html><meta name="build-tag" content="${sha}"></html>`;
  const r=await runSync({busyCheck:idle,root:f.root,engine:f.engine,clone:f.clone,data:f.data,fetchRefs:()=>{},fetchImpl:async(url,opts)=>({ok:true,status:200,text:async()=>body}),execute:false});
  if(live==='valid'){assert.equal(r.receipt.targetRevision,f.b);assert.equal(r.receipt.targetReason,'live-build-sha-match');}
  else {assert.equal(r.receipt.targetRevision,f.d);assert.match(r.receipt.targetReason,/fallback/);}
 }
});

test('target behind the pin is a no-op',async()=>{
 const {runSync}=await import('../src/upstream/sync.mjs');const f=fixture();
 fs.writeFileSync(path.join(f.root,'engine-pin.json'),JSON.stringify({commit:f.c,previousCommit:null,liveBuildTag:null,updatedAt:null}));
 git(f.engine,'checkout','--detach',f.c);
 const r=await runSync({busyCheck:idle,root:f.root,engine:f.engine,clone:f.clone,data:f.data,fetchRefs:()=>{},fetchImpl:async()=>({ok:true,status:200,text:async()=>`<meta name="build-tag" content="${f.b}">`})});
 assert.equal(r.receipt.status,'no-op-behind');assert.equal(git(f.engine,'rev-parse','HEAD'),f.c);
});

test('missing or failed live tag falls back to upstream main with a reason',async()=>{
 const {runSync}=await import('../src/upstream/sync.mjs');const f=fixture();
 const r=await runSync({busyCheck:idle,root:f.root,engine:f.engine,clone:f.clone,data:f.data,fetchRefs:()=>{},fetchImpl:async()=>{throw Error('offline fixture');}});
 assert.equal(r.receipt.targetRevision,f.d);assert.equal(r.receipt.targetReason,'no-live-build-tag-fallback-to-upstream-main');assert.match(r.receipt.liveTagError,/offline fixture/);
});

test('--commit refuses a staged pin edit before sync work',async()=>{
 const {runSync}=await import('../src/upstream/sync.mjs');const f=fixture();repo(f.root);
 fs.writeFileSync(path.join(f.root,'engine-pin.json'),JSON.stringify({commit:f.a,previousCommit:null,liveBuildTag:'staged',updatedAt:null}));git(f.root,'add','engine-pin.json');
 const before=git(f.engine,'rev-parse','HEAD');
 const r=await runSync({busyCheck:idle,root:f.root,engine:f.engine,clone:f.clone,data:f.data,execute:true,commit:true,fetchRefs:()=>{},fetchImpl:async()=>({ok:true,status:200,text:async()=>'<meta name="build-tag" content="'+f.b+'">'})});
 assert.equal(r.receipt.status,'failed');assert.match(r.receipt.error,/staged changes/);assert.equal(git(f.engine,'rev-parse','HEAD'),before);assert.ok(git(f.root,'status','--porcelain').includes('engine-pin.json'));
});

test('ensurePort failure keeps engine and pin, records dossier and repair proposal, and removes candidate',async()=>{
 const {runSync}=await import('../src/upstream/sync.mjs');const f=fixture(),pinBefore=fs.readFileSync(path.join(f.root,'engine-pin.json'),'utf8');
 const r=await runSync({busyCheck:idle,root:f.root,engine:f.engine,clone:f.clone,data:f.data,execute:true,fetchRefs:()=>{},fetchImpl:async()=>({ok:true,status:200,text:async()=>`<meta content="${f.b}" name="build-tag">`}),ensurePort:()=>{throw Error('injected bridge mismatch');},tests:()=>({code:0,stdout:'should not run',stderr:''})});
 assert.equal(r.receipt.status,'failed');assert.equal(git(f.engine,'rev-parse','HEAD'),f.a);assert.equal(fs.readFileSync(path.join(f.root,'engine-pin.json'),'utf8'),pinBefore);
 const dossier=JSON.parse(fs.readFileSync(r.receipt.failureDossier,'utf8'));assert.match(dossier.validation.ensurePort.error,/injected bridge mismatch/);
 const queueDir=path.join(f.data,'repair-queue');assert.equal(fs.readdirSync(queueDir).filter(name=>name.endsWith('.json')).length,1);
 const candidates=path.join(f.data,'upstream-sync','candidates');assert.equal(fs.existsSync(candidates)?fs.readdirSync(candidates).length:0,0);
});

test('successful swap then rollback restores engine revision and pin',async()=>{
 const {runSync,rollbackSync}=await import('../src/upstream/sync.mjs');const f=fixture(),pinFile=path.join(f.root,'engine-pin.json'),pinBefore=fs.readFileSync(pinFile,'utf8');
 const r=await runSync({busyCheck:idle,root:f.root,engine:f.engine,clone:f.clone,data:f.data,execute:true,fetchRefs:()=>{},fetchImpl:async()=>({ok:true,status:200,text:async()=>`<meta name="build-tag" content="${f.b}">`}),ensurePort:()=>{},tests:()=>({code:0,stdout:'pass',stderr:''})});
 assert.equal(r.receipt.status,'swapped');assert.equal(git(f.engine,'rev-parse','HEAD'),f.b);
 const pin=JSON.parse(fs.readFileSync(pinFile,'utf8'));assert.deepEqual(Object.keys(pin).sort(),['commit','liveBuildTag','previousCommit','updatedAt']);
 const rolled=await rollbackSync({busyCheck:idle,root:f.root,engine:f.engine,data:f.data});
 assert.equal(rolled.commit,f.a);assert.equal(git(f.engine,'rev-parse','HEAD'),f.a);assert.deepEqual(JSON.parse(fs.readFileSync(pinFile,'utf8')),JSON.parse(pinBefore));
});

test('retention removes old engines and keeps only the two newest',async()=>{
 const {runSync}=await import('../src/upstream/sync.mjs');const f=fixture();let tick=0;const now=()=>new Date(Date.UTC(2026,0,1,0,0,tick++));
 for(const sha of [f.b,f.c,f.d]){
  const r=await runSync({busyCheck:idle,root:f.root,engine:f.engine,clone:f.clone,data:f.data,execute:true,fetchRefs:()=>git(f.engine,'update-ref','refs/remotes/upstream/main',f.d),now,fetchImpl:async()=>({ok:true,status:200,text:async()=>`<meta name="build-tag" content="${sha}">`}),ensurePort:()=>{},tests:()=>({code:0,stdout:'pass',stderr:''})});
  assert.equal(r.receipt.status,'swapped',JSON.stringify(r.receipt));
 }
 const state=JSON.parse(fs.readFileSync(path.join(f.data,'upstream-sync','state.json'),'utf8'));
 assert.equal(state.previousEngines.length,2);assert.ok(state.previousEngines.every(row=>fs.existsSync(row.path)));
});

test('--commit with no staged pin edit commits only the pin file',async()=>{
 const {runSync}=await import('../src/upstream/sync.mjs');const f=fixture();repo(f.root);
 fs.writeFileSync(path.join(f.root,'engine-pin.json'),JSON.stringify({commit:f.a,previousCommit:null,liveBuildTag:null,updatedAt:null}));fs.writeFileSync(path.join(f.root,'other.txt'),'staged elsewhere');
 git(f.root,'add','engine-pin.json');git(f.root,'commit','-q','-m','pin');git(f.root,'add','other.txt');
 const r=await runSync({busyCheck:idle,root:f.root,engine:f.engine,clone:f.clone,data:f.data,execute:true,commit:true,fetchRefs:()=>{},fetchImpl:async()=>({ok:true,status:200,text:async()=>`<meta name="build-tag" content="${f.b}">`}),ensurePort:()=>{},tests:()=>({code:0,stdout:'pass',stderr:''})});
 assert.equal(r.receipt.status,'swapped',r.receipt.error);assert.ok(r.receipt.pinCommit);
 assert.equal(git(f.root,'show','--name-only','--format=','HEAD'),'engine-pin.json');assert.match(git(f.root,'status','--porcelain'),/^A\s+other\.txt/m);
});
