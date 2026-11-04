import test from 'node:test';
import assert from 'node:assert/strict';
import {createBody, bearingTo, traceRoute, supportedGraph} from '../vendor/legacy-agent/body/core.mjs';
import {createSessionMap} from '../vendor/legacy-agent/mind/placeMap.mjs';

// A motor rig: real turns, dated scans, supported steps and recorded swings, without a game or gateway.
function motor({reach=2}={}) {
 let time=0,id=0,scan,rat=[0,2];
 const held=new Set(),swings=[],presses=[];
 const st={mode:'dungeon',pos:[0,0,0],frame:1,yaw:0,pitch:0,t:0,scan:{page:'fight',frame:1,id:0,fresh:true},foes:[],vitals:{health:37,maxHealth:37},weapon:{out:true}};
 const body=createBody({state:()=>st,view:()=>({scan}),windowObservation:()=>({text:st.windowText}),press:(k)=>{held.add(k);presses.push({k,time});},release:k=>held.delete(k),releaseAll:()=>held.clear(),
  look:(dx,dy)=>{st.yaw+=dx/3.5;st.pitch-=dy/3.5;},swing:()=>swings.push({time,pitch:st.pitch,dist:bearingTo(st,...rat).dist})},{now:()=>time});
 body.enable(true); body.setPolicy({...body.getPolicy(),settings:{reach}});body.setGoal({kind:'explore',heading:180});
 return {st,body,held,swings,presses,setRat:(p)=>rat=p,tick({visible=true,bodyHit=false,hits=[],move=false,dt=50,unknown=false}={}) {
  time+=dt;st.t=time;const b=bearingTo(st,...rat);
  st.foes=visible?[{type:'Rat',hostile:true,...b,dy:0,h:.4}]:[];
  const floor=[];for(let ix=-4;ix<4;ix++)for(let iz=-4;iz<16;iz++)floor.push({ix,iz,height:0});
  const rays=[...hits];if(bodyHit)rays.push({row:0,bearing:b.bearing,ends:'prop',dist:Math.max(0,b.dist-.3),at:[rat[0],.3,rat[1]-.3]});
  scan={version:1,page:'fight',frame:st.frame,id:++id,time,pose:{feet:[...st.pos],yaw:st.yaw*Math.PI/180},rays,footing:[],floor:unknown?[]:floor,things:[],foes:st.foes};
  st.scan={...st.scan,id,time};body.tick();
  if(move&&held.has('MoveForwards')){const a=st.yaw*Math.PI/180;st.pos[0]+=.05*Math.sin(a);st.pos[2]+=.05*Math.cos(a);}
 }};
}

test('fight focus: blinking rat holds facing and suspends the goal, then expires without hurt',()=>{
 const r=motor();r.tick();
 for(let i=0;i<80;i++) {
  r.tick({visible:i%8<3});
  assert.equal(r.body.status().rule,'defend');
  assert.ok(Math.abs(r.st.yaw)<12,'keeps facing the rat instead of the southward goal');
 }
 for(let i=0;i<65;i++)r.tick({visible:false});
 assert.equal(r.body.status().rule,'default');
 assert.ok(Math.abs(r.st.yaw)>90,'the strategist goal resumes after three seconds');
});

test('fight closing: own prop hits allow closing from 2 m and a low aimed swing; a wall stops the step',()=>{
 const r=motor({reach:1});
 for(let i=0;i<100&&!r.swings.length;i++)r.tick({bodyHit:true,move:true});
 assert.ok(r.st.pos[2]>.5,'closes toward the rat');assert.ok(r.swings.length,'swings at contact');
 assert.ok(r.swings[0].pitch< -30,'aimAt points down');
 const receipt=r.body.events().lines.find(e=>e.kind==='swing').data;
 assert.equal(receipt.contact,true);assert.ok(receipt.dist>receipt.reach&&receipt.dist<=receipt.reach+.45,'only the body footprint extends contact reach');
 const wall=motor({reach:1});
 for(let i=0;i<30;i++)wall.tick({bodyHit:true,move:true,hits:[{row:0,bearing:0,ends:'wall',dist:.6,at:[0,1,.6]}]});
 assert.deepEqual(wall.st.pos,[0,0,0]);assert.equal(wall.swings.length,0);
});

