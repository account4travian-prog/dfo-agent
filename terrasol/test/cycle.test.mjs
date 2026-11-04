import test from 'node:test';
import assert from 'node:assert/strict';
import { addUsage, cycleMatches, movementAction } from '../src/main.mjs';

test('movement requires matching visual evidence, but menu cycles use the DOM fingerprint', () => {
  const walk={kind:'hold',keys:['w'],ms:500};
  const click={kind:'click',controlId:2};
  const history=[{fingerprint:'same-dom',visualFingerprint:'view-a',action:walk},{fingerprint:'same-dom',visualFingerprint:'view-a',action:walk},{fingerprint:'menu',action:click},{fingerprint:'menu',action:click}];
  assert.equal(cycleMatches(history,{fingerprint:'same-dom',visualFingerprint:'view-b'},walk),0);
  assert.equal(cycleMatches(history,{fingerprint:'same-dom'},walk),0);
  assert.equal(cycleMatches(history,{fingerprint:'same-dom',visualFingerprint:'view-a'},walk),2);
  assert.equal(cycleMatches(history,{fingerprint:'menu',text:'Account choices'},click),2);
  const cards=[{fingerprint:'canvas',visualFingerprint:'page-one',action:click},{fingerprint:'canvas',visualFingerprint:'page-one',action:click}];
  assert.equal(cycleMatches(cards,{fingerprint:'canvas',text:'',visualFingerprint:'page-two'},click),0);
  assert.equal(cycleMatches(cards,{fingerprint:'canvas',text:'',visualFingerprint:'page-one'},click),2);
  assert.equal(movementAction({kind:'key',keys:['ArrowUp']}),true);
});

test('reported token totals include only available valid usage values', () => {
  const total={input_tokens:0,cached_input_tokens:0,output_tokens:0};
  addUsage(total,{input_tokens:100,cached_input_tokens:20,output_tokens:7});
  addUsage(total,{input_tokens:50,cached_input_tokens:-1,output_tokens:4});
  addUsage(total,undefined);
  assert.deepEqual(total,{input_tokens:150,cached_input_tokens:20,output_tokens:11});
});
