import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {stageRepair,validateRepairProposal} from '../src/repair/stage.mjs';
const git=(root,...args)=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);return r.stdout.trim()};
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-repair-test-'));fs.mkdirSync(path.join(root,'src'));fs.mkdirSync(path.join(root,'test'));fs.mkdirSync(path.join(root,'artifacts'));git(root,'init');git(root,'config','user.email','local@example.invalid');git(root,'config','user.name','Fixture');fs.writeFileSync(path.join(root,'src','value.mjs'),'export const value=1;\n');fs.writeFileSync(path.join(root,'test','round2-player-http.test.mjs'),"import {test} from 'node:test'; import assert from 'node:assert/strict'; import {value} from '../src/value.mjs'; test('regression',()=>assert.equal(value,2));\n");git(root,'add','src','test');git(root,'commit','-m','fixture');return root;}
test('isolated real Git candidate reproduces and passes fixed regression without changing original',()=>{
 const root=fixture(),head=git(root,'rev-parse','HEAD');const patch=Buffer.from('diff --git a/src/value.mjs b/src/value.mjs\nindex b8ead82..4d81acd 100644\n--- a/src/value.mjs\n+++ b/src/value.mjs\n@@ -1 +1 @@\n-export const value=1;\n+export const value=2;\n');
 const result=stageRepair({root,artifactRoot:path.join(root,'artifacts'),proposal:{schemaVersion:'dfo-repair.v1',proposalId:'regression',sourceRevision:head,affectedPaths:['src/value.mjs'],reproducer:'echo must-not-run',reproducerId:'player-http'},patchBytes:patch});
 assert.equal(result.receipt.phase,'staged',result.receipt.reason);assert.equal(result.receipt.baseline.code,1);assert.equal(result.receipt.tests.code,0);assert.equal(result.receipt.reproducer.status,'regression-transition-observed');assert.equal(fs.readFileSync(path.join(root,'src','value.mjs'),'utf8'),'export const value=1;\n');assert.equal(result.receipt.afterRevision,null);assert.equal(result.receipt.gamePageInvariant,'not checked');assert.equal(result.receipt.files[0].sha256.length,64);
});
test('proposal cannot use traversal, duplicate or non-project paths',()=>{
 const base={schemaVersion:'dfo-repair.v1',proposalId:'safe',sourceRevision:'a'.repeat(40)};
 for(const affectedPaths of [['src/../secret'],['engine/a'],['src/X','src/x'],['src/a;echo']])assert.throws(()=>validateRepairProposal({...base,affectedPaths}));
});

test('real patch application rolls back and verifies source hashes on a failing full suite',async()=>{
 const {applyFilesAndTest}=await import('../src/repair/apply.mjs');const root=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-apply-test-'));fs.mkdirSync(path.join(root,'src'));fs.mkdirSync(path.join(root,'test'));fs.mkdirSync(path.join(root,'artifacts'));git(root,'init');git(root,'config','user.email','local@example.invalid');git(root,'config','user.name','Fixture');
 fs.writeFileSync(path.join(root,'src','value.mjs'),'export const value=1;\n');fs.writeFileSync(path.join(root,'test','round2-player-http.test.mjs'),"import {test} from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import {value} from '../src/value.mjs';test('fixture',()=>{assert.equal(path.basename(process.cwd()),'checkout');assert.equal(value,2)});\n");git(root,'add','src','test');git(root,'commit','-m','fixture');const head=git(root,'rev-parse','HEAD');
 const patch=Buffer.from('diff --git a/src/value.mjs b/src/value.mjs\n--- a/src/value.mjs\n+++ b/src/value.mjs\n@@ -1 +1 @@\n-export const value=1;\n+export const value=2;\n');
 const staged=stageRepair({root,artifactRoot:path.join(root,'artifacts'),proposal:{schemaVersion:'dfo-repair.v1',proposalId:'rollback',sourceRevision:head,affectedPaths:['src/value.mjs'],reproducerId:'player-http'},patchBytes:patch});assert.equal(staged.receipt.phase,'staged',staged.receipt.reason);
 const result=applyFilesAndTest(root,staged.artifactDir);assert.match(result.error,/suite failed/);assert.equal(result.rollback.restored,true);assert.equal(fs.readFileSync(path.join(root,'src','value.mjs'),'utf8'),'export const value=1;\n');assert.equal(git(root,'status','--porcelain','--','src/value.mjs'),'');
});

