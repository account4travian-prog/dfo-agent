import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {supportedGraph,traceRoute,createBody,bearingTo} from '../vendor/legacy-agent/body/core.mjs';
import {createSessionMap} from '../vendor/legacy-agent/mind/placeMap.mjs';

const capture=JSON.parse(fs.readFileSync(new URL('../vendor/legacy-agent/fixtures/trial-11-corridor.json',import.meta.url)));

test('trial 11 capture: leave the occupied footing, retreat, and approach the closed door over observed floor',()=>{
  const graph=supportedGraph(capture.snapshot);
  const [x,,z]=capture.state.pos;
  assert.equal(traceRoute(graph,x,z,x,z).status,'complete','the Body is already standing here');
  const retreat=traceRoute(graph,x,z,20.25,19.25);
  assert.equal(retreat.status,'complete',JSON.stringify(retreat));
  const door=traceRoute(graph,x,z,23,19.25);
  assert.equal(door.status,'partial',JSON.stringify(door));
  assert.equal(door.reason,'door blocks the way');
  assert.ok(door.points.at(-1)[0]>21.5,'advance along the visible corridor');
  assert.ok(door.points.every(([px])=>px<22),'do not cross the captured shut door');
  assert.equal(traceRoute(graph,x,z,21.25,18.75).status,'none','do not deepen the existing wall overlap');
});

test('trial 11 final scan: the actual captured rays and transferred graph release a supported first step',()=>{
  const scan=capture.scans.find(p=>p.scan.id===1061).scan,held=new Set();let time=scan.time;
  const st={mode:'dungeon',frame:1,pos:[...capture.state.pos],yaw:capture.state.yaw,pitch:capture.state.pitch,
    t:time,scan:{page:scan.page,frame:1,id:scan.id,fresh:true},vitals:{},foes:[]};
  const body=createBody({state:()=>st,view:()=>({scan}),press:k=>held.add(k),release:k=>held.delete(k),
    releaseAll:()=>held.clear(),look:(dx,dy)=>{st.yaw+=dx/3.5;st.pitch-=dy/3.5;}},{now:()=>time});
  const graph=supportedGraph(capture.snapshot);body.setGoal({kind:'goto',x:23,z:19.25});
  assert.equal(body.setNavigation({page:scan.page,frame:1,visit:'recorded',revision:1,
    goalRevision:body.status().goalRevision,graph,route:traceRoute(graph,21.4,19.1,23,19.25)}).ok,true);
  body.enable(true);
  for(let i=0;i<8&&!held.has('MoveForwards');i++){time+=50;st.t=time;body.tick();}
  assert.equal(held.has('MoveForwards'),true,JSON.stringify(body.events().lines.filter(p=>p.kind!=='scan')));
});

test('occupied clearance does not erase corners, protrusions, missing normals or unseen floor',()=>{
  for(const kind of ['water','ledge','door','prop','unknown']) {
    const snap=structuredClone(capture.snapshot);
    Object.assign(snap.surfaces.find(p=>p.ix===42&&p.iz===37),{kind});
    assert.equal(traceRoute(supportedGraph(snap),21.4,19.1,21.75,19.25).status,'none',kind);
  }
  const snap=structuredClone(capture.snapshot);
  const lower=snap.surfaces.find(p=>p.ix===42&&p.iz===37);
  lower.faces.push([21.49,18.9,-1,0]);
  assert.equal(traceRoute(supportedGraph(snap),21.4,19.1,21.75,19.25).status,'none','same-cell protruding corner');
  lower.faces.pop();lower.faces.push([21.2,18.575,0,-1]);
  assert.equal(traceRoute(supportedGraph(snap),21.4,19.1,21.75,19.25).status,'none','old opposite-side face stays a constraint');
  lower.faces=[]; // Missing normals never certify new space in that cell.
  const g=supportedGraph(snap);
  assert.equal(traceRoute(g,21.4,19.1,21.75,19.25).status,'none');
  assert.notEqual(traceRoute(g,21.4,19.1,21.25,18.75).status,'complete');
  const missing={...g,nodes:g.nodes.filter(p=>p.ix!==42||p.iz!==38)};
  assert.equal(traceRoute(missing,21.4,19.1,21.75,19.25).status,'none','occupancy supplies no missing floor');
});

