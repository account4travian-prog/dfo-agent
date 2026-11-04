import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ROOT,DATA,CONTROL_URL,ENGINE_COMMIT} from './config.mjs';
import {createLogger} from './log.mjs';
import {createMemory} from './memory.mjs';
import {askModel} from './models.mjs';
import {searchHandbook} from './handbook.mjs';
import {PILOT_SCHEMA,NATIVE_PILOT_SCHEMA,PLANNER_SCHEMA,normalizeAction,normalizeNativeDecision} from './protocol.mjs';
import {PILOT,rolePrompt,PLANNER} from './brain.mjs';
import {sessionMode,initialGoal,buildModeReport} from './mode.mjs';
import {renameWithRetry} from './atomic.mjs';
import {loadMindConfig} from './mind/config.mjs';
import {runMindRuntime} from './mind/runtime.mjs';
import {collectRevision,sourceIdentity} from './mind/revision.mjs';
import {createPacketStore} from './mind/packets.mjs';
import {createRepairQueue} from './mind/repair.mjs';
import {mayResumeRepair} from './repair/resume-policy.mjs';
import {buildPreflightPlan} from './mind/preflight.mjs';
const mode=sessionMode();
const modeLogger=directory=>{const log=createLogger(directory);return {...log,event:(kind,data={})=>log.event(kind,{...data,mode})};};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const settleWithin=(promise,ms)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>resolve(false),ms);promise.then(()=>{clearTimeout(timer);resolve(true);},e=>{clearTimeout(timer);reject(e);});});
const value=(flag,def)=>{const i=process.argv.indexOf(`--${flag}`);return i<0?def:process.argv[i+1];};
const read=(f,def=null)=>{try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch{return def;}};
const atomic=(f,v)=>{const t=f+'.tmp';fs.writeFileSync(t,JSON.stringify(v,null,2));renameWithRetry(t,f);};
export function movementAction(action){return action.kind==='hold'||action.kind==='look'||(action.kind==='key'&&action.keys?.some(k=>/^(?:w|a|s|d|arrowup|arrowdown|arrowleft|arrowright)$/i.test(k)));}
export function cycleMatches(history,observation,action){
  const movement=movementAction(action)||!(observation.text??'').trim(),visual=observation.visualFingerprint;
  if(movement&&typeof visual!=='string')return 0;
  return history.slice(-8).filter(x=>!x.blocked&&x.fingerprint===observation.fingerprint&&JSON.stringify(x.action)===JSON.stringify(action)&&(!movement||(typeof x.visualFingerprint==='string'&&x.visualFingerprint===visual))).length;
}
export function addUsage(total,usage){for(const k of ['input_tokens','cached_input_tokens','output_tokens'])if(Number.isFinite(usage?.[k])&&usage[k]>=0)total[k]=(total[k]??0)+usage[k];return total;}
async function http(route,body){const r=await fetch(CONTROL_URL+route,{method:body===undefined?'GET':'POST',...(body!==undefined&&{headers:{'content-type':'application/json'},body:JSON.stringify(body)}),signal:AbortSignal.timeout(18000)});const v=await r.json();if(!r.ok)throw Object.assign(Error(v.error??`HTTP ${r.status}`),{status:r.status});return v;}
const statusFile=path.join(DATA,'session-status.json'),commandFile=path.join(DATA,'command.json');
// Polling is local: this routine never invokes a model.
export async function runNativeIntent({request, intent, generation, frame, observedTarget=false, aborted=()=>false, onProgress=()=>{}, sleep=wait}) {
  await request('/intent',{intent,generation,frame,observedTarget});
  while(!aborted()) {
    const result=await request('/intent');
    onProgress(result);
    if(result.task?.status==='terminal')return result.task;
    if(!result.task)throw Error('Native task disappeared');
    await sleep(250);
  }
  await request('/intent/cancel',{reason:'worker stopped'});
  return {status:'terminal',outcome:'cancelled',reason:'worker stopped'};
}
async function workerLegacy(){
  const control=process.env.DFO_CONTROL||'native';
  const run=process.env.DFO_RUN_DIR,deadline=Number(process.env.DFO_DEADLINE),epoch=Number(process.env.DFO_EPOCH);
  const log=modeLogger(path.join(run,`epoch-${epoch}`)),memory=createMemory(path.join(DATA,'memory',mode));
  let aborted=false,reason='deadline',calls=0,errors=0,turn=0,plan='Explore and establish yourself through ordinary play.',lastPlan=0,planning=null,book=[],lastOutcome=null,lastFingerprint=null,lastVisualFingerprint=null,repeated=0,lastAction=null,lastChange=Date.now(),lastVisualChange=Date.now(),cycleBlocks=0,pendingObservation=null,nativeFailures=0,lastNativeProgressAt=0;
  const recentDecisions=[];
  const priorStatus=read(statusFile);
  let continuation=read(path.join(run,'continuation.json'));
  if(!continuation&&priorStatus?.run===run&&epoch>1){
    const previousTrace=path.join(run,`epoch-${epoch-1}`,'trace.jsonl');
    const notes=fs.existsSync(previousTrace)?fs.readFileSync(previousTrace,'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(e=>e?.kind==='model-response'&&e.role==='terra').slice(-6).map(e=>({note:e.json?.note})):[];
    continuation={plan:priorStatus.plan,lastDecisions:notes};
  }
  if(continuation?.plan){plan=continuation.plan;lastPlan=Date.now();}
  const cumulativeTokenUsage={input_tokens:0,cached_input_tokens:0,output_tokens:0},modelCallCounts={terra:0,sol:0};
  for(let n=1;n<epoch;n++){
    const file=path.join(run,`epoch-${n}`,'trace.jsonl');if(!fs.existsSync(file))continue;
    const raw=fs.readFileSync(file,'utf8'),end=raw.lastIndexOf('\n');if(end<0)continue;
    for(const line of raw.slice(0,end).split('\n')){if(!line)continue;const e=JSON.parse(line);if(e.kind==='model-request'&&Object.hasOwn(modelCallCounts,e.role))modelCallCounts[e.role]++;if(e.kind==='model-response')addUsage(cumulativeTokenUsage,e.usage);}
  }
  const abort=new AbortController();let commandAt=Number(process.env.DFO_COMMAND_AT??0);
  const archive=path.join(run,`epoch-${epoch}`,'source');fs.mkdirSync(archive,{recursive:true});
  const revision=collectRevision({root:ROOT,dirs:['src','test','vendor','tools'],revisionDir:archive,copy:true});
  const hashes=Object.fromEntries(revision.files.map(file=>[file.path,file.sha256]));
  const previous=epoch>1?read(path.join(run,`epoch-${epoch-1}`,'source','manifest.json')):null;
  const previousHashes=previous?.hashes??Object.fromEntries((previous?.files??[]).map(file=>[file.path,file.sha256]));
  const changedFiles=Object.keys({...previousHashes,...hashes}).filter(file=>previousHashes[file]!==hashes[file]).sort();
  log.event('epoch-start',{epoch,deadline,hashes,sourceArchive:archive,previousSourceArchive:previous?path.join(run,`epoch-${epoch-1}`,'source'):null,changedFiles,engineCommit:ENGINE_COMMIT,phase:process.env.DFO_PHASE,hotSwap:revision.classes});log.flush();
  const stop=why=>{if(aborted)return;aborted=true;reason=why;abort.abort();};
  const timer=setInterval(()=>{
    const cmd=read(commandFile);if(cmd&&cmd.at>commandAt&&['hold','stop'].includes(cmd.command)){commandAt=cmd.at;stop(cmd.command);}
    if(Date.now()>=deadline)stop('deadline');
  },200);
  process.on('SIGINT',()=>stop('signal'));process.on('SIGTERM',()=>stop('signal'));
  let statusFields={};
  const save=(state={})=>{statusFields={...statusFields,...state};atomic(statusFile,{run,mode,phase:process.env.DFO_PHASE,epoch,state:aborted?'ending':'playing',at:new Date().toISOString(),deadline:new Date(deadline).toISOString(),calls,turn,cumulativeTokenUsage,modelCallCounts,goal:memory.snapshot().goal,plan,...statusFields});};
  function remember(text,o,source='pilot'){if(text?.trim()){const m=memory.remember({text:text.slice(0,4000),kind:'uncertain',source,evidence:`${run}, epoch ${epoch}, observation ${o.id}`});log.event('memory-change',{memory:m});}}
  function localBook(query){if(!query?.trim())return;book=searchHandbook(query,{limit:3,maxChars:6500});log.event('handbook',{query,results:book});}
  const briefMemory=e=>({kind:e.kind,text:e.text.slice(0,700),source:e.source,confidence:e.confidence,evidence:e.evidence?.slice(0,180)});
  const context=o=>{const goal=memory.snapshot().goal,compact=d=>({note:d.note,action:d.action,result:d.result,blocked:d.blocked,subsequentObservation:d.subsequentObservation});const common={mode,bindings:o.bindings,persona:memory.persona,goal,plan,handbook:book,lastOutcome,previousEpoch:continuation?{plan:continuation.plan,lastDecisions:continuation.lastDecisions,note:'Continue this work using the fresh observation; past control IDs are historical, not current targets.'}:undefined,
    observation:{id:o.id,generation:o.generation,title:o.title,viewport:o.viewport,pointerLocked:o.pointerLocked,ownVitals:o.ownVitals,
      text:o.text.slice(-9000),controls:o.controls.map(c=>({id:c.id,tag:c.tag,text:c.text,type:c.type,value:c.value,disabled:c.disabled,x:c.x,y:c.y})),
      legacyWindow:o.legacyWindow?{window:o.legacyWindow.window,hud:o.legacyWindow.hud,plaque:o.legacyWindow.plaque}:undefined}};
    const next=JSON.stringify({...common,memory:memory.context(goal??'',8).map(briefMemory),recentDecisions:recentDecisions.slice(-6).map(compact)});
    const prior=JSON.stringify({...common,memory:memory.context(goal??'',10).map(briefMemory),recentMemory:memory.context('',4).map(briefMemory),recentDecisions:recentDecisions.slice(-8).map(compact)});
    log.event('context-size',{previousBytes:Buffer.byteLength(prior),currentBytes:Buffer.byteLength(next),savedBytes:Buffer.byteLength(prior)-Buffer.byteLength(next),note:'Context bytes, not measured token savings.'});return next;};
  function requestPlan(o,why,critical=false){
    if(planning||(!critical&&Date.now()-lastPlan<45000)||aborted)return;
    lastPlan=Date.now();const prompt=PLANNER+'\nReason: '+why+'\n'+context(o);calls++;modelCallCounts.sol++;log.event('model-request',{role:'sol',model:'gpt-6.1-sol',observationId:o.id,prompt});
    planning=askModel({model:'gpt-6.1-sol',effort:'medium',prompt,images:[o.screen],schema:PLANNER_SCHEMA,signal:abort.signal,timeoutMs:45000}).then(r=>{
      if(aborted)return;log.event('model-response',{role:'sol',...r});addUsage(cumulativeTokenUsage,r.usage);
      plan=r.json.plan;memory.setGoal(r.json.goal.slice(0,2000));remember(r.json.memory,o,'sol');localBook(r.json.handbookQuery);
    }).catch(e=>{if(!aborted){log.event('planner-error',{error:e.message,code:e.code});if(e.code==='USAGE_LIMIT')stop('usage-limit');}}).finally(()=>{planning=null;});
  }
  try{
    if(!memory.snapshot().goal)memory.setGoal(initialGoal(mode));
    localBook('Privateers Hold first dungeon way out torch combat');
    while(!aborted){
      let o;
      try{o=await http('/observe');}catch(e){if(e.status===409){log.event('observation-retry',{error:e.message});await wait(500);continue;}throw e;}
      if(aborted)break;
      log.event('observation',{...o,epoch});
      if(pendingObservation){
        const healthBefore=pendingObservation.health,healthAfter=o.ownVitals?.health;const healthDelta=Number.isFinite(healthBefore)&&Number.isFinite(healthAfter)?healthAfter-healthBefore:null;
        const evidence={actionId:pendingObservation.actionId,priorObservationId:pendingObservation.id,observationId:o.id,domFingerprintChanged:o.fingerprint!==pendingObservation.fingerprint,visualFingerprintChanged:typeof o.visualFingerprint==='string'&&typeof pendingObservation.visualFingerprint==='string'?o.visualFingerprint!==pendingObservation.visualFingerprint:null,visualChange:o.visualChange??null,healthBefore:Number.isFinite(healthBefore)?healthBefore:null,healthAfter:Number.isFinite(healthAfter)?healthAfter:null,healthDelta,note:'Observed changes are imperfect evidence; they do not establish action success, cause, or distance.'};
        log.event('action-observation',evidence);lastOutcome={...lastOutcome,subsequentObservation:evidence};
        const prior=recentDecisions.findLast(x=>x.actionId===pendingObservation.actionId);if(prior)prior.subsequentObservation=evidence;
        pendingObservation=null;
      }
      if(o.fingerprint!==lastFingerprint){lastChange=Date.now();lastFingerprint=o.fingerprint;}
      if(typeof o.visualFingerprint==='string'&&o.visualFingerprint!==lastVisualFingerprint){lastVisualChange=Date.now();lastVisualFingerprint=o.visualFingerprint;}
      if(!lastPlan)requestPlan(o,'Initial strategy');else if(control==='browser'&&Date.now()-Math.max(lastChange,lastVisualChange)>120000&&Date.now()-lastPlan>120000)requestPlan(o,'No observable screen change for over two minutes; reassess.');
      let native=null;
      if(control==='native') { native=await http('/native'); if(aborted)break; }
      if(control==='native' && (native?.state?.loading || (!native?.ready && /\bloading\b/i.test(o.text) && !o.controls.some(c=>!c.disabled&&c.tag!=='canvas')))) {log.event('native-loading-wait',{});await wait(1000);continue;}
      const nativeTargets=Array.isArray(native?.targets)?native.targets:[];
      const nativeContext=native?JSON.stringify({ready:native.ready,reason:native.reason,generation:native.generation,state:native.state,window:native.window,events:native.events?.lines?.slice(-8),targets:nativeTargets}):'';
      const prompt=control==='native'?rolePrompt('native',mode,o.bindings)+'\nNative observation: '+nativeContext+'\n'+context(o):PILOT+'\nWhen the visible route is clear and it is safe, prefer a guarded 6–12 second hold for sustained movement over many tiny holds. Use a single look turn when appropriate. Stop or choose shorter actions near hazards; observed change is not proof of progress.\n'+context(o);calls++;modelCallCounts.terra++;turn++;
      log.event('model-request',{role:'terra',model:'gpt-6.1-terra',observationId:o.id,prompt});log.flush();save();
      let r;
      try{r=await askModel({model:'gpt-6.1-terra',effort:'low',prompt,images:[o.screen],schema:control==='native'?NATIVE_PILOT_SCHEMA:PILOT_SCHEMA,timeoutMs:45000,signal:abort.signal});errors=0;}
      catch(e){if(aborted)break;log.event('pilot-error',{error:e.message,code:e.code});if(e.code==='USAGE_LIMIT'){stop('usage-limit');break;}if(++errors>=3){stop('three model failures');break;}await wait(700);continue;}
      log.event('model-response',{role:'terra',...r});
      addUsage(cumulativeTokenUsage,r.usage);if(aborted)break;
      const d=r.json;remember(d.memory,o);localBook(d.handbookQuery);
      if(d.goal?.trim()&&!planning)memory.setGoal(d.goal.slice(0,2000));
      let chosen;
      try{chosen=control==='native'?normalizeNativeDecision(d,nativeTargets):{action:normalizeAction(d.action)};}
      catch(e){log.event('pilot-error',{error:e.message});lastOutcome={error:e.message};continue;}
      if(chosen.intent){
        if(!native?.ready){lastOutcome={error:native?.reason||'Native bridge unavailable; use UI actions only until world is ready'};log.event('intent-error',lastOutcome);continue;}
        if(d.escalate)requestPlan(o,d.note,true);
        log.event('intent-start',{intent:chosen.intent,generation:native.generation,frame:native.state?.frame});log.flush();
        try{lastOutcome=await runNativeIntent({request:http,intent:chosen.intent,generation:native.generation,frame:native.state?.frame,observedTarget:chosen.observedTarget,aborted:()=>aborted,onProgress:r=>{
          const due=r.task?.status==='terminal'||Date.now()-lastNativeProgressAt>=2000;
          if(r.events?.length||due)log.event('intent-progress',r);
          if(due){lastNativeProgressAt=Date.now();save({lastNote:d.note,lastAction:chosen.intent,lastOutcome:r.task});}
        }});}
        catch(e){lastOutcome={status:'terminal',outcome:'failed',reason:e.message};log.event('intent-error',{error:e.message});}
        log.event('intent-outcome',{task:lastOutcome});
        if(lastOutcome.cleanupPending){stop('repair-needed: physical input cleanup unverified');break;}
        if(['failed','blocked','expired'].includes(lastOutcome.outcome)){nativeFailures++;if(nativeFailures>=2){requestPlan(o,'Repeated native routine failure: '+(lastOutcome.reason||lastOutcome.outcome),true);nativeFailures=0;}}else if(lastOutcome.outcome==='completed')nativeFailures=0;
        recentDecisions.push({note:d.note,action:chosen.intent,result:lastOutcome});if(recentDecisions.length>12)recentDecisions.shift();
        memory.checkpoint();save({lastNote:d.note,lastAction:chosen.intent,lastOutcome});
        atomic(path.join(run,'continuation.json'),{mode,epoch,plan,lastDecisions:recentDecisions.slice(-6)});
        continue;
      }
      const action=chosen.action,sig=JSON.stringify(action);repeated=sig===lastAction?repeated+1:0;lastAction=sig;
      const priorMatches=cycleMatches(recentDecisions,o,action);
      if(priorMatches>=2){
        cycleBlocks++;
        const warning='Do not repeat this failed cycle: the same action at this screen has already been dispatched twice in the recent history. Reassess the goal, screen and alternatives.';
        log.event('cycle-block',{observationId:o.id,action,priorMatches,warning});
        recentDecisions.push({note:d.note,action,observationTextExcerpt:o.text.slice(-1500),fingerprint:o.fingerprint,visualFingerprint:o.visualFingerprint??null,result:{blocked:warning},blocked:true});if(recentDecisions.length>12)recentDecisions.shift();
        if(planning)await planning;
        if(!aborted){requestPlan(o,warning,true);if(planning)await planning;}
        if(cycleBlocks>=3){stop('repair-needed: recurring action cycle');break;}
        continue;
      }
      if(d.escalate)requestPlan(o,d.note,true);
      if(repeated>=8&&Date.now()-lastChange>30000&&(!movementAction(action)||(typeof o.visualFingerprint==='string'&&Date.now()-lastVisualChange>30000))){log.event('watcher-hold',{reason:'Repeated action with unchanged observed screen',action,note:'Visual fingerprints are imperfect evidence.'});stop('repair-needed');break;}
      log.event('action-intent',{observationId:o.id,generation:o.generation,action,note:d.note});log.flush();
      const actionId=`${epoch}-${turn}`;
      try{lastOutcome=await http('/action',{observationId:o.id,generation:o.generation,actionId,action});}
      catch(e){lastOutcome={error:e.message};log.event('action-error',lastOutcome);if(/timeout|aborted due/i.test(e.message)){await http('/stop',{});log.event('timed-action-cancelled',{reason:e.message});stop('repair-needed: timed action cancelled; controller held');break;}requestPlan(o,e.message);}
      log.event('action-result',{...lastOutcome,note:'Dispatch receipt only; next observation supplies outcome evidence'});
      recentDecisions.push({actionId,note:d.note,action,observationTextExcerpt:o.text.slice(-1500),fingerprint:o.fingerprint,visualFingerprint:o.visualFingerprint??null,result:lastOutcome});if(recentDecisions.length>12)recentDecisions.shift();
      pendingObservation={actionId,id:o.id,fingerprint:o.fingerprint,visualFingerprint:o.visualFingerprint,health:o.ownVitals?.health};
      cycleBlocks=0;
      console.log(JSON.stringify({at:new Date().toISOString(),turn,role:'terra',note:d.note,action,result:lastOutcome}));
      memory.checkpoint();save({lastNote:d.note,lastAction:action,lastOutcome});
      atomic(path.join(run,'continuation.json'),{mode,epoch,plan,lastDecisions:recentDecisions.slice(-6).map(x=>({note:x.note,action:x.action,result:x.result,subsequentObservation:x.subsequentObservation}))});
    }
  }catch(e){reason='fatal: '+e.message;try{log.event('fatal',{error:e.stack});}catch{};console.error(e.stack);}
  finally{
    aborted=true;abort.abort();clearInterval(timer);
    const cleanupErrors=[];
    const cleanupError=(step,e)=>{const message=`${step}: ${e?.message??e}`;cleanupErrors.push(message);console.error(message);try{log.event('cleanup-error',{step,error:String(e?.message??e)});}catch{}};
    if(planning) await settleWithin(planning,2000);
    try{await http('/stop',{});}catch(e){cleanupError('browser stop',e);}
    if(reason!=='hold'){try{const pause=await http('/pause',{});log.event('game-pause',pause);if(!pause.paused)cleanupError('game pause',pause.reason??'No visible Resume control');}catch(e){cleanupError('game pause',e);}}
    try{memory.checkpoint();}catch(e){cleanupError('memory checkpoint',e);}
    try{memory.close();}catch(e){cleanupError('memory close',e);}
    if(cleanupErrors.length)reason=`cleanup failure (${reason})`;
    try{save({state:reason==='deadline'?'deadline-reached':'held',reason,cleanupErrors});}catch(e){cleanupError('status save',e);reason='cleanup failure (status save)';}
    try{log.event('epoch-end',{reason,calls,turn,cleanupErrors});}catch(e){console.error('epoch-end logging:',e.message);reason='cleanup failure (epoch-end log)';}
    try{log.close();}catch(e){console.error('log close:',e.message);reason='cleanup failure (log close)';}
  }
  process.exitCode=reason==='deadline'?0:75;
}
async function workerMind(){
  const run=process.env.DFO_RUN_DIR,deadline=Number(process.env.DFO_DEADLINE),epoch=Number(process.env.DFO_EPOCH);
  const log=modeLogger(path.join(run,`epoch-${epoch}`)),memory=createMemory(path.join(DATA,'memory',mode));
  let aborted=false,reason='deadline',lastSummary=null,lastPause=null,calls=0,turn=0,planText='';
  const cumulativeTokenUsage={input_tokens:0,cached_input_tokens:0,output_tokens:0},modelCallCounts={luna:0,terra:0,sol:0};
  const abort=new AbortController();let commandAt=Number(process.env.DFO_COMMAND_AT??0);
  const stop=why=>{if(aborted)return;aborted=true;reason=why;abort.abort();};
  const timer=setInterval(()=>{
    const cmd=read(commandFile);if(cmd&&cmd.at>commandAt&&['hold','stop'].includes(cmd.command)){commandAt=cmd.at;stop(cmd.command);}
    if(Date.now()>=deadline)stop('deadline');
  },200);
  process.on('SIGINT',()=>stop('signal'));process.on('SIGTERM',()=>stop('signal'));
  const archive=path.join(run,`epoch-${epoch}`,'source');fs.mkdirSync(archive,{recursive:true});
  let revision=null,revisionError=null;
  try{revision=collectRevision({root:ROOT,dirs:['src','test','vendor','tools'],revisionDir:archive,copy:true});}
  catch(error){revisionError=error.message;log.event('revision-error',{error:revisionError});}
  const hashes=revision?Object.fromEntries(revision.files.map(file=>[file.path,file.sha256])):{};
  const previous=epoch>1?read(path.join(run,`epoch-${epoch-1}`,'source','manifest.json')):null;
  const previousHashes=previous?.hashes??Object.fromEntries((previous?.files??[]).map(file=>[file.path,file.sha256]));
  const changedFiles=Object.keys({...previousHashes,...hashes}).filter(file=>previousHashes[file]!==hashes[file]).sort();
  log.event('epoch-start',{epoch,deadline,hashes,sourceArchive:archive,previousSourceArchive:previous?path.join(run,`epoch-${epoch-1}`,'source'):null,changedFiles,engineCommit:ENGINE_COMMIT,phase:process.env.DFO_PHASE,hotSwap:revision?.classes??null,revisionError});log.flush();
  let packetStore=null,repairQueue=null,packetError=null,repairError=null,repairStatusSeen=null;
  try{packetStore=createPacketStore({dir:path.join(run,'packets')});}catch(error){packetError=error.message;log.event('packet-store-error',{error:packetError});}
  try{repairQueue=createRepairQueue({dir:path.join(run,'repair-proposals')});}catch(error){repairError=error.message;log.event('repair-queue-error',{error:repairError});}
  let statusFields={};
  const save=(state={})=>{statusFields={...statusFields,...state};atomic(statusFile,{run,mode,phase:process.env.DFO_PHASE,epoch,state:aborted?'ending':'playing',at:new Date().toISOString(),deadline:new Date(deadline).toISOString(),calls,turn,cumulativeTokenUsage,modelCallCounts,goal:memory.snapshot().goal,plan:planText,mind:lastSummary,packets:packetStore?{count:packetStore.count(),bytes:packetStore.bytes()}:null,repairQueue:repairQueue?.dir??null,repairError,packetError,...statusFields});};
  const updateFromSummary=summary=>{
    if(!summary)return;
    lastSummary=summary;
    const counts=summary.stats?.modelCalls??{};
    for(const role of Object.keys(modelCallCounts))modelCallCounts[role]=summary.budget?.byRole?.[role]?.calls??counts[role]??modelCallCounts[role];
    calls=Object.values(modelCallCounts).reduce((total,value)=>total+value,0);turn=calls;
    const totals=summary.budget?.totals??{input_tokens:0,cached_input_tokens:0,output_tokens:0};
    for(const key of Object.keys(cumulativeTokenUsage))if(Number.isFinite(totals[key]))cumulativeTokenUsage[key]=totals[key];
    if(summary.plan)planText=`${summary.plan.goal} (v${summary.plan.version}${summary.plan.stale?', stale':''})`;
  };
  const onPause=(why,summary)=>{lastPause=why;updateFromSummary(summary);try{memory.checkpoint();}catch(error){log.event('mind-checkpoint-error',{error:error.message});}save({state:'held',reason:why,mind:summary,lastNote:`paused: ${why}`,lastOutcome:summary.lastOutcome??null});log.event('mind-held',{reason:why});log.flush();};
  const onCheckpoint=(summary,why,durable)=>{updateFromSummary(summary);save({mind:summary,lastOutcome:summary.lastOutcome??null,lastNote:why});try{atomic(path.join(run,'continuation.json'),{mode,epoch,plan:durable?.plan??null,planHistory:durable?.planHistory??summary.planHistory??[],stats:summary.stats,budget:summary.budget,player:summary.player??null,repair:summary.repair??null,lastOutcome:summary.lastOutcome,at:new Date().toISOString()});}catch(error){log.event('continuation-error',{error:error.message});}};
  const onPlanChange=(plan)=>{if(plan?.goal)planText=`${plan.goal} (v${plan.version})`;save({mindPlan:plan,plan:planText});};
  const onDecisionPacket=(packet)=>{try{packetStore?.record(packet);}catch(error){log.event('decision-packet-store-error',{error:error.message,packetId:packet?.packetId??null});}};
  const onRepairProposal=(proposal)=>{try{const queued=repairQueue?.enqueue(proposal);log.event('repair-queued',{proposalId:proposal.proposalId,file:queued?.file??null});}catch(error){log.event('repair-queue-error',{error:error.message,proposalId:proposal?.proposalId??null});}};
  const readRepairStatus=()=>{try{const file=path.join(run,'repair-status.json');if(!fs.existsSync(file))return null;const status=read(file);if(!status)return null;const key=`${status.proposalId}:${status.phase}:${status.at}`;if(key===repairStatusSeen)return null;repairStatusSeen=key;return status;}catch{return null;}};
  let config=null,result=null;
  try{
    if(!memory.snapshot().goal)memory.setGoal(initialGoal(mode));
    try{config=loadMindConfig({env:process.env});}
    catch(error){reason='mind-config-error';log.event('mind-config-error',{error:error.message,code:error.code??null,errors:error.errors??null});throw error;}
    log.event('mind-config',{roles:{luna:{model:config.roles.luna.model,enabled:config.roles.luna.enabled},terra:{model:config.roles.terra.model,enabled:config.roles.terra.enabled},sol:{model:config.roles.sol.model,enabled:config.roles.sol.enabled}},budget:config.budget,resolution:config.models?.resolution??null,continueAfterPlan:config.scheduler.continueAfterPlan});
    try{log.event('mind-preflight-prepared',buildPreflightPlan(config,{metadata:config.models?.resolution?{ok:config.models.resolution.ok,source:config.models.resolution.source,fetchedAt:config.models.resolution.fetchedAt,models:Object.fromEntries(Object.entries(config.models.resolution.selected??{}).map(([role,slug])=>[role,{slug}]))}:null}));}catch(error){log.event('mind-preflight-prepare-error',{error:error.message});}
    const continuation=read(path.join(run,'continuation.json'));
    if(continuation&&continuation.mode!==mode)throw Error('Continuation mode mismatch or missing mode');
    const savedPlan=continuation?.plan&&Array.isArray(continuation.plan.steps)?continuation.plan:null;
    const savedPlanHistory=Array.isArray(continuation?.planHistory)?continuation.planHistory:[];
    const agentSource=sourceIdentity(ROOT);log.event('agent-source-identity',agentSource);
    result=await runMindRuntime({config,memory,logger:log,request:http,plan:savedPlan,planHistory:savedPlanHistory,initialRepair:continuation?.repair??null,initialBudget:continuation?.budget??null,operatorBudgetResume:process.env.DFO_OPERATOR_RESUME==='1',sourceRevision:agentSource.effectiveRevision,session:{run,mode,epoch,phase:process.env.DFO_PHASE,sourceRevision:agentSource.effectiveRevision,previousEpoch:continuation?{plan:continuation.plan,lastDecisions:continuation.lastDecisions}:null},onPause,onCheckpoint,onPlanChange,onDecisionPacket,onRepairProposal,readRepairStatus,signal:abort.signal,deadline,shouldStop:()=>aborted});
    if(result.ok){updateFromSummary(result.summary);reason=result.summary?.pauseReason??'session-complete';}
    else{reason=result.reason??'mind-unavailable';updateFromSummary(null);log.event('mind-runtime-unavailable',{reason,capabilities:result.capabilities??null,error:result.error??null});}
  }catch(error){reason=reason==='mind-config-error'?'mind-config-error':`fatal: ${error.message}`;try{log.event('fatal',{error:error.stack??error.message});}catch{};console.error(error.stack??error);}
  finally{
    aborted=true;abort.abort();clearInterval(timer);
    const cleanupErrors=[];
    const cleanupError=(step,error)=>{const message=`${step}: ${error?.message??error}`;cleanupErrors.push(message);console.error(message);try{log.event('cleanup-error',{step,error:String(error?.message??error)});}catch{}};
    try{await http('/stop',{});}catch(error){cleanupError('browser stop',error);}
    if(reason!=='hold'){try{const pause=await http('/pause',{});log.event('game-pause',pause);if(!pause.paused)cleanupError('game pause',pause.reason??'No visible Resume control');}catch(error){cleanupError('game pause',error);}}
    try{memory.checkpoint();}catch(error){cleanupError('memory checkpoint',error);}
    try{memory.close();}catch(error){cleanupError('memory close',error);}
    if(cleanupErrors.length)reason=`cleanup failure (${reason})`;
    try{save({state:reason==='deadline'?'deadline-reached':'held',reason,pauseReason:lastPause,cleanupErrors,mind:lastSummary});}catch(error){cleanupError('status save',error);reason='cleanup failure (status save)';}
    try{log.event('epoch-end',{reason,calls,turn,cleanupErrors,stats:lastSummary?.stats??null,budget:lastSummary?.budget??null});}catch(error){console.error('epoch-end logging:',error.message);reason='cleanup failure (epoch-end log)';}
    try{log.close();}catch(error){console.error('log close:',error.message);reason='cleanup failure (log close)';}
  }
  process.exitCode=reason==='deadline'?0:75;
}

async function worker(){
  const control=process.env.DFO_CONTROL||'native';
  if((control!=='native'||process.env.DFO_MIND_LEGACY==='1')&&mode!=='offline')throw Error('Legacy PILOT/PLANNER are offline diagnostics; use native control for online play, or --mode offline');
  if(control==='native'&&process.env.DFO_MIND_LEGACY!=='1')return workerMind();
  return workerLegacy();
}

async function supervise(){
  fs.mkdirSync(DATA,{recursive:true});const phase=value('phase','trial'),minutes=Number(value('minutes',60)),control=value('control','native');
  if(!['native','browser'].includes(control))throw Error('Invalid control mode');
  if(!Number.isFinite(minutes)||minutes<=0)throw Error('Invalid minutes');
  const started=Date.now(),deadline=started+minutes*60000,run=path.join(DATA,'runs',new Date(started).toISOString().replace(/[:.]/g,'-'));
  fs.mkdirSync(run,{recursive:true});let epoch=0,child=null,childExit=null,held=false,stopped=false,commandAt=read(commandFile)?.at??0,stopReason=null;
  const repairRequestsSeen=new Set();
  const log=modeLogger(run);log.event('session-start',{phase,started,deadline,minutes,engineCommit:ENGINE_COMMIT});
  const launch=async(operatorResume=false,guard=null)=>{await http('/resume',{});if(guard&&!guard()){await http('/stop',{});log.event('repair-resume-refused',{reason:'ownership changed during release'});return false;}epoch++;const workerEpoch=epoch;held=false;const current=spawn(process.execPath,[fileURLToPath(import.meta.url),'--worker','--mode',mode],{cwd:ROOT,env:{...process.env,DFO_RUN_DIR:run,DFO_MODE:mode,DFO_DEADLINE:String(deadline),DFO_EPOCH:String(workerEpoch),DFO_COMMAND_AT:String(commandAt),DFO_PHASE:phase,DFO_CONTROL:control,DFO_OPERATOR_RESUME:operatorResume?'1':'0'},windowsHide:true,stdio:['ignore','pipe','pipe']});child=current;
    current.stdout.on('data',d=>process.stdout.write(d));current.stderr.on('data',d=>process.stderr.write(d));
    childExit=new Promise(resolve=>{let settled=false;const finish=(code,signal,error)=>{if(settled)return;settled=true;try{log.event('worker-exit',{epoch:workerEpoch,code,signal,...(error&&{error:error.message})});}catch(e){console.error('worker-exit logging:',e.message);}if(child===current)child=null;if(code===0){stopped=true;stopReason??='deadline';}else if(Date.now()>=deadline){stopped=true;stopReason??='deadline';}else held=true;resolve({code,signal,error});};current.once('error',e=>finish(null,null,e));current.once('exit',(code,signal)=>finish(code,signal));});
  };
  await launch();console.log(JSON.stringify({run,phase,deadline:new Date(deadline).toISOString(),pid:process.pid}));
  while(!stopped){
    const cmd=read(commandFile);
    if(cmd&&cmd.at>commandAt){commandAt=cmd.at;log.event('operator-command',cmd);if(cmd.command==='stop'){stopped=true;stopReason='operator-stop';}else if(cmd.command==='resume'&&held&&!child){await launch(true);}
    }
    if(held&&!child&&!stopped){const directory=path.join(run,'repair-resume');if(fs.existsSync(directory))for(const name of fs.readdirSync(directory).filter(n=>/^[\w.-]+\.json$/.test(n)).sort()){
      if(repairRequestsSeen.has(name))continue;repairRequestsSeen.add(name);const request=read(path.join(directory,name)),status=read(path.join(run,'repair-status.json')),continuation=read(path.join(run,'continuation.json')),command=read(commandFile);
      const check=()=>mayResumeRepair({request,status:read(path.join(run,'repair-status.json')),continuation:read(path.join(run,'continuation.json')),command:read(commandFile),commandAt,run,effectiveRevision:sourceIdentity(ROOT).effectiveRevision,deadline});
      if(check()){if(await launch(false,check)!==false)break;}
      log.event('repair-resume-refused',{proposalId:request?.proposalId??null,reason:'hold ownership, status or budget did not match'});
    }}
    if(Date.now()>=deadline){stopped=true;stopReason??='deadline';}if(!stopped)await wait(300);
  }
  let forced=false,workerUnconfirmed=false;
  if(child){
    const current=child,exit=childExit;
    // Worker sees the existing stop command or its deadline and handles its own cleanup.
    if(!await settleWithin(exit,7000)){
      forced=true;log.event('worker-force-stop',{epoch});current.kill();
      workerUnconfirmed=!await settleWithin(exit,3000);
    }
  }
  const end=Date.now(),status=read(statusFile);
  const result={run,mode,phase,started:new Date(started).toISOString(),ended:new Date(end).toISOString(),wallSeconds:Math.round((end-started)/1000),requestedSeconds:minutes*60,epochs:epoch,lastStatus:status?.run===run?status:null,outcome:stopReason==='deadline'?'wall-deadline-reached':'ended-early',forced,workerUnconfirmed,note:'Wall deadline is not evidence of completed gameplay or continuous active play.'};
  log.event('session-end',result);log.close();
  try{result.report=buildModeReport(run,mode);}catch(e){result.reportError=e.message;console.error('Report:',e.message);}
  atomic(path.join(run,'summary.json'),result);console.log(JSON.stringify(result,null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){if(process.argv.includes('--worker'))await worker();else await supervise();}
