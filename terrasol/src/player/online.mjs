import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {readLiveBindings,bindingKey} from './bindings.mjs';

const hold=(code,message)=>Object.assign(Error(message),{code,status:409});
export function validatePlayerInput(action,target={}){
 if(target.characterName&&target.characterName!=='Rowan')throw hold('character-refused',target.characterName==='Tiger Fist'?'Tiger Fist belongs to the user and is refused':'Only Rowan may be selected');
 if(target.accountField||target.accountAction&&!['sign in','back','close'].includes(String(target.accountAction).toLowerCase())||target.loginSubmit)throw hold('account-private','Account input requires startup.sign-in; account creation and guest play are not authorized');
 if(target.creationName&&(action.kind==='type'?action.text!=='Rowan':target.value&&target.value!=='Rowan'))throw hold('character-refused','Creation name must be Rowan');
}
export function readAccount(env=process.env){
 try{
  const file=env.DFO_ROWAN_ACCOUNT_FILE??path.join(env.USERPROFILE??os.homedir(),'.dfo-rowan','account.json');
  const stat=fs.statSync(file);if(!stat.isFile()||stat.size>8192)throw Error();
  const value=JSON.parse(fs.readFileSync(file,'utf8'));
  if(typeof value.handle!=='string'||!value.handle.trim()||value.handle.length>24||typeof value.password!=='string'||!value.password||value.password.length>200)throw Error();
  return {handle:value.handle,password:value.password};
 }catch{throw hold('account-missing','account-missing: provide a readable account JSON with handle and password');}
}
// Volatile driver-only redaction. These values are never persisted or returned
// by an observation, receipt, logger or decision-context builder.
export function createAccountInput(read=readAccount){
 const privateValues=new Set();
 const redact=(value,key=null)=>{
  if(['mode','sessionMode'].includes(key)&&['online','offline'].includes(value))return value;
  if(['name','characterName'].includes(key)&&value==='Rowan')return value;
  if(typeof value==='string'){for(const secret of [...privateValues].sort((a,b)=>b.length-a.length))value=value.split(secret).join('[redacted]');return value;}
  if(Array.isArray(value))return value.map(v=>redact(v));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,redact(v,k)]));
  return value;
 };
 return {read(){const value=read();privateValues.add(value.handle);privateValues.add(value.password);return value;},redact};
}
export function rowanAction(ui,{name='Rowan',allowCreate=false}={}){
 if(name!=='Rowan')throw hold('character-refused',name==='Tiger Fist'?'Tiger Fist belongs to the user and is refused':'Only Rowan may be selected');
 if(!ui.account?.signedIn||!ui.realmReady)throw hold('realm-unavailable','Signed-in online character list is not ready');
 const rows=(ui.characters??[]).filter(c=>c.name==='Rowan');
 if(rows.length>1)throw hold('character-ambiguous','Multiple Rowan characters; selection held');
 if(rows.length===1){
  const control=(ui.controls??[]).find(c=>c.id===rows[0].playId&&c.text?.toLowerCase()==='play'&&!c.disabled);
  if(!control)throw hold('character-unavailable','Rowan has no enabled Play control');
  return {kind:'click',controlId:control.id};
 }
 if(!allowCreate)throw hold('rowan-missing','No Rowan character; creation requires allowCreate');
 const controls=(ui.controls??[]).filter(c=>c.text==='New online character'&&!c.disabled);
 if(controls.length!==1)throw hold('character-unavailable','New online character control is absent or ambiguous');
 return {kind:'click',controlId:controls[0].id};
}
export async function executeSignIn({ui,read=readAccount,fill,click,waitSignedIn,check=()=>{}}){
 if(ui.account?.signedIn)return {issued:false,skipped:true,account:'redacted'};
 const account=ui.account;
 if(!account?.login||![account.handleId,account.passwordId,account.submitId].every(Number.isSafeInteger))throw hold('account-screen','Open the existing-account Sign in screen first');
 const credentials=read();
 try{
  check();await fill(account.handleId,credentials.handle);check();
  await fill(account.passwordId,credentials.password);check();await click(account.submitId);check();
  if(!await waitSignedIn())throw Error();check();
  return {issued:true,signedIn:true,account:'redacted'};
 }catch{throw hold('account-sign-in-unverified','Account sign-in input failed');}
 finally{credentials.handle='';credentials.password='';}
}
const sameRowan=(a,b)=>a?.mode==='online'&&b?.mode==='online'&&a.character?.name==='Rowan'&&b.character?.name==='Rowan'&&!!a.character.idHash&&a.character.idHash===b.character.idHash;
export function recoveryObserved(before,after){return sameRowan(before,after)&&before.phase==='death'&&Number.isFinite(before.vitals?.health)&&before.vitals.health<=0&&after.phase==='world'&&Number.isFinite(after.vitals?.health)&&after.vitals.health>0;}
export function restObserved(before,after){return sameRowan(before,after)&&before.vitals?.health>0&&after.vitals?.health>0&&['health','fatigue','magicka'].some(k=>Number.isFinite(before.vitals[k])&&Number.isFinite(after.vitals[k])&&after.vitals[k]>before.vitals[k]);}
export async function readOnlineState(page){
 const value=await page.evaluate(async()=>{
  const {playerEntity:p}=await import('/src/characters/playerEntity.js');
  const {isOnlinePage}=await import('/src/systems/online/onlineLane.js');
  const rest=document.querySelector('#enhanced-rest'),restButtons=[...(rest?.querySelectorAll('button')??[])].map(e=>e.textContent.trim());
  const native=globalThis.__agent?.state?.();
  return {mode:isOnlinePage()?'online':'offline',worldReady:!!native&&!native.loading&&!document.querySelector('#enhanced-menu'),name:p.name??null,id:typeof p.characterId==='string'?p.characterId:null,vitals:Object.fromEntries(['health','fatigue','magicka'].map(k=>[k,Number.isFinite(p[k])?p[k]:null])),phase:p.health<=0?'death':'world',restEnded:!!rest&&restButtons.includes('OK')&&!restButtons.includes('Stop'),restInterrupted:!!rest?.textContent.includes('Your rest is interrupted.')};
 });
 const {createHash}=await import('node:crypto');
 const {id,name,...state}=value;
 return {...state,character:{name,idHash:id?createHash('sha256').update(id).digest('hex'):null}};
}
// Runs inside the existing browser input gate. Page code only reads; every write
// is a trusted visible-control click/fill or a live-bound key press.
export async function executeOnlineUI({page,ui,action,check=()=>{},sleep=ms=>new Promise(r=>setTimeout(r,ms)),read=readAccount,readState=()=>readOnlineState(page)}){
 const byId=id=>page.locator(`[data-rowan-id="${id}"]`);
 const click=async id=>{
  const c=ui.controls.find(c=>c.id===id&&!c.disabled);if(!c)throw hold('STALE_CONTROL','Control unavailable');
  const target=byId(id);check();
  const valid=await target.evaluate((e,c)=>{
   const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
   const names=[...document.querySelectorAll('.svrealm .svtile .svtop h3')].map(e=>e.textContent.trim());
   const rowanCount=names.filter(n=>n==='Rowan').length;
   return e.isConnected&&!e.disabled&&r.width>0&&r.height>0&&(hit===e||e.contains(hit))&&(e.innerText??'').trim()===c.text&&(!c.characterName||c.characterName==='Rowan'&&rowanCount===1&&e.closest('.svtile')?.querySelector('.svtop h3')?.textContent?.trim()===c.characterName)&&(c.text!=='New online character'||rowanCount===0);
  },c);check();if(!valid)throw hold('STALE_CONTROL','Control changed since observation');
  await target.click({timeout:1500});check();
 };
 const waitFor=async predicate=>{const until=Date.now()+11000;while(Date.now()<until){check();if(await predicate())return true;await sleep(150);}return false;};
 if(action.kind==='account-sign-in'&&!ui.account?.signedIn&&!ui.account?.login){
  const labels=ui.account?.open?['Sign in']:['Sign in or continue as guest','Account profile'];
  const controls=labels.map(label=>ui.controls.filter(c=>c.text?.toLowerCase()===label.toLowerCase()&&!c.disabled)).find(rows=>rows.length===1);
  if(!controls)throw hold('account-screen','Open the existing-account Sign in screen first');
  // The profile mark's accessible name is deliberately redacted by the reader.
  if(controls[0].text==='Account profile'){
   const target=byId(controls[0].id);check();
   if(!await target.evaluate(e=>e.matches('.px-profile')))throw hold('STALE_CONTROL','Account profile changed');
   await target.click({timeout:1500});check();
  }else await click(controls[0].id);
  return {issued:true,stage:'account-navigation',account:'redacted'};
 }
 if(action.kind==='account-sign-in')return executeSignIn({ui,read,check,
  fill:async(id,value)=>{
   const c=ui.controls.find(c=>c.id===id&&c.accountField&&!c.disabled);if(!c)throw hold('STALE_CONTROL','Account field unavailable');
   const target=byId(id),expected=id===ui.account.handleId?'username':'current-password';
   if(!await target.evaluate((e,expected)=>!!e.closest('.acct')&&e.autocomplete===expected,expected))throw hold('STALE_CONTROL','Account field changed');
   check();await target.fill(value,{timeout:1500});check();
  },click,waitSignedIn:()=>waitFor(()=>page.evaluate(()=>!!document.querySelector('.acctin')))});
 if(action.kind==='rowan-start'){
  const selected=rowanAction(ui,{allowCreate:action.allowCreate===true}),creating=!ui.characters.some(c=>c.name==='Rowan');
  await click(selected.controlId);
  const observed=await waitFor(async()=>{if(creating)return page.locator('.stagebody').isVisible();const after=await readState();return after.worldReady&&after.mode==='online'&&after.character?.name==='Rowan'&&!!after.character.idHash;});
  if(!observed)throw hold('character-unverified','Rowan startup result unverified');
  return {issued:true,character:'Rowan',creationOpened:creating};
 }
 const before=await readState();check();
 if(before.mode!=='online'||before.character?.name!=='Rowan'||!before.character.idHash)throw hold('character-refused','Online recovery requires the active Rowan');
 if(action.kind==='online-respawn'){
  if(before.phase!=='death')throw hold('respawn-unavailable','Rowan is not on the death screen');
  const rises=ui.controls.filter(c=>c.tag==='button'&&/(?:^|\s)Rise(?: now)?$/.test(c.text)&&!c.disabled);
  if(rises.length!==1)throw hold('respawn-wait','Wait for the visible online respawn countdown');
  await click(rises[0].id);
  if(!await waitFor(async()=>recoveryObserved(before,await readState())))throw hold('recovery-unverified','Living Rowan respawn unverified');
  return {issued:true,recovery:'observed'};
 }
 if(action.kind!=='online-rest')throw hold('UNSUPPORTED_ACTION','Unsupported online operation');
 const key=bindingKey(await readLiveBindings(page),'Rest');if(!key)throw hold('rest-unavailable','Rest has no keyboard binding; use visible controls');
 if(before.phase==='death')throw hold('rest-unavailable','Cannot rest while dead');
 await page.keyboard.press(key);check();
 if(!await waitFor(async()=>{const after=await readState();return after.restEnded&&!after.restInterrupted&&restObserved(before,after);}))throw hold('rest-unverified','Online rest gain unverified or rest refused');
 return {issued:true,rest:'own-vital-gain-observed'};
}
