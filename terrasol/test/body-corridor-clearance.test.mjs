import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionMap} from '../vendor/legacy-agent/mind/placeMap.mjs';
import {supportedGraph,traceRoute,createBody} from '../vendor/legacy-agent/body/core.mjs';

function corridor({normals=true,north=19.825,south=18.575}={}) {
  const floor=[],rays=[];
  for(let ix=40;ix<53;ix++) {
    for(let iz=36;iz<41;iz++)if((iz+.5)*.5>south&&(iz+.5)*.5<north)floor.push({ix,iz,height:0});
    for(const [z,nz] of [[north,-1],[south,1]])rays.push({ends:'wall',row:0,at:[(ix+.5)*.5,1,z],...(normals?{normal:[0,0,nz]}:{})});
  }
  const scan={version:1,page:'corridor',frame:1,id:1,time:50,pose:{feet:[21.58,0,19.25],yaw:Math.PI/2},floor,rays,footing:[],things:[]};
  const map=createSessionMap();map.ingest(scan);
  return {scan,map,graph:supportedGraph(map.snapshot())};
}

test('trial 10: observed wall faces permit full-radius walking along the 1.25 m passage',()=>{
  const {graph}=corridor();
  const route=traceRoute(graph,21.58,19.25,25.25,19.25);
  assert.equal(route.status,'complete',route.reason);
  const merged=createSessionMap();merged.merge(corridor().map);
  assert.equal(traceRoute(supportedGraph(merged.snapshot()),21.58,19.25,25.25,19.25).status,'complete','map merge retains floor and face proof');
  assert.ok(graph.blocked.some(([ix,iz])=>ix===43&&iz===39),'wall stays blocked');
  assert.notEqual(traceRoute(graph,21.58,19.25,23.25,19.75).status,'complete','cannot enter the wall cell');
});

test('wall face clearance needs a valid normal, enough width and observed supporting floor',()=>{
  assert.equal(traceRoute(corridor({normals:false}).graph,21.58,19.25,25.25,19.25).status,'none');
  assert.equal(traceRoute(corridor({north:19.55,south:18.95}).graph,21.58,19.25,25.25,19.25).status,'none');
  const {graph}=corridor();graph.nodes=[];
  assert.equal(traceRoute(graph,21.58,19.25,25.25,19.25).status,'none');
});

test('corners retain every face across fresh floor and map merge; an unresolved sloped face stays blocked',()=>{
  const r=corridor(),extra={ends:'wall',at:[21.9,1,19.7],normal:[-1,0,0]};
  r.map.ingest({...r.scan,id:2,time:100,rays:[...r.scan.rays,extra]});
  r.map.ingest({...r.scan,id:3,time:150});
  const wall=r.map.snapshot().surfaces.find(p=>p.ix===43&&p.iz===39);
  assert.equal(wall.faces.length,2,'fresh floor cannot erase a corner face');
  const merged=createSessionMap();merged.merge(r.map);
  assert.equal(merged.snapshot().surfaces.find(p=>p.ix===43&&p.iz===39).faces.length,2);
  assert.equal(traceRoute(supportedGraph(merged.snapshot()),21.58,19.25,25.25,19.25).status,'none');
  const slope=corridor();slope.map.ingest({...slope.scan,id:2,time:100,rays:[{...extra,normal:[-.973,-.229,0]}]});
  const uncertain=supportedGraph(slope.map.snapshot()).wallClearance.find(p=>p.ix===43&&p.iz===39);
  assert.equal(uncertain.exitOnly,true,'a slope never earns unrestricted face clearance');
  assert.notEqual(traceRoute(supportedGraph(slope.map.snapshot()),21.58,19.25,21.75,19.75).status,'complete','cannot add new space inside the uncertain cell');
});

test('trial 10: the transferred graph and live guard walk the narrow observed passage',()=>{
  const r=corridor(),held=new Set();let time=50,scan=r.scan,id=1;
  const st={mode:'dungeon',frame:1,pos:[21.58,0,19.25],yaw:90,pitch:0,t:time,
    scan:{page:'corridor',frame:1,id:1,fresh:true},foes:[],vitals:{health:27,maxHealth:37},front:null};
  const body=createBody({state:()=>st,view:()=>({scan}),press:k=>held.add(k),release:k=>held.delete(k),releaseAll:()=>held.clear(),
    look:(dx,dy)=>{st.yaw+=dx/3.5;st.pitch-=dy/3.5;}},{now:()=>time});
  body.setGoal({kind:'goto',x:25.25,z:19.25});
  const nav={page:'corridor',frame:1,visit:'v',revision:1,goalRevision:body.status().goalRevision,graph:r.graph,route:traceRoute(r.graph,21.58,19.25,25.25,19.25)};
  assert.equal(body.setNavigation(nav).ok,true);body.enable(true);
  for(let i=0;i<160&&body.status().goal.kind!=='idle';i++) {
    time+=50;st.t=time;st.scan.id=++id;
    scan={...r.scan,id,time,pose:{feet:[...st.pos],yaw:st.yaw*Math.PI/180}};
    body.tick();if(held.has('MoveForwards'))st.pos[0]+=.05;
  }
  assert.ok(st.pos[0]>24.5,JSON.stringify(body.events().lines.filter(e=>e.kind!=='scan')));
  assert.ok(body.events().lines.some(e=>e.kind==='arrived'));
  assert.ok(!body.events().lines.some(e=>e.kind==='goal-failed'));
  const bad=structuredClone(nav);bad.goalRevision=body.status().goalRevision;bad.graph.wallClearance[0].faces=[[99,99,0,-1]];
  body.setGoal({kind:'goto',x:25.25,z:19.25});bad.goalRevision=body.status().goalRevision;
  assert.equal(body.setNavigation(bad).ok,false,'reject clearance faces outside their cell');
});

test('trial 10: an initial raster overlap up to 10 cm permits only a local step out over known floor',()=>{
  const r=corridor();
  r.map.ingest({...r.scan,id:2,time:100,rays:[{ends:'wall',at:[21.23,1.324,19.845],normal:[-.973,-.229,0]}]});
  const graph=supportedGraph(r.map.snapshot());
  // Keep testing the legacy fallback independently of occupied-space evidence.
  graph.wallClearance=graph.wallClearance.filter(p=>!p.exitOnly);
  assert.equal(traceRoute(graph,21.58,19.25,25.25,19.25).status,'complete');
  assert.notEqual(traceRoute(graph,21.58,19.25,21.25,19.75).status,'complete');
  assert.equal(traceRoute(graph,21.58,19.30,25.25,19.30).status,'none','deeper initial overlap is refused');
});
