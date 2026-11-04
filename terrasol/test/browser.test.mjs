import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAction, sampleScene, compareScenes, makeLocalPassword, PASSWORD_SENTINEL } from '../src/browser.mjs';

test('rejects invalid kinds, durations, keys, text and coordinates', () => {
  for (const action of [null, {}, {kind:'teleport'}, {kind:'wait',ms:-1}, {kind:'hold',keys:['W'],ms:15001}, {kind:'key',keys:[]}, {kind:'hold',keys:['W', 3]}, {kind:'type',text:'a'.repeat(2001)}, {kind:'click',x:Infinity,y:1}, {kind:'look',dx:4001}]) {
    assert.throws(() => validateAction(action));
  }
});

test('accepts representative bounded controls', () => {
  for (const action of [{kind:'hold',keys:['W'],ms:500}, {kind:'click',x:300,y:400}, {kind:'look',dx:-20,dy:5}, {kind:'wait',ms:0}, {kind:'release'}]) {
    assert.equal(validateAction(action), action);
  }
});

test('rejects incomplete and malformed targeted actions', () => {
  for (const action of [{kind:'click'}, {kind:'drag',x:1,y:2,toX:3}, {kind:'click',x:1,y:2,button:'invalid'}, {kind:'click',controlId:-1}, {kind:'click',controlId:1.5}, {kind:'key',keys:[' ']}, {kind:'hold',keys:['']}]) assert.throws(() => validateAction(action));
});

test('swing accepts bounded gestures and rejects unsafe or malformed controls', () => {
  assert.doesNotThrow(()=>validateAction({kind:'swing',keys:['W'],dx:80,dy:0,ms:6000}));
  assert.doesNotThrow(()=>validateAction({kind:'swing'}));
  for(const action of [{kind:'swing',keys:['']},{kind:'swing',keys:'W'},{kind:'swing',dx:401},{kind:'swing',dy:Infinity},{kind:'swing',ms:6001}])assert.throws(()=>validateAction(action));
});

test('scene change uses averaged center pixels, ignores bottom HUD, and normalizes', () => {
  const w=100,h=100;const data=Buffer.alloc(w*h*4,0);const sample=sampleScene({width:w,height:h,data});
  const hud=Buffer.from(data);for(let y=90;y<h;y++)for(let x=0;x<w;x++)hud[(y*w+x)*4]=255;
  assert.equal(compareScenes(sampleScene({width:w,height:h,data:hud}),sample),0);
  const white=Buffer.alloc(w*h*4,255);
  assert.equal(compareScenes(sampleScene({width:w,height:h,data:white}),sample),1);
  assert.equal(compareScenes(sample,null),null);
});

test('local password derives from strong random bytes and never equals the public sentinel', () => {
  const a=makeLocalPassword(Buffer.alloc(24,1)),b=makeLocalPassword(Buffer.alloc(24,2));
  assert.notEqual(a,b);assert.notEqual(a,PASSWORD_SENTINEL);assert.ok(a.length>=30);
  assert.throws(()=>makeLocalPassword(Buffer.alloc(23)));
});