test('trial 8 start disk: escape a raster wall corner on known support, never step deeper into it',()=>{
 const nodes=[];for(let ix=38;ix<45;ix++)for(let iz=35;iz<43;iz++)if(ix!==42||iz!==39)nodes.push({ix,iz,level:0,height:0});
 const graph={cell:.5,nodes,blocked:[[42,39,0]],walls:[[42,39,0]],strips:[]};
 const r=traceRoute(graph,20.656,19.482,20.25,19.25);
 assert.equal(r.status,'complete',r.reason);
 const blocked=traceRoute(graph,20.656,19.482,21.25,19.75);
 assert.notEqual(blocked.status,'complete','the occupied wall cell remains blocked');
 assert.equal(traceRoute({...graph,walls:[]},20.656,19.482,20.25,19.25).status,'none','no escape exemption for unknown, water, ledges or a door');
 assert.equal(traceRoute(graph,21.1,19.6,20.25,19.25).status,'none','starting inside a wall is still unsafe');
});

test('trial 8 wall-corner escape also survives navigation transfer and the live step guard',()=>{
 let time=0,id=0;const held=new Set();
 const st={mode:'dungeon',frame:1,pos:[20.656,0,19.482],yaw:-56.57,pitch:0,t:0,scan:{page:'corner',frame:1,id:0,fresh:true},foes:[],vitals:{health:37,maxHealth:37}};
 let scan;
 const body=createBody({state:()=>st,view:()=>({scan}),press:k=>held.add(k),release:k=>held.delete(k),releaseAll:()=>held.clear(),look:(dx,dy)=>{st.yaw+=dx/3.5;st.pitch-=dy/3.5;}},{now:()=>time});
 const nodes=[];for(let ix=38;ix<45;ix++)for(let iz=35;iz<43;iz++)if(ix!==42||iz!==39)nodes.push({ix,iz,level:0,height:0});
 body.setGoal({kind:'goto',x:20.25,z:19.75});
 assert.equal(body.setNavigation({page:'corner',frame:1,visit:'v',revision:1,goalRevision:body.status().goalRevision,
  graph:{cell:.5,nodes,blocked:[[42,39,0]],walls:[[42,39,0]],strips:[]},route:{status:'complete',points:[[20.25,19.75,0]],reason:'supported'}}).ok,true);
 body.enable(true);
 for(let i=0;i<25&&body.status().goal.kind!=='idle';i++) {
  time+=50;st.t=time;st.scan.id=++id;
  scan={version:1,page:'corner',frame:1,id,time,pose:{feet:[...st.pos],yaw:st.yaw*Math.PI/180},rays:[{row:-.7,ends:'wall',at:[21.227,1.385,19.825]}],footing:[]};
  body.tick();if(held.has('MoveForwards')){const a=st.yaw*Math.PI/180;st.pos[0]+=.05*Math.sin(a);st.pos[2]+=.05*Math.cos(a);}
 }
 assert.ok(st.pos[0]<20.5,'steps out of the corner');
 assert.ok(body.events().lines.some(e=>e.kind==='arrived'));
 assert.ok(!body.events().lines.some(e=>e.kind==='goal-failed'));
});

test('hurt without a visible foe renews focus and faces its last world position, without blind swings',()=>{
 const r=motor();r.tick();for(let i=0;i<50;i++)r.tick({visible:false});
 const swings=r.swings.length;r.st.yaw=100;r.st.vitals.health-=2;r.tick({visible:false});
 for(let i=0;i<20;i++)r.tick({visible:false});
 assert.ok(Math.abs(r.st.yaw)<12);assert.equal(r.swings.length,swings);assert.equal(r.held.size,0);
 for(let i=0;i<42;i++)r.tick({visible:false});
 assert.equal(r.body.status().rule,'default');
});

test('fight admission survives range flicker; the tactician can replace it immediately',()=>{
 const r=motor();r.tick();r.setRat([0,2.7]);r.tick();
 assert.equal(r.body.status().rule,'defend');
 r.body.setPolicy({rules:[{id:'stop',do:{act:'stop'}}]});r.tick();
 assert.equal(r.body.status().rule,'stop');assert.equal(r.held.size,0);
 r.body.setPolicy({rules:[{id:'goal',do:{act:'followGoal'}}]});r.tick({visible:false});
 assert.equal(r.body.status().rule,'goal');assert.ok(Math.abs(r.st.yaw)>12,'a replacement table is obeyed during memory');
});

