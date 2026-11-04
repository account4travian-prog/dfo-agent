#!/usr/bin/env node
// Compare two recorded report JSON files under a matched scenario. This tool
// never launches a game or model; --live only relabels the evidence after a
// real run, and even then the report must carry its own outcome evidence.
import fs from 'node:fs';
import { measurementFromReport, compareMeasurements, formatMeasurement } from '../src/mind/efficiency.mjs';

const args = process.argv.slice(2);
const value = (name, fallback = null) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : fallback;
};
const readJson = file => {
  if (!file) throw new Error('missing report path');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};
const twoTier = readJson(value('two'));
const threeTier = readJson(value('three'));
const scenarioId = value('scenario', 'uncatalogued');
const startFingerprint = value('fingerprint', 'uncatalogued');
const sourceRevision = value('revision', null);
const live = args.includes('--live');
const two = measurementFromReport(twoTier.report ?? twoTier, { routing: 'two-tier', scenarioId, startFingerprint, sourceRevision, live });
const three = measurementFromReport(threeTier.report ?? threeTier, { routing: 'three-tier', scenarioId, startFingerprint, sourceRevision, live });
const comparison = compareMeasurements({ twoTier: two, threeTier: three });
console.log(JSON.stringify({ two: formatMeasurement(two), three: formatMeasurement(three), comparison }, null, 2));
