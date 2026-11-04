import fs from 'node:fs';
import path from 'node:path';
import {ROOT,ENGINE} from './config.mjs';
export function ensureLegacyReader(){
  const target=path.join(ENGINE,'src','rowan','agentWindows.js');
  const bytes=fs.readFileSync(path.join(ROOT,'vendor','agentWindows.js'));
  if(fs.existsSync(target)){
    if(!fs.readFileSync(target).equals(bytes))throw Error('Engine window reader differs from tracked vendor source');
    return;
  }
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes,{flag:'wx'});
}
/** Read the earlier project's rendered window without using its synthetic input helpers.
 * The host must assign current data-rowan-id values before this call; controls
 * without one retain their visible bounds but have no trusted control ID. */
export async function readLegacyWindow(page) {
  return page.evaluate(async () => {
    const reader = await import('/src/rowan/agentWindows.js');
    const controls = reader.listControls().map(({ el, label, kind }) => {
      const r = el.getBoundingClientRect();
      const rawId = el.dataset.rowanId;
      const controlId = rawId != null && /^\d+$/.test(rawId) ? Number(rawId) : null;
      return { label, kind, rect: { x: r.x, y: r.y, width: r.width, height: r.height }, controlId };
    });
    return { window: reader.renderedWindowObservation(), controls, hud: reader.visibleHud(), plaque: reader.visiblePlaque() };
  });
}
