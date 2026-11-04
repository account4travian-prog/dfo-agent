# Scheduled upstream engine sync

The sync tool defaults to a dry run. Run it manually from the primary checkout with:

```powershell
Set-Location '%USERPROFILE%\Documents\DFO\DFO-TerraSol'
node tools/upstream-sync.mjs
```

The scheduled task uses this action to fetch, validate, swap the candidate, and commit only `engine-pin.json`:

- Program: `C:\Program Files\nodejs\node.exe`
- Arguments: `tools\upstream-sync.mjs --execute --commit`
- Start in: `%USERPROFILE%\Documents\DFO\DFO-TerraSol`

Configure Task Scheduler to run daily, **only when the user is logged on**, with **Run task as soon as possible after a scheduled start is missed**, a **45-minute** stop limit, and **Do not start a new instance**. Do not store the account password. The task is non-interactive and all subprocesses have finite timeouts.

The tool exits `3` if a session, driver, game, or protected port is active, `1` on failure, and `0` after a plan, no-op, or successful swap. Receipts, rollback state, and failure dossiers are written under `data/upstream-sync/`. Use `node tools/upstream-sync.mjs --rollback` while idle to restore the retained engine and pin. At most two previous engines are retained.
