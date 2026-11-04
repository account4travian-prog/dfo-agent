import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {supportedGraph,traceRoute,createBody} from '../vendor/legacy-agent/body/core.mjs';
import {pickFrontier} from '../vendor/legacy-agent/mind/autopilot.mjs';
import {navigationFor} from '../vendor/legacy-agent/mind/route.mjs';

const snapshot=JSON.parse(fs.readFileSync(new URL('./support/live-2026-10-29/place-against-wall.json',import.meta.url))).place;
const state={pos:[14.424,0.019,26.565]};
const gap=([x,z])=>Math.hypot(Math.max(14.5-x,0,x-15),Math.max(26.5-z,0,z-27));

test('wall-start capture: explore and goto leave the occupied disk away from the raster wall',()=>{
  const edge=pickFrontier({state,snapshot});
  assert.ok(edge,'observed ground has a reachable frontier');
  assert.ok(edge.path.length);
  assert.ok(edge.path[0][0]<state.pos[0],'first step moves west, away from wall (29,53)');
  for(const p of edge.path)assert.ok(gap(p)>=gap([state.pos[0],state.pos[2]])-1e-6,'never deepen the initial overlap');
  const nav=navigationFor(state,snapshot,edge);
  assert.equal(nav.route.status,'complete',nav.route.reason);
  assert.ok(nav.route.points[0][0]<state.pos[0]);
});

test('wall-start occupancy cannot grant a deeper start, enter a wall or replace missing floor',()=>{
  const graph=supportedGraph(snapshot),[x,,z]=state.pos;
  assert.equal(traceRoute(graph,x+.05,z,13.75,26.75).status,'none','no occupied disk at a deeper start');
  assert.equal(traceRoute(graph,x,z,13.75,26.75).status,'complete','failed start does not poison the shared route cache');
  assert.equal(traceRoute(graph,x-.1,z,13.75,26.75).status,'complete','can replan while leaving the occupied disk');
  assert.equal(traceRoute(graph,x+.05,z,13.75,26.75).status,'none','cached clearance never transfers to a deeper start');
  assert.equal(traceRoute(graph,x,z+1,13.75,z+1).status,'none','recorded occupancy cannot extend along an unseen wall');
  assert.equal(traceRoute(graph,x,z,14.75,26.75).status,'none','cannot enter the raster wall');
  const approach=traceRoute(graph,13.75,26.75,14.75,26.75);
  assert.notEqual(approach.status,'complete','cannot pass into a wall from elsewhere');
  assert.ok(approach.points.every(p=>gap(p)>=.35-1e-6),'partial route stops before the wall disk');
  assert.equal(traceRoute(supportedGraph({...snapshot,strips:[]}),x,z,13.75,26.75).status,'none','seen point floor alone is not an occupied disk');
  const missing={...graph,nodes:graph.nodes.filter(p=>p.ix!==28||p.iz!==53)};
  assert.equal(traceRoute(missing,x,z,13.75,26.75).status,'none','occupancy supplies no missing start floor');
  for(const kind of ['water','ledge','door','prop','unknown']) {
    const snap=structuredClone(snapshot);
    snap.surfaces.find(p=>p.ix===29&&p.iz===53).kind=kind;
    assert.equal(pickFrontier({state,snapshot:snap}),null,kind);
  }
});

test('wall-start recovery retains observed protrusions and all known wall faces',()=>{
  for(const change of [
    wall=>{wall.at=[14.6,1,26.6];},
    wall=>{wall.history.push({kind:'wall',at:[14.6,1,26.6]});},
    wall=>{wall.faces=[[14.6,26.6,-1,0]];},
    wall=>{wall.at=undefined;wall.history=[];},
    wall=>{wall.normal=undefined;},
  ]) {
    const snap=structuredClone(snapshot);
    change(snap.surfaces.find(p=>p.ix===29&&p.iz===53));
    assert.equal(pickFrontier({state,snapshot:snap}),null,'contradictory or missing wall evidence stays blocked');
  }
});

