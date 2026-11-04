# DFO TerraSol

Project location: `%USERPROFILE%\Documents\DFO\DFO-TerraSol`. This folder is an independent Git repository inside DFO; the parent repository excludes it locally. Run all project commands from this folder. See the [checkpoint](docs/CHECKPOINT-2026-10-28.md) and [DeepSeek review prompt](docs/DEEPSEEK-REVIEW-PROMPT.md).

The [three-tier mind](docs/THREE-TIER-MIND-PLAN.md) now has a reconciled implementation: Luna immediate tactics, Terra 6.1 session planning, and Sol 6.1 difficult decisions and post-session engineering proposals. See [reconciliation and remaining limits](docs/RECONCILIATION-2026-10-28.md). Configure the exact Luna model and allowlist explicitly; no substitute is selected. The old two-tier loop remains available through `DFO_MIND_LEGACY=1` for diagnostics.

The [independent review](docs/INDEPENDENT-REVIEW-2026-10-28.md) and [response with repairs and remaining work](docs/REVIEW-RESPONSE-2026-10-28.md) now guide that implementation. Report metric v2 separates evidenced state transitions from turn/UI/dispatch receipts; those transitions still do not establish useful gameplay by themselves.

Rowan is an experimental DFO player. A single event scheduler routes tactical, session and strategic decisions across the three tiers. The native control port reuses the earlier agent's player-input bridge, 50ms Body, observed-place memory, routing, and frontier exploration. Local code steers and checks a bounded intention without a model call for every keypress or attack. The handbook, persistent character memory, and structured run logs provide context.

The previous practice trial stopped after 21m18s at the user's request. The port has model-free verification; live movement, combat, online account setup, player conversation, and a completed one-hour trial remain unverified. See the [implementation plan](docs/NATIVE-CONTROL-PORT-PLAN.md), [shared contract](docs/NATIVE-CONTROL-CONTRACT.md), and provenance in [Body](docs/BODY-PORT.md) and [bridge](docs/NATIVE-BRIDGE.md) notes.

## Local setup

Use Node.js and a locally authenticated Codex CLI. The project expects its dedicated `engine/` checkout at upstream revision `e4f09316684d78d194553d3c94cbaa9bbdaa9b7b`. It uses the existing Playwright and Vite dependencies at `../upstream/daggerfall-js-source/node_modules`, resolved from the project folder in `src/config.mjs`. Daggerfall's `ARENA2` files default to the Steam install path in that file; set `ARENA2_PATH` to the local folder if needed. The handbook is read from `../handbook/content`. Never put credentials into the project or logs.

The game server uses `127.0.0.1:5390`, the control API uses `127.0.0.1:5391`, and the separate Edge debugging endpoint uses `127.0.0.1:5392`. The Edge profile and runtime artifacts live under `data/`. Keep those ports local and available. The driver can reconnect to the existing Edge game page; a normal hot repair does not close or reload that page.

```powershell
node --test (Get-ChildItem test/*.test.mjs | ForEach-Object FullName)
node tools/native-benchmark.mjs
node src/browser.mjs --headless
```

Start the browser driver separately, then start a bounded session in another terminal:

```powershell
node src/main.mjs --phase trial --minutes 60
node src/control.mjs status
```

A browser must be ready before starting the session. Native control is the default: the driver installs the tracked port into the pinned engine and starts its world host with `agent=1`. Models select `turn`, `look`, `goto`, `use`, `explore`, `fight`, `retreat`, or `stop`; execution defaults to 30 seconds (90 for bounded exploration) with a 90-second hard bound. The worker polls locally while an intention progresses. Scene/driver changes, lease expiry, and cancellation release input. Trusted UI actions cancel Body control first. `--control browser` on both driver and worker selects the earlier browser diagnostic mode explicitly; native mode never silently falls back to timed movement.

Watch the status and logs to distinguish issued actions from observed game outcomes. A wall-clock session deadline is not evidence of continuous play or achievement. Assess efficiency as model calls and tokens per independently verified game outcome (such as a confirmed room transition or item equipped), alongside failures and elapsed time. Dispatch receipts alone are not verified outcomes; when evidence is insufficient, report the count as unknown rather than treating a call or action as progress. Pure control receipts such as a turn or stop also do not establish quest or combat progress.

## Hold, repair and resume

```powershell
node src/control.mjs hold
node src/control.mjs resume
node src/control.mjs stop
node tools/reload.mjs --reason "Describe the repair"
node tools/reload.mjs --reason "Describe the driver repair" --driver
```

`hold` asks the worker to stop and releases its input; `resume` starts a new worker epoch only while the supervisor is waiting. `stop` ends the supervisor. The reload tool captures status and an observation when the controller is idle, requests a hold, stops outstanding input, and waits for the worker to finish. It runs every `test/*.test.mjs`, leaves the session held on failure, and on success archives source and test bytes and hashes before attempting to resume. `--driver` also replaces the driver and checks the same game-page CDP target and URL on reconnection; Edge and the game remain open. If no supervisor resumes, the tool records that outcome and does not start a new trial. A failed or timed-out reload requires checking its receipt and status before further actions.

Revision snapshots are under `data/revisions/<id>/`; repair receipts are in the active run's `repairs/` directory when available, otherwise `data/repairs/`. Run logs and summaries are under `data/runs/`, screenshots under `data/screens/`, and persistent character memory under `data/memory/`. These are local records and may include game text and images; inspect them before sharing.
