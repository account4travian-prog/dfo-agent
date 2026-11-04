import {sourceIdentity} from '../mind/revision.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const hash=b=>createHash('sha256').update(b).digest('hex');
function run(command,args,cwd,timeout=180000){const env={...process.env};delete env.NODE_TEST_CONTEXT;return spawnSync(command,args,{cwd,env,encoding:'utf8',timeout,maxBuffer:8*1024*1024,windowsHide:true,shell:false});}
function ok(r,label){if(r.status!==0)throw Error(`${label}: ${(r.error?.message||r.stderr||'failed').slice(0,800)}`);return r.stdout;}
function fileHash(root,p){const f=path.join(root,...p.split('/'));if(!fs.existsSync(f))return null;const s=fs.lstatSync(f);if(!s.isFile()||s.isSymbolicLink())throw Error(`Non-regular file: ${p}`);return hash(fs.readFileSync(f));}
function fixedSuite(root){const dir=path.join(root,'test'),files=fs.readdirSync(dir).filter(x=>x.endsWith('.test.mjs')).sort();if(!files.length)throw Error('Acceptance suite is missing');if(files.includes('native-bridge.test.mjs')&&!fs.existsSync(path.join(root,'engine','src','agent','agentBridge.js')))throw Error('Full engine-backed acceptance suite unavailable');return run(process.execPath,['--test',...files.map(f=>path.join('test',f))],root);}
export function verifyStaged(root,stageDir){
 const dir=fs.realpathSync(stageDir),receipt=JSON.parse(fs.readFileSync(path.join(dir,'status.json'),'utf8')),patch=path.join(dir,'candidate.patch'),bytes=fs.readFileSync(patch);
 if(receipt.phase!=='staged'||hash(bytes)!==receipt.patchSha256||!Array.isArray(receipt.files)||!receipt.files.length)throw Error('Staged repair receipt or hash invalid');
 const checkout=fs.realpathSync(path.join(dir,'checkout'));if(!checkout.startsWith(dir+path.sep))throw Error('Candidate checkout is outside its stage');
 const changed=ok(run('git',['diff','--cached','--name-only','-z'],checkout),'candidate paths').split('\0').filter(Boolean).sort();
 if(JSON.stringify(changed)!==JSON.stringify(receipt.files.map(f=>f.path).sort()))throw Error('Candidate index does not match receipt paths');
 ok(run('git',['apply','--reverse','--check','--cached',patch],checkout),'candidate patch identity');
 for(const f of receipt.files)if(fileHash(checkout,f.path)!==f.sha256)throw Error(`Candidate source hash mismatch: ${f.path}`);
 if(ok(run('git',['rev-parse','HEAD'],root),'source revision').trim()!==receipt.beforeRevision.slice(0,40)||(receipt.beforeRevision.includes('+')&&sourceIdentity(root).effectiveRevision!==receipt.beforeRevision))throw Error('Source revision changed');
 for(const f of receipt.files){if(!/^((src|test|tools|vendor|docs)\/)[\w.\/-]+$/.test(f.path)||f.path.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Invalid candidate path');if(ok(run('git',['status','--porcelain=v1','--untracked-files=all','--',f.path],root),'source status').trim())throw Error(`Affected path has local changes: ${f.path}`);}
 ok(run('git',['apply','--check',patch],root),'patch check');return {dir,receipt,patch,bytes};
}
export function rollbackFiles(root,stage,original){
 for(const f of stage.receipt.files)if(fileHash(root,f.path)!==f.sha256)throw Error(`Candidate file changed after application: ${f.path}`);
 ok(run('git',['apply','--reverse','--check',stage.patch],root),'rollback check');ok(run('git',['apply','--reverse',stage.patch],root),'rollback');
 for(const f of original){if(f.sha256!==null&&fileHash(root,f.path)!==f.sha256){const target=path.join(root,...f.path.split('/')),bytes=fs.readFileSync(f.archive);if(hash(bytes)!==f.sha256)throw Error(`Original archive hash mismatch: ${f.path}`);const temp=`${target}.rollback-${randomUUID()}`;fs.writeFileSync(temp,bytes,{flag:'wx',mode:f.mode});fs.renameSync(temp,target);}if(fileHash(root,f.path)!==f.sha256)throw Error(`Rollback hash mismatch: ${f.path}`);}
 return {restored:true,files:original};
}
// Caller must hold/release the running session before invoking this function.
export function applyFilesAndTest(root,stageDir){
 const stage=verifyStaged(root,stageDir),archiveDir=path.join(stage.dir,'original-files');fs.mkdirSync(archiveDir,{recursive:false});
 const original=stage.receipt.files.map((f,i)=>{const target=path.join(root,...f.path.split('/')),sha256=fileHash(root,f.path);if(sha256===null)return {path:f.path,sha256:null};const bytes=fs.readFileSync(target),archive=path.join(archiveDir,String(i));fs.writeFileSync(archive,bytes,{flag:'wx'});return {path:f.path,sha256,archive,mode:fs.statSync(target).mode&0o777};});
 ok(run('git',['apply',stage.patch],root),'apply patch');
 try{
  for(const f of stage.receipt.files)if(fileHash(root,f.path)!==f.sha256)throw Error(`Applied candidate hash mismatch: ${f.path}`);
  const acceptance=fs.readdirSync(path.join(root,'test')).filter(f=>f.endsWith('.test.mjs')).sort().map(f=>({path:`test/${f}`,sha256:fileHash(root,`test/${f}`)}));
  if(sourceIdentity(root).effectiveRevision!==stage.receipt.candidateRevision)throw Error('Effective candidate source identity mismatch');
  const result=fixedSuite(root);for(const f of acceptance)if(fileHash(root,f.path)!==f.sha256)throw Error(`Acceptance test changed during execution: ${f.path}`);fs.writeFileSync(path.join(stage.dir,'preapply-full-test.log'),(result.stdout??'')+(result.stderr??''));
  if(result.status!==0)throw Error(`Full preapply test suite failed: ${result.error?.message??result.status}`);
  return {stage,original,tests:{code:result.status,log:path.join(stage.dir,'preapply-full-test.log')}};
 }catch(e){const rollback=rollbackFiles(root,stage,original);return {stage,original,error:e.message,rollback};}
}
