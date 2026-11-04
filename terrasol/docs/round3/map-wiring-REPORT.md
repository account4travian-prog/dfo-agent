# Map wiring report

Driver `/place` returns a cloned executor place snapshot, the installed bridge's revealed-floor map, and remembered exploration edges. It returns an unavailable result when the native world or executor snapshot is missing. Health advertises the route only when native control is enabled. The control client gates `place()` on that capability.

Terra and Sol navigation contexts now fetch `/place` immediately before context construction. The scheduler renders the picture into the active run folder, passes its path and caption into context, and caches by place revision to avoid rewriting an unchanged PNG. Luna, routine contexts, and ordinary executor polls do not request the route. Unavailable maps are ignored without failing planning.

Tests added: four fake-driver/HTTP regressions cover Terra path and caption delivery, no Luna or routine-poll calls, unavailable-map handling, and unchanged-revision writer reuse. The first test invocation passed 2 and failed 2 because the test writer injection was not yet connected and the Sol review was not enabled; both harness issues were corrected. The targeted rerun passed 4/4. A pre-implementation red run was not captured.

Full suite: `node --test test/*.test.mjs` passed 290 and failed 5 of 295. All five failures are in `test/native-bridge.test.mjs`: the worktree lacks the ignored `engine/` checkout, and child processes cannot resolve `git` (`ENOENT`). No other failures occurred.

Requests: none.

Live run remains unverified: `/place` against an initialized browser/native bridge, correctness of revealed-floor rendering in an actual level, model transport of the image, and navigation benefit require a live run.
