import {sessionMode} from './mode.mjs';
import {readLiveBindings,bindingKey} from './player/bindings.mjs';
import {executeOnlineUI,readOnlineState,validatePlayerInput,createAccountInput} from './player/online.mjs';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync, renameSync, unlinkSync, appendFileSync, openSync, closeSync, statSync as fsStat } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import { ROOT, DATA, ENGINE, DEPENDENCIES, ARENA2, GAME_PORT, CONTROL_PORT, GAME_URL } from './config.mjs';
import { createLogger } from './log.mjs';
import { prepareEngine } from './engine-prepare.mjs';
import { readLegacyWindow, ensureLegacyReader } from './legacy-windows.mjs';
import { renderDashboard } from './dashboard.mjs';
import {createNativeController,nativeControlRoute,withDeadline,runTrustedUI} from './native-controller.mjs';
const delay = ms => new Promise(r => setTimeout(r, ms));
export const PASSWORD_SENTINEL='__LOCAL_PASSWORD__';
export function makeLocalPassword(bytes=randomBytes(24)) {
  if(!Buffer.isBuffer(bytes)||bytes.length<24)throw Error('Insufficient password randomness');
  return `A1!${bytes.toString('base64url')}`;
}
function localPassword() {
  const file=join(DATA,'identity.json');
  try {writeFileSync(file,JSON.stringify({password:makeLocalPassword()}),{flag:'wx',mode:0o600});}
  catch(e){if(e.code!=='EEXIST')throw Error('Could not save local identity');}
  let value;try{value=JSON.parse(readFileSync(file,'utf8')).password;}catch{throw Error('Local identity is unreadable');}
  if(typeof value!=='string'||value.length<20)throw Error('Local identity is invalid');
  return value;
}
// Average cells over the center scene, excluding the outside margins and bottom HUD.
export function sampleScene({width,height,data}) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||data.length<width*height*4)throw Error('Invalid image');
  const sample=new Uint8Array(32*20*3);
  for(let gy=0;gy<20;gy++)for(let gx=0;gx<32;gx++){
    const x0=Math.min(width-1,Math.floor(width*(0.1+0.8*gx/32))),x1=Math.min(width,Math.max(x0+1,Math.floor(width*(0.1+0.8*(gx+1)/32))));
    const y0=Math.min(height-1,Math.floor(height*(0.1+0.65*gy/20))),y1=Math.min(height,Math.max(y0+1,Math.floor(height*(0.1+0.65*(gy+1)/20))));
    const sum=[0,0,0];let n=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*width+x)*4;for(let c=0;c<3;c++)sum[c]+=data[i+c];n++;}
    const j=(gy*32+gx)*3;for(let c=0;c<3;c++)sample[j+c]=Math.round(sum[c]/n);
  }
  return sample;
}
export function compareScenes(current,previous) {
  if(!previous)return null;
  if(current.length!==previous.length||!current.length)throw Error('Invalid scene samples');
  let sum=0;for(let i=0;i<current.length;i++)sum+=Math.abs(current[i]-previous[i]);
  return sum/(current.length*255);
}
export function holdGuardReason(base,current) {
  if(!Number.isFinite(base?.health)||!Number.isFinite(current?.health))return 'health unavailable';
  if(current.health<=0)return 'death';
  if(current.health<base.health)return 'health decreased';
  if(!base.panel&&current.panel)return 'window opened';
  if(base.panel!==current.panel)return 'window changed';
  return null;
}
export function validateAction(a,{trustedOnline=false}={}) {
  if(trustedOnline&&['account-sign-in','rowan-start','online-rest','online-respawn'].includes(a?.kind))return a;
  if (!a || typeof a !== 'object') throw new Error('Action must be an object');
  if (!['key','hold','click','look','type','scroll','drag','swing','wait','release'].includes(a.kind)) throw new Error('Unknown action');
  if (a.ms != null && (!Number.isFinite(a.ms) || a.ms < 0 || a.ms > (a.kind==='hold'?15000:6000))) throw new Error('Duration exceeds action limit');
  if (['key','hold'].includes(a.kind) && (!Array.isArray(a.keys) || a.keys.length < 1 || a.keys.length > 5 || a.keys.some(k=>typeof k!=='string'||!k.trim()||k.length>32))) throw new Error('Invalid keys');
  if(a.kind==='swing'&&a.keys!=null&&(!Array.isArray(a.keys)||a.keys.length>5||a.keys.some(k=>typeof k!=='string'||!k.trim()||k.length>32)))throw Error('Invalid keys');
  if(a.kind==='swing'&&[a.dx,a.dy].some(v=>v!=null&&(!Number.isFinite(v)||Math.abs(v)>400)))throw Error('Invalid swing delta');
  if(a.controlId!=null&&(!Number.isSafeInteger(a.controlId)||a.controlId<0))throw Error('Invalid control ID');
  if(a.button!=null&&!['left','right','middle'].includes(a.button))throw Error('Invalid mouse button');
  if(a.kind==='click'&&a.controlId==null&&(!Number.isFinite(a.x)||!Number.isFinite(a.y)))throw Error('Click requires coordinates');
  if(a.kind==='drag'&&!['x','y','toX','toY'].every(k=>Number.isFinite(a[k])))throw Error('Drag requires coordinates');
  if (a.kind==='type' && (typeof a.text!=='string'||a.text.length>2000)) throw new Error('Invalid text');
  for (const k of ['x','y','dx','dy','toX','toY']) if(a[k]!=null && (!Number.isFinite(a[k]) || Math.abs(a[k])>4000)) throw new Error('Invalid coordinates');
  return a;
}
// One queue owns every physical writer. Invalidating happens before queued cleanup,
// so an in-flight start can see a concurrent stop even while it awaits I/O.
export function createControlGate() {
  let chain=Promise.resolve(), revision=0;
  return {get revision(){return revision;}, invalidate(){return ++revision;},
    run(fn){const next=chain.then(fn,fn);chain=next.catch(()=>{});return next;}};
}
export async function readHeldInput(page,held,buttons) {
  const native=await page.evaluate(()=>{const state=globalThis.__agent?.state?.();return state?.inputHeld===true||!!(state?.held?.length||globalThis.__body?.status?.()?.held?.length);});
  return native||held.size>0||buttons.size>0;
}
export function createHealthReader({readPhysical,readTask,now=()=>Date.now()}) {
  let lease=null;
  return async()=>{
    const inputHeld=await readPhysical(),task=readTask(),activeTask=task?{id:task.id,kind:task.kind}:null;
    if(!inputHeld)lease=null;
    else if(!lease||lease.holder!==(task?.id??null))lease={startedAt:task?.startedAt??now(),holder:task?.id??null};
    return {inputHeld,activeTask,inputLease:lease?{...lease}:null};
  };
}
export async function prepareTrustedUI({poll,stopBody,release}) {
  const existing=await poll();
  if(existing?.task?.status==='running'||existing?.task?.cleanupPending)throw Object.assign(Error('Existing native execution owns input'),{status:409,code:'TASK_BUSY'});
  const stopped=await stopBody();
  if(stopped?.ok!==true)throw Object.assign(Error('Native release unverified'),{status:409,code:'UNVERIFIED_CLEANUP'});
  await release();
}
export function refreshObservedTarget(original, targets) {
  if(!original || !Array.isArray(targets)) return null;
  if(original.targetId!=null) return targets.find(t=>t.target?.targetId===original.targetId)?.target ?? null;
  return targets.find(t=>t.kind==='thing'&&t.target?.kind===original.kind&&t.target?.x===original.x&&t.target?.z===original.z)?.target ?? null;
}
export async function startBrowser({headless=false,control='native',mode=sessionMode([])}={}) {
  sessionMode(['--mode',mode],{});
  if(!['native','browser'].includes(control)) throw Error('Invalid control mode');
  let nativeModules=null;
  if(control==='native') {
    const bridge=await import('./native-bridge.mjs'), body=await import('./body-runtime.mjs'), executor=await import('./intent-executor.mjs');
    await bridge.ensureNativePort();
    nativeModules={...bridge,...body,...executor};
  }
  ensureLegacyReader();
  mkdirSync(join(DATA,'browser'),{recursive:true});
  const privateInput=createAccountInput(),rawLog=createLogger(join(DATA,'browser-log'));
  const log={...rawLog,event:(kind,data={})=>rawLog.event(kind,privateInput.redact({...data,mode}))};
  const req=createRequire(join(DEPENDENCIES,'playwright','package.json'));
  const {chromium}=req('playwright');
  const {PNG}=req('pngjs');
  let dev=null;
  try { const r=await fetch(GAME_URL,{signal:AbortSignal.timeout(700)}); if(!r.ok)throw Error(); }
  catch {
    log.event('engine-prepared',prepareEngine(ENGINE));
    // The game server outlives this driver, so its output goes to a file: a failed start must say why.
    const serverLog=join(DATA,'browser-log','game-server.log');mkdirSync(join(DATA,'browser-log'),{recursive:true});
    const out=openSync(serverLog,'w');
    dev=spawn(process.execPath,[join(DEPENDENCIES,'vite','bin','vite.js'),'--config',join(ROOT,'vite.config.mjs'),'--port',String(GAME_PORT),'--strictPort','--host','127.0.0.1'],{cwd:ENGINE,env:{...process.env,ARENA2_PATH:ARENA2},windowsHide:true,detached:true,stdio:['ignore',out,out]});
    dev.unref();closeSync(out);
    const deadline=Date.now()+240_000; let ready=false; // A new engine can take minutes to serve its first page.
    while(Date.now()<deadline){try{if((await fetch(GAME_URL,{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{} await delay(300);}
    if(!ready)throw Error(`Game server did not become ready; see ${serverLog}:\n${readFileSync(serverLog,'utf8').slice(-2000)}`);
  }
  const endpoint='http://127.0.0.1:5392';
  let endpointReady=false;
  try { endpointReady=(await fetch(`${endpoint}/json/version`,{signal:AbortSignal.timeout(700)})).ok; } catch {}
  if(!endpointReady){
    const edge=[join(process.env['PROGRAMFILES(X86)']||'C:/Program Files (x86)','Microsoft/Edge/Application/msedge.exe'),join(process.env.PROGRAMFILES||'C:/Program Files','Microsoft/Edge/Application/msedge.exe')].find(existsSync);
    if(!edge)throw Error('Microsoft Edge executable not found');
    const args=['--remote-debugging-address=127.0.0.1','--remote-debugging-port=5392',`--user-data-dir=${join(DATA,'browser')}`,'--window-size=1280,800','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-background-timer-throttling','--autoplay-policy=no-user-gesture-required','--mute-audio','--no-first-run','--no-default-browser-check'];
    if(headless)args.push('--headless=new');
    args.push('about:blank');
    const edgeProcess=spawn(edge,args,{detached:true,windowsHide:true,stdio:'ignore'});edgeProcess.unref();
    const deadline=Date.now()+30000;
    while(Date.now()<deadline){try{if((await fetch(`${endpoint}/json/version`,{signal:AbortSignal.timeout(1000)})).ok){endpointReady=true;break;}}catch{}await delay(200);}
    if(!endpointReady)throw Error('Edge CDP endpoint did not become ready');
  }
  const browser=await chromium.connectOverCDP(endpoint);
  const context=browser.contexts()[0];
  if(!context)throw Error('Edge has no browser context');
  const page=context.pages().find(p=>p.url().startsWith(GAME_URL)) ?? context.pages().find(p=>p.url()==='about:blank') ?? await context.newPage();
  const cdp=await context.newCDPSession(page);
  const pageId=(await cdp.send('Target.getTargetInfo')).targetInfo.targetId;
  let generation=Date.now(),obsId=0,lastObs=null,lastScene=null,lastRecoveryHash=null,busy=false,lastBeat=Date.now(),closing=false,actionDone=null,abortAction=null,mouseX=640,mouseY=400;
  const held=new Set(),buttons=new Set();let uiTask=null;
  const release=async()=>{for(const key of held)await page.keyboard.up(key).catch(()=>{});held.clear();for(const button of new Set(['left','right',...buttons]))await page.mouse.up({button}).catch(()=>{});buttons.clear();};
  let executor=null, nativeStopped=false, placeMemory=null; // placeMemory outlives executors; a page navigation starts it over
  const gate=createControlGate();
  page.on('console',m=>{if(m.type()==='error')log.event('console-error',{text:lastObs?.account?.open?'[redacted account UI error]':m.text().slice(0,2500)});});
  page.on('pageerror',e=>log.event('page-error',{text:lastObs?.account?.open?'[redacted account UI error]':e.message}));
  page.on('framenavigated',f=>{if(f===page.mainFrame()){lastObs=null;lastScene=null;void nativeControl.stopAll('navigation').then(()=>{executor=null;placeMemory=null;}).catch(e=>log.event('native-cancel-error',{error:e.message}));log.event('navigation',{generation,url:page.url()});}});
  const serialNative=fn=>gate.run(fn);
  async function cancelNative(reason){
    gate.invalidate();
    return serialNative(async()=>{try {const receipt=executor?await executor.cancel(reason):null;if(nativeModules)await nativeModules.stopBody(page);return receipt;} finally {if(reason==='navigation')executor=null;}});
  }
  async function nativeObservation(after=0){
    if(!nativeModules)return {ready:false,reason:'Native control disabled in browser diagnostic mode',generation};
    const observed=await nativeModules.readNative(page,after),own=await readOnlineState(page).catch(()=>null);
    const privateUI=await page.evaluate(()=>!!document.querySelector('.acct,.px-profile'));
    if(privateUI){observed.window=null;if(observed.state)observed.state.window=null;}
    if(observed.events?.lines)observed.events.lines=observed.events.lines.map(e=>e.kind==='window'&&/account|username|password|signed in|profile/i.test(e.text??'')?{...e,text:'[redacted account UI]'}:e);
    return privateInput.redact({...observed,generation,sessionMode:own?.character?.name?own.mode:null,character:own?.character??null,bindings:await readLiveBindings(page)});
  }
  async function startNative(body){
    const revision=gate.revision;
    return serialNative(async()=>{
      if(!nativeModules)throw Object.assign(Error('Native control unavailable'),{status:503});
      if(nativeStopped||busy||revision!==gate.revision||body.generation!==generation)throw Object.assign(Error('Stale generation or controller busy'),{status:409});
      const n=await nativeObservation();
      if(n.character?.name&&n.character.name!=='Rowan')throw Object.assign(Error(n.character.name==='Tiger Fist'?'Tiger Fist belongs to the user and is refused':'Only Rowan may be played'),{status:409,code:'character-refused'});
      if(!n.ready)throw Object.assign(Error(n.reason||'Native bridge unavailable'),{status:503});
      if(body.generation!==generation||revision!==gate.revision||body.frame!==n.state?.frame)throw Object.assign(Error('Stale native frame'),{status:409});
      if(body.requestId&&executor){const existing=await executor.poll();if(existing.task?.status==='running'||existing.task?.cleanupPending)throw Object.assign(Error('An existing task must be cancelled first'),{status:409});}
      if(body.observedTarget && !refreshObservedTarget(body.intent.target,n.targets)) throw Object.assign(Error('Observed target changed'),{status:409});
      if(!executor){const installed=await nativeModules.installBody(page,{generation});if(!installed.ready)throw Object.assign(Error(installed.reason||'Body unavailable'),{status:503});log.event('native-body-install',installed);placeMemory??=nativeModules.createPlaceMemory();executor=nativeModules.createIntentExecutor({page,memory:placeMemory,emit:event=>log.event('native-executor',event)});}
      const fresh=await nativeObservation();
      if(!fresh.ready||body.generation!==generation||revision!==gate.revision||fresh.state?.frame!==body.frame||(body.observedTarget&&!refreshObservedTarget(body.intent.target,fresh.targets))) throw Object.assign(Error('Native observation changed'),{status:409});
      const currentIntent=body.observedTarget?{...body.intent,target:refreshObservedTarget(body.intent.target,fresh.targets)}:body.intent;
      const receipt=await executor.start(currentIntent,{generation,frame:body.frame});
      if(revision!==gate.revision||body.generation!==generation){await executor.cancel('stale start');throw Object.assign(Error('Intent invalidated'),{status:409});}
      return receipt;
    });
  }
  async function pollNative(){return serialNative(async()=>executor?await executor.poll():{task:null,events:[]});}
  async function readPlace(){
    if(!nativeModules)return {available:false,reason:'Native world unavailable'};
    if(!executor)return {available:false,reason:'Place memory unavailable'};
    const native=await nativeModules.readNative(page);
    if(!native?.ready||!native.state?.pos)return {available:false,reason:native?.reason||'Native world unavailable'};
    const place=executor.placeSnapshot();
    if(!place)return {available:false,reason:'Place memory unavailable'};
    let automap=null;
    try{automap=await page.evaluate(()=>globalThis.__agent?.map?.()??null);}catch{}
    const edges=executor.placeEdges();
    const revision=createHash('sha256').update(JSON.stringify({place,automap,edges})).digest('hex');
    return {available:true,revision,place,automap,edges};
  }
  async function readCharacterIdentity(){const id=await page.evaluate(async()=>{const p=(await import('/src/characters/playerEntity.js')).playerEntity;return typeof p?.characterId==='string'&&p.characterId?p.characterId:null;}).catch(()=>null);return id?createHash('sha256').update(id).digest('hex'):null;}
  const uncertainFile=join(DATA,'uncertain-ui.json');
  const loadUncertain=()=>{try{return JSON.parse(readFileSync(uncertainFile,'utf8'));}catch(e){return e.code==='ENOENT'?null:{schemaVersion:'invalid',reason:'unreadable uncertainty record'};}};
  const saveUncertain=value=>{mkdirSync(DATA,{recursive:true});const tmp=join(DATA,`.uncertain-${randomBytes(8).toString('hex')}.tmp`);writeFileSync(tmp,JSON.stringify(value),{flag:'wx',mode:0o600});renameSync(tmp,uncertainFile);};
  const loadCompleted=()=>{const f=join(DATA,'uncertain-ui-audit.jsonl');if(!existsSync(f))return [];if(fsStat(f).size>10_000_000)throw Error('Completed UI receipt ledger exceeds limit; control unavailable');return readFileSync(f,'utf8').split('\n').filter(Boolean).map(line=>JSON.parse(line)).filter(row=>row.requestId&&row.keyHash&&row.task);};
  const clearUncertain=value=>{appendFileSync(join(DATA,'uncertain-ui-audit.jsonl'),JSON.stringify({...value,resolution:'player-state-observed'})+'\n',{mode:0o600});unlinkSync(uncertainFile);};
  const nativeControl=createNativeController({timeoutMs:15000,loadUncertain,loadCompleted,saveUncertain,clearUncertain,readIdentity:readCharacterIdentity,enabled:!!nativeModules,basis:()=>({pageId,generation}),readNative:nativeObservation,readUI:options=>observe(options),runUI:request=>{const a=request.action;if(nativeModules&&(['hold','look','swing'].includes(a?.kind)||(a?.kind==='key'&&a.keys?.some(k=>/^(w|a|s|d|arrowup|arrowdown|arrowleft|arrowright)$/i.test(k)))))throw Object.assign(Error('Physical movement requires native intent'),{status:400,code:'UNSUPPORTED_ACTION'});return serialNative(async()=>{await prepareTrustedUI({poll:async()=>executor?executor.poll():null,stopBody:async()=>nativeModules?nativeModules.stopBody(page):{ok:true},release});return act(request,true);});},start:startNative,poll:pollNative,cancel:cancelNative,
    latchStop:()=>{nativeStopped=true;generation++;lastObs=null;gate.invalidate();abortAction?.abort();},
    forceStop:async()=>{const previous=executor;await page.evaluate(epoch=>{globalThis.__dfoControlGeneration=epoch;globalThis.__body?.enable(false);globalThis.__agent?.releaseAll?.();},generation);await release();if(executor===previous)executor=null;return {ok:true};},
    resume:()=>{nativeStopped=false;}});
  const readHealth=createHealthReader({readPhysical:()=>withDeadline(()=>readHeldInput(page,held,buttons),1500,'input health'),readTask:()=>nativeControl.health().activeTask??uiTask});
  if(!page.url().startsWith(GAME_URL)){const initial=new URL(GAME_URL);if(control==='native')initial.searchParams.set('agent','1');await page.goto(initial.href,{waitUntil:'domcontentloaded',timeout:120_000});}
  async function observe({image=true}={}){
    if(busy)throw Object.assign(Error('Action controller busy'),{status:409});
    busy=true;const observedGeneration=generation;
    try {
    let visible=await page.evaluate(()=>{
      const shown=e=>{for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.visibility==='hidden'||s.visibility==='collapse'||s.display==='none'||Number(s.opacity)===0)return false;}const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth;};
      const exposed=(e,r)=>{const left=Math.max(0,r.left),right=Math.min(innerWidth,r.right),top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);if(right<=left||bottom<=top)return false;const hit=document.elementFromPoint((left+right)/2,(top+bottom)/2);return !!hit&&(hit===e||e.contains(hit));};
      document.querySelectorAll('[data-rowan-id]').forEach(e=>delete e.dataset.rowanId);
      const recovery=[...document.querySelectorAll('.acctcode')].filter(shown).flatMap(e=>[...e.querySelectorAll('code')].map(c=>c.textContent.trim()).filter(Boolean));
      const els=[...document.querySelectorAll('button,input,textarea,select,a,[role="button"],[role="tab"],[role="checkbox"],canvas')].filter(e=>!e.closest('.acctcode')&&!e.querySelector('.acctcode')&&shown(e)&&exposed(e,e.getBoundingClientRect())).slice(0,150);
      const controls=els.map((e,i)=>{e.dataset.rowanId=String(i);const r=e.getBoundingClientRect(),accountField=!!e.closest('.acct')&&e.matches('input'),tile=e.closest('.svtile');return {id:i,tag:e.tagName.toLowerCase(),type:e.type??'',text:(e.matches('.px-profile')?'Account profile':e.matches('input')&&e.closest('label')?.querySelector('.fieldlabel')?.textContent||e.innerText||e.getAttribute('aria-label')||e.title||e.placeholder||'').trim().slice(0,240),value:e.type==='password'||accountField?'[private]':String(e.value??'').slice(0,200),accountField,characterName:tile?.querySelector('.svtop h3')?.textContent?.trim()??null,creationName:e.matches('.namebox'),disabled:!!e.disabled,context:e.matches('.dfchat-input')?'chat-input':e.matches('.dfchat-send')?'chat-send':null,x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2),w:Math.round(r.width),h:Math.round(r.height)};});
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const parts=[];let chars=0,node;
      while((node=walker.nextNode())&&chars<18000){const value=node.nodeValue?.trim(),parent=node.parentElement;if(!value||!parent||parent.closest('script,style,noscript,.acct,.px-profile')||!shown(parent))continue;const range=document.createRange();range.selectNodeContents(node);const rects=[...range.getClientRects()];if(rects.some(r=>exposed(parent,r))){parts.push(value);chars+=value.length+1;}}
      const chatLines=[...document.querySelectorAll('.dfchat-line.mine .dfchat-text')].filter(e=>shown(e)&&exposed(e,e.getBoundingClientRect())).map(e=>(e.innerText||'').trim()).filter(Boolean).slice(-50);
      const accountRoot=[...document.querySelectorAll('.acct')].find(shown),profile=document.querySelector('.px-profile');
      const signedIn=!!(accountRoot?.classList.contains('acctin')||profile?.getAttribute('aria-label')?.startsWith('Profile:'));
      const controlId=e=>e?.dataset.rowanId!=null?Number(e.dataset.rowanId):null;
      const account={signedIn,open:!!accountRoot,profile:!!profile,login:!!accountRoot?.querySelector('input[autocomplete="current-password"]'),handleId:controlId(accountRoot?.querySelector('input[autocomplete="username"]')),passwordId:controlId(accountRoot?.querySelector('input[autocomplete="current-password"]')),submitId:controls.find(c=>c.tag==='button'&&c.text?.toLowerCase()==='sign in')?.id??null};
      const realm=document.querySelector('.svrealm'),characters=[...(realm?.querySelectorAll('.svtile')??[])].map(tile=>({name:tile.querySelector('.svtop h3')?.textContent?.trim(),playId:controlId([...tile.querySelectorAll('button')].find(e=>e.textContent.trim().toLowerCase()==='play'))}));
      const realmReady=!!realm&&(characters.length>0||realm.textContent.includes('No online characters yet.'));
      if(accountRoot)parts.push(signedIn?'Account signed in':'Account Sign in');
      return {account,characters,realmReady,recovery,text:parts.join('\n').slice(0,18000),controls,chatLines,title:document.title,pointerLocked:!!document.pointerLockElement,focused:document.hasFocus(),viewport:{width:innerWidth,height:innerHeight}};
    });
    visible=privateInput.redact(visible);
    const recovery=visible.recovery;delete visible.recovery;
    if(recovery.length){const digest=createHash('sha256').update(JSON.stringify(recovery)).digest('hex');if(digest!==lastRecoveryHash){try{writeFileSync(join(DATA,'identity-recovery.txt'),`${new Date().toISOString()}\n${recovery.join('\n')}\n\n`,{flag:'a',mode:0o600});}catch{throw Error('Could not save recovery codes');}lastRecoveryHash=digest;}visible.text+='\nRecovery codes saved locally.';}
    let legacyWindow=null,ownVitals=null;
    if(!recovery.length&&!visible.account.open&&!visible.account.profile)try{const legacy=await readLegacyWindow(page);for(const old of legacy.controls??[]){const c=visible.controls.find(c=>c.id===old.controlId);if(c&&old.label&&typeof old.label==='string'){c.domText=c.text;c.text=old.label.slice(0,240);}}legacyWindow={window:legacy.window,hud:legacy.hud,plaque:legacy.plaque};}catch{log.event('legacy-reader-unavailable',{});}
    try{ownVitals=await page.evaluate(async()=>{const {playerEntity:p}=await import('/src/characters/playerEntity.js');const {maxFatigue}=await import('/src/systems/statMods.js');const n=v=>Number.isFinite(v)?v:null;return {health:n(p.health),maxHealth:n(p.maxHealth),fatigue:n(p.fatigue),maxFatigue:n(maxFatigue(p)),magicka:n(p.magicka),maxMagicka:n(p.maxMagicka),source:'player HUD precision assist'};});}catch{log.event('own-vitals-unavailable',{});}
    const id=++obsId;let screen=null,visualChange=null,visualFingerprint=null;
    if(image){screen=join(DATA,'screens',`${observedGeneration}-${String(id).padStart(7,'0')}.png`);mkdirSync(resolve(screen,'..'),{recursive:true});
      const png=await page.screenshot({path:screen,timeout:10000,mask:[page.locator('.acct'),page.locator('.px-profile'),page.locator('.dfchat-name')]});
      const scene=sampleScene(PNG.sync.read(png));visualChange=compareScenes(scene,lastScene);
      const quantized=Buffer.from(Uint8Array.from(scene,v=>v>>4));visualFingerprint=createHash('sha256').update(quantized).digest('hex').slice(0,20);lastScene=scene;
    }
    const fingerprint=createHash('sha256').update(JSON.stringify([page.url(),visible.controls.map(c=>[c.tag,c.text,c.disabled]),visible.text])).digest('hex').slice(0,20);
    if(observedGeneration!==generation)throw Object.assign(Error('Observation invalidated'),{status:409});
    lastObs=privateInput.redact({id,generation,pageId,at:new Date().toISOString(),url:page.url(),fingerprint,visualFingerprint,visualChange,screen,legacyWindow,ownVitals,sessionMode:(await readOnlineState(page).catch(()=>null))?.mode??null,bindings:await readLiveBindings(page),...visible});
    log.event('observation',lastObs);return lastObs;
    } finally { busy=false; }
  }
  async function act(body,trustedOnline=false){
    if(busy)throw Object.assign(Error('Action controller busy'),{status:409});
    const a=validateAction(body.action,{trustedOnline});if(!lastObs||body.generation!==generation||body.observationId!==lastObs.id)throw Object.assign(Error('Stale observation'),{status:409});
    if(Date.now()-Date.parse(lastObs.at)>45_000)throw Object.assign(Error('Observation expired'),{status:409});
    if(a.controlId!=null&&!lastObs.controls.some(c=>c.id===a.controlId&&!c.disabled))throw Error('Control is not currently available');
    if(!['account-sign-in','rowan-start','online-rest','online-respawn'].includes(a.kind)){
      const target=await page.evaluate(a=>{
        const e=a.controlId!=null?document.querySelector(`[data-rowan-id="${a.controlId}"]`):a.kind==='click'?document.elementFromPoint(a.x,a.y):document.activeElement;
        const account=e?.closest('.acct'),button=e?.closest('button'),tile=e?.closest('.svtile');
        return {accountField:!!account&&!!e?.matches('input,textarea'),accountAction:account?(button?.innerText??'').trim():null,loginSubmit:!!account?.querySelector('input[autocomplete="current-password"]')&&button?.innerText?.trim().toLowerCase()==='sign in',characterName:tile?.querySelector('.svtop h3')?.textContent?.trim()??null,creationName:!!e?.matches('.namebox'),value:e?.matches('.namebox')?e.value:null};
      },a);
      validatePlayerInput(a,target);
      const selected=lastObs.controls.find(c=>c.id===a.controlId);
      if(selected?.text==='New online character')throw Object.assign(Error('Use startup.select-rowan to check for an existing Rowan first'),{code:'character-refused',status:409});
    }
    busy=true;lastBeat=Date.now();const id=body.actionId??`${generation}-${Date.now()}`,started=Date.now(),actionGeneration=generation;let inputMode,holdReceipt;
    uiTask={id,kind:a.kind,startedAt:started};
    const abort=new AbortController();abortAction=abort;let done;actionDone=new Promise(r=>{done=r;});
    const check=()=>{if(abort.signal.aborted||generation!==actionGeneration)throw Object.assign(Error('Action cancelled'),{status:409});};
    const sleep=ms=>new Promise((resolve,reject)=>{if(abort.signal.aborted)return reject(Error('Action cancelled'));const timer=setTimeout(()=>{abort.signal.removeEventListener('abort',onAbort);resolve();},ms);const onAbort=()=>{clearTimeout(timer);reject(Error('Action cancelled'));};abort.signal.addEventListener('abort',onAbort,{once:true});});
    log.event('action-intent',{id,observationId:body.observationId,generation,action:a});log.flush();
    try{
      const target=a.controlId==null?null:page.locator(`[data-rowan-id="${a.controlId}"]`);
      if(target){const expected=lastObs.controls.find(c=>c.id===a.controlId);const valid=await page.evaluate(({id,c})=>{const e=document.querySelector(`[data-rowan-id="${id}"]`);if(!e)return false;for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse'||Number(s.opacity)===0)return false;}const r=e.getBoundingClientRect(),l=Math.max(0,r.left),right=Math.min(innerWidth,r.right),t=Math.max(0,r.top),b=Math.min(innerHeight,r.bottom);if(right<=l||b<=t)return false;const hit=document.elementFromPoint((l+right)/2,(t+b)/2),text=(e.matches('.px-profile')?'Account profile':e.matches('input')&&e.closest('label')?.querySelector('.fieldlabel')?.textContent||e.innerText||e.getAttribute('aria-label')||e.title||e.placeholder||'').trim().slice(0,240);return e.isConnected&&!e.disabled&&!!hit&&(hit===e||e.contains(hit))&&e.tagName.toLowerCase()===c.tag&&(e.type??'')===c.type&&text===(c.domText??c.text);},{id:a.controlId,c:expected}).catch(()=>false);check();if(!valid)throw Object.assign(Error('Control changed since observation'),{status:409});}
      if(['account-sign-in','rowan-start','online-rest','online-respawn'].includes(a.kind))return {id,...await executeOnlineUI({page,ui:lastObs,action:a,check,sleep,read:privateInput.read})};
      if(a.kind==='key')for(const key of a.keys){check();await page.keyboard.press(key);check();}
      if(a.kind==='hold'){
        inputMode='guarded-key-hold';
        const readGuard=()=>Promise.race([page.evaluate(async()=>{const [{playerEntity:p},w]=await Promise.all([import('/src/characters/playerEntity.js'),import('/src/rowan/agentWindows.js')]);const panel=w.renderedWindowObservation();return {health:Number.isFinite(p.health)?p.health:null,panel:panel?JSON.stringify([panel.title,panel.text]):null};}),new Promise((_,reject)=>setTimeout(()=>reject(Error('guard timeout')),1500))]);
        let reason=null,holdStart=null,heldMs=0,pressedAny=false;
        try{
          let baseline;try{baseline=await readGuard();}catch{reason='guard unavailable';}
          check();if(!reason)reason=holdGuardReason(baseline,baseline);
          if(!reason){for(const key of a.keys){check();held.add(key);await page.keyboard.down(key);pressedAny=true;check();}holdStart=Date.now();const until=holdStart+(a.ms??500);
            while(Date.now()<until){lastBeat=Date.now();await sleep(Math.min(500,until-Date.now()));check();let current;try{current=await readGuard();}catch{reason='guard unavailable';break;}check();lastBeat=Date.now();reason=holdGuardReason(baseline,current);if(reason)break;baseline.health=current.health;}}
        }catch(e){if(abort.signal.aborted)reason='cancelled';else if(generation!==actionGeneration)reason='page changed';else throw e;}
        finally{heldMs=holdStart===null?0:Date.now()-holdStart;await release();}
        holdReceipt={issued:pressedAny,interrupted:!!reason,reason,heldMs};
      }
      if(a.kind==='click'){check();if(target){const c=lastObs.controls.find(c=>c.id===a.controlId);await target.click({button:a.button??'left',timeout:3000});mouseX=c.x;mouseY=c.y;}else{await page.mouse.click(a.x,a.y,{button:a.button??'left'});mouseX=a.x;mouseY=a.y;}check();}
      if(a.kind==='look'){
        check();const locked=await page.evaluate(()=>!!document.pointerLockElement);check();
        if(locked){inputMode='pointer';mouseX+=a.dx??0;mouseY+=a.dy??0;await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:mouseX,y:mouseY,button:'none'});check();}
        else{
          inputMode='keyboard-look';
          const axes=[[a.dx??0,'ArrowRight','ArrowLeft'],[a.dy??0,'Delete','Insert']].filter(([v])=>v!==0).map(([v,pos,neg])=>({key:v>0?pos:neg,ms:Math.min(1200,Math.round(Math.abs(v)*4))}));
          try{for(const axis of axes){check();held.add(axis.key);await page.keyboard.down(axis.key);check();}let elapsed=0;for(const end of [...new Set(axes.map(x=>x.ms))].sort((x,y)=>x-y)){await sleep(end-elapsed);check();for(const axis of axes.filter(x=>x.ms===end)){await page.keyboard.up(axis.key);held.delete(axis.key);check();}elapsed=end;}}
          finally{await release();}
        }
      }
      if(a.kind==='type'){if(target){const isPassword=(await target.getAttribute('type',{timeout:1500}))==='password';if(isPassword&&a.text!==PASSWORD_SENTINEL)throw Error('Password fields require the local password sentinel');if(!isPassword&&a.text===PASSWORD_SENTINEL)throw Error('Local password sentinel requires a password field');check();if(isPassword){try{await target.fill(localPassword(),{timeout:3000});}catch{throw Error('Could not fill local password');}}else await target.fill(a.text,{timeout:3000});}else{if(a.text===PASSWORD_SENTINEL||await page.evaluate(()=>document.activeElement?.getAttribute('type')==='password'))throw Error('Password entry requires a visible password control');check();await page.keyboard.insertText(a.text);}check();}
      if(a.kind==='scroll'){if(Number.isFinite(a.x)&&Number.isFinite(a.y)){check();await page.mouse.move(a.x,a.y);check();mouseX=a.x;mouseY=a.y;}await page.mouse.wheel(a.dx??0,a.dy??500);check();}
      if(a.kind==='drag'){check();await page.mouse.move(a.x,a.y);check();mouseX=a.x;mouseY=a.y;const button=a.button??'left';buttons.add(button);await page.mouse.down({button});try{check();await page.mouse.move(a.toX,a.toY,{steps:10});mouseX=a.toX;mouseY=a.toY;check();}finally{await page.mouse.up({button});buttons.delete(button);}}
      if(a.kind==='swing'){
        const dx=a.dx??80,dy=a.dy??0,duration=a.ms??1000,until=Date.now()+duration;
        try{
          for(const key of a.keys??[]){check();held.add(key);await page.keyboard.down(key);check();}
          const state=await page.evaluate(async()=>({locked:!!document.pointerLockElement,mode:(await import('/src/systems/settings/settings.js')).getInt('Controls','WeaponSwingMode',0,2)}));check();
          if(!state.locked&&state.mode===0)throw Error('Gesture swing requires pointer lock; choose click or hold attack in controls');
          inputMode=state.locked?'pointer-swing':state.mode===2?'mouse-hold-swing':'mouse-click-swing';
          check();buttons.add('right');await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:mouseX,y:mouseY,button:'right',buttons:2,clickCount:1});check();
          let direction=1;
          do{check();if(state.locked&&state.mode===0){mouseX+=dx*direction;mouseY+=dy*direction;await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:mouseX,y:mouseY,button:'right',buttons:2});direction=-direction;}check();const remaining=until-Date.now();if(remaining>0)await sleep(Math.min(450,remaining));check();if(state.mode===1&&Date.now()<until){await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:mouseX,y:mouseY,button:'right',buttons:0,clickCount:1});check();await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:mouseX,y:mouseY,button:'right',buttons:2,clickCount:1});check();}}while(Date.now()<until);
        }finally{await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:mouseX,y:mouseY,button:'right',buttons:0,clickCount:1}).catch(()=>{});await release();}
        check();
      }
      if(a.kind==='wait')await sleep(a.ms??500);
      if(a.kind==='release')await release();
      if(!holdReceipt?.interrupted){await sleep(130);check();}const result={id,issued:true,generation,ms:Date.now()-started,...(inputMode?{inputMode}:{}),...holdReceipt};log.event('action-issued',result);return result;
    }catch(e){await release();log.event('action-error',{id,error:e.message});throw e;}finally{uiTask=null;abortAction=null;busy=false;done();actionDone=null;}
  }
  const watchdog=setInterval(()=>{if(held.size&&Date.now()-lastBeat>7000)void release().then(()=>log.event('lease-expired',{}));},250);
  async function stopAction(){const result=await nativeControl.stopAll('operator stop');const pending=actionDone;if(pending)try{await withDeadline(()=>pending,4000,'UI cancellation');}catch(e){result.cleanupPending=true;result.cleanupErrors.push(e.message);}log.event('stop',{generation,...result});return result;}
  async function pauseGame(){
    await stopAction();
    const deadline=Date.now()+12000;
    while(busy&&Date.now()<deadline)await delay(50);
    if(busy)return {paused:false,reason:'controller busy'};
    busy=true;
    try{
      const visibleButtons=()=>page.evaluate(()=>[...document.querySelectorAll('button,[role="button"],input[type="button"],input[type="submit"]')].filter(e=>{for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse'||Number(s.opacity)===0)return false;}const r=e.getBoundingClientRect(),l=Math.max(0,r.left),right=Math.min(innerWidth,r.right),t=Math.max(0,r.top),b=Math.min(innerHeight,r.bottom);if(right<=l||b<=t)return false;const hit=document.elementFromPoint((l+right)/2,(t+b)/2);return !e.disabled&&hit&&(hit===e||e.contains(hit));}).map(e=>(e.innerText||e.value||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ')));
      for(let i=0;i<=3;i++){
        const buttons=await visibleButtons();
        if(buttons.some(t=>/\brise\b|end your tale/i.test(t))){log.event('pause-result',{paused:false,reason:'death screen'});return {paused:false,reason:'death screen'};}
        if(buttons.some(t=>/^(resume|resume game|continue game)$/i.test(t.replace(/◆/g,"").trim()))){log.event('pause-result',{paused:true});return {paused:true};}
        if(i===3)break;
        await page.keyboard.press('Escape');await delay(200);
      }
      log.event('pause-result',{paused:false,reason:'resume control not visible'});return {paused:false,reason:'resume control not visible'};
    }catch{log.event('pause-result',{paused:false,reason:'pause input failed'});return {paused:false,reason:'pause input failed'};}
    finally{await release();busy=false;}
  }
  function publicSession(){
    let s={};try{s=JSON.parse(readFileSync(join(DATA,'session-status.json'),'utf8'));}catch{}
    let startedAt=null;try{const root=resolve(DATA,'runs'),run=resolve(s.run||'');if(run.startsWith(root+'\\')||run.startsWith(root+'/')){const first=JSON.parse(readFileSync(join(run,'trace.jsonl'),'utf8').split('\n')[0]);if(first.kind==='session-start'&&Number.isFinite(first.started))startedAt=new Date(first.started).toISOString();}}catch{}
    const clean=v=>typeof v==='string'?v.replace(/[A-Za-z]:\\[^\s"']+/g,'[local path]').slice(0,4000):null;
    const action=s.lastAction&&typeof s.lastAction==='object'?Object.fromEntries(Object.entries(s.lastAction).filter(([k])=>['kind','keys','ms','x','y','dx','dy','button','controlId'].includes(k))):null;
    return {mode:clean(s.mode),state:clean(s.state),phase:clean(s.phase),epoch:Number.isFinite(s.epoch)?s.epoch:null,calls:Number.isFinite(s.calls)?s.calls:null,turn:Number.isFinite(s.turn)?s.turn:null,goal:clean(s.goal),plan:clean(s.plan),lastNote:clean(s.lastNote),lastAction:action,startedAt,deadline:clean(s.deadline),endedAt:clean(s.endedAt),at:clean(s.at)};
  }
  const server=createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,'http://localhost');let result;
      if(req.method==='GET'&&url.pathname==='/dashboard'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(renderDashboard());return;}
      else if(req.method==='GET'&&url.pathname==='/session')result=publicSession();
      else if(req.method==='POST'&&url.pathname==='/command'){if(req.headers.origin&&req.headers.origin!==`http://127.0.0.1:${CONTROL_PORT}`)throw Error('Invalid origin');if(!String(req.headers['content-type']||'').startsWith('application/json'))throw Error('JSON required');let raw='';for await(const c of req){raw+=c;if(raw.length>1000)throw Error('Request too large');}const {command}=JSON.parse(raw);if(!['hold','resume'].includes(command))throw Error('Invalid command');const file=join(DATA,'command.json'),temp=join(DATA,`.command-${randomBytes(8).toString('hex')}.tmp`);writeFileSync(temp,JSON.stringify({command,at:Date.now()}),{flag:'wx'});renameSync(temp,file);if(command==='hold')await stopAction();else await nativeControl.resume();result={command,issued:true};}
      else if(req.method==='GET'&&url.pathname==='/repair-identity'){
        const characterHash=await readCharacterIdentity();
        result={source:'verification-only',pageId,generation,characterHash};
      }
      else if(req.method==='GET'&&url.pathname==='/health'){const health=nativeControl.health();result={ok:!closing,generation,busy,url:page.url(),pageId,pid:process.pid,...health,capabilities:{...health.capabilities,place:!!nativeModules},...await readHealth()};}
      else if(req.method==='GET'&&url.pathname==='/place')result=await readPlace();
      else if((req.method==='GET'&&['/snapshot','/workflows','/task'].includes(url.pathname))||(req.method==='POST'&&['/task','/task/cancel','/task/reconcile'].includes(url.pathname)))result=await nativeControlRoute(req,url,nativeControl);
      else if(req.method==='GET'&&url.pathname==='/observe')result=await observe();
      else if(req.method==='GET'&&url.pathname==='/native')result=await nativeObservation(Number(url.searchParams.get('after')||0));
      else if(req.method==='GET'&&url.pathname==='/intent'){if(!url.searchParams.has('requestId')&&nativeControl.isBusy())throw Object.assign(Error('requestId required for the active task'),{status:409});result=url.searchParams.has('requestId')?await nativeControlRoute(req,url,nativeControl):await pollNative();}
      else if(req.method==='POST'&&['/intent','/intent/cancel'].includes(url.pathname)){result=await nativeControlRoute(req,url,nativeControl);if(result?.legacyBody){const body=result.legacyBody;if(url.pathname==='/intent'){if(nativeControl.isBusy())throw Object.assign(Error('Request-fenced task is active'),{status:409});result=await startNative(body);}else result=await nativeControl.cancelCurrent(body.reason||'operator cancellation');}}
      else if(req.method==='GET'&&url.pathname==='/screen'){const bytes=lastObs?readFileSync(lastObs.screen):null;if(!bytes)throw Error('No observation');res.writeHead(200,{'content-type':'image/png'});res.end(bytes);return;}
      else if(req.method==='POST'&&url.pathname==='/action'){let raw='';for await(const c of req){raw+=c;if(raw.length>20000)throw Error('Request too large');}const request=JSON.parse(raw);request.observationId=nativeControl.uiObservationId(request.observationId,request.generation);if(nativeStopped)throw Object.assign(Error('Operator stopped control'),{status:409});if(nativeModules&&(['hold','look','swing'].includes(request.action?.kind)||(request.action?.kind==='key'&&request.action.keys?.some(k=>/^(w|a|s|d|arrowup|arrowdown|arrowleft|arrowright)$/i.test(k)))))throw Object.assign(Error('Physical movement requires native intent'),{status:400});result=await runTrustedUI(nativeControl,()=>serialNative(()=>act(request)));}
      else if(req.method==='POST'&&url.pathname==='/stop')result=await stopAction();
      else if(req.method==='POST'&&url.pathname==='/resume')result=await nativeControl.resume();
      else if(req.method==='POST'&&url.pathname==='/pause')result=await pauseGame();
      else if(req.method==='POST'&&url.pathname==='/shutdown'){result={closing:true};setTimeout(()=>void shutdown(true),100);}
      else{res.writeHead(404);res.end();return;}
      res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(result));
    }catch(e){res.writeHead(e.status??500,{'content-type':'application/json'});res.end(JSON.stringify({error:e.message,code:e.code??'TASK_ERROR'}));}
  });
  async function shutdown(closeBrowser=false){if(closing)return;closing=true;generation++;lastObs=null;abortAction?.abort();await nativeControl.stopAll('driver shutdown');if(actionDone)await actionDone;clearInterval(watchdog);await release();server.close();if(closeBrowser){try{const session=await browser.newBrowserCDPSession();await session.send('Browser.close');}catch{}dev?.kill();}await browser.close().catch(()=>{});log.close();}
  await new Promise(r=>server.listen(CONTROL_PORT,'127.0.0.1',r));
  writeFileSync(join(DATA,'browser-status.json'),JSON.stringify({pid:process.pid,port:CONTROL_PORT,url:GAME_URL,started:new Date().toISOString()}));
  process.on('SIGINT',()=>void shutdown());process.on('SIGTERM',()=>void shutdown());
  console.log(JSON.stringify({ready:true,url:GAME_URL,port:CONTROL_PORT}));
  return {page,observe,act,shutdown};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))startBrowser({headless:process.argv.includes('--headless'),mode:sessionMode(),control:process.argv.includes('--control')?process.argv[process.argv.indexOf('--control')+1]:'native'}).catch(e=>{console.error(e);process.exitCode=1;});
