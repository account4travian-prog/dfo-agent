import {createServer} from 'node:http';
import {createNativeController,nativeControlRoute,runTrustedUI} from '../../src/native-controller.mjs';
export async function rig({timeoutMs=100,delayStart=null,hangPoll=false,releaseFails=false,changeSceneDuringUI=false,badCancel=false,completeAfterPolls=0,badTurn=false,failTurn=false,initialYaw=0}={}) {
  let uiWrites=0;
  let generation=1,frame=1,yaw=initialYaw,task=null,starts=0,images=0,stops=0,uiCaptures=0,polls=0,taskPolls=0;
  const controller=createNativeController({timeoutMs,basis:()=>({generation,pageId:'page'}),
    readNative:async()=>({ready:true,state:{frame,yaw,pos:[0,0,0],scan:{fresh:true}},targets:[{kind:'thing',target:{kind:'door',targetId:'door-1',x:1,z:2}}],events:{lines:[]}}),
    readUI:async({image})=>{uiCaptures++;if(image)images++;if(changeSceneDuringUI)frame++;return {id:uiCaptures,screen:image?'fake.png':null};},
    runUI:async()=>({issued:++uiWrites}),
    start:async body=>{if(delayStart)await delayStart;if(body.generation!==generation)throw Object.assign(Error('Stale generation'),{status:409});starts++;taskPolls=0;task={id:starts,generation,frame,kind:body.intent.kind,targetYaw:body.intent.kind==='turn'?yaw+body.intent.degrees:undefined,status:'running',progress:{}};return task;},
    poll:async()=>{polls++;taskPolls++;if(hangPoll)return new Promise(()=>{});if(completeAfterPolls&&taskPolls>=completeAfterPolls){if(task?.targetYaw!=null)yaw=task.targetYaw;task={...task,status:'terminal',outcome:failTurn?'failed':'completed',progress:{displacement:3,remaining:0,angularError:badTurn?20:0,turnToleranceDeg:12}};}return {task,events:[]};},
    cancel:async reason=>{if(task)task={...task,status:'terminal',outcome:'cancelled',reason,cleanupPending:badCancel};return task;},
    forceStop:async()=>{stops++;if(releaseFails)throw Error('release unavailable');return {ok:true};},latchStop:()=>generation++});
  const server=createServer(async(req,res)=>{try {const url=new URL(req.url,'http://localhost');const result=url.pathname==='/health'?controller.health():url.pathname==='/stop'?await controller.stopAll():url.pathname==='/resume'?await controller.resume():url.pathname==='/action'?await runTrustedUI(controller,async()=>({issued:++uiWrites})):await nativeControlRoute(req,url,controller);res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(result));}catch(e){res.writeHead(e.status??500,{'content-type':'application/json'});res.end(JSON.stringify({error:e.message,code:e.code}));}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
  const request=async(path,body)=>{const res=await fetch(base+path,{method:body?'POST':'GET',headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(2500)});return {status:res.status,data:await res.json()};};
  return {base,controller,request,close:async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));},get starts(){return starts},get images(){return images},get stops(){return stops},get uiCaptures(){return uiCaptures},get uiWrites(){return uiWrites},get polls(){return polls},setFrame:n=>frame=n,complete:()=>{task={...task,status:'terminal',outcome:'completed',progress:{angularError:0}};}};
}