test('remembered fight respects disable, lease, death, pause and frame boundaries',()=>{
 for(const gate of ['disable','lease','death','pause','frame']) {
  const r=motor();r.tick();r.st.yaw=100;const swings=r.swings.length;
  if(gate==='disable')r.body.enable(false);
  if(gate==='lease')r.body.enable(true,10);
  if(gate==='death')r.st.vitals.health=0;
  if(gate==='pause')r.st.paused=true;
  if(gate==='frame')r.st.frame++;
  r.tick({visible:false});assert.equal(r.held.size,0,gate);assert.equal(r.swings.length,swings,gate);
  assert.equal(r.st.yaw,100,gate);
 }
});

test('fight memory never substitutes its admission distance into another policy rule',()=>{
 const r=motor();
 r.body.setPolicy({rules:[{id:'range-stop',when:{noHostileWithin:2.6},do:{act:'stop'}},...r.body.getPolicy().rules]});
 r.tick();assert.equal(r.body.status().rule,'defend');
 r.setRat([0,2.7]);r.tick();assert.equal(r.body.status().rule,'range-stop');assert.equal(r.held.size,0);
});

test('a tutorial at trial 8 distance (2.1 m), with clipped state text, dismisses after 550 ms',()=>{
 const r=motor();r.setRat([0,2.1]);r.tick();r.st.vitals.health-=2;r.tick();
 r.st.overlay=true;r.st.window='[Z] draws\nway you\n[MOUSE';r.st.windowText='Fighting\n[Z] draws your weapon\nclick or press any key';
 r.tick({visible:false});for(let i=0;i<10;i++)r.tick({visible:false});
 assert.equal(r.presses.filter(p=>p.k==='ActivateCursor').length,0);
 r.tick({visible:false});assert.equal(r.presses.filter(p=>p.k==='ActivateCursor').length,1);
 assert.ok(r.body.events().lines.some(e=>e.kind==='tutorial-dismissed'));
});

test('real walls, water, ledges and drops still stop closing, even within a foe footprint',()=>{
 for(const ends of ['wall','water','ledge','ground']) {
  const r=motor({reach:.5});r.setRat([0,.9]);
  for(let i=0;i<12;i++)r.tick({bodyHit:true,move:true,hits:[{row:0,bearing:0,ends,dist:.7,height:ends==='ground'?-1:0,at:[0,ends==='ground'?-1:0,.7]}]});
  assert.deepEqual(r.st.pos,[0,0,0],ends);assert.equal(r.swings.length,0,ends);
 }
 const door=motor({reach:.5});door.setRat([0,.9]);
 for(let i=0;i<12;i++)door.tick({bodyHit:true,move:true,hits:[{row:0,bearing:0,ends:'door',dist:.7,at:[0,1,.7]}]});
 assert.ok(door.st.pos[2]>0,'a door hazard no longer blocks closing on a visible foe');
 const unknown=motor({reach:.5});for(let i=0;i<12;i++)unknown.tick({bodyHit:true,unknown:true,move:true});
 assert.deepEqual(unknown.st.pos,[0,0,0],'no inferred floor beneath an actor');
});

test('recent body positions do not poison the live guard or the shared planning graph',()=>{
 const r=motor({reach:.5});r.setRat([0,1]);r.tick({bodyHit:true});r.setRat([.5,1]);
 r.tick({hits:[{row:0,bearing:0,ends:'prop',dist:.7,at:[0,.3,.7]}],move:true});
 assert.ok(r.held.has('MoveForwards'),'recent body hit is ignored while closing');
 const m=createSessionMap();let id=0,time=0;
 const ingest=(foes,rays)=>m.ingest({version:1,page:'actors',frame:1,id:++id,time:time+=50,pose:{feet:[0,0,0],yaw:0},foes,rays,footing:[]});
 const prop={row:0,ends:'prop',dist:.7,at:[0,.3,.7]};
 ingest([], [prop]);assert.ok(m.snapshot().surfaces.some(p=>p.kind==='prop'));
 ingest([{hostile:true,dist:1,bearing:0,h:.4}], [prop]);
 assert.equal(supportedGraph(m.snapshot()).blocked.length,0,'a recognised actor clears its old prop stamp');
 ingest([], [prop]);assert.equal(supportedGraph(m.snapshot()).blocked.length,0,'recent position is retained');
 time+=1100;ingest([], [prop]);assert.ok(supportedGraph(m.snapshot()).blocked.length,'an unrelated prop after the trail expires is solid');
});
