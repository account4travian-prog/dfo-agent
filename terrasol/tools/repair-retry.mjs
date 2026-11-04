import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {ROOT,DATA,CONTROL_URL} from '../src/config.mjs';
import {sourceIdentity} from '../src/mind/revision.mjs';
import {createBudget} from '../src/mind/budget.mjs';
import {selectTurnRetry,retryTurn} from '../src/repair/retry.mjs';
import {rollbackFiles} from '../src/repair/apply.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
function atomic(f,value){const t=`${f}.${randomUUID()}.tmp`;fs.writeFileSync(t,JSON.stringify(value,null,2),{flag:'wx'});fs.renameSync(t,f);}
function budgetAllowed(value){if(!value||value.paused)return false;try{return createBudget({limits:value.limits,initialStatus:value}).check('terra').ok;}catch{return false;}}
async function request(route,body){const r=await fetch(CONTROL_URL+route,{method:body?'POST':'GET',headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(5000)}),v=await r.json();if(!r.ok)throw Error(v.error??`HTTP ${r.status}`);return v;}
function reload(){const p=spawnSync(process.execPath,[path.join(ROOT,'tools','reload.mjs'),'--driver','--no-resume'],{cwd:ROOT,encoding:'utf8',windowsHide:true,timeout:180000,shell:false});if(p.status!==0)throw Error(`Rollback reload failed: ${(p.stderr||p.error?.message||'unknown').slice(0,500)}`);return read(JSON.parse(p.stdout).receipt);}
export async function main(args=process.argv.slice(2)){
 if(args.length<2||args[0]!=='--stage'||args.length>3||(args[2]&&args[2]!=='--execute'))throw Error('Usage: node tools/repair-retry.mjs --stage <staged-directory> [--execute]');
 const dir=fs.realpathSync(args[1]),base=fs.realpathSync(path.join(DATA,'repairs','staging'))+path.sep;if(!dir.startsWith(base))throw Error('Stage outside authorized directory');
 const stage=read(path.join(dir,'status.json')),status=read(path.join(dir,'apply-status.json')),run=fs.realpathSync(status.run),runs=fs.realpathSync(path.join(DATA,'runs'))+path.sep;
 if(!run.startsWith(runs)||status.phase!=='applying'||status.originalHold||!status.holdCommandAt||status.afterRevision!==sourceIdentity(ROOT).effectiveRevision||!['pagePreserved','characterPreserved','memoryPreserved','planPreserved','budgetPreserved'].every(k=>status.invariants?.[k]===true))throw Error('Repair is not eligible for an automatic retry');
 const checkpointFile=path.join(run,'continuation.json'),continuation=read(checkpointFile),step=selectTurnRetry(continuation),commandFile=path.join(DATA,'command.json');
 const owned=()=>{try{const c=read(commandFile),saved=read(checkpointFile);return c.command==='hold'&&c.at===status.holdCommandAt&&budgetAllowed(saved.budget);}catch{return false;}};
 if(!owned())throw Error('Operator or budget hold prevents repair retry');
 if(!args.includes('--execute')){console.log(JSON.stringify({eligible:true,stepId:step.stepId,kind:'turn',modelsInvoked:0}));return;}
 const marker=path.join(dir,'retry-once.json');fs.writeFileSync(marker,JSON.stringify({proposalId:status.proposalId,step,at:new Date().toISOString()}),{flag:'wx'});
 const publish=()=>{status.at=new Date().toISOString();atomic(path.join(dir,'apply-status.json'),status);atomic(path.join(run,'repair-status.json'),status);};
 const prior=await request('/repair-identity');if(prior.characterHash!==status.characterHash||!status.pageId||prior.pageId!==status.pageId)throw Error('Character or page changed before retry');
 const result=await retryTurn({baseUrl:CONTROL_URL,step,stillOwned:owned});status.retry=result;
 const after=await request('/repair-identity').catch(()=>null);const same=after?.characterHash===status.characterHash&&after?.pageId===prior.pageId;
 if(result.verified&&same&&owned()){
  const latest=read(checkpointFile);if(JSON.stringify(latest.plan)!==JSON.stringify(continuation.plan)||!budgetAllowed(latest.budget))throw Error('Plan or budget changed during retry');
  latest.plan.stepStates[step.stepId]='completed';if(latest.plan.steps.every(s=>latest.plan.stepStates[s.id]==='completed'))latest.plan.status='complete';latest.repair={...(latest.repair??{}),proposalId:status.proposalId,hold:true,verified:false};atomic(checkpointFile,latest);
  status.phase='verified';status.reason='Original failed turn reached its measured heading after repair';status.invariants.pagePreserved=true;status.invariants.characterPreserved=true;publish();
  if(owned()){const directory=path.join(run,'repair-resume');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,`${status.proposalId}.json`),JSON.stringify({proposalId:status.proposalId,expectedHoldAt:status.holdCommandAt,at:Date.now()}),{flag:'wx'});status.resumeRequested=true;publish();}
 }else{
  try{const restore=rollbackFiles(ROOT,{receipt:stage,patch:path.join(dir,'candidate.patch')},status.originalFiles);const replaced=reload();if(replaced.outcome!=='replacement-held'||replaced.afterIdentity?.characterHash!==status.characterHash)throw Error('Restored driver identity unverified');status.phase='rolled-back';status.afterRevision=status.beforeRevision;status.rollback=restore;status.reason=`Original goal retry failed: ${result.error??'heading not verified'}`;}
  catch(e){status.phase='failed';status.reason=`Retry failed and rollback incomplete: ${e.message}`;}
  publish();
 }
 console.log(JSON.stringify({phase:status.phase,reason:status.reason,resumeRequested:!!status.resumeRequested}));return status;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
