import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOM = path.join(ROOT, 'data', 'role-room');
const MAX_OUTPUT = 2 * 1024 * 1024;
const DEFAULT_MODELS = Object.freeze(['gpt-6-luna', 'gpt-6.1-terra', 'gpt-6.1-sol']);
const EFFORTS = new Set(['low', 'medium', 'high', 'xhigh', 'max', 'ultra']);
/** Models the transport is allowed to invoke. An explicit Luna identifier must be
 * added here (or via DFO_ALLOWED_MODELS) by the operator; the transport never
 * substitutes a different model. */
export function allowedModels() {
  const extra = String(process.env.DFO_ALLOWED_MODELS ?? '').split(',').map(model => model.trim()).filter(Boolean);
  return [...new Set([...DEFAULT_MODELS, ...extra])];
}
export function isUsageLimit(message) {
  return typeof message === 'string' && /\b(?:usage[\s_-]*limit|rate[\s_-]*limit|quota|credits|too[\s_-]*many[\s_-]*requests)(?:\b|_)/i.test(message.slice(0, 16384));
}
export function roleInstructionConfig() {
  return `model_instructions_file=${JSON.stringify(path.join(ROOT, 'src', 'role-instructions.md').replaceAll('\\', '/'))}`;
}

function executable() {
  const triple = process.platform === 'win32' ? `x86_64-pc-windows-msvc` : process.platform === 'linux' ? 'x86_64-unknown-linux-musl' : 'x86_64-apple-darwin';
  const platformPkg = process.platform === 'win32' ? 'codex-win32-x64' : process.platform === 'linux' ? 'codex-linux-x64' : 'codex-darwin-x64';
  const name = process.platform === 'win32' ? 'codex.exe' : 'codex';
  const roots = [process.env.APPDATA && path.join(process.env.APPDATA, 'npm', 'node_modules', '@openai', 'codex'), ...String(process.env.PATH || '').split(path.delimiter).map(p => path.join(p, 'node_modules', '@openai', 'codex'))].filter(Boolean);
  for (const root of roots) {
    for (const candidate of [path.join(root, 'node_modules', '@openai', platformPkg, 'vendor', triple, 'bin', name), path.join(root, 'vendor', triple, 'bin', name)]) {
      if (existsSync(candidate)) return candidate;
    }
  }
  throw new Error('Could not locate the native npm-installed Codex executable');
}

