import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {engineerProposal} from './engineer.mjs';
import {ROOT,DATA} from '../config.mjs';
import {runRepair} from '../../tools/repair-apply.mjs';
import {main as retryRepair} from '../../tools/repair-retry.mjs';
function status(run,proposalId,phase,reason=null,extra={}){const value={schemaVersion:'dfo-repair-status.v1',proposalId,phase,at:new Date().toISOString(),reason,...extra};const target=path.join(run,'repair-status.json'),tmp=`${target}.${randomUUID()}.tmp`;fs.writeFileSync(tmp,JSON.stringify(value),{flag:'wx'});fs.renameSync(tmp,target);return value;}
// Each proposal is claimed create-only before any model call; an interrupted or
// ambiguous claim is deliberately never reissued by automatic polling.
export async function consumeOne({root,data,run,maxCalls,transport,apply=false}){
 const queue=path.join(run,'repair-proposals'),claims=path.join(run,'repair-claims');fs.mkdirSync(claims,{recursive:true});
 const files=fs.existsSync(queue)?fs.readdirSync(queue).filter(f=>f.endsWith('.json')&&f!=='queue.json').sort():[];
 for(const file of files){
  const proposal=JSON.parse(fs.readFileSync(path.join(queue,file),'utf8'));if(typeof proposal.proposalId!=='string'||!/^[\w.-]{1,80}$/.test(proposal.proposalId)||file!==`${proposal.proposalId}.json`)throw Error('Invalid queued proposal identity');
  const claim=path.join(claims,`${proposal.proposalId}.json`);try{fs.writeFileSync(claim,JSON.stringify({proposalId:proposal.proposalId,phase:'claimed',at:new Date().toISOString()}),{flag:'wx'});}catch(e){if(e.code==='EEXIST')continue;throw e;}
  status(run,proposal.proposalId,'queued','Claimed by external engineering worker');
  try{
   const artifactRoot=path.join(data,'repairs','staging');fs.mkdirSync(artifactRoot,{recursive:true});
   const candidate=await engineerProposal({root,proposal,run,artifactRoot,usageFile:path.join(run,'engineering-usage.jsonl'),maxCalls,...(transport?{transport}:{})});
   const phase=candidate.receipt.phase;status(run,proposal.proposalId,phase,candidate.receipt.reason,{beforeRevision:proposal.sourceRevision,afterRevision:null,artifactRefs:[candidate.artifactDir]});
   let applied=null;if(apply&&phase==='staged')applied=runRepair({root,data,stageDir:candidate.artifactDir,execute:true});
   if(applied?.phase==='applying'&&root===ROOT&&data===DATA){try{applied=await retryRepair(['--stage',candidate.artifactDir,'--execute'])??applied;}catch(error){applied.reason=`Automatic retry unavailable: ${error.message}`;status(run,proposal.proposalId,'applying',applied.reason,{beforeRevision:applied.beforeRevision,afterRevision:applied.afterRevision,invariants:applied.invariants,artifactRefs:applied.artifactRefs,originalHold:applied.originalHold,holdCommandAt:applied.holdCommandAt,run:applied.run});}}
   fs.writeFileSync(claim,JSON.stringify({proposalId:proposal.proposalId,phase:applied?.phase??phase,artifactDir:candidate.artifactDir,at:new Date().toISOString()},null,2));return {proposalId:proposal.proposalId,phase:applied?.phase??phase};
  }catch(e){const phase='failed';status(run,proposal.proposalId,phase,e.message);fs.writeFileSync(claim,JSON.stringify({proposalId:proposal.proposalId,phase,reason:e.message,at:new Date().toISOString()}));return {proposalId:proposal.proposalId,phase,error:e.message,code:e.code??null};}
 }
 return null;
}
