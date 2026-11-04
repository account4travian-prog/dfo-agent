# Guide assistant / personification — research C

**Task:** task-19 (research C). **Author:** coverage-auditor. **Date:** 2026-10-25.
**Scope:** recommend a small, cheap, highly capable, source-accurate assistant for The DFO Online Handbook that can
navigate pages and answer game questions. No code changes were made; this is a research + MVP recommendation.

**What this repo already has (measured 2026-10-25):**
`handbook/dist/search-index.json` has **113 indexed entries** with `url`, `title`, `stage`, `gate`, `status`, `tags`,
per-section anchors/excerpts and full `body`; **≈61,600 words of body text** (~82k tokens). `handbook/facts/facts.json`
holds **47 facts**, each with `value`, `label`, `unit`, `source`, `symbol` and `appliesOnline` (commit `e4f093166`,
extracted 2026-10-24). `handbook/facts/tables.json` has the generated class and online-ruleset tables.
`handbook/dist/previews.json` is 588 KB; `dist/map-data/` is 26 MB (paths, world map, town data); `planner/` ships class
and plan presets (`tiger-fist`, `ashen-blade`) and build rules. The site is static, builds with Node and **no installed
packages**, and is served from **Cloudflare Pages** behind **Cloudflare Access** (`handbook/DEPLOY.md`; no analytics, one
external Google Fonts request). That is an unusually good starting point: retrieval does **not** need a vector database,
and the facts registry gives every number a citation anchor.

The goal is not a general chatbot. It is a **librarian that answers from the guide, shows the page, and refuses when the
guide does not say** — because a plausible wrong Daggerfall number costs a player a week.

---

## 1. Candidate models and prices (current, Oct 2026)

