import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { relativeUrl } from './site.mjs';
import { escapeHtml as e } from './markdown.mjs';

// Prefer the engraved SVG series, while retaining existing WebP compatibility.
export async function stageArt(root, stage, from, overview = false) {
  const image = await stageImage(root, stage, from, 2400, 900);
  const fallback = '<div class="stage-art-fallback" aria-hidden="true"><svg viewBox="0 0 76 76" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round"><circle cx="38" cy="38" r="28"/><circle cx="38" cy="38" r="33"/><path d="M38 5v9m0 48v9M5 38h9m48 0h9M38 17l6 21-6 21-6-21Zm-21 21 21-6 21 6-21 6Z"/></svg></div>';
  return `<div class="stage-art${overview ? ' stage-overview-art' : ''}" aria-hidden="true">${image || fallback}</div>`;
}

// Home tiles crop the same plates to a square, with a Roman numeral if art is absent.
export async function stageTileArt(root, stage, from, numeral) {
  const image = await stageImage(root, stage, from, 600, 600);
  return `<span class="stage-art stage-tile-art" aria-hidden="true">${image || `<span class="tile-art-number">${e(numeral)}</span>`}</span>`;
}

async function stageImage(root, stage, from, width, height) {
  let image = '';
  for (const extension of ['svg', 'webp']) {
    const asset = `theme/art/stage-${stage.id}.${extension}`;
    try {
      await access(join(root, asset));
      image = `<img src="${e(relativeUrl(from, asset))}" alt="" loading="lazy" width="${width}" height="${height}">`;
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return image;
}
