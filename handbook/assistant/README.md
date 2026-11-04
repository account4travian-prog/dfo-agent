# DFO Handbook assistant (Phase 1)

The handbook's guide assistant has two layers:

1. **Static, extractive answers** in `/ask/` on the static site: BM25 search over the site search index, quoted
   passages, source-checked numbers. Always available, no model, no cost.
2. **Optional written answer** from the Worker in this directory: Cloudflare Workers AI `qwen3-30b-a3b` with retrieved
   context, strict citation/number verification, and a static fallback whenever the answer is unavailable, unverified,
   over quota or over budget.

The Worker is routed at `handbook.wardenlog.org/api/*` and inherits the existing Cloudflare Access protection. It is
not exposed on `workers.dev`.

## Files

| Path | Purpose |
|---|---|
| `wrangler.toml` | production Worker: AI binding, KV, route, vars |
| `wrangler.dev.toml` | local/remote dev config with test user and debug raw output |
| `src/index.js` | HTTP API, access identity, quota, budget, model call, fallback |
| `src/retrieve.js` | pure retrieval (BM25, section picker) |
| `src/route.js` | deterministic routing: static / qwen / gemma / refuse |
| `src/verify.js` | JSON parsing, citation and number verification |
| `data/index.json` | bundled search index + facts generated from the built site |
| `eval/cases.json` | first eval questions and expected pages |
| `eval/run-eval.mjs` | eval runner against a running Worker |

## Build and test

```powershell
# 1. Build the static site, then bundle its search index for the Worker
node handbook/tools/build.mjs --map --planner
node handbook/tools/build-assistant-index.mjs

# 2. Worker and unit tests
node --test handbook/tools/test/assistant-worker.test.mjs
node handbook/tools/test/ # full suite

# 3. Dry-run the bundle
cd handbook/assistant
npx --prefix %USERPROFILE%\Documents\wardenlog-agent-hub wrangler deploy --dry-run

# 4. Deploy the Worker
npx --prefix %USERPROFILE%\Documents\wardenlog-agent-hub wrangler deploy
```

The KV namespace in `wrangler.toml` is already created. The production route is
`handbook.wardenlog.org/api/*`; the `database`/`workers_dev` route is intentionally off.

## Local model test

```powershell
cd handbook/assistant
npx --prefix %USERPROFILE%\Documents\wardenlog-agent-hub wrangler dev --remote --config wrangler.dev.toml --port 8789

# another terminal
$env:BASE_URL = 'http://127.0.0.1:8789'
node handbook/assistant/eval/run-eval.mjs
```

`wrangler dev --remote` may need an Access Service Token if the route is protected; the dev config removes the route and
uses `workers_dev` so local testing does not touch the Access-protected hostname.

The first smoke eval is **14/14** against the remote dev Worker: 6 model calls, 176 estimated Neurons. It covers page
lookups, explanatory answers, live/price/unknown refusals and special pages. The external DeepSeek comparison is not
part of this run; it needs a separate API key and is optional.

## Budget and quotas

- `MONTHLY_BUDGET_USD=5` is a hard estimated-Neuron budget. The Worker reserves the estimated cost before a model call
  and stops model calls at the cap; the static cards remain.
- Workers AI free allowance is **10,000 Neurons/day** on Workers Free. A typical qwen call is about **36 estimated
  Neurons** at 2,400 input/700 output; the free tier covers roughly 275 model calls/day. The $5 cap is the paid-overage
  ceiling if the project moves to Workers Paid.
- `QUOTA_ENFORCE=false` for owner testing. Set it to `true` and tune `FREE_DAILY` / `FREE_MONTHLY` before opening
  beyond testers.
- `ALLOW_ESCALATION=false`; comparison questions can be routed to gemma only when enabled and the eval justifies it.
- The model answer is rejected if it cites an unknown URL, omits citations, or contains a number not present in the
  retrieved context/facts. Rejection returns the static cards.

## Feedback endpoints

The same Worker stores editor feedback in `ASSISTANT_KV` under `feedback:*` (180-day TTL, hashed Access identity,
20 submissions/day/user):

- `POST /api/request-answer` — `{ question, page? }`; adds a guide-expansion request.
- `POST /api/manuscript` — `{ title, question?, body, sources?, contact? }`; adds a manuscript for editing/moderation.
- `POST /api/request-update` — `{ page, title, note }`; adds a page-update request.

The public surfaces are `/ask/` (no-coverage actions), `/contribute/` (manuscript form) and the **Request an update**
form at the end of every article. Submissions are plain text only (tags stripped), never published automatically. The
editor reads them with `wrangler kv key list --namespace-id <ASSISTANT_KV_NAMESPACE_ID> --prefix feedback:` and
then `wrangler kv key get ...`; there is deliberately no admin UI yet.

## Privacy and access

- The Worker is reachable only through the Access-protected hostname route.
- Identity is read from Access headers/JWT for quota keys; it is hashed before KV storage.
- No account data, live player data or prompts are logged to a third party. Prompts stay inside Cloudflare.
- The model is not called for live/player/price questions or for simple page lookups.

## Known limits

- KV counters are not atomic under high concurrency; this is acceptable at beta volume. Use Durable Objects if strict
  quotas become necessary.
- The estimated budget uses token estimates, not provider billing; reconcile against the Cloudflare usage dashboard.
- `data/index.json` must be regenerated after every handbook sync and Worker deploy.
- The external DeepSeek eval is separate and is not part of the Worker.
