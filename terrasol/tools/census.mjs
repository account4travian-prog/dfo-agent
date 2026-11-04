#!/usr/bin/env node
import { census } from '../src/watch/census.mjs';

const [runDir, ...args] = process.argv.slice(2);
if (!runDir || args.some(arg => arg !== '--json')) throw new Error('Usage: node tools/census.mjs <runDir> [--json]');
const result = census(runDir);
if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`Run: ${result.runDir}`);
  console.log(`Stop reasons: ${result.sections.stopReasons.state === 'absent' ? 'absent' : JSON.stringify(result.sections.stopReasons.histogram)}`);
  console.log(`Task outcomes: ${result.sections.taskOutcomes.state === 'absent' ? 'absent' : JSON.stringify(result.taskOutcomes.byCategory)}`);
  console.log(`Verified useful outcomes (metric v${result.verifiedUseful.metricVersion}): ${result.verifiedUseful.count ?? 'absent'}`);
  console.log(`Holds: ${result.sections.holds.state === 'absent' ? 'absent' : result.sections.holds.count}`);
  console.log(`Model calls: ${JSON.stringify(result.modelCalls)}`);
  console.log(`Top repeated failures: ${JSON.stringify(result.topRepeatedFailures)}`);
  console.log(`Time ms: ${JSON.stringify(result.time)}`);
}
