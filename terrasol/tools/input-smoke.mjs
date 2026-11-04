import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {DATA,DEPENDENCIES,CONTROL_URL,GAME_URL} from '../src/config.mjs';
const req=createRequire(path.join(DEPENDENCIES,'playwright/package.json'));
const {chromium}=req('playwright');
const browser=await chromium.connectOverCDP('http://127.0.0.1:5392');
const page=browser.contexts()[0].pages().find(p=>p.url().startsWith(GAME_URL));
if(!page)throw Error('No game page');
const http=async(route,body)=>{const r=await fetch(CONTROL_URL+route,{method:body?'POST':'GET',...(body&&{headers:{'content-type':'application/json'},body:JSON.stringify(body)})});const v=await r.json();if(!r.ok)throw Error(v.error);return v;};
await page.evaluate(()=>{globalThis.__rowanInputEvidence=[];for(const type of ['mousemove','mousedown','mouseup','keydown','keyup'])document.addEventListener(type,e=>{globalThis.__rowanInputEvidence.push({type:e.type,trusted:e.isTrusted,code:e.code??null,button:e.button??null,dx:e.movementX??null,dy:e.movementY??null,at:performance.now()});if(globalThis.__rowanInputEvidence.length>100)globalThis.__rowanInputEvidence.shift();},{capture:true});});
const steps=[];
async function action(action){const before=await http('/observe');const receipt=await http('/action',{observationId:before.id,generation:before.generation,action});await new Promise(r=>setTimeout(r,500));const after=await http('/observe');steps.push({action,before,receipt,after});}
await action({kind:'click',controlId:0,button:'left'});
await action({kind:'look',dx:40,dy:0});
await action({kind:'look',dx:-40,dy:0});
await action({kind:'key',keys:['F9']});
const events=await page.evaluate(()=>globalThis.__rowanInputEvidence);
const result={at:new Date().toISOString(),pageId:steps[0]?.before.pageId,steps,events,
  trustedMovement:events.some(e=>e.type==='mousemove'&&e.trusted&&Math.abs(e.dx)>0),
  cameraImageChanged:steps[1].before.visualFingerprint!==steps[1].after.visualFingerprint,
  pointerLocked:steps[1].after.pointerLocked,
  note:'Image change alone does not establish movement; inspect trusted input, lock state, and screenshots together.'};
const file=path.join(DATA,'input-smoke.json');fs.writeFileSync(file,JSON.stringify(result,null,2));
console.log(JSON.stringify({file,trustedMovement:result.trustedMovement,cameraImageChanged:result.cameraImageChanged,pointerLocked:result.pointerLocked,events},null,2));
await browser.close();