test('repair adapter runs a tested patch with a simulated pre-existing budget hold and never resumes',async()=>{
 const {runRepair}=await import('../tools/repair-apply.mjs');const root=fs.mkdtempSync(path.join(os.tmpdir(),'dfo-adapter-test-')),data=path.join(root,'data'),run=path.join(data,'runs','r');
 for(const d of ['src','test','tools','data/repairs/staging','data/runs/r','data/memory'])fs.mkdirSync(path.join(root,d),{recursive:true});
 git(root,'init');git(root,'config','user.email','local@example.invalid');git(root,'config','user.name','Fixture');fs.writeFileSync(path.join(root,'.gitignore'),'data/\n');
 fs.writeFileSync(path.join(root,'src','value.mjs'),'export const value=1;\n');fs.writeFileSync(path.join(root,'test','round2-player-http.test.mjs'),"import {test} from 'node:test';import assert from 'node:assert/strict';import {value} from '../src/value.mjs';test('fix',()=>assert.equal(value,2));\n");
 const reload=`import fs from 'node:fs';import path from 'node:path';const args=process.argv.slice(2),d=path.join(process.cwd(),'data');fs.appendFileSync(path.join(d,'reload-args.jsonl'),JSON.stringify(args)+'\\n');const run=path.join(d,'runs','r'),held=args.includes('--hold-only');const receipt={originalHold:{state:'held',reason:'budget-exhausted'},heldStatus:{run,state:'held'},stop:{cleanupPending:false},outcome:held?'held':'replacement-held',beforeTarget:{id:'page'},afterTarget:{id:'page'},beforeIdentity:{characterHash:'stable'},afterIdentity:{characterHash:'stable'}};const file=path.join(d,held?'held.json':'replacement.json');fs.writeFileSync(file,JSON.stringify(receipt));console.log(JSON.stringify({receipt:file,outcome:receipt.outcome}));`;
 fs.writeFileSync(path.join(root,'tools','reload.mjs'),reload);git(root,'add','.gitignore','src','test','tools');git(root,'commit','-m','fixture');
 fs.writeFileSync(path.join(run,'continuation.json'),JSON.stringify({plan:{planId:'p',version:1,steps:[{id:'s'}]},budget:{paused:true,totals:{calls:12}},repair:{proposalId:'budget-hold',hold:true}}));fs.writeFileSync(path.join(data,'memory','memory.jsonl'),'memory\n');
 const patch=Buffer.from('diff --git a/src/value.mjs b/src/value.mjs\n--- a/src/value.mjs\n+++ b/src/value.mjs\n@@ -1 +1 @@\n-export const value=1;\n+export const value=2;\n');const staged=stageRepair({root,artifactRoot:path.join(data,'repairs','staging'),proposal:{schemaVersion:'dfo-repair.v1',proposalId:'budget-hold',sourceRevision:git(root,'rev-parse','HEAD'),affectedPaths:['src/value.mjs']},patchBytes:patch});assert.equal(staged.receipt.phase,'staged');
 const status=runRepair({root,data,stageDir:staged.artifactDir,execute:true});assert.equal(status.phase,'applying');assert.equal(status.originalHold.reason,'budget-exhausted');assert.equal(status.invariants.planPreserved,true);assert.equal(status.invariants.memoryPreserved,true);assert.equal(status.invariants.budgetPreserved,true);assert.equal(status.invariants.characterPreserved,true);
 const args=fs.readFileSync(path.join(data,'reload-args.jsonl'),'utf8').trim().split('\n').map(JSON.parse);assert.equal(args.length,2);assert.ok(args.every(a=>a.includes('--no-resume')));assert.equal(JSON.parse(fs.readFileSync(path.join(run,'continuation.json'))).budget.totals.calls,12);
});

