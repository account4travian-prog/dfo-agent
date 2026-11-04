import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSite } from './site.mjs';
export async function check(options = {}) {
  const site = await loadSite(options);
  site.warnings.forEach(s => console.warn(`WARN ${s}`));
  site.errors.forEach(s => console.error(`ERROR ${s}`));
  console.log(`${site.pages.length} pages checked: ${site.errors.length} errors, ${site.warnings.length} warnings.`);
  return site;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) check().then(site => {
  if (site.errors.length) process.exitCode = 1;
}).catch (error => {
  console.error(error.message);
  process.exitCode = 1;
});
