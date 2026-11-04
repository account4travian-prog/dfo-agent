/**
 * First assistant eval: hits a running Worker (/api/ask) and checks retrieval/citations/refusal shape.
 * Usage: BASE_URL=http://127.0.0.1:8789 node handbook/assistant/eval/run-eval.mjs
 * Not part of the static site build. It does not call DeepSeek; that external comparison is a separate run.
 */
import { readFile, writeFile } from 'node:fs/promises';

const base = (process.env.BASE_URL ?? 'http://127.0.0.1:8789').replace(/\/$/, '');
const user = process.env.EVAL_USER ?? 'assistant-eval';
const suite = JSON.parse(await readFile(new URL('./cases.json', import.meta.url), 'utf8'));
const results = [];
let modelCalls = 0;
let totalNeurons = 0;

for (const item of suite.cases) {
  const started = Date.now();
  let data, error = null;
  try {
    const response = await fetch(`${base}/api/ask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user': user },
      body: JSON.stringify({ question: item.question })
    });
    data = await response.json();
    if (!response.ok) error = data?.error ?? `HTTP ${response.status}`;
  } catch (cause) {
    error = String(cause);
  }
  const urls = new Set([...(data?.cards ?? []).map(c => c.url), ...(data?.citations ?? []).map(c => c.url)]);
  const expectedHit = item.expect?.length ? item.expect.some(url => urls.has(url)) : false;
  const noModel = !data || data.mode !== 'model';
  const pass = error ? false : item.expectNoModel ? noModel : item.expect?.length ? expectedHit : true;
  if (data?.mode === 'model') modelCalls += 1;
  totalNeurons += Number(data?.usage?.estimatedNeurons ?? 0);
  results.push({
    id: item.id,
    question: item.question,
    pass,
    error,
    mode: data?.mode ?? null,
    route: data?.route ?? null,
    model: data?.model ?? null,
    urls: [...urls],
    expectedHit,
    fallback: data?.fallback ?? null,
    ms: Date.now() - started
  });
}

const passed = results.filter(r => r.pass).length;
const report = {
  corpus: suite.corpus,
  base,
  generatedAt: new Date().toISOString(),
  total: results.length,
  passed,
  modelCalls,
  totalNeurons,
  results
};
const out = new URL('../../../audit/work/reports/assistant-eval.json', import.meta.url);
await writeFile(out, JSON.stringify(report, null, 2));
const md = [
  `# Assistant eval — ${report.generatedAt}`,
  '',
  `- Corpus: ${suite.corpus}`,
  `- Cases: ${results.length}; passed: ${passed}; model calls: ${modelCalls}; estimated Neurons: ${totalNeurons}`,
  '',
  '| Case | Pass | Mode | Route | Expected hit | ms |',
  '|---|---|---|---|---|---:|',
  ...results.map(r => `| ${r.id} | ${r.pass ? 'yes' : 'NO'} | ${r.mode ?? '-'} | ${r.route?.kind ?? '-'} | ${r.expectedHit ? 'yes' : 'no'} | ${r.ms} |`),
  '',
  'Failures and near misses are in `audit/work/reports/assistant-eval.json`.'
].join('\n');
await writeFile(new URL('../../../audit/work/reports/assistant-eval.md', import.meta.url), md);
console.log(`${passed}/${results.length} passed; ${modelCalls} model calls; ${totalNeurons} estimated Neurons`);
for (const r of results.filter(r => !r.pass)) console.log('FAIL', r.id, r.error ?? r.mode ?? '', r.urls.join(','));
