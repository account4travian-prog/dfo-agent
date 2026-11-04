import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {ROOT,DATA} from '../src/config.mjs';
import {verifyStaged,applyFilesAndTest,rollbackFiles} from '../src/repair/apply.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
function reload(root,args){const p=spawnSync(process.execPath,[path.join(root,'tools','reload.mjs'),...args],{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:1024*1024,windowsHide:true,shell:false});if(p.status!==0)throw Error(`Reload failed: ${(p.stderr||p.error?.message||'unknown').slice(0,800)}`);const info=JSON.parse(p.stdout);return {info,receipt:JSON.parse(fs.readFileSync(info.receipt,'utf8'))};}
function readCheckpoint(run,data){const base=path.resolve(data,'runs')+path.sep,dir=fs.realpathSync(run);if(!dir.startsWith(base))throw Error('Session checkpoint is outside authorized runs');const continuation=JSON.parse(fs.readFileSync(path.join(dir,'continuation.json'),'utf8'));if(!continuation.plan||!continuation.budget)throw Error('Full plan/budget checkpoint is missing');const ledger=fs.readFileSync(path.join(data,'memory','memory.jsonl'));return {planHash:digest(Buffer.from(JSON.stringify(continuation.plan))),budgetHash:digest(Buffer.from(JSON.stringify(continuation.budget))),memoryHash:digest(ledger)};}
function saveStatus(file,status){const tmp=`${file}.${randomUUID()}.tmp`;fs.writeFileSync(tmp,JSON.stringify(status,null,2),{flag:'wx'});fs.renameSync(tmp,file);}
export function runRepair({root=ROOT,data=DATA,stageDir,execute=false}){
 const staging=fs.realpathSync(path.join(data,'repairs','staging'))+path.sep,dir=fs.realpathSync(path.resolve(stageDir));if(!dir.startsWith(staging))throw Error('Stage is outside the repair staging directory');
 const stage=verifyStaged(root,dir);if(!execute){console.log(JSON.stringify({phase:'staged',proposalId:stage.receipt.proposalId,note:'Dry run; no service, source write or replacement.'}));return;}
 let applied=null,run=null,status={schemaVersion:'dfo-repair-status.v1',proposalId:stage.receipt.proposalId,phase:'applying',beforeRevision:stage.receipt.beforeRevision,afterRevision:null,invariants:{pagePreserved:null,characterPreserved:null,memoryPreserved:null,planPreserved:null},artifactRefs:[dir],at:new Date().toISOString()},statusFile=path.join(dir,'apply-status.json');
 const publish=()=>{status.at=new Date().toISOString();saveStatus(statusFile,status);if(run)saveStatus(path.join(run,'repair-status.json'),status);};
 try {
  const held=reload(root,['--driver','--hold-only','--no-resume']);status.artifactRefs.push(held.info.receipt);
  status.originalHold=held.receipt.originalHold??null;status.holdPolicy='Always retain the held state; no automatic resume or budget reset.';
  if(!held.receipt.heldStatus?.run||held.receipt.stop?.cleanupPending!==false)throw Error('An active checkpointed supervisor and verified release are required');
  if(!held.receipt.beforeIdentity?.characterHash)throw Error('Stable character identity is unavailable');
  run=fs.realpathSync(held.receipt.heldStatus.run);status.run=run;status.holdCommandAt=held.receipt.holdCommandAt??null;status.characterHash=held.receipt.beforeIdentity.characterHash;status.pageId=held.receipt.beforeTarget?.id??null;const checkpoint=JSON.parse(fs.readFileSync(path.join(run,'continuation.json'),'utf8'));if(checkpoint.repair?.proposalId!==status.proposalId||checkpoint.repair?.hold!==true)throw Error('Checkpoint does not contain the matching active repair hold');const before=readCheckpoint(run,data);publish();
  applied=applyFilesAndTest(root,dir);status.tests=applied.tests??null;status.originalFiles=applied.original??null;
  if(applied.error){status.phase=applied.rollback?.restored?'rolled-back':'failed';status.reason=applied.error;status.rollback=applied.rollback;publish();return status;}
  try {
   const replaced=reload(root,['--driver','--no-resume']);status.artifactRefs.push(replaced.info.receipt);
   if(replaced.receipt.outcome!=='replacement-held')throw Error('Driver replacement did not remain held');
   const after=readCheckpoint(run,data);status.invariants.pagePreserved=held.receipt.beforeTarget?.id===replaced.receipt.afterTarget?.id;status.invariants.characterPreserved=!!replaced.receipt.afterIdentity?.characterHash&&held.receipt.beforeIdentity.characterHash===replaced.receipt.afterIdentity.characterHash;status.invariants.memoryPreserved=before.memoryHash===after.memoryHash;status.invariants.planPreserved=before.planHash===after.planHash;status.invariants.budgetPreserved=before.budgetHash===after.budgetHash;
   if(!status.invariants.pagePreserved||!status.invariants.characterPreserved||!status.invariants.memoryPreserved||!status.invariants.planPreserved||!status.invariants.budgetPreserved)throw Error('Page, memory, plan or budget invariant changed');
   status.afterRevision=stage.receipt.candidateRevision;
   status.reason='Driver replaced and held; goal retry and independent outcome verification remain required.';status.phase='applying';publish();
  }catch(error){
   try{status.rollback=rollbackFiles(root,applied.stage,applied.original);const restored=reload(root,['--driver','--no-resume']);status.artifactRefs.push(restored.info.receipt);if(restored.receipt.outcome!=='replacement-held'||restored.receipt.afterTarget?.id!==held.receipt.beforeTarget?.id)throw Error('Rollback driver or page was not confirmed');status.phase='rolled-back';status.afterRevision=status.beforeRevision;status.reason=`Candidate replacement failed; source and driver restored: ${error.message}`;}
   catch(rollbackError){status.phase='failed';status.reason=`Candidate replacement failed: ${error.message}; rollback incomplete: ${rollbackError.message}`;}
   publish();
  }
 }catch(error){status.phase='failed';status.reason=error.message;publish();}
 console.log(JSON.stringify({phase:status.phase,reason:status.reason,status:statusFile}));return status;
}
export function main(args=process.argv.slice(2)){if(args.length<2||args[0]!=='--stage'||args.length>3||(args[2]&&args[2]!=='--execute'))throw Error('Usage: node tools/repair-apply.mjs --stage <staged-directory> [--execute]');return runRepair({stageDir:args[1],execute:args.includes('--execute')});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try{const result=main();if(result?.phase==='failed'||result?.phase==='rolled-back')process.exitCode=1;}catch(e){console.error(e.message);process.exitCode=1;}