Prices below are list prices per 1M tokens, input / output. Primary source for hosted open models: Cloudflare Workers AI
pricing table (last updated 2026-10-20). Hosted frontier-small prices are from a secondary compilation checked
2026-10-17 against provider pages; **confirm on the provider page before committing spend** ([pricing compilation](https://dev.to/freetierkits/cheapest-llm-apis-per-1m-tokens-oct-2026-20-models-compared-plus-free-tiers-4mn9)).

### 1a. Cheap hosted APIs (best answer quality per dollar)

| Model | Input $/1M | Output $/1M | Notes |
|---|---:|---:|---|
| `gpt-5-nano` (OpenAI) | 0.05 | 0.40 | cheapest capable small model in the Oct-2026 survey |
| `gemini-2.5-flash-lite` (Google) | 0.10 | 0.40 | free tier on the Gemini API; good long-context handling |
| `gpt-6-luna` (OpenAI) | 0.10 | 0.50 | — |
| `Claude Haiku 5.5` (Anthropic) | 0.10 | 0.50 | price for prompts ≤100k tokens; strongest instruction-following of the cheap tier in practice |
| `deepseek-flash` (DeepSeek) | 0.30 | 1.20 | peak price; half off-peak |

### 1b. Cloudflare Workers AI (same vendor as the host; open weights)

| Model | Input $/1M | Output $/1M | Why consider it |
|---|---:|---:|---|
| `@cf/qwen/qwen3-30b-a3b-fp8` | 0.051 | 0.335 | 30B MoE with ~3B active: fast, good JSON/instruction following, very cheap |
| `@cf/meta/llama-3.2-3b-instruct` | 0.051 | 0.335 | cheapest sensible small model; good for classification/rerank, weaker prose |
| `@cf/meta/llama-3.1-8b-instruct-fp8-fast` | 0.045 | 0.384 | fast 8B baseline |
| `@cf/google/gemma-4-26b-a4b-it` | 0.100 | 0.300 | 26B MoE (~4B active), strong prose, cheap output |
| `@cf/openai/gpt-oss-20b` | 0.200 | 0.300 | 20B open model; reasoning-flavoured, slower |
| `@cf/zai-org/glm-4.7-flash` | 0.060 | 0.400 | cheap GLM flash |
| `@cf/ibm-granite/granite-4.0-h-micro` | 0.017 | 0.112 | cheapest of all; only for extraction/classification |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 0.293 | 2.253 | quality ceiling on Workers AI; use selectively |
| `@cf/baai/bge-m3` (embedding) | 0.012 | — | cheap embeddings if a vector index is wanted |
| `@cf/qwen/qwen3-embedding-0.6b` | 0.012 | — | same price |
| `@cf/baai/bge-reranker-base` | 0.003 | — | reranking, negligible cost |

Free allowance: Workers AI includes **10,000 Neurons/day** ($0.011 per 1,000 Neurons above it); a 3B-class query costs
under ~50 Neurons, so the free tier is roughly **tens to a couple of hundred grounded queries per day** — enough for
private beta, not for launch traffic.

### 1c. Local / open-weight options

| Family | Typical quantized size | Where it runs | Use |
|---|---|---|---|
| Llama 3.2 1B / 3B | ~0.7–2 GB | browser (WebLLM), Ollama, llama.cpp | small in-browser or desktop assistant |
| Qwen2.5/Qwen3 1.5B–4B | ~1–2.6 GB | same | better instruction following than Llama 3.2 3B at similar size |
| Gemma 3 4B / Gemma 4 small | ~2.5–3 GB | same | prose quality |
| Embeddings: all-MiniLM-L6-v2, bge-small, e5-small | 20–130 MB | Transformers.js in browser | local retrieval without any API |

**WebLLM** is the mature in-browser path: WebGPU inference, OpenAI-compatible API, streaming, JSON mode, model caching,
preliminary function calling; first load downloads the model and is slow ([webllm.mlc.ai](https://webllm.mlc.ai/),
[README](https://github.com/mlc-ai/web-llm)). **Transformers.js** runs ONNX models in the browser on WASM or WebGPU,
including quantized q4/q8, and is the right tool for local embeddings ([Transformers.js docs](https://huggingface.co/docs/transformers.js/index)).
A desktop **Ollama**/llama.cpp fallback is the simplest "local-only" mode if the owner wants an offline copy.

Sizes above are rough q4 figures; check the model card before quoting them to users.

---

## 2. Cost math (rough, for the MVP shape)

Assumptions per question: system + rules ≈ 500 tokens, 3 retrieved sections × ~600 tokens ≈ 1,800, question ≈ 100 →
**~2,400 input tokens**; answer ≈ **250 output tokens**. Retrieval is local/static, so it is free.

| Route | Cost per 1,000 questions | p50/p95 latency (rough) | Verdict |
|---|---:|---|---|
| Extractive only (no model) | **$0.00** | 20–80 ms | zero hallucination, not conversational |
| Workers AI `llama-3.2-3b` or `qwen3-30b-a3b` | **≈ $0.21** | 0.5–1.5 s / 1–2 s | best cheap default |
| Workers AI `gemma-4-26b-a4b` | ≈ $0.33 | 0.6–1.8 s | better prose |
| Workers AI `gpt-oss-20b` | ≈ $0.58 | 1–3 s | only if quality demands |
| Workers AI `llama-3.3-70b` | ≈ $1.30 | 1–3 s | selective "hard question" fallback |
| `gpt-5-nano` API | ≈ $0.23 | 0.6–1.5 s | best cheap external |
| `gemini-2.5-flash-lite` API | ≈ $0.35 | 0.5–1.2 s | free tier helps beta |
| `Claude Haiku 5.5` API | ≈ $0.38 | 0.6–1.5 s | strongest cheap instruction following |
| Local browser 3B (WebLLM q4) | $0 marginal (0.1–0.4 GB traffic/model) | first load 30–90 s, then 5–20 tok/s → 250 tok in 12–50 s | privacy/offline only, not primary UX |
| Local desktop 4B (Ollama q4) | $0 marginal (2–3 GB disk) | CPU 10–25 tok/s → 10–25 s; GPU 30–80 tok/s → 3–8 s | power-user/offline mode |

At 10,000 questions/month the cheap cloud routes cost **$2–4/month** plus the existing Pages/Workers plan; at 100k
questions they cost **$20–40/month**. For comparison, stuffing the whole 82k-token guide into every prompt with
`gpt-5-nano` costs ≈ $0.004/query (**$4 per 1k**), 15–20× the RAG route, with worse citation precision — do not do it.

Embeddings, if a vector index is ever added: the whole corpus is ~85k tokens → **≈ $0.001 one-off** with bge-m3.
Vectorize stores ~0.35M dimensions for ~900 chunks; the Workers free tier covers 5M stored / 30M queried dimensions and
500k-question traffic would still be inside the paid included allowance, so vector cost is noise
([Vectorize pricing](https://developers.cloudflare.com/vectorize/platform/pricing/)).

---

## 3. Architectures compared (at least three, plus the recommendation)

### A. Static extractive librarian (no LLM) — ship this first
**How:** browser loads the existing `search-index.json` (or a trimmed assistant index), runs BM25 + section scoring, and
renders answer cards: the best two or three sections verbatim, their page title/stage/status, deep links, and
"related pages". A tiny template layer turns the top result into a short "here is what the guide says" summary.
**Cost:** $0. **Latency:** tens of ms. **Quality:** cannot hallucinate; cannot rephrase; poor for "why/compare" questions.
**Privacy:** perfect; no new requests. **Ops:** none. **Personification:** limited to canned intros.

### B. Cloudflare-native RAG + small Worker AI model — recommended MVP
**How:** Pages Function (or a small Worker) does retrieval server-side from a prebuilt index, calls Workers AI
(`qwen3-30b-a3b` default; `llama-3.3-70b` or a hosted API for hard questions), validates that every claim maps to a
retrieved passage, returns a JSON answer + citations. **Cost:** ≈ $0.21/1k questions; free tier for beta.
**Latency:** 0.5–2 s p95. **Quality:** good if constrained to summarise retrieved text (the guide is short, the model
rarely needs world knowledge). **Privacy:** prompts stay inside Cloudflare; no new third party beyond the host.
**Ops:** one deployment surface, but it ends the "pure static, no functions" property — see §7.

### C. Cheap external API RAG (OpenAI/Gemini/Anthropic small model)
**How:** same retrieval; model behind a secret in a Worker/Function or called from a local dev script. **Cost:** $0.23–0.38/1k.
**Quality:** highest cheap-tier instruction following and JSON reliability; best for the evaluation loop (LLM-as-judge
can also use the same provider). **Privacy:** guide text (public) leaves Cloudflare; user questions would go to a third
party — a real change to the site's current "no third-party requests" statement. **Ops:** key/secret management, spend
caps, provider status dependency.

### D. Local-first / offline personal mode
**How:** WebLLM or Ollama + the same client-side index; model downloads to the user's machine, so zero marginal cost and
no data leaves the browser. **Cost:** $0 + bandwidth. **Latency:** 12–50 s per answer on typical hardware, first load
worse. **Quality:** 3B-class; needs stricter extractive prompting and citation checks. **Best role:** optional toggle
("run locally") for privacy/offline, not the default.

### E. Recommended hybrid = A + B (+ D as a toggle)
Phase 0 ships A in days with no server. Phase 1 adds B behind the same UI and keeps A as the **extractive fallback** when
the model is unavailable, slow, over budget, or fails the quote check. Phase 3 offers D as an opt-in. C stays available
as a benchmark/quality ceiling behind a flag, because one provider or model should not be the only option and the
evaluation set can run against both.

| | A static | B Cloudflare RAG | C external API | D local |
|---|---|---|---|---|
| Hallucination risk | none | low (quote-checked) | low (quote-checked) | low–medium |
| Answer quality | low | good | best cheap | fair |
| Cost / 1k | $0 | ~$0.21 | ~$0.23–0.38 | $0 |
| p95 latency | <100 ms | 1–2 s | 1–2 s | 12–50 s |
| New vendor | none | Workers AI | OpenAI/Google/Anthropic | none |
| Static-site purity | kept | needs Functions | needs Function/proxy | kept |
| Privacy | best | good | weakest | best |
| Build effort | 1–2 days | ~1 week | ~1 week | 2–4 days |

---

## 4. Recommendation (practical MVP)

1. **Persona:** *The Archivist* — a guide persona, not a game-playing NPC. It speaks in the handbook's voice, opens with
   one short in-world line at most, then answers plainly. It never claims knowledge beyond the guide and never roleplays
   a character who "knows" DFO beyond what the pages say. Naming it after the guide's memory/lore (LeFay Monument,
   archivist) fits without inventing rules.
2. **MVP = Architecture B, but retrieval-first.** A grounded RAG service with three tools:
   `search(query)` → ranked pages/sections; `get_section(slug, anchor)` → verbatim text + metadata; `get_fact(id)` →
   value + source file/symbol. Later add `find_service` (map data), `related_pages`, and `plan_firmament`/`build_plan`
   (planner presets). The model chooses at most 2–3 tools per turn; every answer must cite 1–4 pages with anchors.
3. **Default model:** Workers AI `@cf/qwen/qwen3-30b-a3b-fp8` (fast, cheap, JSON-friendly), escalate a hard question to
   `llama-3.3-70b` or a hosted cheap API only if the quote check or confidence is low. Use `llama-3.2-3b` or
   `granite-4.0-h-micro` for routing/classification, and `bge-reranker-base` for reranking.
4. **Retrieval:** do **not** start with a vector database. BM25 over ~113 pages/≈700 sections plus title/tag/stage boosts
   is enough, deterministic, testable, and free; add embeddings only if the golden-set retrieval score plateaus (then
   bge-m3 for ~$0.001 one-off).
5. **Launch behind Access** (the site is private today), with Turnstile + per-session/IP rate limits and a daily budget
   cap. Measure real questions before opening it publicly.
6. **Ship Phase 0 first.** A no-model "ask the guide" search page with precise answers, deep links and a good "not
   found" flow can go live with zero risk and gives the evaluation corpus real user questions.

**What I would *not* do:** fine-tune a model (the facts change every sync; retrieval handles it), upload the whole guide
into a long context (15–20× cost, worse citations), use a 1B model for final prose, ship a browser-download model as the
default, or let the model write URLs (construct links from the index).

---

## 5. Guardrails and citation contract

**Citation contract (enforced in code, not prompt only):**
1. Every answer carries 1–4 citations of the form `{slug, anchor, title, commit}`. Links are built only from the index
   whitelist (`https://handbook.wardenlog.org/<slug>/#<anchor>`); the model may not emit raw URLs.
2. Every factual sentence must quote or paraphrase a retrieved passage. The server checks each sentence's key terms
   against the retrieved text and rejects/repairs unsupported sentences; a rejected answer returns the extractive card.
3. Every number in an answer must appear verbatim in the retrieved passages **or** come from a `get_fact(id)` result; the
   service extracts numbers from the answer and verifies them. This catches the classic "invented 15%" failure.
4. If top retrieval score is below a threshold, answer: "The guide does not cover this" plus up to three nearest pages
   and a search link. Never fill the gap from model memory.
5. Show trust metadata: page `status` ("draft"), guide commit (`e4f093166`), and the page's own "verified" note. Do not
   present a draft page as gospel.
6. Refuse live-state questions (current prices, seat holders, active events, player counts) and send the user to the
   in-game HUD/notice board — the handbook explicitly does not publish live data.
7. Treat retrieved content and user text as untrusted data: no tool calls or instructions from page text, no system
   prompt verbatim, bounded tool iterations, no arbitrary fetch.
8. Style contract: direct answer first (≤3 sentences), then bullets for steps, then citations; build-agnostic trade-offs,
   no "best build"; no hype; match `handbook/STYLE.md` voice.
9. Cost/safety: per-session question cap, daily spend cap, answer cache keyed by `hash(question + commit)`, Turnstile on
   the public form, no account data in prompts or logs, 30-day max log retention of question + cited ids only.
10. Change control: corpus commit stamped in every answer and cache key; after each sync the index and eval set rebuild,
    and a failing regression blocks the assistant while the static guide stays online.

---

## 6. Evaluation plan

**Golden set (build-time, ~80–120 cases):**
- 40 factual: answers that exist in `facts.json` or a caps/rules table (expected fact id/value + page/anchor).
- 20 navigation: "where do I learn X", "which page for Y", "what do I do next" (expected top-1/top-3 page).
- 10 multi-page: compare/online-vs-offline, must cite ≥2 pages.
- 10 unanswerable/live-state: must refuse or redirect, never invent.
- 10 adversarial/injection: instructions embedded in questions, fake citations, "ignore the guide", URL requests.

**Automated checks (deterministic, no LLM needed):**
- Citation validity: every cited slug/anchor exists in the index; every cited page is in the retrieved set.
- Quote check: cited quoted text is a substring of the page (whitespace-normalised).
- Number check: every number in the answer appears in context or `facts.json`.
- Refusal check: unanswerable set never returns a factual answer.
- Navigation: expected page in top-3.
- Latency/cost: p50/p95 and tokens per answer recorded.

**Judged checks:** cheap LLM-as-judge (groundedness / helpfulness / completeness, 1–5) on every non-trivial answer, plus
**human review of 100% of failures and a 10% weekly sample** — judge models are not trustworthy alone.

**Targets for launch:** groundedness ≥98% (zero uncited numeric claims), citation precision ≥95%, top-3 retrieval ≥90%,
refusal correctness ≥95%, p95 <2.5 s, ≤$0.001 per question. Re-run on every sync and before every deploy; keep the eval
set in the repo so the assistant can never silently regress.

---

## 7. Concrete integration sketch for this repo (no code changes yet)

**Data/index (build time, no new dependencies):**
- `handbook/tools/build-assistant-index.mjs` — read `content/**/*.md` (reusing `tools/markdown.mjs`) + `facts/facts.json`;
  emit `handbook/dist/assistant-index.json`: `{commit, generatedAt, pages:[{slug,url,title,stage,gate,status,verified,
  sections:[{anchor,title,text}], facts:[{id,value,source,symbol}]}], glossaryTerms}`. Estimate 300–600 KB raw, ~100 KB
  gzipped — acceptable for a lazy-loaded page, and the existing `search-index.json` (587 KB) already ships.
- `handbook/tools/check.mjs`: add validation that every assistant-index slug/anchor exists and every fact id is known.
- Keep the build dependency-free; the index is generated by the existing Node build, not by a new package.

**UI:**
- Add a generated `/ask/` route (same pattern as `reference/bay-map`, via `tools/site.mjs`/`build.mjs`) with a
  `#guide-assistant` mount, plus a nav/footer link and a search box entry. Keep it a progressive enhancement: with no
  JS it falls back to the existing search page; with no model it shows extractive cards (Architecture A).
- `handbook/theme/assistant.js` + `assistant.css`, loaded only on `/ask/`: BM25 client-side, render citations, streaming
  or staged rendering, deep links, feedback buttons, "run locally" toggle later.
- No new third-party script, font or analytics. The persona name/wordmark is a text label, not an asset from the game.

**Edge service (Phase 1), two options:**
1. **Pages Function** `functions/api/ask.js` at the repo root (Pages' convention): uses `env.AI` binding
   (`@cf/qwen/qwen3-30b-a3b-fp8`), optional `env.KV` cache, imports the assistant index, verifies quotes and numbers,
   returns JSON; `functions/_middleware.js` does Turnstile/rate-limit/CORS. This adds a Functions deployment step and a
   `wrangler` config but keeps one project.
2. **Separate Worker** on `ask.wardenlog.org` (or `ask.wardenlog.org/api`), same code, wired from the static page with
   same-origin proxying; cleaner separation from the static build and easier to put behind its own Access policy and
   budget cap. Recommended if the owner wants the static site to stay purely static.
- Either way, put **Cloudflare AI Gateway** in front (caching, rate limiting, logs) and use Workers AI's free/paid plan
  ([AI Gateway features](https://developers.cloudflare.com/ai-gateway/features/), [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)).
- Deployment docs: extend `handbook/DEPLOY.md` with the endpoint, secrets, budget cap, and the privacy line. If an
  external API is ever chosen, update the "only external request is Google Fonts" statement explicitly.

**Tools for navigation (JSON schemas, server-validated):**
`search(query)`, `get_page(slug)`, `get_section(slug, anchor)`, `get_fact(id)`, `related_pages(slug)`,
`find_service(service)` (from `map-data/paths.json` / town data), `open_map(townOrService)` (deep link into the Bay map),
`plan_build(classPreset)` and `plan_firmament(goal)` (from `planner/` presets/JSON; read-only). Every tool returns a
whitelisted URL or structured data; the model never generates a URL.

**Ops:** Questions/day and spend dashboard; kill switch (feature flag in `site.config.json`); cache hit-rate; failure log
(question + retrieval top score + citation pass/fail); answer feedback goes to Discord issues as today
(`feedbackUrl`). Rate limit before launch (the site may leave Access).

**Personification details:** name *The Archivist*; greeting one line maximum ("I can look things up in the handbook —
what do you need?"); answer template = direct answer → steps/trade-offs → "Where this comes from: [page] (draft/verified
at e4f093166)" → "Not in the guide" fallback with search suggestions. It is allowed to say "I don't know"; it is not
allowed to guess.

**What the owner must decide:**
1. Vendor posture: Cloudflare-only (B) or external small API (C) for quality — B is the safer default given the current
   no-analytics/no-third-party promise.
2. Whether to keep the site purely static: if yes, start with A only and add a separate Worker later; if no, Pages
   Functions is the smallest step.
3. Public-launch abuse budget: Turnstile + per-session cap + daily cap; decide the monthly spend ceiling ($10–25 is
   enough for the early audience at cheap-model prices).
4. Local-only toggle demand: nice privacy story, but 12–50 s answers mean it should stay opt-in.

---

## 8. Risks and open questions

- **Stale corpus:** the guide is synced manually (≈496 commits behind at the last audit); the assistant must stamp the
  commit and rebuild the index on every sync, or it will confidently answer from old rules. This is the top risk.
- **Draft pages:** 76+ pages are still `status: draft`; the assistant must surface that and prefer the reviewed pages.
- **Classic-vs-online confusion:** the model may mix Daggerfall offline rules with DFO online rules; retrieval should
  boost `online-ruleset`, `what-changed`, caps and the changed-2026 pages, and the eval set must include this trap.
- **Small-model JSON/tool reliability:** Qwen3-30B/8B class models can emit malformed JSON or skip citations; server-
  validate, retry once with the schema, then fall back to extractive.
- **Prompt injection** via questions (not much via the guide, which is trusted); tool sandbox and no-fetch policy.
- **Hosting limits:** Workers AI free tier is small (10k Neurons/day); plan the paid tier before any launch spike.
- **Unverified numbers here:** per-query token estimates and latencies are planning estimates, not measurements of this
  app; the hosted-API price table comes from a secondary compilation and must be re-checked on provider pages.

---

## 9. Sources checked (2026-10-25)

- Cloudflare Workers AI pricing (models, Neurons, free allowance, last updated 2026-10-20):
  https://developers.cloudflare.com/workers-ai/platform/pricing/
- Cloudflare Vectorize pricing (dimensions, free/paid allowances):
  https://developers.cloudflare.com/vectorize/platform/pricing/
- Cloudflare Pages Functions (server-side code/Workers runtime for the static site):
  https://developers.cloudflare.com/pages/functions/
- Cloudflare Workers AI bindings (AI binding for Functions/Workers):
  https://developers.cloudflare.com/workers-ai/configuration/bindings/
- Cloudflare AI Gateway features (caching, rate limiting, logs):
  https://developers.cloudflare.com/ai-gateway/features/
- Cloudflare Workers pricing (free/paid plan; check current numbers before budgeting):
  https://developers.cloudflare.com/workers/platform/pricing/
- Cheap hosted API prices (secondary compilation, checked 2026-10-17):
  https://dev.to/freetierkits/cheapest-llm-apis-per-1m-tokens-oct-2026-20-models-compared-plus-free-tiers-4mn9
- WebLLM in-browser inference (WebGPU, OpenAI-compatible, model families, caching, WIP function calling):
  https://webllm.mlc.ai/ and https://github.com/mlc-ai/web-llm
- Transformers.js (browser ONNX/WASM/WebGPU, quantized q4/q8, local embeddings):
  https://huggingface.co/docs/transformers.js/index
- Repo data measured in place: `handbook/dist/search-index.json` (113 entries, ~61.6k body words),
  `handbook/facts/facts.json` (47 facts, commit e4f093166), `handbook/facts/tables.json`,
  `handbook/dist/previews.json`, `handbook/dist/map-data/` (26 MB), `handbook/DEPLOY.md`, `handbook/site.config.json`,
  `handbook/tools/` (Node, no installed packages).

**Bottom line for the Lead:** ship the extractive librarian first (days, $0), then the Cloudflare Workers AI RAG MVP
(~1 week, ≈$0.21 per 1,000 questions, 1–2 s p95) with a hard citation/quote/number contract and a refusal path; keep a
hosted cheap API as the benchmark/quality fallback and a browser-local model as an opt-in privacy mode. Do not fine-tune,
do not vector-database-by-default, and do not let the model produce URLs or unsourced numbers.
