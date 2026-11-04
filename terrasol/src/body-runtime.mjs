import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const source = readFileSync(new URL('../vendor/legacy-agent/body/core.mjs', import.meta.url), 'utf8');
const sha256 = createHash('sha256').update(source).digest('hex');
const script = `${source.replace(/^export /gm, '')}\nreturn startBody;`;
new Function(script);
export async function installBody(page, { reload = false, generation = null } = {}) {
  // Explicit installation, rather than a waiting timer that could resurrect a retired Body.
  return page.evaluate(({ script, sha256, generation }) => {
    const agent = globalThis.__agent;
    if (!agent) return { ready: false, reason: 'native bridge unavailable', sha256 };
    const old = globalThis.__body;
    if (old && typeof old.dispose !== 'function') throw Error('old Body cannot retire its clock');
    old?.dispose(); agent.releaseAll?.();
    if(generation!=null)globalThis.__dfoControlGeneration=generation;
    const body = new Function(script)()(agent);
    globalThis.__body = body;
    return { ready: true, sha256, id: body.status().id };
  }, { script, sha256, reload, generation });
}
export async function readBody(page, after = 0) {
  return page.evaluate(after => {
    const b = globalThis.__body;
    return b ? { ready: true, status: b.status(), events: b.events(after), policy: b.getPolicy() } : { ready: false, reason: 'Body unavailable' };
  }, after);
}
export async function commandBody(page, method, argument, expected = null) {
  if (!['enable','setPolicy','setGoal','setNavigation','setCombatGuard','setUseTarget'].includes(method)) throw Error('unsupported Body command');
  return page.evaluate(({method, argument, expected}) => {
    const b = globalThis.__body;
    if (!b) return {ok:false, errors:['Body unavailable']};
    if (expected) { const state=globalThis.__agent?.state?.(); if (!state || b.status().id!==expected.id || (globalThis.__dfoControlGeneration!=null&&expected.generation!==globalThis.__dfoControlGeneration) || (!expected.allowSceneChange && (state.frame!==expected.frame || state.mode!==expected.mode || state.scan?.page!==expected.page))) return {ok:false,errors:['Body or scene changed']}; }
    return method === 'enable' && Array.isArray(argument) ? b.enable(...argument) : b[method](argument);
  }, {method,argument,expected});
}
export async function stopBody(page) {
  return page.evaluate(() => { const b=globalThis.__body; b?.enable(false); globalThis.__agent?.releaseAll?.(); return {ok:true}; });
}
