import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {runSync} from '../src/upstream/sync.mjs';
// The real game ports may be open while tests run; sync logic is tested with an idle machine.
const idle=async()=>({busy:false,reasons:[]});

const git=(cwd,...args)=>{const result=spawnSync('git',args,{cwd,encoding:'utf8',windowsHide:true});assert.equal(result.status,0,result.stderr);return result.stdout.trim();};
function repo(dir){fs.mkdirSync(dir,{recursive:true});git(dir,'init','-q');git(dir,'config','user.name','Fixture');git(dir,'config','user.email','fixture@example.invalid');}
test('default sync is dry, records tag-selected target and writes a receipt',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-upstream-test-')),engine=path.join(root,'engine'),clone=path.join(root,'clone'),data=path.join(root,'data');repo(engine);repo(clone);
 fs.mkdirSync(path.join(engine,'src'),{recursive:true});fs.mkdirSync(path.join(engine,'src','net'),{recursive:true});
 fs.writeFileSync(path.join(engine,'src','buildTag.js'),"export const BUILD_TAG = '1';\n");fs.writeFileSync(path.join(engine,'src','net','updateNotice.js'),"export function fetchLiveBuildTag(){return fetch('https://example.invalid/tag');}\n");
 git(engine,'add','.');git(engine,'commit','-m','one');const first=git(engine,'rev-parse','HEAD');
 fs.writeFileSync(path.join(engine,'src','buildTag.js'),"export const BUILD_TAG = '2';\n");git(engine,'add','.');git(engine,'commit','-m','two');const second=git(engine,'rev-parse','HEAD');
 fs.writeFileSync(path.join(engine,'src/buildTag.js'),"export const BUILD_TAG = '3';\n");git(engine,'add','.');git(engine,'commit','-m','three');const current=git(engine,'rev-parse','HEAD');fs.writeFileSync(path.join(root,'engine-pin.json'),JSON.stringify({commit:first,previousCommit:null,liveBuildTag:null,updatedAt:null}));
 git(engine,'update-ref','refs/remotes/upstream/main',current);git(engine,'remote','add','origin',clone);git(clone,'remote','add','upstream','https://github.com/Lattymoy/daggerfall-js-source.git');
 const result=await runSync({busyCheck:idle,root,engine,clone,data,fetchRefs:()=>{},fetchImpl:async(_url,options)=>{assert.equal(options.cache,'no-store');return {ok:true,status:200,text:async()=>'<html><meta content="'+second+'" name="build-tag"></html>'};},now:()=>new Date('2026-10-28T00:00:00.000Z')});
 assert.equal(result.receipt.status,'planned',JSON.stringify(result.receipt));assert.equal(result.receipt.targetRevision,second);assert.equal(result.receipt.targetReason,'live-build-sha-match');assert.equal(git(engine,'rev-parse','HEAD'),current);assert.equal(fs.existsSync(result.receiptFile),true);assert.notEqual(first,second);
});

test('active session exits busy before fetch or engine inspection',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-upstream-busy-')),data=path.join(root,'data');fs.mkdirSync(data);fs.writeFileSync(path.join(data,'session-status.json'),JSON.stringify({state:'playing',at:new Date().toISOString()}));let fetched=false;
 const result=await runSync({root,data,fetchImpl:async()=>{fetched=true;throw Error('must not fetch');}});
 assert.equal(result.exitCode,3);assert.equal(result.receipt.status,'busy');assert.equal(fetched,false);
});