/** Invoke the logged-in Codex CLI for a single ephemeral turn. Failures reject. */
export async function askModel({ model, effort = 'low', prompt, images = [], schema, timeoutMs = 45000, signal, onEvent } = {}) {
  if (!allowedModels().includes(model)) throw new Error('Unsupported model');
  if (!EFFORTS.has(effort)) throw new Error('Unsupported reasoning effort');
  if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('Prompt must be nonempty');
  if (!Array.isArray(images) || images.some(p => typeof p !== 'string' || !p.toLowerCase().endsWith('.png') || !existsSync(p))) throw new Error('Images must be existing PNG paths');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Invalid timeout');
  if (schema !== undefined && (!schema || typeof schema !== 'object' || Array.isArray(schema))) throw new Error('Schema must be a JSON Schema object');
  if (signal?.aborted) throw new Error('Model call cancelled');
  const start = performance.now();
  await mkdir(ROOM, { recursive: true });
  const temp = schema ? await mkdtemp(path.join(os.tmpdir(), 'dfo-model-')) : null;
  try {
    const args = ['exec', '--json', '--ephemeral', '--ignore-user-config', '--ignore-rules', '--skip-git-repo-check', '-s', 'read-only', '-C', ROOM, '-m', model, '-c', `model_reasoning_effort="${effort}"`, '-c', roleInstructionConfig(), '-c', 'model_provider="openai"', '-c', 'forced_login_method="chatgpt"', '-c', 'web_search="disabled"', '-c', 'features.code_mode.enabled=false', '-c', 'agents.enabled=false', '-c', 'mcp_servers={}', '-c', 'memories.use_memories=false', '-c', 'memories.generate_memories=false'];
    for (const feature of ['shell_tool', 'unified_exec', 'unified_exec_tty', 'apps', 'browser_use', 'browser_use_external', 'browser_use_full_cdp_access', 'computer_use', 'multi_agent', 'memories', 'hooks', 'plugins', 'code_mode_host', 'code_mode_interrupt', 'view_image', 'in_app_browser', 'remote_plugin', 'plugin_sharing', 'mentions_v2', 'skill_search', 'skill_mcp_dependency_install', 'workspace_dependencies']) args.push('--disable', feature);
    for (const image of images) args.push('-i', path.resolve(image));
    if (schema) {
      const schemaPath = path.join(temp, 'schema.json');
      await writeFile(schemaPath, JSON.stringify(schema), { flag: 'wx' });
      args.push('--output-schema', schemaPath);
    }
    args.push('-');
    const env = { ...process.env };
    for (const key of Object.keys(env)) {
      if (/^(OPENAI_|AZURE_OPENAI_|CODEX_API_KEY$|CODEX_BASE_URL$)/i.test(key)) delete env[key];
    }
    // The dedicated, already authenticated role home avoids loading the operator's
    // unrelated plugins and skills. Authentication is managed by Codex itself.
    const roleHome = path.resolve(env.DFO_CODEX_ROLE_HOME || path.join(os.homedir(), '.codex-dfo-roles'));
    if (!existsSync(roleHome)) throw new Error('Codex role home does not exist; sign in to the dedicated role home first');
    env.CODEX_HOME = roleHome;
    return await new Promise((resolve, reject) => {
      let child;
      try { child = spawn(executable(), args, { cwd: ROOM, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }); }
      catch (err) { reject(err); return; }
      let output = '', stderr = '', outputBytes = 0, sessionId, usage, message, failure, usageLimit = false, settled = false;
      const stop = reason => { if (settled) return; failure = reason; child.kill(); };
      const abort = () => stop('Model call cancelled');
      const timer = setTimeout(() => stop('Model call timed out'), timeoutMs);
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) abort();
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      function eventLine(line) {
        if (!line.trim()) return;
        let event;
        try { event = JSON.parse(line); } catch { failure = 'Malformed JSON event from Codex'; child.kill(); return; }
        try { onEvent?.(event); } catch { /* observers cannot break the model call */ }
        if (event.type === 'thread.started') sessionId = event.thread_id;
        if (event.type === 'turn.completed') usage = event.usage;
        // Keep Codex's own words (bounded): "a failed turn" alone cannot be diagnosed from the trace.
        if (event.type === 'turn.failed' || event.type === 'error') { const said = event.error?.message ?? event.message; failure = `Codex reported a failed turn${typeof said === 'string' && said.trim() ? `: ${said.trim().slice(0, 300)}` : ''}`; usageLimit ||= isUsageLimit(JSON.stringify(event)); }
        if (event.type === 'item.completed' && event.item?.type === 'error' && isUsageLimit(JSON.stringify(event.item))) { usageLimit = true; failure = 'Codex reported a failed turn'; }
        if (event.type === 'item.completed' && event.item?.type === 'agent_message') message = event.item.text;
        if (event.item && ['command_execution', 'mcp_tool_call', 'web_search', 'file_change'].includes(event.item.type)) { failure = 'Unexpected tool use'; child.kill(); }
      }
      child.stdout.on('data', chunk => {
        outputBytes += Buffer.byteLength(chunk);
        output += chunk;
        if (outputBytes > MAX_OUTPUT) { stop('Codex output exceeded limit'); return; }
        let index;
        while ((index = output.indexOf('\n')) >= 0) { const line = output.slice(0, index); output = output.slice(index + 1); eventLine(line); }
      });
      child.stderr.on('data', chunk => { stderr += chunk; if (stderr.length > MAX_OUTPUT) stop('Codex error output exceeded limit'); });
      child.on('error', err => { failure = `Could not start Codex: ${err.message}`; });
      child.on('close', code => {
        settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
        if (output.trim()) eventLine(output);
        if (failure || code !== 0 || typeof message !== 'string' || !message.trim() || !usage) {
          if (usageLimit || isUsageLimit(stderr)) { const error = new Error('Subscription usage limit reached'); error.code = 'USAGE_LIMIT'; reject(error); return; }
          reject(new Error(failure || `Codex failed or returned an incomplete response (exit ${code})`)); return;
        }
        let json;
        if (schema) { try { json = JSON.parse(message); } catch { reject(new Error('Codex returned invalid JSON')); return; } }
        resolve({ text: message, json, usage, ms: Math.round(performance.now() - start), requestedModel: model, sessionId });
      });
      child.stdin.on('error', () => {});
      child.stdin.end(prompt);
    });
  } finally { if (temp) await rm(temp, { recursive: true, force: true }); }
}
