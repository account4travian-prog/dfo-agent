# Run census and watcher

`node tools/census.mjs <runDir>` prints a zero model summary. Add `--json` for machine readable output. Stop reasons and outcomes come from logged event notes; verified useful outcomes reuse metric v2 from `src/report.mjs`. Missing sections and model usage are reported as absent or unknown.

`node tools/watch.mjs <runDir>` polls `GET /health` and `GET /snapshot?ui=0&image=0&after=0` every 15 seconds by default and appends verdicts with evidence to `<runDir>/watch.jsonl`. It does not call models. It runs dry by default. Configure thresholds with `--idle-minutes`, `--repeat-count`, `--window-minutes`, and `--lease-timeout-ms`; set `--interval-ms` and `--control` to change polling. It caches the census report and rows until a run trace file's size or modification time changes.

Add `--enforce` to write a `hold` or `stop` command to the run's `data/command.json` and request the existing control `/stop` path. A hold or stop is never cleared by the watcher. Keep a single watcher per run because the runner command file is shared.

The watcher starts a fresh evidence window after its last enforced action, an `operator-command` resume, a `session-start`, or a worker `epoch-start`. Old stop reasons and useful outcomes before that point do not count. The idle clock advances only across consecutive polls where `native.ready` is true or `player.phase` is `world`; it starts at zero when the watcher first observes the world.

Health-fall holds require at least three consecutive poll-to-poll health drops without position progress. They are suppressed while the active task is `fight` or `retreat`, a visible native target is marked hostile, or Body's current goal indicates combat. The native control health and snapshot currently do not expose held-input state, active-task ownership, or input lease timestamps. Those two stop rules activate only if a compatible control implementation supplies `inputHeld`, `activeTask`, or `inputLease` fields. Live enforce behavior remains to be verified with the runner and driver.
