// Source/vendor-aware revision snapshots and hot-swap classification. The
// worker/driver/Body can be replaced while keeping the page; bridge/engine
// changes require a suitable page/session reload. This module never performs a
// swap itself; tools/reload.mjs owns the operator workflow.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {spawnSync} from 'node:child_process';

export const SWAP_CLASSES = Object.freeze(['worker', 'driver', 'body', 'bridge', 'engine', 'tooling', 'test', 'docs', 'other']);
const textExtensions = new Set(['.mjs', '.js', '.md', '.json', '.txt', '.css', '.html']);

export function classifySwap(relativePath) {
  const file = String(relativePath).replace(/\\/g, '/');
  if (file === 'src/browser.mjs' || file === 'src/native-controller.mjs' || file === 'src/legacy-windows.mjs' || file.startsWith('src/player/') || file.startsWith('src/browser/')) return 'driver';
  if (file === 'src/body-runtime.mjs' || file === 'src/intent-executor.mjs') return 'body';
  if (file.startsWith('vendor/legacy-agent/body/')) return 'body';
  if (file === 'src/native-bridge.mjs' || file.startsWith('vendor/native-agent/')) return 'bridge';
  if (file.startsWith('engine/')) return 'engine';
  if (file.startsWith('test/')) return 'test';
  if (file.startsWith('docs/')) return 'docs';
  if (file.startsWith('src/repair/')) return 'tooling';
  if (file === 'tools/reload.mjs') return 'tooling';
  if (file.startsWith('tools/')) return 'tooling';
  return 'worker';
}

export function hotSwapNotes(relativePath) {
  const swap = classifySwap(relativePath);
  if (swap === 'worker') return 'replace worker process; page can stay open; preserve memory/plan checkpoint';
  if (swap === 'driver') return 'restart driver process and reconnect CDP to the same page; cancel active intent first';
  if (swap === 'body') return 'worker/driver replacement can reinstall the Body; verify lease and release before swap';
  if (swap === 'bridge') return 'bridge is installed at world boot; a suitable page/session reload is required';
  if (swap === 'engine') return 'engine host patch requires a page/session reload; not a live session-preserving swap';
  if (swap === 'tooling') return 'tooling change; no gameplay input authority';
  return 'non-runtime file';
}

function walk(root, dir, out) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return;
  for (const entry of fs.readdirSync(full, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'data' || entry.name === 'engine') continue;
    const relative = path.posix.join(dir.split(path.sep).join('/'), entry.name);
    if (entry.isDirectory()) walk(root, relative, out);
    else if (entry.isFile() && textExtensions.has(path.extname(entry.name).toLowerCase())) out.push(relative);
  }
}

export function collectRevision({ root, dirs = ['src', 'test', 'vendor', 'tools'], revisionDir = null, copy = true } = {}) {
  if (!root) throw new TypeError('collectRevision needs a root');
  const files = [];
  for (const dir of dirs) walk(root, dir, files);
  const manifest = { generatedAt: new Date().toISOString(), root, dirs: [...dirs], files: [], classes: Object.fromEntries(SWAP_CLASSES.map(name => [name, 0])), hotSwap: {} };
  for (const relative of files) {
    const bytes = fs.readFileSync(path.join(root, relative));
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const swap = classifySwap(relative);
    manifest.files.push({ path: relative, sha256, bytes: bytes.length, hotSwap: swap });
    manifest.classes[swap] = (manifest.classes[swap] ?? 0) + 1;
    manifest.hotSwap[swap] = hotSwapNotes(relative);
    if (revisionDir && copy) {
      const destination = path.join(revisionDir, relative);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, bytes, { flag: 'wx' });
    }
  }
  if (revisionDir) {
    fs.mkdirSync(revisionDir, { recursive: true });
    fs.writeFileSync(path.join(revisionDir, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
  }
  return manifest;
}

export function rollbackInstructions(revisionId, { restorationDir = '<new-folder>' } = {}) {
  return [
    `Revision ${revisionId} is archived under data/revisions/${revisionId}.`,
    `Verify its manifest hashes before copying: data/revisions/${revisionId}/manifest.json.`,
    `Restore into a fresh checkout or ${restorationDir}; never overwrite a running checkout with unverified bytes.`,
    'Worker-layer files: stop the worker, restore, run the model-free suite, then resume a new epoch with memory/plan checkpoints.',
    'Driver/Body files: cancel any active intent, stop the worker, restart the driver, confirm the same page URL/target, then resume.',
    'Bridge/engine files cannot be hot-swapped into a live page; restore and reload the page/session before play, or defer to the next session.',
  ];
}

export function sourceIdentity(root) {
  const invoke=args=>spawnSync('git',args,{cwd:root,encoding:'utf8',timeout:5000,windowsHide:true,shell:false});
  const revision=invoke(['rev-parse','HEAD']), status=invoke(['status','--porcelain=v1','--untracked-files=no']);
  const head=revision.status===0&&/^[0-9a-f]{40}$/i.test(revision.stdout.trim())?revision.stdout.trim():null;
  const files=collectRevision({root,dirs:['src','vendor','tools'],copy:false}).files.map(({path,sha256})=>({path,sha256}));
  const digest=createHash('sha256').update(JSON.stringify(files)).digest('hex');
  return {revision:head,effectiveRevision:head?`${head}+sha256:${digest}`:null,sourceDigest:digest,dirty:status.status===0?!!status.stdout.trim():null};
}
