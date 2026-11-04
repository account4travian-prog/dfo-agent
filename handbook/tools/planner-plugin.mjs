/**
 * Optional character-planner page (planner/ is a separate static app).
 *
 * The app is copied into dist/planner/ and embedded by reference/character-planner/. The page is only
 * emitted with --planner, so a build without the planner's extracted game data stays valid.
 */
import { access, cp } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = fileURLToPath(new URL('../../planner/', import.meta.url));

export async function plannerPlugin(options = {}) {
  if (!options.planner) return { html: '' };
  try {
    await access(join(appRoot, 'index.html'));
    await access(join(appRoot, 'data/game-data.json'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    throw Error('Planner build requested, but planner/index.html or planner/data/game-data.json is missing. '
      + 'Run `node planner/tools/extract-game-data.mjs` once (it reads your own Daggerfall files), then rebuild with --planner.');
  }
  const html = `<section class="planner-embed" aria-label="DFO Character Planner">
<iframe src="../../planner/" title="DFO Character Planner" loading="lazy" allow="clipboard-write"></iframe>
</section>
<p class="planner-note">The planner is a separate app: your build is saved in this browser and a share link carries it,
and <a href="../../planner/">the full-window version</a> works without the handbook's navigation.</p>`;
  return {
    html,
    publish: async dist => {
      await cp(appRoot, join(dist, 'planner'), {
        recursive: true,
        filter: source => {
          const rel = relative(appRoot, source).replaceAll('\\', '/');
          return !rel.startsWith('test') && !rel.startsWith('tools') && !rel.startsWith('guide') && !rel.endsWith('.md');
        }
      });
    }
  };
}
