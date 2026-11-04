// Builder-only hot replacement. The caller must hold the gateway's operator stop.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const scripts = new WeakMap();
export function bodyCode() {
  const source=readFileSync(new URL('../body/core.mjs',import.meta.url),'utf8');
  const sha256=createHash('sha256').update(source).digest('hex');
  const script=`(() => {\n${source.replace(/^export /gm,'')}\nconst install = () => {
    if (!globalThis.__agent) return false;
    const old = globalThis.__body;
    if (old && typeof old.dispose !== 'function') throw new Error('old Body cannot retire its clock; restart the gateway once');
    const policy = old?.getPolicy();
    old?.dispose();
    const next = startBody(globalThis.__agent);
    globalThis.__body = next;
    if (policy) {
      const result = next.setPolicy(policy);
      if (!result.ok) throw new Error('replacement Body refused the retained policy: '+result.errors.join('; '));
    }
    return true;
  };
  if (!install()) { const wait = setInterval(() => { if (install()) clearInterval(wait); },200); }
})();`;
  return {script,sha256};
}

/** Replace the document-start script too: a later page load must not resurrect old code. */
export async function installBodyCode(page,{reload=false}={}) {
  const code=bodyCode();
  // Parse before touching either the running Body or its next-load script.
  new Function(code.script);
  const previous=scripts.get(page);
  const cdp=previous?.cdp ?? await page.context().newCDPSession(page);
  if (!previous) await cdp.send('Page.enable');
  const {identifier}=await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:code.script});
  try {
    if (reload) await page.evaluate(code.script);
  } catch (err) {
    await cdp.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});
    throw err;
  }
  if (previous) await cdp.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:previous.identifier});
  scripts.set(page,{cdp,identifier});
  return {sha256:code.sha256};
}
