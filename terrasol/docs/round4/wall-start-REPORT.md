# Wall-start report

## Cause and change

The captured cave wall has non-axis normals, no retained axis faces and no full-cell ground proof. `supportedGraph` therefore omitted its clearance entry; the legacy 10 cm overlap fallback rejected Rowan's 27.4 cm raster overlap despite recorded footing at his actual feet. The scan has not lost an axis face: its observed cave surface does not qualify as one.

Changed only `vendor/legacy-agent/body/core.mjs` and added `test/body-wall-start.test.mjs`. The graph now carries exit-only clearance for an observed non-axis wall beside a recorded footing origin. It retains current/history wall hit points as vetoes rather than inventing a planar face. The shared planner and Body guard require supporting floor, compatible height, no deeper overlap, and a step within 0.75 m of both the recorded occupied position and current start. Known faces still constrain the disk; missing normals, missing axis faces and other hazards remain blocked. Navigation transfer validates the bounded hit lists. The trial 12 route-cache policy is unchanged.

The capture now selects edge `(13.3374, 28.0001)` with a complete 1.872 m route. Its first densified step is `(14.1895, 26.7900)`, away from wall cell `(29,53)`. No engine geometry queries or native scan changes were needed; there is no native module to reinstall.

## Tests

- Wrote the capture regression first: `pickFrontier` returned `null` before the fix. It now returns the edge and a complete goto route whose steps never deepen the initial overlap.
- Added rejection checks for deeper starts, wall entry, missing support/normal/hits, other hazards, observed protrusions and retained corner faces. Shared-graph searches also verify that cached clearance cannot transfer to a deeper start or distant wall position.
- Added transferred-navigation and captured-scan guard checks. Transfer initially rejected the new evidence, then passed after validation support was added.
- Added a motor double using recorded floor/hits. It initially stopped after one tick; the final rule permits continued retreat bounded by the original occupied position. It now clears the raster overlap.
- All 15 focused wall-start/trial 10-11 tests pass. Existing tests and expectations were not changed.
- Full suite: **312 passed, 0 failed**, including native-bridge tests, in 22.60 s. The first plain run hit two engine Git ownership failures. The passing run appended a process-only `safe.directory` entry for the junction target, preserving the two inherited entries; no global Git configuration changed. A read-only installer preflight confirmed the shared engine required no writes.
- `git diff --check` passes. No commit was made.

## Requests

None.

## Live verification

Claude must confirm real movement away from this save position and continued explore/goto operation with fresh scans and the actual motor. The motor double proves guard behavior only. No game, driver, browser, Vite, model calls or external network requests were started.
