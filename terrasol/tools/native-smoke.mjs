import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {CONTROL_URL,DATA} from '../src/config.mjs';

// Fixed operator test, never a model-powered player. Default is a dry run and
// makes no HTTP requests, starts no services and performs no game input.
export async function smoke(args=process.argv.slice(2)) {
 const value=(key,otherwise)=>{const i=args.indexOf(key);return i<0?otherwise:args[i+1];};
 const kind=value('--case','turn'),maxMs=Number(value('--max-ms','10000'));
 if(!['turn','look','goto','use','explore','fight','retreat','stop'].includes(kind)||!Number.isFinite(maxMs)||maxMs<=0||maxMs>90000)throw Error('Choose a supported --case and --max-ms within 1..90000');
 const plan={kind,maxMs,execute:args.includes('--execute'),modelsInvoked:0,note:'One fixed skill, then pause/hold; no live outcome implied.'};
 if(!plan.execute){console.log(JSON.stringify(plan,null,2));return plan;}
 const request=async(route,body)=>{const res=await fetch(CONTROL_URL+route,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(18000)});const result=await res.json();if(!res.ok)throw Error(`${route}: ${res.status} ${result.error}`);return result;};
 const receipt={startedAt:new Date().toISOString(),plan,requestId:randomUUID()},dir=path.join(DATA,'smoke');fs.mkdirSync(dir,{recursive:true});
 const output=path.join(dir,`${Date.now()}-${receipt.requestId}.json`);let started=false,interrupted=false;
 const stop=()=>{interrupted=true;};process.once('SIGINT',stop);process.once('SIGTERM',stop);
 try {
  const health=await request('/health');if(health.contractVersion!=='dfo-control.v1')throw Error('Compatible native driver must already be running');
  if(health.stopped||health.fault)throw Error('Driver is held; smoke never resumes it automatically');
  const image=args.includes('--images'),before=await request(`/snapshot?ui=${image?1:0}&image=${image?1:0}`);receipt.before=before;
  if(!before.native.ready)throw Error('World native bridge unavailable');
  const intent={kind,maxMs};if(kind==='turn'){intent.degrees=Number(value('--degrees','90'));if(!Number.isFinite(intent.degrees)||Math.abs(intent.degrees)>180)throw Error('Invalid turn angle');}
  if(['goto','use','fight','retreat'].includes(kind)){
   const id=value('--target-id',null),index=Number(value('--target-index','NaN'));
   const target=id?before.native.targets.find(t=>t.target.targetId===id):before.native.targets[index];
   if(!target)throw Error('Choose an actually observed --target-id or --target-index');
   if(['fight','retreat'].includes(kind)?target.kind!=='foe'||!target.target.hostile:target.kind!=='thing')throw Error('Target kind is incompatible with case');
   intent.target=target.target;if(['fight','retreat'].includes(kind))intent.stopHpPct=Number(value('--stop-hp','50'));
  }
  started=true;receipt.accepted=await request('/intent',{requestId:receipt.requestId,basis:{...before.basis,observationId:before.observationId},authority:{planId:'operator-smoke',planVersion:1,stepId:kind},intent,observedTarget:!!intent.target});
  const deadline=Date.now()+maxMs+5000;receipt.polls=[];
  while(!interrupted&&Date.now()<deadline){const poll=await request(`/intent?requestId=${receipt.requestId}`);receipt.polls.push({at:Date.now(),task:poll.task,events:poll.events});if(poll.task?.status==='terminal')break;await new Promise(r=>setTimeout(r,250));}
  receipt.terminal=receipt.polls.at(-1)?.task??null;
  if(receipt.terminal?.status!=='terminal')receipt.cancel=await request('/intent/cancel',{requestId:receipt.requestId,reason:'smoke deadline or operator signal'});
  receipt.after=await request(`/snapshot?ui=${image?1:0}&image=${image?1:0}`);
 } catch(e){receipt.error=e.message;}
 finally {
  if(started){try{receipt.pause=await request('/pause',{});}catch(e){receipt.pauseError=e.message;try{receipt.stop=await request('/stop',{});}catch(e){receipt.stopError=e.message;}}}
  receipt.endedAt=new Date().toISOString();fs.writeFileSync(output,JSON.stringify(receipt,null,2));process.off('SIGINT',stop);process.off('SIGTERM',stop);
 }
 console.log(JSON.stringify({output,terminal:receipt.terminal?.outcome??null,error:receipt.error??null,modelsInvoked:0}));
 if(receipt.error||receipt.terminal?.cleanupPending||receipt.pause?.paused===false)process.exitCode=1;
 return receipt;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))smoke().catch(e=>{console.error(e.message);process.exitCode=1;});
