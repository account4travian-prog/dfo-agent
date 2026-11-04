import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
// Rowan's engine is a checkout without its own install, so the files its install step generates (src/firstVisitPins.js
// since 10e43fd0) would be missing and the game page would fail to boot. Run that step the way the engine declares it,
// accepting only `node <script inside the engine>` so a synced engine can never hand this driver a shell command.
export function postinstallScript(engine) {
  const manifest=path.join(engine,'package.json');
  if(!fs.existsSync(manifest))return null;
  const command=JSON.parse(fs.readFileSync(manifest,'utf8')).scripts?.postinstall;
  if(command==null)return null;
  const match=/^node ([\w./-]+\.m?js)$/.exec(String(command).trim());
  const script=match&&path.resolve(engine,match[1]);
  if(!script||!script.startsWith(path.resolve(engine)+path.sep)||!fs.existsSync(script))throw Error(`Unsupported engine postinstall: ${command}`);
  return script;
}
export function prepareEngine(engine,{run=(script)=>spawnSync(process.execPath,[script],{cwd:engine,encoding:'utf8',timeout:120000,windowsHide:true})}={}) {
  const script=postinstallScript(engine);
  if(!script)return {ran:false};
  const result=run(script);
  if(result.status!==0)throw Error(`Engine postinstall failed (${path.relative(engine,script)}): ${String(result.stderr||result.error?.message||'').slice(-1000)}`);
  return {ran:true,script:path.relative(engine,script),output:String(result.stdout??'').trim().slice(-500)};
}
