import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildReport } from '../src/report.mjs';

test('reports observed intervals and dispatch receipts without claiming outcomes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rowan-report-'));
  const at = seconds => new Date(Date.UTC(2026, 0, 1, 0, 0, seconds)).toISOString();
  const line = (kind, seconds, fields = {}) => JSON.stringify({mode:'online',kind, at: at(seconds), ...fields}) + '\n';
  fs.writeFileSync(path.join(dir, 'trace.jsonl'), line('session-start', 0) + line('worker-exit', 10, {epoch: 1, code: 75}) + line('worker-exit', 25, {epoch: 2, code: 0}) + line('session-end', 30));
  for (const n of [1, 2]) fs.mkdirSync(path.join(dir, `epoch-${n}`));
  fs.writeFileSync(path.join(dir, 'epoch-1', 'trace.jsonl'), line('epoch-start', 1) + line('observation', 2, {generation: 0}) + line('model-request', 3, {role: 'terra'}) + line('model-response', 5, {role: 'terra'}) + line('action-intent', 6) + line('action-result', 7, {issued: true}) + '{"partial":');
  fs.writeFileSync(path.join(dir, 'epoch-2', 'trace.jsonl'), line('epoch-start', 20) + line('observation', 21, {generation: 1}) + line('model-request', 22, {role: 'sol'}));
  const report = buildReport(dir);
  assert.equal(report.wallMs, 30000);
  assert.equal(report.epochs[0].elapsedMs, 9000);
  assert.equal(report.holds[0].elapsedMs, 10000);
  assert.equal(report.generationCount, 2);
  assert.equal(report.counts.dispatchReceipts, 1);
  assert.equal(report.modelTiming.terra.elapsedMs, 2000);
  assert.equal(report.modelTiming.sol.unmatchedRequests, 1);
  assert.match(report.note, /do not establish gameplay outcomes/);
});

test('efficiency uses completed outcomes and does not treat dispatch as proof',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rowan-native-report-'));
  fs.mkdirSync(path.join(dir,'epoch-1'));
  const row=(kind,fields={})=>JSON.stringify({mode:'online',kind,at:'2026-01-01T00:00:00Z',...fields})+'\n';
  fs.writeFileSync(path.join(dir,'trace.jsonl'),row('session-start')+row('session-end'));
  fs.writeFileSync(path.join(dir,'epoch-1','trace.jsonl'),row('epoch-start')+row('model-request',{role:'terra'})+row('model-response',{role:'terra',usage:{input_tokens:100,cached_input_tokens:60,output_tokens:10}})+row('action-result',{issued:true})+row('intent-outcome',{task:{status:'terminal',kind:'goto',outcome:'blocked',progress:{displacement:0.1}}}));
  let report=buildReport(dir);assert.equal(report.verifiedOutcomes,0);assert.equal(report.efficiency.inputTokensPerVerifiedOutcome,null);
  fs.appendFileSync(path.join(dir,'epoch-1','trace.jsonl'),row('intent-outcome',{task:{status:'terminal',kind:'turn',outcome:'completed',progress:{angularError:1}}}));
  report=buildReport(dir);assert.equal(report.verifiedOutcomes,0);assert.equal(report.efficiency.inputTokensPerVerifiedOutcome,null);
  fs.appendFileSync(path.join(dir,'epoch-1','trace.jsonl'),row('intent-outcome',{task:{id:3,status:'terminal',kind:'goto',outcome:'completed',progress:{displacement:3,remaining:.5}}}));
  report=buildReport(dir);assert.equal(report.efficiency.inputTokensPerVerifiedOutcome,100);assert.equal(report.efficiency.modelCallsPerVerifiedOutcome,1);assert.equal(report.playingRoleUsage.cached_input_tokens,60);assert.equal(report.engineeringUsage,'unavailable');
});

test('completed stop and look stay separate from verified progress',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rowan-stops-'));fs.mkdirSync(path.join(dir,'epoch-1'));
  const row=(kind,fields={})=>JSON.stringify({mode:'online',kind,at:'2026-01-01T00:00:00Z',...fields})+'\n';
  fs.writeFileSync(path.join(dir,'trace.jsonl'),row('session-start')+row('session-end'));
  fs.writeFileSync(path.join(dir,'epoch-1','trace.jsonl'),row('epoch-start')+['stop','look'].map(kind=>row('intent-outcome',{task:{status:'terminal',kind,outcome:'completed'}})).join(''));
  const r=buildReport(dir);assert.equal(r.verifiedOutcomes,0);assert.equal(r.completedStops,1);assert.equal(r.outcomesByKind.look.completed,1);assert.equal(r.efficiency.modelCallsPerVerifiedOutcome,null);
});

test('metric v2 rejects weak UI effects and tiny motion, and deduplicates evidenced tasks',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rowan-metric2-'));fs.mkdirSync(path.join(dir,'epoch-1'));
 try {
  const row=(kind,fields={})=>JSON.stringify({mode:'online',kind,at:'2026-01-01T00:00:00Z',...fields})+'\n';
  const tasks=[{id:1,kind:'turn',progress:{angularError:0}},{id:2,kind:'use',progress:{interaction:'window'}},{id:3,kind:'use',progress:{interaction:'hud'}},{id:4,kind:'goto',progress:{displacement:.2,remaining:0}},{id:5,kind:'use',progress:{interaction:'place'}},{id:5,kind:'use',progress:{interaction:'place'}},{id:6,kind:'goto',cleanupPending:true,progress:{displacement:3,remaining:0}}];
  fs.writeFileSync(path.join(dir,'trace.jsonl'),row('session-start')+row('session-end'));
  fs.writeFileSync(path.join(dir,'epoch-1','trace.jsonl'),row('epoch-start')+tasks.map(t=>row('intent-outcome',{task:{status:'terminal',outcome:'completed',...t}})).join(''));
  const r=buildReport(dir);assert.equal(r.metricVersion,2);assert.equal(r.verifiedOutcomes,1);assert.equal(r.verifiedTransitions[0].evidence,'place-transition');
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