// A motor test double uses only the captured floor and wall/door observations.
// Re-bear those remembered hit points as the fake feet move; this is not a live trial.
function motor({open=false,extra=[]}={}) {
  const snap=structuredClone(capture.snapshot);
  if(open) {
    const m=createSessionMap();m.merge({snapshot:()=>(snap)});
    const scan=structuredClone(capture.scans[0].scan);
    scan.time=Math.max(...snap.surfaces.map(p=>p.time))+1;scan.rays=[];scan.footing=[];
    m.ingest(scan);Object.assign(snap,m.snapshot());
  }
  const graph=supportedGraph(snap);
  let time=0,id=0,scan;
  const held=new Set(),st={mode:'dungeon',frame:1,pos:[...capture.state.pos],yaw:90,pitch:0,t:0,
    scan:{page:capture.state.scan.page,frame:1,id:0,fresh:true},vitals:{},foes:[]};
  const body=createBody({state:()=>st,view:()=>({scan}),press:k=>held.add(k),release:k=>held.delete(k),
    releaseAll:()=>held.clear(),look:(dx,dy)=>{st.yaw+=dx/3.5;st.pitch-=dy/3.5;}},{now:()=>time});
  const floor=snap.surfaces.filter(p=>p.kind==='support'&&p.usable&&p.coverage==='full').map(p=>({ix:p.ix,iz:p.iz,height:p.height}));
  const seen=snap.surfaces.filter(p=>['wall','door','water','ledge'].includes(p.kind)&&p.at).map(p=>({ends:p.kind,at:p.at,normal:p.normal}));
  return {body,st,held,graph,tick({stale=false}={}) {
    time+=50;st.t=time;st.scan.id=++id;
    const rays=[...seen,...extra].map(p=>{const b=bearingTo(st,p.at[0],p.at[2]);return {...p,row:0,bearing:b.bearing,dist:b.dist};}).filter(p=>Math.abs(p.bearing)<=45);
    scan={version:1,page:st.scan.page,frame:1,id,time:stale?time-451:time,pose:{feet:[...st.pos],yaw:st.yaw*Math.PI/180},rays,floor,footing:[],things:[]};
    st.scan.fresh=!stale;body.tick();
    if(held.has('MoveForwards')) {const a=st.yaw*Math.PI/180;st.pos[0]+=Math.sin(a)*.025;st.pos[2]+=Math.cos(a)*.025;}
  },go(x,z) {
    body.setGoal({kind:'goto',x,z});
    const nav={page:st.scan.page,frame:1,visit:'trial-11',revision:1,goalRevision:body.status().goalRevision,graph,route:traceRoute(graph,st.pos[0],st.pos[2],x,z)};
    assert.equal(body.setNavigation(nav).ok,true);body.enable(true);return nav;
  }};
}

test('trial 11 geometry: transferred planner and live guard agree on retreat and the observed open passage',()=>{
  for(const [open,x,z] of [[false,20.25,19.25],[true,23.75,19.25]]) {
    const r=motor({open}),nav=r.go(x,z);
    assert.equal(nav.route.status,'complete',JSON.stringify(nav.route));
    for(let i=0;i<500&&r.body.status().goal.kind!=='idle';i++)r.tick();
    assert.ok(r.body.events().lines.some(e=>e.kind==='arrived'),JSON.stringify({pos:r.st.pos,events:r.body.events().lines.filter(e=>e.kind!=='scan').slice(-10)}));
    assert.ok(Math.hypot(r.st.pos[0]-x,r.st.pos[2]-z)<.3);
  }
});

test('live guard still stops at a shut door, a newly seen protruding bevel and stale sight',()=>{
  for(const options of [{},{open:true,extra:[{ends:'wall',at:[21.8,1,19.2],normal:[-.973,-.229,0]}]},{open:true,stale:true}]) {
    const r=motor(options);r.go(23.75,19.25);
    for(let i=0;i<50;i++)r.tick(options);
    assert.ok(r.st.pos[0]<22,'never step into the shut door or newly seen wall');
    if(options.extra||options.stale)assert.deepEqual(r.st.pos,capture.state.pos);
    assert.equal(r.held.has('MoveForwards'),false);
  }
  const r=motor();const nav=r.go(20.25,19.25);
  nav.graph.wallClearance[0].exitOnly='yes';
  assert.equal(r.body.setNavigation(nav).ok,false,'reject malformed transferred recovery flag');
  nav.graph.wallClearance[0].exitOnly=true;nav.frame=2;
  assert.equal(r.body.setNavigation(nav).ok,false,'reject another frame');
});
