import fs from 'node:fs';
import path from 'node:path';
import {buildReport} from './report.mjs';

export function sessionMode(argv=process.argv.slice(2),env=process.env){
 const index=argv.indexOf('--mode'),mode=index<0?(env.DFO_MODE??'online'):argv[index+1];
 if(!['online','offline'].includes(mode))throw Error('Invalid session mode: use --mode online|offline');
 return mode;
}
export function modeFacts(mode){
 sessionMode(['--mode',mode],{});
 return mode==='online'
  ? 'ONLINE session. Saves are server-held and automatically checkpointed. The live QuickSave binding can request a server checkpoint, not a local save slot. Loading is disabled during online play; never use save/load as death recovery. Death uses normal visible respawn, with the screen’s countdown and any zone restrictions. Rest at a fire, tent or bed: the current engine channels for six seconds, then a night passes at once when eligible; rest can be interrupted. No instant overland fast travel; use normal travel and Portal Stones. The enhanced lane is on; mods have selective room-owned rules, so read current settings rather than assuming every bundled mod is forced. Combat uses the engine combat/pcaao.js path through the native fight intent.'
  : 'OFFLINE session. Continue Rowan’s own offline character, use normal save and load controls after meaningful progress, and recover through Rowan’s own save on death. Use the live QuickSave and QuickLoad bindings. Rest uses the normal offline time/rest window. Do not enter Online in this mode.';
}
export function initialGoal(mode){return mode==='online'?'Sign in to the user-created account through the trusted startup workflow, select existing Rowan (create Rowan only if absent), enter DFO Online and pursue useful adventures.':'Continue or create Rowan offline, save progress, learn the controls and pursue useful adventures.';}
// The older aggregate has no mode filter. Validate every epoch BEFORE calling it.
export function buildModeReport(run,mode){
 const readRows=file=>fs.existsSync(file)?fs.readFileSync(file,'utf8').split('\n').slice(0,-1).filter(Boolean).map(JSON.parse):[];
 const session=readRows(path.join(run,'trace.jsonl'));
 const checkRows=rows=>{if(rows.some(e=>e.mode!==undefined&&e.mode!==mode))throw Error('Report mode mismatch; refusing mixed results');};
 checkRows(session);
 const epochs=fs.readdirSync(run,{withFileTypes:true}).filter(d=>d.isDirectory()&&/^epoch-\d+$/.test(d.name));
 const starts=[...session.filter(e=>e.kind==='session-start'),...epochs.flatMap(d=>{
  const events=readRows(path.join(run,d.name,'trace.jsonl')),start=events.find(e=>e.kind==='epoch-start');
  checkRows(events);
  if(events.length&&!start)throw Error('Report mode unavailable for epoch');
  return start?[start]:[];
 })];
 if(!starts.length||starts.some(e=>e.mode!==mode))throw Error('Report mode mismatch or missing mode; refusing mixed results');
 return {mode,...buildReport(run)};
}