test('subscription engineering adapter turns a queued proposal into a tested Git patch and enforces its call cap',async()=>{
 const {engineerProposal}=await import('../src/repair/engineer.mjs'),{sourceIdentity}=await import('../src/mind/revision.mjs');const root=fixture(),artifactRoot=path.join(root,'artifacts'),usageFile=path.join(root,'usage.jsonl');let calls=0;
 const proposal={schemaVersion:'dfo-repair.v1',proposalId:'engineering',sourceRevision:sourceIdentity(root).effectiveRevision,affectedPaths:['src/value.mjs'],diagnosis:'test failure'};
 const patch='diff --git a/src/value.mjs b/src/value.mjs\n--- a/src/value.mjs\n+++ b/src/value.mjs\n@@ -1 +1 @@\n-export const value=1;\n+export const value=2;\n';
 const transport=async options=>{calls++;assert.equal(options.model,'gpt-6.1-sol');return {json:{summary:'fix fixture',patch},usage:{input_tokens:12,output_tokens:8},ms:4}};
 const staged=await engineerProposal({root,proposal,artifactRoot,usageFile,maxCalls:1,transport});assert.equal(staged.receipt.phase,'staged',staged.receipt.reason);await assert.rejects(()=>engineerProposal({root,proposal,artifactRoot,usageFile,maxCalls:1,transport}),e=>e.code==='ENGINEERING_CAP');assert.equal(calls,1);
 const rows=fs.readFileSync(usageFile,'utf8').trim().split('\n').map(JSON.parse);assert.equal(rows[0].usage,'unknown');assert.equal(rows[1].usage.input_tokens,12);
});

test('queue worker claims once, supplies bounded redacted packet evidence and stages a real patch',async()=>{
 const {consumeOne}=await import('../src/repair/queue-worker.mjs'),{sourceIdentity}=await import('../src/mind/revision.mjs');const root=fixture(),data=path.join(root,'data'),run=path.join(data,'runs','r');fs.mkdirSync(path.join(run,'repair-proposals'),{recursive:true});fs.mkdirSync(path.join(run,'packets'),{recursive:true});
 const proposal={schemaVersion:'dfo-repair.v1',proposalId:'q1',sourceRevision:sourceIdentity(root).effectiveRevision,affectedPaths:['src/value.mjs'],failurePacketRefs:['pkt-1'],diagnosis:'failure'};fs.writeFileSync(path.join(run,'repair-proposals','q1.json'),JSON.stringify(proposal));fs.writeFileSync(path.join(run,'packets','packets.jsonl'),JSON.stringify({packetId:'pkt-1',prompt:'password=hidden',reply:{answer:'observed'},images:[{ref:'private.png'}]})+'\n');
 let calls=0;const transport=async o=>{calls++;assert.match(o.prompt,/pkt-1/);assert.doesNotMatch(o.prompt,/password=hidden/);assert.match(o.prompt,/images omitted/);return {json:{summary:'fix',patch:'diff --git a/src/value.mjs b/src/value.mjs\n--- a/src/value.mjs\n+++ b/src/value.mjs\n@@ -1 +1 @@\n-export const value=1;\n+export const value=2;\n'},usage:{input_tokens:10,output_tokens:5},ms:1}};
 const first=await consumeOne({root,data,run,maxCalls:1,transport});assert.equal(first.phase,'staged');assert.equal(await consumeOne({root,data,run,maxCalls:1,transport}),null);assert.equal(calls,1);assert.equal(JSON.parse(fs.readFileSync(path.join(run,'repair-status.json'))).proposalId,'q1');
});
