import test from 'node:test';
import assert from 'node:assert/strict';
import trial from './support/fight-close/trial-13.json' with { type: 'json' };
import {createBody, bearingTo} from '../vendor/legacy-agent/body/core.mjs';

function doorwayFight({obstacle = 'door',doorCell=false} = {}) {
  let time=0,id=0,scan;
  const held=new Set(),swings=[];
  const st={mode:'dungeon',pos:[0,0,0],frame:1,yaw:0,pitch:0,t:0,
    scan:{page:'fight-close',frame:1,id:0,fresh:true},foes:[],vitals:{health:37,maxHealth:37},weapon:{out:true}};
  const body=createBody({state:()=>st,view:()=>({scan}),press:k=>held.add(k),release:k=>held.delete(k),releaseAll:()=>held.clear(),
    look:(dx,dy)=>{st.yaw+=dx/3.5;st.pitch-=dy/3.5;},swing:()=>swings.push({time,dist:bearingTo(st,0,trial.distanceM).dist})},{now:()=>time});
  body.enable(true);body.setPolicy({...body.getPolicy(),settings:{reach:trial.reachM}});
  body.setGoal({kind:'explore',heading:180});
  if(doorCell) {
    const nodes=[];for(let ix=-4;ix<4;ix++)for(let iz=-4;iz<16;iz++)nodes.push({ix,iz,level:0,height:0});
    body.setNavigation({page:'fight-close',frame:1,visit:'trial-13',revision:1,goalRevision:body.status().goalRevision,
      graph:{cell:.5,nodes,blocked:[[0,2,0]],walls:[],doors:[[0,2,0]],strips:[]},route:{status:'complete',points:[[0,0,0]],reason:'fixture'}});
  }
  return {st,body,held,swings,tick({dt=50}={}) {
    time+=dt;st.t=time;
    const foe=bearingTo(st,0,trial.distanceM);
    st.foes=[{type:trial.foe,hostile:true,...foe,dy:0,h:.4}];
    const floor=[];for(let ix=-4;ix<4;ix++)for(let iz=-4;iz<16;iz++)floor.push({ix,iz,height:0});
    const drop=obstacle==='ground';
    const rays=obstacle==='door'?[{row:0,bearing:0,ends:'door',dist:trial.doorDistanceM,
      at:[0,1,trial.doorDistanceM],normal:[0,0,-1]}]:[{row:0,bearing:0,ends:obstacle,dist:.6,height:drop?-1:0,at:[0,drop?-1:0,.6]}];
    if(doorCell)rays.length=0;
    scan={version:1,page:'fight-close',frame:st.frame,id:++id,time,pose:{feet:[...st.pos],yaw:st.yaw*Math.PI/180},rays,footing:[],floor,things:[],foes:st.foes};
    st.scan={...st.scan,id,time};body.tick();
    if(held.has('MoveForwards')){const a=st.yaw*Math.PI/180;st.pos[0]+=.05*Math.sin(a);st.pos[2]+=.05*Math.cos(a);}
  }};
}

test('trial 13: closes on a biting rat 2.1 m away through a doorway, then swings in reach',()=>{
  const r=doorwayFight();
  for(let i=0;i<100&&!r.swings.length;i++)r.tick();
  assert.ok(r.st.pos[2]>.5,'steps through the doorway instead of staying at its edge');
  assert.ok(r.swings.length,'swings after closing');
  assert.ok(r.swings[0].dist<=trial.reachM,`swing at ${r.swings[0].dist} m should be within ${trial.reachM} m reach`);
});

test('visible and remembered door cells allow combat closing',()=>{
  for(const options of [{obstacle:'door'},{obstacle:'door',doorCell:true},{obstacle:'none',doorCell:true}]) {
    const r=doorwayFight(options);
    for(let i=0;i<12;i++)r.tick();
    assert.ok(r.held.has('MoveForwards'),JSON.stringify(options));
  }
});

test('real walls, water and drops still stop closing on a foe',()=>{
  for(const obstacle of ['wall','water','ledge','ground']) {
    const r=doorwayFight({obstacle});
    for(let i=0;i<12;i++)r.tick();
    assert.deepEqual(r.st.pos,[0,0,0],obstacle);
    assert.ok(r.swings.every(swing=>swing.dist<=trial.reachM+.3),obstacle);
  }
});