test('wall-start captured scan: transferred navigation releases a supported first step',()=>{
  const scan=JSON.parse(fs.readFileSync(new URL('./support/live-2026-10-29/snapshot-live.json',import.meta.url))).native.view.scan;
  const edge=pickFrontier({state,snapshot}),held=new Set();let time=scan.time;
  const st={mode:'dungeon',frame:scan.frame,pos:[...state.pos],yaw:scan.pose.yaw*180/Math.PI,pitch:0,t:time,
    scan:{page:scan.page,frame:scan.frame,id:scan.id,fresh:true},vitals:{},foes:[]};
  const body=createBody({state:()=>st,view:()=>({scan}),press:k=>held.add(k),release:k=>held.delete(k),
    releaseAll:()=>held.clear(),look:(dx,dy)=>{st.yaw+=dx/3.5;st.pitch-=dy/3.5;}},{now:()=>time});
  body.setGoal({kind:'goto',x:edge.x,z:edge.z});
  const nav=navigationFor(st,snapshot,edge,body.status().goalRevision);
  assert.equal(body.setNavigation(nav).ok,true,'accept bounded occupied-disk evidence');
  body.enable(true);
  for(let i=0;i<8&&!held.has('MoveForwards');i++){time+=50;st.t=time;body.tick();}
  assert.ok(held.has('MoveForwards'),JSON.stringify(body.events().lines.filter(e=>e.kind!=='scan')));
  const clearance=nav.graph.wallClearance.find(p=>p.ix===29&&p.iz===53);
  for(const hits of [[],[[NaN,26.6]],[[14.6,27.6]],Array(10).fill([14.6,26.6])]) {
    const bad=structuredClone(nav);
    bad.graph.wallClearance.find(p=>p.ix===29&&p.iz===53).hits=hits;
    assert.equal(body.setNavigation(bad).ok,false,'reject malformed observed wall hits');
  }
  assert.ok(clearance.hits.length);
});

test('wall-start motor double: the live guard keeps releasing movement until clear of the wall raster',()=>{
  const recorded=JSON.parse(fs.readFileSync(new URL('./support/live-2026-10-29/snapshot-live.json',import.meta.url))).native.view.scan;
  const edge=pickFrontier({state,snapshot}),held=new Set();let time=recorded.time,scan=recorded;
  const st={mode:'dungeon',frame:scan.frame,pos:[...state.pos],yaw:scan.pose.yaw*180/Math.PI,pitch:0,t:time,
    scan:{page:scan.page,frame:scan.frame,id:scan.id,fresh:true},vitals:{},foes:[]};
  const body=createBody({state:()=>st,view:()=>({scan}),press:k=>held.add(k),release:k=>held.delete(k),
    releaseAll:()=>held.clear(),look:(dx,dy)=>{st.yaw+=dx/3.5;st.pitch-=dy/3.5;}},{now:()=>time});
  body.setGoal({kind:'goto',x:edge.x,z:edge.z});
  assert.equal(body.setNavigation(navigationFor(st,snapshot,edge,body.status().goalRevision)).ok,true);
  body.enable(true);
  // Reuse only recorded hit points and floor; fake the motor and scan clock.
  for(let i=0;i<40&&gap([st.pos[0],st.pos[2]])<.35;i++) {
    time+=50;st.t=time;st.scan.id++;
    scan={...recorded,time,id:st.scan.id,pose:{...recorded.pose,feet:[...st.pos],yaw:st.yaw*Math.PI/180,direction:st.yaw*Math.PI/180}};
    body.tick();
    if(held.has('MoveForwards')){st.pos[0]+=.025*Math.sin(st.yaw*Math.PI/180);st.pos[2]+=.025*Math.cos(st.yaw*Math.PI/180);}
    assert.ok(gap([st.pos[0],st.pos[2]])>=gap([state.pos[0],state.pos[2]])-1e-6);
  }
  assert.ok(gap([st.pos[0],st.pos[2]])>=.35,JSON.stringify({pos:st.pos,events:body.events().lines.filter(e=>e.kind!=='scan')}));
});

test('the wall start also holds for the rounded position the live state reports',()=>{
  // The live native state gave [14.42, 0.02, 26.56] for this spot; the strips keep [14.424, 0.019, 26.565].
  const edge=pickFrontier({state:{pos:[14.42,0.02,26.56]},snapshot});
  assert.ok(edge,'an edge from the rounded position');
  assert.ok(Math.hypot(edge.x-14.42,edge.z-26.56)<=28);
});
