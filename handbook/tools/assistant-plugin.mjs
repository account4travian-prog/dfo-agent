/**
 * Ask the guide: a static, extractive page with an optional model-backed answer.
 *
 * The static cards are the fallback and the default when no model/budget/quota is available. The Worker at
 * /api/ask can add a short, citation-checked answer through Workers AI; if it fails, the page keeps the cards.
 */
import { cp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const themePath = join(root, 'handbook/theme/assistant');

export async function assistantPlugin(options = {}) {
  if (options.assistant === false) return { html: '' };
  const facts = await readFile(join(root, 'handbook/facts/facts.json'), 'utf8');
  const portrait = await readFile(join(themePath, 'archivist.svg'), 'utf8');
  const html = `<section class="guide-assistant" aria-label="Ask the guide">
<header class="ga-intro">
<div class="ga-persona"><div class="archivist-portrait" data-archivist-state="idle" aria-hidden="true">${portrait}</div><div><p class="eyebrow">THE ARCHIVIST · GUIDE ASSISTANT</p><h2>Find the page, not a guess</h2>
<p>Ask a question about DFO Online. The Archivist searches the handbook's own words and shows you the passages it found. A written answer is optional: it is checked against those passages before it is shown, and the quoted cards remain underneath.</p></div></div>
<div class="ga-note"><strong>Static-first preview.</strong> The assistant always works from the guide, never from outside knowledge. If the model is unavailable or over budget, you still get the quoted passages. <a href="../reference/how-this-guide-is-checked/">How this guide is checked</a>.</div></header>
<form class="ga-form" role="search"><label for="ga-query">What do you want to know?</label><div class="ga-row"><input id="ga-query" type="search" placeholder="How many stars per Renown? Where is the bank? What is a Breach?" autocomplete="off"><button type="submit">Search the guide</button><button type="button" id="ga-ask">Ask the Archivist</button></div></form>
<div class="ga-examples" aria-label="Example questions"><button type="button" class="ga-example">How do I bank gold?</button><button type="button" class="ga-example">What is a Breach?</button><button type="button" class="ga-example">How many stars per Renown?</button><button type="button" class="ga-example">Where do I start a questline?</button></div>
<p class="ga-status" id="ga-status" role="status">Ask a question, or start with an example.</p>
<section class="ga-model" id="ga-model" hidden aria-live="polite"><h2>The Archivist's answer</h2><div id="ga-model-answer"></div><div id="ga-model-citations" class="ga-citations"></div><p class="ga-model-note" id="ga-model-note"></p></section>
<div class="ga-answer" id="ga-answer" aria-live="polite"><h2>Guide passages</h2><p>Results will appear here.</p></div>
<div class="ga-facts" id="ga-facts" hidden><h2>Source-checked numbers</h2><div id="ga-fact-list"></div></div>
<p class="ga-foot">The assistant knows only what the handbook says. It will not answer live player, price or account questions, and it does not replace the page it links to.</p>
</section>`;
  return {
    html,
    publish: async dist => {
      await cp(themePath, join(dist, 'theme/assistant'), { recursive: true });
      await cp(join(root, 'handbook/facts/facts.json'), join(dist, 'facts/facts.json'));
    }
  };
}
