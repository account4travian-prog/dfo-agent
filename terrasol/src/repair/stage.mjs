import {sourceIdentity} from '../mind/revision.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function run(executable,args,{cwd,timeout=120000,env=process.env}={}) {
 const r=spawnSync(executable,args,{cwd,env,encoding:'utf8',timeout,maxBuffer:8*1024*1024,windowsHide:true,shell:false});
 return {code:r.status,signal:r.signal,error:r.error?.message??null,stdout:r.stdout??'',stderr:r.stderr??''};
}
function must(result,label){if(result.code!==0)throw Error(`${label} failed: ${(result.error||result.stderr||'nonzero exit').slice(0,1000)}`);return result.stdout;}
export function validateRepairProposal(proposal) {
 if(proposal?.schemaVersion!=='dfo-repair.v1'||typeof proposal.proposalId!=='string'||!/^[\w.-]{1,80}$/.test(proposal.proposalId)||typeof proposal.sourceRevision!=='string'||!/^[0-9a-f]{40}(?:\+sha256:[0-9a-f]{64})?$/i.test(proposal.sourceRevision)||!Array.isArray(proposal.affectedPaths)||!proposal.affectedPaths.length||proposal.affectedPaths.length>100)throw Error('Invalid repair proposal identity or paths');
 const paths=proposal.affectedPaths.map(p=>{
  if(typeof p!=='string'||p.length>240||!/^((src|test|tools|vendor|docs)\/)[\w.\/-]+$/.test(p)||p.split('/').some(x=>!x||x==='.'||x==='..'||x.toLowerCase()==='.git'))throw Error('Path outside authorized project source scope');return p;
 });
 if(new Set(paths.map(p=>p.toLowerCase())).size!==paths.length)throw Error('Duplicate affected path');
 return paths;
}
const REGRESSIONS=Object.freeze({'player-http':'round2-player-http.test.mjs','controller-http':'native-controller-http.test.mjs','mind-joint-http':'round2-joint-http.test.mjs'});
function tests(root,{regressionId=null}={}){
 const dir=path.join(root,'test');if(!fs.existsSync(dir))throw Error('Fixed test suite is missing');
 let files=fs.readdirSync(dir).filter(x=>x.endsWith('.test.mjs')).sort();const omitted=[];
 if(regressionId){const selected=REGRESSIONS[regressionId];if(!selected||!files.includes(selected))throw Error('Unknown or unavailable trusted reproducer');files=[selected];}
 if(!fs.existsSync(path.join(root,'engine','src','agent','agentBridge.js'))&&files.includes('native-bridge.test.mjs')){files=files.filter(x=>x!=='native-bridge.test.mjs');omitted.push('native-bridge.test.mjs: isolated checkout has no engine');}
 if(!files.length)throw Error('Fixed test suite is empty');const env={...process.env};delete env.NODE_TEST_CONTEXT;
 return {...run(process.execPath,['--test',...files.map(x=>path.join('test',x))],{cwd:root,env}),files,omitted};
}
function hashes(root,paths){return paths.map(p=>{const f=path.join(root,...p.split('/'));if(!fs.existsSync(f))return {path:p,sha256:null};const st=fs.lstatSync(f);if(!st.isFile()||st.isSymbolicLink())throw Error(`Non-regular repair path: ${p}`);return {path:p,sha256:sha(fs.readFileSync(f))};});}
function maintenance(paths){return paths.some(p=>p==='src/native-bridge.mjs'||p.startsWith('vendor/native-agent/')||p.startsWith('engine/'));}
// All executable selections are fixed here. Proposal fields are data, not commands.
// This creates a retained isolated worktree and never applies bytes to the playing checkout.
export function stageRepair({root,proposal,patchBytes,artifactRoot}) {
 const paths=validateRepairProposal(proposal),source=fs.realpathSync(root),base=fs.realpathSync(artifactRoot);
 if(!Buffer.isBuffer(patchBytes)||!patchBytes.length||patchBytes.length>2_000_000)throw Error('Patch must be a nonempty bounded byte buffer');
 const head=must(run('git',['rev-parse','HEAD'],{cwd:source}),'read source revision').trim();if(head.toLowerCase()!==proposal.sourceRevision.slice(0,40).toLowerCase()||(proposal.sourceRevision.includes('+')&&sourceIdentity(source).effectiveRevision!==proposal.sourceRevision))throw Error('Proposal source revision does not match checkout');
 const runtimeChanges=must(run('git',['status','--porcelain=v1','--untracked-files=all','--','src','vendor','tools'],{cwd:source}),'inspect runtime sources');if(runtimeChanges.trim())throw Error('Runtime source changes must be committed before isolated staging');
 for(const p of paths){if(p.startsWith('test/')&&fs.existsSync(path.join(source,...p.split('/'))))throw Error(`Existing acceptance test cannot be modified by a candidate: ${p}`);const status=must(run('git',['status','--porcelain=v1','--untracked-files=all','--',p],{cwd:source}),'inspect source path');if(status.trim())throw Error(`Affected path has local changes: ${p}`);}
 const id=`${proposal.proposalId}-${randomUUID()}`,dir=path.join(base,id),checkout=path.join(dir,'checkout');fs.mkdirSync(dir,{recursive:false});
 const patch=path.join(dir,'candidate.patch');fs.writeFileSync(patch,patchBytes,{flag:'wx'});
 const emptyHooks=path.join(dir,'no-hooks');fs.mkdirSync(emptyHooks);
 const receipt={schemaVersion:'dfo-repair-status.v1',proposalId:proposal.proposalId,phase:'queued',beforeRevision:proposal.sourceRevision,gitRevision:head,afterRevision:null,artifactRefs:[patch],patchSha256:sha(patchBytes),paths,gamePageInvariant:'not checked',characterInvariant:'not checked',memoryInvariant:'not checked',planInvariant:'not checked',events:[]};
 const save=()=>fs.writeFileSync(path.join(dir,'status.json'),JSON.stringify(receipt,null,2));
 try {
  must(run('git',['-c',`core.hooksPath=${emptyHooks}`,'worktree','add','--detach',checkout,head],{cwd:source,timeout:60000}),'create isolated worktree');
  receipt.phase='reproducing';receipt.events.push({phase:'reproducing',at:new Date().toISOString()});save();
  const before=tests(checkout);fs.writeFileSync(path.join(dir,'baseline-test.log'),before.stdout+before.stderr);receipt.baseline={code:before.code,signal:before.signal,error:before.error,log:path.join(dir,'baseline-test.log'),omitted:before.omitted};
  let beforeRegression=null;if(proposal.reproducerId){beforeRegression=tests(checkout,{regressionId:proposal.reproducerId});fs.writeFileSync(path.join(dir,'reproducer-before.log'),beforeRegression.stdout+beforeRegression.stderr);}
  receipt.phase='patching';save();
  must(run('git',['apply','--check','--index',patch],{cwd:checkout}),'check patch');
  must(run('git',['apply','--index',patch],{cwd:checkout}),'apply patch in isolated worktree');
  const changed=must(run('git',['diff','--cached','--name-only','-z'],{cwd:checkout}),'list changed paths').split('\0').filter(Boolean).sort();
  if(JSON.stringify(changed)!==JSON.stringify([...paths].sort()))throw Error('Patch paths differ from authorized affected paths');
  const raw=must(run('git',['diff','--cached','--raw','--no-abbrev'],{cwd:checkout}),'inspect file modes');if(/(?:^|\s)120000(?:\s|$)/m.test(raw))throw Error('Symlink patches are not eligible');
  receipt.files=hashes(checkout,paths);receipt.candidateRevision=sourceIdentity(checkout).effectiveRevision;receipt.phase='testing';save();
  const verified=tests(checkout);fs.writeFileSync(path.join(dir,'candidate-test.log'),verified.stdout+verified.stderr);receipt.tests={code:verified.code,signal:verified.signal,error:verified.error,log:path.join(dir,'candidate-test.log'),omitted:verified.omitted};
  if(verified.code!==0)throw Error('Fixed test suite failed');
  receipt.phase=maintenance(paths)?'maintenance-required':'staged';receipt.reason=maintenance(paths)?'Bridge/engine change requires a tested reload path':'Isolated candidate tested; no live apply, retry, verification or rollback has occurred';
  if(beforeRegression){const afterRegression=tests(checkout,{regressionId:proposal.reproducerId});fs.writeFileSync(path.join(dir,'reproducer-after.log'),afterRegression.stdout+afterRegression.stderr);receipt.reproducer={id:proposal.reproducerId,beforeCode:beforeRegression.code,afterCode:afterRegression.code,status:beforeRegression.code!==0&&beforeRegression.code!==null&&afterRegression.code===0?'regression-transition-observed':'unconfirmed',note:'The trusted test transition needs review against the failure dossier.'};}
  else receipt.reproducer={status:'unknown',note:'No trusted reproducer selected; a baseline suite failure alone does not establish the reported fault.'};
  receipt.fullSuiteRequiredBeforeApply=verified.omitted.length>0;
 } catch(e){receipt.phase='failed';receipt.reason=e.message;}finally{receipt.updatedAt=new Date().toISOString();save();}
 return {receipt,artifactDir:dir,checkout};
}
