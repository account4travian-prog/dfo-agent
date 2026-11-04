import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createRepairProposal,createRepairQueue} from '../mind/repair.mjs';
import {git,tryGit} from './git.mjs';
import {checkBusy} from './selection.mjs';
import {parseBuildTag} from './meta.mjs';

const iso=()=>new Date().toISOString();
function atomic(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=`${file}.${randomUUID()}.tmp`;fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n',{flag:'wx'});fs.renameSync(tmp,file);}
function readJson(file){try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}}
function portOpen(port,host='127.0.0.1',timeout=700){return new Promise(resolve=>{const socket=net.createConnection({port,host});const done=value=>{socket.destroy();resolve(value);};socket.setTimeout(timeout,()=>done(false));socket.once('connect',()=>done(true));socket.once('error',()=>done(false));});}
export async function liveTag({fetchImpl=fetch,url=process.env.DFO_LIVE_SITE_URL??'https://daggerfalljs.dev/'}={}) {
 const response=await fetchImpl(url,{cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error(`Live build-tag request failed: HTTP ${response.status}`);
 const tag=parseBuildTag(await response.text());
 if(!tag)throw Error('Live response did not contain a build-tag meta element');
 return {tag,url};
}
function resolveTarget(engine,liveTag,upstreamMain) {
 if(!liveTag)return {target:upstreamMain,reason:'no-live-build-tag-fallback-to-upstream-main'};
 const verified=tryGit(engine,['rev-parse','--verify',`${liveTag}^{commit}`]);
 if(!verified.ok)return {target:upstreamMain,reason:'live-build-sha-unknown-fallback-to-upstream-main'};
 const sha=verified.stdout;
 const ancestor=tryGit(engine,['merge-base','--is-ancestor',sha,'upstream/main']);
 if(!ancestor.ok)return {target:upstreamMain,reason:'live-build-sha-not-in-upstream-main-fallback-to-upstream-main'};
 return {target:sha,reason:'live-build-sha-match'};
}
function writeRepair({data,root,dossier,oldRevision,target,error}){
 const sourceRevision=tryGit(root,['rev-parse','HEAD']).stdout||'unknown';
 const proposal=createRepairProposal({proposalId:`upstream-sync-${Date.now()}`,sourceRevision,failurePacketRefs:[dossier],engineering:{diagnosis:`Upstream engine candidate ${target} failed validation from ${oldRevision}: ${String(error).slice(0,1500)}`,affectedPaths:['src/native-bridge.mjs','vendor/native-agent/manifest.json'],changeClass:'bridge',reproducer:'Review the upstream-sync failure dossier and reproduce the isolated candidate validation failure.',intendedChange:'Repair the host seam or native bridge compatibility for the selected upstream engine revision.',verificationCriteria:['ensureNativePort completes on the candidate','node --test test/*.test.mjs passes against the candidate engine'],budget:'One bounded bridge compatibility repair proposal.',risk:'Engine update may change host seams or runtime behavior.',rollback:'Keep the previous engine checkout and pin; restore them if candidate validation fails.'}});
 const queue=createRepairQueue({dir:path.join(data,'repair-queue')});return queue.enqueue(proposal);
}
function run(executable,args,{cwd,timeout=120000,env=process.env,shell=false}={}){const r=spawnSync(executable,args,{cwd,timeout,encoding:'utf8',maxBuffer:24*1024*1024,windowsHide:true,shell,env});return {code:r.status,signal:r.signal,error:r.error?.message??null,stdout:r.stdout??'',stderr:r.stderr??''};}
function pidAlive(pid){try{process.kill(pid,0);return true;}catch(error){return error.code==='EPERM';}}
async function isBusy(data){return checkBusy({readStatus:async name=>readJson(path.join(data,name==='session'?'session-status.json':'browser-status.json')),isListening:portOpen,isAlive:pidAlive});}
function stagedPinChanges(root){return !tryGit(root,['diff','--cached','--quiet','--','engine-pin.json']).ok;}
function trimRetention(entries,keep=2){const retained=entries.sort((a,b)=>b.retainedAt.localeCompare(a.retainedAt));for(const entry of retained.slice(keep)){if(entry.path&&fs.existsSync(entry.path))fs.rmSync(entry.path,{recursive:true,force:true});}return retained.slice(0,keep);}
export async function runSync({busyCheck,root,engine=path.join(root,'engine'),clone=path.resolve(root,'..','upstream','daggerfall-js-source'),data=path.join(root,'data'),fetchImpl=fetch,fetchRefs=({clone,engine})=>{git(clone,['fetch','--prune','upstream'],{timeout:300000});git(engine,['fetch',clone,'+refs/remotes/upstream/main:refs/remotes/upstream/main'],{timeout:300000});},execute=false,commit=false,ensurePort,tests=({cwd=root,env=process.env,timeout=600000}={})=>run(process.execPath,['--test',...fs.readdirSync(path.join(root,'test')).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>path.join('test',name))],{cwd,env,timeout}),now=()=>new Date()}={}){
 fs.mkdirSync(path.join(data,'upstream-sync'),{recursive:true});const receipts=path.join(data,'upstream-sync');const stamp=now().toISOString().replace(/[:.]/g,'-');const receiptFile=path.join(receipts,`${stamp}-${randomUUID().slice(0,8)}.json`);const pinFile=path.join(root,'engine-pin.json');const stateFile=path.join(receipts,'state.json');
 const receipt={schemaVersion:'dfo-upstream-sync.v1',startedAt:now().toISOString(),mode:execute?'execute':'dry-run',status:'started',steps:[]};
 const save=()=>atomic(receiptFile,receipt);const step=(name,result)=>{receipt.steps.push({name,...result,at:now().toISOString()});save();};
 let candidate=null;
 try{
  const busy=await (busyCheck??(()=>isBusy(data)))();step('busy-check',busy);if(busy.busy){receipt.status='busy';receipt.exitCode=3;return saveResult();}
  if(commit&&stagedPinChanges(root))throw Error('Refusing --commit: engine-pin.json already has staged changes');
  const pin=readJson(pinFile);const oldRevision=pin?.commit??git(engine,['rev-parse','HEAD']);receipt.previousRevision=oldRevision;
  const remote=git(engine,['remote','get-url','origin']);const cloneUpstream=git(clone,['remote','get-url','upstream']);receipt.remotes={engineOrigin:remote,cloneUpstream};
  if(!/^https:\/\/github\.com\/Lattymoy\/daggerfall-js-source(?:\.git)?$/i.test(cloneUpstream))throw Error(`Unexpected upstream remote: ${cloneUpstream}`);
  // Fetching moves only refs, never the engine's files, so a dry run fetches too and plans against current upstream.
  await fetchRefs({clone,engine});
  step('fetch',{engineOrigin:remote,upstream:cloneUpstream,executed:execute});
  let live=null,liveError=null;try{live=await liveTag({fetchImpl});}catch(error){liveError=error.message;}
  const main=git(engine,['rev-parse','upstream/main']);const selected=resolveTarget(engine,live?.tag,main);receipt.liveBuildTag=live?.tag??null;receipt.liveTagUrl=live?.url??(process.env.DFO_LIVE_SITE_URL??'https://daggerfalljs.dev/');if(liveError)receipt.liveTagError=liveError;receipt.targetRevision=selected.target;receipt.targetReason=selected.reason;step('target',selected);
  if(selected.target===oldRevision){receipt.status='no-op';return saveResult();}
  const behind=tryGit(engine,['merge-base','--is-ancestor',selected.target,oldRevision]);if(behind.ok){receipt.status='no-op-behind';receipt.targetReason='target-is-ancestor-of-current-pin';return saveResult();}
  if(!execute){receipt.status='planned';receipt.candidatePath=path.join(receipts,'candidates',selected.target);return saveResult();}
  candidate=path.join(receipts,'candidates',`${stamp}-${selected.target.slice(0,12)}`);const previous=path.join(receipts,'previous',`${stamp}-${oldRevision.slice(0,12)}`);fs.mkdirSync(path.dirname(candidate),{recursive:true});fs.mkdirSync(path.dirname(previous),{recursive:true});
  git(engine,['clone','--no-hardlinks',engine,candidate],{timeout:300000});git(candidate,['checkout','--detach',selected.target]);git(candidate,['remote','set-url','origin',clone]);
  const candidateLock=path.join(candidate,'package-lock.json'),currentLock=path.join(engine,'package-lock.json');let separateDependencies=false;
  if(fs.existsSync(candidateLock)&&(!fs.existsSync(currentLock)||!fs.readFileSync(candidateLock).equals(fs.readFileSync(currentLock)))){const install=run(process.platform==='win32'?'npm.cmd':'npm',['ci','--ignore-scripts'],{cwd:candidate,timeout:600000,shell:process.platform==='win32'});if(install.code!==0)throw Error(`Candidate dependency installation failed: ${install.stderr||install.error}`);separateDependencies=true;}
  else {const sharedDependencies=path.join(clone,'node_modules');if(!fs.existsSync(sharedDependencies))throw Error('Matching lockfile but shared clone node_modules junction is unavailable');fs.symlinkSync(sharedDependencies,path.join(candidate,'node_modules'),'junction');}
  const port=ensurePort??(await import('../native-bridge.mjs')).ensureNativePort;await port({engine:candidate,engineCommit:selected.target});
  const result=await tests({cwd:root,env:{...process.env,DFO_ENGINE_PATH:candidate,DFO_ENGINE_COMMIT:selected.target},timeout:600000});receipt.tests={code:result.code,signal:result.signal,error:result.error,stdout:result.stdout,stderr:result.stderr};receipt.separateDependencies=separateDependencies;
  if(result.code!==0)throw Error(`Candidate test suite failed with exit ${result.code}`);
  fs.renameSync(engine,previous);try{fs.renameSync(candidate,engine);candidate=null;atomic(pinFile,{commit:selected.target,previousCommit:oldRevision,liveBuildTag:live?.tag??null,updatedAt:now().toISOString()});}catch(error){if(fs.existsSync(engine))fs.renameSync(engine,candidate??path.join(receipts,'failed-candidate'));fs.renameSync(previous,engine);throw error;}
  const state=readJson(stateFile)??{previousEngines:[]};state.previousEngines=[...(state.previousEngines??[]),{path:previous,commit:oldRevision,retainedAt:now().toISOString()}];state.previousEngines=trimRetention(state.previousEngines);state.previousPin={commit:oldRevision,previousCommit:pin?.previousCommit??null,liveBuildTag:pin?.liveBuildTag??null,updatedAt:pin?.updatedAt??null};atomic(stateFile,state);
  receipt.previousEnginePath=previous;receipt.status='swapped';step('swap',{previousRevision:oldRevision,targetRevision:selected.target});
  if(commit){if(stagedPinChanges(root))throw Error('Refusing --commit: engine-pin.json has staged changes');git(root,['add','--','engine-pin.json']);git(root,['commit','--only','-m',`Sync engine ${oldRevision.slice(0,12)} to ${selected.target.slice(0,12)} (live ${live?.tag??'unknown'})`,'--','engine-pin.json']);receipt.pinCommit=git(root,['rev-parse','HEAD']);}
  return saveResult();
 }catch(error){receipt.status='failed';receipt.error=error.message;if(candidate&&fs.existsSync(candidate))fs.rmSync(candidate,{recursive:true,force:true});receipt.failureDossier=path.join(receipts,stamp,'failure.json');atomic(receipt.failureDossier,{schemaVersion:'dfo-upstream-sync-failure.v1',at:now().toISOString(),error:error.message,validation:{tests:receipt.tests??null,ensurePort:receipt.tests?{status:'passed'}:{status:error.message.includes('test suite')?'passed':'failed',error:error.message}},receipt});try{receipt.repairProposal=writeRepair({data,root,dossier:receipt.failureDossier,oldRevision:receipt.previousRevision??'unknown',target:receipt.targetRevision??'unknown',error:error.message});}catch(queueError){receipt.repairQueueError=queueError.message;}return saveResult();}
 function saveResult(){receipt.finishedAt=now().toISOString();save();return {receipt,receiptFile,exitCode:receipt.exitCode??(receipt.status==='failed'?1:0)};}
}

export async function rollbackSync({busyCheck,root,engine=path.join(root,'engine'),data=path.join(root,'data'),pinFile=path.join(root,'engine-pin.json')}={}){
 const busy=await (busyCheck??(()=>isBusy(data)))();if(busy.busy)throw Error(`Cannot roll back while busy: ${busy.reasons.join(', ')}`);
 const stateFile=path.join(data,'upstream-sync','state.json'),state=readJson(stateFile),pin=readJson(pinFile);const retained=state?.previousEngines?.at(-1);
 if(!retained?.path||!fs.existsSync(retained.path))throw Error('No retained previous engine is available');
 const displaced=path.join(data,'upstream-sync','previous',`${Date.now()}-${pin.commit}`);fs.mkdirSync(path.dirname(displaced),{recursive:true});fs.renameSync(engine,displaced);try{fs.renameSync(retained.path,engine);}catch(error){fs.renameSync(displaced,engine);throw error;}
 const previousPin=state.previousPin??{commit:retained.commit,previousCommit:null,liveBuildTag:null,updatedAt:null};atomic(pinFile,previousPin);state.previousEngines=state.previousEngines.filter(row=>row!==retained);state.previousEngines.push({path:displaced,commit:pin.commit,retainedAt:iso()});state.previousPin={commit:pin.commit,previousCommit:pin.previousCommit??null,liveBuildTag:pin.liveBuildTag??null,updatedAt:pin.updatedAt??null};state.previousEngines=trimRetention(state.previousEngines);atomic(stateFile,state);return {commit:previousPin.commit,displaced};
}
