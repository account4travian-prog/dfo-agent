import crypto from 'node:crypto';
// Exact failed plan step only; a turn is the first supported safe retry class.
export function selectTurnRetry(continuation){
 const plan=continuation?.plan,outcome=continuation?.lastOutcome,id=outcome?.authority?.stepId;
 if(!plan||!id||outcome.authority.planId!==plan.planId||outcome.authority.planVersion!==plan.version||!['failed','blocked','interrupted','expired'].includes(outcome.outcome))throw Error('No matching failed plan step in checkpoint');
 const step=plan.steps?.find(s=>s.id===id),degrees=step?.skill==='turn'?step.args?.degrees:step?.task?.kind==='intent'&&step.task.payload?.kind==='turn'?step.task.payload.degrees:null;
 const tolerance=outcome.progress?.turnToleranceDeg;
 if(!Number.isFinite(tolerance)||tolerance<=0||tolerance>12||!Number.isFinite(outcome.targetYaw)||!Number.isFinite(degrees)||Math.abs(degrees)<3||Math.abs(degrees)>180||!['pending','running','failed'].includes(plan.stepStates?.[id]))throw Error('Failed step is not an eligible bounded turn');
 return {stepId:id,degrees,targetYaw:outcome.targetYaw,tolerance,authority:{planId:plan.planId,planVersion:plan.version,stepId:id}};
}
export function verifiedTurn(task,tolerance){return task?.status==='terminal'&&task.outcome==='completed'&&task.cleanupPending!==true&&Number.isFinite(tolerance)&&tolerance>0&&tolerance<=12&&Number.isFinite(task.progress?.angularError)&&task.progress.angularError<=tolerance;}

export async function retryTurn({baseUrl,step,maxMs=10000,stillOwned=()=>true}){
 const url=new URL(baseUrl);if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||!Number.isSafeInteger(maxMs)||maxMs<1000||maxMs>10000)throw Error('Invalid bounded retry endpoint or deadline');
 const request=async(route,body)=>{const r=await fetch(new URL(route,url),{method:body?'POST':'GET',headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(5000)}),value=await r.json();if(!r.ok)throw Error(`${route}: ${value.error??r.status}`);return value;};
 const id=`repair-retry-${crypto.randomUUID()}`;let accepted=false,result=null,error=null,release=null,afterYaw=null,delta=null;
 try{
  if(!stillOwned())throw Error('Repair hold no longer owns the session');
  await request('/resume',{});const s=await request('/snapshot');if(!s.native?.ready||!s.captured?.coherent)throw Error('Fresh native observation unavailable');
  if(!stillOwned())throw Error('Newer operator command');
  if(!Number.isFinite(s.native.state?.yaw))throw Error('Fresh yaw unavailable');
  delta=((step.targetYaw-s.native.state.yaw+540)%360)-180;if(Math.abs(delta)<3)throw Error('Original heading already reached; repair improvement cannot be demonstrated');
  await request('/task',{requestId:id,basis:{observationId:s.observationId,...s.basis},authority:step.authority,task:{kind:'intent',payload:{kind:'turn',degrees:delta,maxMs}}});accepted=true;
  const end=Date.now()+maxMs;while(Date.now()<end&&stillOwned()){const value=await request(`/task?requestId=${id}`);if(value.task?.status==='terminal'){result=value.task;break;}await new Promise(r=>setTimeout(r,100));}
  if(result){const after=await request('/snapshot');afterYaw=after.native?.state?.yaw;}
  if(!result){await request('/task/cancel',{requestId:id,reason:'repair retry deadline or operator hold'});throw Error('Retry deadline or newer operator command');}
 }catch(e){error=e.message;}
 finally{try{release=await request('/stop',{});}catch(e){error??=`Release unavailable: ${e.message}`;}}
 if(release?.cleanupPending!==false)error??='Release unverified';
 const headingError=Number.isFinite(afterYaw)?Math.abs(((step.targetYaw-afterYaw+540)%360)-180):null;
 return {requestId:id,accepted,task:result,release,error,targetYaw:step.targetYaw,dispatchedDelta:delta,afterYaw,headingError,verified:!error&&verifiedTurn(result,step.tolerance)&&headingError!==null&&headingError<=step.tolerance};
}
