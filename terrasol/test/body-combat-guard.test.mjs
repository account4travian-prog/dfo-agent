import test from 'node:test';
import assert from 'node:assert/strict';
import {createBody} from '../vendor/legacy-agent/body/core.mjs';
for (const failure of ['changed target','health floor','lost observation']) test(`combat guard stops before input on ${failure}`,()=>{
 let tick=0;const calls=[];const state={frame:1,mode:'dungeon',pos:[0,0,0],yaw:0,pitch:0,scan:{page:'p',frame:1,id:1,fresh:true},vitals:{health:10,maxHealth:10},foes:[{targetId:'rat',hostile:true,dist:1,bearing:0}],weapon:{out:true}};
 const agent={state:()=>structuredClone(state),view:()=>null,press:a=>calls.push(['press',a]),release:()=>{},releaseAll:()=>calls.push(['releaseAll']),look:()=>calls.push(['look']),swing:()=>calls.push(['swing'])};
 const b=createBody(agent,{now:()=>tick});
 assert.equal(b.setCombatGuard({targetId:'rat',page:'p',frame:1,stopHpPct:35}).ok,true);
 b.setPolicy({rules:[{id:'fight',when:{},do:{act:'fight',target:'nearestHostile'}}],settings:{}});b.enable(true,10000);b.tick();
 if(failure==='changed target')state.foes=[{targetId:'other',hostile:true,dist:.5,bearing:0}];
 if(failure==='health floor')state.vitals.health=3;
 if(failure==='lost observation')state.scan.fresh=false;
 calls.length=0;tick+=50;b.tick();assert.deepEqual(calls,[['releaseAll']]);
 if(failure!=='health floor'){assert.equal(b.status().enabled,true);calls.length=0;tick+=800;b.tick();assert.deepEqual(calls,[['releaseAll']]);}
 assert.equal(b.status().enabled,false);assert.ok(b.status().combatGuardFailure);
 calls.length=0;tick+=50;b.tick();assert.equal(calls.length,0);assert.equal(b.enable(true,10000).ok,false);
 assert.equal(b.setCombatGuard(null).ok,true);assert.equal(b.enable(true,100).ok,true);
});

test('combat retains the explicitly selected actor through distance crossings and brief occlusion',()=>{
 let tick=0;const calls=[];const state={frame:1,mode:'dungeon',pos:[0,0,0],yaw:0,pitch:0,scan:{page:'p',frame:1,id:1,fresh:true},vitals:{health:10,maxHealth:10},foes:[{targetId:'other',hostile:true,dist:.5,bearing:-45},{targetId:'chosen',hostile:true,dist:1,bearing:30}],weapon:{out:true}};
 const b=createBody({state:()=>structuredClone(state),view:()=>null,press:()=>({ok:true}),release(){},releaseAll:()=>calls.push(['release']),look:(dx,dy)=>calls.push(['look',dx,dy]),swing:()=>calls.push(['swing'])},{now:()=>tick});
 b.setCombatGuard({targetId:'chosen',page:'p',frame:1,stopHpPct:35});b.setPolicy({rules:[{id:'fight',when:{},do:{act:'fight',target:'nearestHostile'}}],settings:{}});b.enable(true,10000);b.tick();
 assert.equal(b.status().enabled,true);assert.ok(calls.some(c=>c[0]==='look'&&c[1]>0));assert.ok(!calls.some(c=>c[0]==='look'&&c[1]<0));
 state.foes=state.foes.filter(f=>f.targetId!=='chosen');calls.length=0;tick+=50;b.tick();assert.deepEqual(calls,[['release']]);
 state.foes.push({targetId:'chosen',hostile:true,dist:1,bearing:30});tick+=200;b.tick();assert.equal(b.status().enabled,true);assert.equal(b.status().combatGuardFailure,null);
});
