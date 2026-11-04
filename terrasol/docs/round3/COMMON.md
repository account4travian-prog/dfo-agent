# Round 3: shared rules for every job

Direction from the user, 2026-10-28: the goal is an agent player of DFO **Online**. Every permission is granted and there are no holdbacks: Rowan may use every resource (the handbook, training knowledge, in-game sources). Off-machine backup and housekeeping wait. Claude orchestrates; Luna (`gpt-6-luna`) and Sol (`gpt-6.1-sol`) implement.

Paths:
- the primary checkout is `%USERPROFILE%\Documents\DFO\DFO-TerraSol` (read only for you; it holds the ignored `engine/` and `data/`);
- each job's worktree is under `%USERPROFILE%\Documents\DFO\.claude\worktrees\dfo-new-branch-explore-624fb3\terrasol\<job>`;
- the base branch is `round3/integration`.

## How you work

- You work only in your own worktree and branch, named in your brief. You cannot write the Git folder, so do not commit. Leave your changes in the working tree; Claude reviews them, runs the full suite with the engine and commits them.
- Edit only the files your brief owns. If you need a change in a file you do not own, describe it in your report under "Requests" and work around it with a mock.
- Do not start the game, Edge, Vite, the driver or any service on ports 5390–5392. Make no model calls and no network requests. Tests use fixtures, fakes and temporary directories.
- Write the regression test first and note that it fails before your fix. Then make it pass. Do not weaken existing tests; if an expectation changes on purpose, say which and why in the report.
- Run `node --test test/*.test.mjs`. In a worktree, the 5 tests in `test/native-bridge.test.mjs` fail because the ignored `engine/` checkout is absent. That is expected; report any other failure.
- Match the surrounding code: its style, comment density and naming. Reuse existing modules instead of writing parallel ones.
- Never put credentials, tokens or account secrets in source, tests, logs, receipts or model context.

## Your report

When you finish, write `docs/round3/<job>-REPORT.md`. It should cover:
- what changed and why;
- the tests you added, with their result before and after your fix;
- the full-suite result;
- requests for files you do not own;
- what remains unverified until a live run.

Keep it short and factual.
