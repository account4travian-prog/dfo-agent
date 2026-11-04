# Fix round: watcher (Claude's review)

Your first pass is good; the census is useful as is. Fix these watcher behaviours in your owned files. Same rules as before.

1. **Never hold mid-fight.** A hold releases all input, so holding while a foe is biting gets Rowan killed. `health-falling` must not fire while:
   - the active task is `fight` or `retreat`;
   - a hostile is visible in the snapshot's native targets;
   - or the Body's current goal is combat.

   Outside those cases, it fires only when health has fallen across at least 3 consecutive polls with no movement progress. Add tests for a fight with falling health (no action) and for being bitten while stuck with no fight task (hold).
2. **Do not re-hold right after a resume.** Rules count only evidence after the latest of these:
   - the watcher's own last enforced action;
   - the last `operator-command` row with `resume`;
   - the last `session-start`;
   - a new worker epoch start.

   The idle clock restarts at the same point. Add a test: hold, then resume, then the very next poll takes no action.
3. **Count idle time only while in the world.** Startup, sign-in, loading and character screens are not idle play. Accumulate idle time only while the snapshot shows the world phase (`native.ready` true, or a player phase of world). Test that 15 minutes on the title screen produces no idle hold.
4. **Cost.** Default the poll interval to 15 s. Read only rows newer than the last poll instead of rebuilding the whole report each time, or cache the report by log file size. Keep metric v2 as the definition of useful.
5. Keep the dry-run default and the `command.json` format that `src/control.mjs` uses.

Your request for `inputHeld`, `activeTask` and lease exposure in `/health` is noted. It goes to the job that owns `src/browser.mjs`, so keep those two rules dormant when the fields are absent, as now.

Update `docs/WATCHER.md` and `docs/round3/watcher-REPORT.md`.
