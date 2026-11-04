#!/usr/bin/env node
import { createHttpControl, watchOnce } from '../src/watch/watcher.mjs';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const runDir = args.find(arg => !arg.startsWith('--'));
if (!runDir) throw new Error('Usage: node tools/watch.mjs <runDir> [--enforce] [--interval-ms N] [--idle-minutes N] [--repeat-count N] [--window-minutes N] [--lease-timeout-ms N] [--control URL]');
const value = name => { const index = args.indexOf(name); return index < 0 ? null : args[index + 1]; };
const number = (name, fallback) => value(name) === null ? fallback : Number(value(name));
const config = { idleMs: number('--idle-minutes', 10) * 60_000, repeatCount: number('--repeat-count', 5), windowMs: number('--window-minutes', 10) * 60_000, leaseTimeoutMs: number('--lease-timeout-ms', 30_000) };
const interval = number('--interval-ms', 15_000), enforce = args.includes('--enforce');
if (![interval, config.idleMs, config.repeatCount, config.windowMs, config.leaseTimeoutMs].every(n => Number.isFinite(n) && n > 0)) throw new Error('Watcher thresholds must be positive numbers');
const control = createHttpControl({ baseUrl: value('--control') ?? undefined });
let previous = null;
let running = true;
process.once('SIGINT', () => { running = false; });
process.once('SIGTERM', () => { running = false; });
while (running) {
  try {
    const result = await watchOnce({ runDir, control, previous, config, enforce });
    previous = result.previous;
    if (result.verdict.actions.length) console.log(JSON.stringify(result.verdict));
  } catch (error) {
    const verdict = { at: new Date().toISOString(), held: null, enforce, actions: [], evidence: { controlError: error.message } };
    fs.appendFileSync(path.join(runDir, 'watch.jsonl'), JSON.stringify(verdict) + '\n');
    console.error(JSON.stringify(verdict));
  }
  await new Promise(resolve => setTimeout(resolve, interval));
}
