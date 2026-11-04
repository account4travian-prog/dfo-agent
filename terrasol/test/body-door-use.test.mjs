import test from 'node:test';
import assert from 'node:assert/strict';
import {createBody,bearingTo} from '../vendor/legacy-agent/body/core.mjs';
import {createPlaceMemory} from '../vendor/legacy-agent/mind/memory.mjs';
import {navigationFor} from '../vendor/legacy-agent/mind/route.mjs';

// Trial 7's door coordinates: nine metres east, in a 10 x 3.5 m pictured room.
const door={x:22.475,z:19.2},goal={kind:'use',...door};
const inside=(x,z)=>x>12.5&&x<22.5&&z>17.5&&z<21;
const floor=[];
for(let ix=25;ix<45;ix++)for(let iz=35;iz<42;iz++)floor.push({ix,iz,height:0});
const ceiling=floor.map(({ix,iz})=>({ends:'wall',row:.7,at:[(ix+.5)*.5,3,(iz+.5)*.5],normal:[0,-1,0]}));
const wall=Array.from({length:7},(_,i)=>({ends:i===3?'door':'wall',row:0,
  at:[door.x,1,17.75+i*.5],normal:[-1,0,0]}));
const sample=(over={})=>({version:1,page:'door-use',frame:1,id:1,time:0,
  pose:{feet:[13.475,0,door.z],yaw:Math.PI/2},floor,water:[],rays:[...ceiling,...wall],footing:[],
  things:[{kind:'door',...door,y:1.125,dist:9,bearing:0}],...over});
function snapshot() {
  const m=createPlaceMemory(),scan=sample(),st={mode:'dungeon',pos:[...scan.pose.feet],yaw:90,t:0,
    frame:1,scan:{page:scan.page,frame:1,id:scan.id,time:0,fresh:true}};
  m.observe(st);m.ingestScan(st,scan);
  return m.snapshot(st);
}

test('door use: remembered place-map route ends within use reach without entering the door cell',t=>{
  const snap=snapshot(),remembered=snap.things.find(p=>p.kind==='door');
  assert.ok(remembered,'door is retained with its position in the memory the mind reads');
  const nav=navigationFor({pos:[13.475,0,door.z],frame:1,scan:{page:'door-use'}},snap,{kind:'use',x:remembered.x,z:remembered.z});
  const end=nav.route.points.at(-1);
  assert.ok(end,nav.route.reason);
  assert.ok(Math.hypot(end[0]-door.x,end[1]-door.z)<=1.6,JSON.stringify(nav.route));
  assert.ok(nav.graph.blocked.some(([x,z])=>x===44&&z===38),'door stays a hazard');
  assert.ok(!nav.route.points.some(([x,z])=>Math.floor(x/.5)===44&&Math.floor(z/.5)===38));
  t.diagnostic(JSON.stringify(nav.route));
});

// Same clock, three-line footing and held-key motor as seen-floor.test.mjs.
function motor() {
  let time=0,id=0,scan;
  const held=new Set(),presses=[];
  const st={mode:'dungeon',pos:[13.475,0,door.z],frame:1,yaw:0,pitch:0,t:0,
    scan:{page:'door-use',frame:1,id:0,time:0,fresh:true},foes:[],vitals:{}};
  const body=createBody({state:()=>st,view:()=>({scan}),press:k=>{
    if(k==='ActivateCenterObject')presses.push({pos:[...st.pos],...bearingTo(st,door.x,door.z)});
    else held.add(k);
  },release:k=>held.delete(k),releaseAll:()=>held.clear(),
    look:(dx,dy)=>{st.yaw+=dx/3.5;st.pitch-=dy/3.5;}},{now:()=>time});
  body.enable(true);
  function tick({move=true,visible=true,fresh=true}={}) {
    time+=50;st.t=time;
    const yaw=st.yaw*Math.PI/180,feet=[...st.pos],footing=[];
    for(let station=1;station<=32;station++)for(const side of [-.35,0,.35]) {
      const reach=station*.25,at=[feet[0]+Math.sin(yaw)*reach+Math.cos(yaw)*side,0,feet[2]+Math.cos(yaw)*reach-Math.sin(yaw)*side];
      footing.push({station,side,reach,at,height:0,ends:inside(at[0],at[2])?'ground':'unknown'});
    }
    let front=12;
    for(let d=.05;d<=12;d+=.05)if(!inside(feet[0]+Math.sin(yaw)*d,feet[2]+Math.cos(yaw)*d)){front=d;break;}
    const b=bearingTo(st,door.x,door.z);
    scan=sample({id:++id,time,pose:{feet,yaw},footing,
      rays:[...ceiling,...wall],
      things:visible&&Math.abs(b.bearing)<=45?[{kind:'door',...door,y:1.125,...b}]:[]});
    st.scan={...st.scan,id,time,fresh};st.front=front;body.tick();
    if(move&&held.has('MoveForwards')) {
      const a=st.yaw*Math.PI/180;st.pos[0]+=Math.sin(a)*.06;st.pos[2]+=Math.cos(a)*.06;
    }
  }
  tick({move:false}); // Body remembers floor while idle; the mind transfers its place-map graph.
  body.setGoal(goal);
  assert.equal(body.setNavigation(navigationFor(st,snapshot(),goal,body.status().goalRevision)).ok,true);
  return {st,body,held,presses,tick};
}
const details=r=>JSON.stringify({pos:r.st.pos,presses:r.presses,events:r.body.events().lines.filter(e=>e.kind!=='scan')});

test('door use: walks from across the room, faces the freshly seen door and presses use once',t=>{
  const r=motor();
  for(let i=0;i<600&&r.body.status().goal.kind!=='idle';i++) {
    r.tick();assert.ok(r.st.pos[0]<door.x-.35,'never walks into the door');
  }
  assert.equal(r.presses.length,1,details(r));
  assert.ok(r.presses[0].pos[0]>20,'walked east across the room');
  assert.ok(r.presses[0].dist<=1.6,details(r));
  assert.ok(Math.abs(r.presses[0].bearing)<=12,details(r));
  assert.equal(r.held.size,0);
  t.diagnostic(details(r));
});

for(const mode of ['unseen','stale'])test(`door use: a remembered door cannot be activated when the target is ${mode}`,()=>{
  const r=motor();
  for(let i=0;i<600&&r.st.pos[0]<20.8&&r.body.status().goal.kind!=='idle';i++)r.tick();
  assert.ok(r.st.pos[0]>=20.8,details(r));
  for(let i=0;i<100&&r.body.status().goal.kind!=='idle';i++)r.tick({visible:mode!=='unseen',fresh:mode!=='stale'});
  assert.equal(r.presses.length,0,details(r));
  assert.ok(r.body.events().lines.some(e=>e.kind==='goal-failed'&&e.text==='use needs a fresh visible target or plaque'),details(r));
  assert.equal(r.held.size,0);
});
