import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {CONTROL_URL,DATA} from '../src/config.mjs';
// No services or model calls are started. Execution requires an already-running driver.
export async function playerAcceptance(args=process.argv.slice(2)){
 const get=(k,d=null)=>{const i=args.indexOf(k);return i<0?d:args[i+1]};const kind=get('--case','snapshot'),execute=args.includes('--execute'),specPath=get('--spec');
 if(!['snapshot','workflow'].includes(kind)||(kind==='workflow'&&!specPath))throw Error('Use --case snapshot or --case workflow --spec <json>');
 const plan={kind,execute,modelsInvoked:0,spec:specPath?path.resolve(specPath):null};if(!execute){console.log(JSON.stringify(plan,null,2));return plan;}
 const call=async(route,body,timeout=15000)=>{const r=await fetch(CONTROL_URL+route,{method:body?'POST':'GET',headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(timeout)});const v=await r.json();if(!r.ok)throw Error(`${route}: ${v.code??r.status} ${v.error??''}`);return v;};
 const id=randomUUID(),dir=path.join(DATA,'player-acceptance');fs.mkdirSync(dir,{recursive:true});const output=path.join(dir,`${Date.now()}-${id}.json`),receipt={schemaVersion:'dfo-player-acceptance.v1',id,startedAt:new Date().toISOString(),plan};let started=false;
 try{
  const h=await call('/health');if(h.playerContractVersion!=='dfo-player.v1'||h.stopped||h.fault)throw Error('Compatible unheld player driver required');
  receipt.before=await call('/snapshot?ui=1&image=0');
  if(kind==='workflow'){
   const spec=JSON.parse(fs.readFileSync(path.resolve(specPath),'utf8')),catalogue=await call('/workflows'),def=catalogue.workflows.find(w=>w.id===spec.workflowId&&w.version===spec.version);if(!def)throw Error('Workflow is not advertised');
   if(!spec.args||typeof spec.args!=='object'||Array.isArray(spec.args))throw Error('Workflow args are required');
   const payload={workflowId:spec.workflowId,version:spec.version,maxMs:Math.min(spec.maxMs??def.maxMs,def.maxMs),args:{...spec.args,uiObservationId:receipt.before.ui.observationId}};
   const redacted=structuredClone(payload);if('text' in redacted.args)redacted.args.text='[redacted]';receipt.workflow=redacted;
   started=true;receipt.accepted=await call('/task',{requestId:id,basis:{observationId:receipt.before.observationId,...receipt.before.basis},authority:{planId:'operator-player-acceptance',planVersion:1,stepId:spec.workflowId},task:{kind:'workflow',payload}},Math.max(15000,payload.maxMs+5000));
   receipt.polled=await call(`/task?requestId=${encodeURIComponent(id)}`);receipt.after=await call('/snapshot?ui=1&image=0');
  }
 }catch(e){receipt.error=e.message;}finally{if(started)try{receipt.stop=await call('/stop',{});}catch(e){receipt.stopError=e.message;}receipt.endedAt=new Date().toISOString();fs.writeFileSync(output,JSON.stringify(receipt,null,2),{flag:'wx'});}
 console.log(JSON.stringify({output,outcome:receipt.polled?.task?.outcome??null,error:receipt.error??null,modelsInvoked:0}));if(receipt.error||receipt.stop?.cleanupPending)process.exitCode=1;return receipt;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))playerAcceptance().catch(e=>{console.error(e.message);process.exitCode=1;});
