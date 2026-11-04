# Online job report

Local implementation in `sol/online`; no commit. Startup integration still needs the controller change under Requests. No game, browser, driver, model, or live service was started. Tests used fakes and temporary directories.

## Changes

- Worker accepts `--mode online|offline`, default `online`, and forwards it to child epochs. Goals, context, plans, continuation, memory directories, status, logs and the worker's aggregate report carry/separate mode. Mixed or unlabelled epoch reports and cross-mode measurements are refused. Wrong-mode worlds and Tiger Fist hold before model/input dispatch.
- Active native/Luna/Terra/Sol prompts use selected-mode facts and current bindings, preserve game/player-text-as-data and the first-meeting AI introduction. Legacy PILOT/PLANNER text is unchanged and marked legacy; that diagnostic worker requires explicit offline mode.
- Added `startup.sign-in`, `startup.select-rowan`, `online.rest`, `online.respawn` catalogue entries and trusted driver executors. Account JSON uses `handle` and `password`, matching the engine login fields. Read only at input time from `DFO_ROWAN_ACCOUNT_FILE`, otherwise `%USERPROFILE%\.dfo-rowan\account.json`; missing/unreadable/invalid input holds as `account-missing`. Signed-in profiles skip credential reads. Account/profile images and fields are masked; observations, native window text and logs are redacted. Credentials never enter workflow arguments or receipts. Ordinary focused/coordinate UI input cannot bypass account-field or character guards.
- Rowan selection checks the complete rendered realm list, exact name, unique match, current enabled Play control, and resulting online Rowan identity. Missing Rowan may open normal creation with `allowCreate:true`; creation name entry is restricted to Rowan. Respawn checks the same living character; rest waits for the channel's end and an own-vital gain. No save/load recovery is substituted online.
- Snapshots expose live `inputActions.js` action codes from `ui/input.js`'s current `bindings()` store, including unbound actions and swing setting. Prompts receive those bindings. Defaults are explicitly labelled fallback. Fixed a context-reduction loop exposed by the additional context.

## Engine evidence

Read the primary checkout's engine only: `main.js`, `ui/enhanced/enhancedMenu.js`, `ui/saveTile.js`, `ui/accountFlow.js`, `ui/enhanced/enhancedAccount.js`, `ui/enhanced/enhancedChargen.js`, `ui/deathScreen.js`, `ui/enhanced/enhancedDeath.js`, `ui/enhanced/enhancedRest.js`, `systems/rest/restAct.js`, `systems/online/onlineLane.js`, `systems/inputActions.js`, and `scenes/world.js`. Confirmed the live relay/account defaults in `net/online.js` and `net/accountClient.js`.

Three brief assumptions differ from current source: mods have selective online forcing; rest has a six-second channel before the night passes; QuickSave can request a server checkpoint, while in-session loading is disabled. Prompts follow the code. Online death also has zone-specific countdown restrictions.

## Tests

The initial nine regression tests failed before implementation and passed afterward. Additional mode/plan/context, mixed-report/comparison, focused-input privacy, redaction and unknown-health checks were also observed failing before their fixes. Added executor, real scheduler and injected-controller coverage, including conservative startup holds. Existing expectations were not weakened.

- `node --test test/round3-online-*.test.mjs`: **20/20 pass**.
- `node --test test/*.test.mjs`: **246 tests, 241 pass, 5 fail**. All five failures are in `native-bridge.test.mjs`, expected without the ignored engine; diagnostics include absent engine modules and `spawnSync git ENOENT`. No other failures.
- `git diff --check`: clean.

## Requests

1. **Required: `src/native-controller.mjs`.** Add trusted startup outcome support across the pre-world/native-frame transition and for an already-signed-in no-op. Today the executor can observe online Rowan, but the generic same-frame check returns blocked/reconciliation-required when startup changes frame; an unnecessary sign-in invocation on an already-signed-in profile also holds. `round3-online-controller.test.mjs` demonstrates both limits with injected adapters. Preserve page/generation fencing, request replay and unknown-effect holds; do not simply waive frame/identity checks. A normal signed-in caller should already skip the sign-in workflow using snapshot account facts.
2. `src/report.mjs`: apply the same mode checks for direct consumers outside the worker. The owned worker uses `buildModeReport`; the legacy aggregate remains unchanged.
3. `src/dashboard.mjs`: replace its hard-coded "Experimental offline trial" label with the reported session mode. The session endpoint now exposes mode.

## Live-pending

Actual DOM/control freshness and screenshot redaction, account authentication/latency, existing Rowan entry, visible creation through completion, rest refusal/interruption, zone death countdown/respawn, rebound controls, server checkpoints and online combat remain unverified. Full online startup acceptance requires Request 1 and a coordinated live run; fixture passes do not establish live play.
