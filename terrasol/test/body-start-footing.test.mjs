import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseStart} from '../vendor/legacy-agent/checks/start-footing.mjs';

test('builder diagnosis distinguishes retained unresolved walls from missing starting floor without mutating evidence',()=>{
  const surfaces=[];
  for(let ix=0;ix<5;ix++)for(let iz=0;iz<5;iz++)surfaces.push({ix,iz,level:0,kind:'support',height:0,usable:true,coverage:'full',clearance:1.8});
  Object.assign(surfaces.find(p=>p.ix===2&&p.iz===1),{kind:'wall',ground:0,unresolved:true,badFaces:true,faces:[[1.25,.6,0,1]]});
  const c={state:{pos:[1.25,0,1.05]},snapshot:{surfaces,strips:[]}};
  const before=JSON.stringify(c),r=diagnoseStart(c);
  assert.ok(r.startNode);
  assert.equal(r.route.status,'complete','current occupied space establishes the start without clearing the wall');
  assert.equal(r.cells[0].unresolved,true);
  assert.equal(r.cells[0].clearanceTransferred,true);
  assert.equal(r.cells[0].exitOnly,true);
  assert.equal(r.counterfactualOnly.route.status,'complete');
  assert.equal(JSON.stringify(c),before,'ablation never edits the captured graph');
  c.snapshot.surfaces=c.snapshot.surfaces.filter(p=>!(p.ix===2&&p.iz===2));
  assert.equal(diagnoseStart(c).counterfactualOnly.route.status,'none','removing wall constraints cannot supply unseen starting floor');
});
