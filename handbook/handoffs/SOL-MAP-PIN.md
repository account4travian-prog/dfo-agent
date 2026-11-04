# Sol brief: a "You are here" pin and "Find nearest" on the handbook's Bay map

The user (2026-10-22): "Put a droppable pin on the map that dictates the player's current location. We will use this
for a 'find the nearest...' service/button on the map that will find the nearest location of X type based on the
player's current location, such as banks or fighters guilds. Have Sol handle this."

## Where the map lives

- Build: `planner/tools/build-world-map.mjs` (writes `docs/build/world-map.*` and `docs/build/paths.json`, gitignored).
- Handbook plugin: `handbook/tools/map-plugin.mjs` (publishes the map into `handbook/dist/reference/bay-map/` and
  `map-data/`).
- Runtime: `handbook/theme/map/bay-map.js`, `bay-map.css`, `path-layers.mjs`, `town-map.js`, `town-map.css`.
- The map already has service filters (Carriage, Port, General Store, Fighters Guild, Mages Guild, Temple, Armorer,
  Tavern, Weapon smith, Bank, Stable/Wagon Yard) and a "Nearest to: search and select a place" helper that measures
  from a selected place. Reuse its service data and distance code; this feature generalises it to a dropped pin.

## What to build

1. **The pin.** A clear "You are here" control: a button "Drop my location pin", then a click/tap on the Bay map
   places the pin; drag it to adjust; a "Remove pin" control. Also "Set pin here" from a selected place's card (snaps
   to that place). Draw it above roads and icons, distinct from place icons, readable in light and dark themes and at
   every zoom. Keyboard accessible (a way to place it at the map centre and nudge with arrow keys). Remember it per
   browser in localStorage, wrapped in try/catch, and restore it on load.
2. **Find nearest.** A "Find nearest…" control: choose a service (same list as the filters; allow more than one
   service meaning places offering all of them, as the filter does), then list the closest matching places to the pin
   (5 by default, "show more"), each with its name, region, straight-line distance in map squares and km (1 map square
   = 819.2 m; the existing constant), and a compass direction from the pin (N, NE, ...). Selecting a result centres and
   highlights it on the map and offers "Open town" for settlements with a town view. Draw a faint line from the pin to
   the selected result.
3. **Honest wording.** Say "straight-line distance", not travel distance. If no pin is set, the control asks the
   player to drop one first. If a service has no matches, say so.
4. **Optional nicety:** "Nearest carriage" quick button next to the pin control, since the carriage is the main land
   shortcut.

## Rules

- Follow the existing map code's style and the handbook's design tokens; no new dependencies; no network requests
  beyond the map's existing relative files.
- File ownership: `handbook/theme/map/**`, `handbook/tools/map-plugin.mjs`, `planner/tools/build-world-map.mjs` (only if
  data is needed), and tests under `handbook/tools/test/`. Don't edit content, handoffs or the docs.
- Add tests for the nearest-search logic (distance, direction, multi-service matching, ordering, empty results) and
  for pin persistence with storage that throws.
- Build: `node handbook/tools/build.mjs --map` from the workspace root (map data must exist in `docs/build/`; rebuild
  it with `node planner/tools/build-world-map.mjs` if needed; read its header for the env it uses).
- You can't open a browser; Claude will check it. Write your report to the path in the launch command. Never touch
  `.claude/launch.json`; don't commit, push or merge.

## Launch (for Claude)

From the worktree (`%USERPROFILE%\Documents\DFO\.claude\worktrees\game-sync-catchup-261af9`), with a scratch folder
for the report:

```bash
codex exec -m gpt-6.1-sol -C "<worktree>" -s workspace-write --add-dir "<scratch>" \
  -o "<scratch>/sol-map-pin-final.md" - < handbook/handoffs/SOL-MAP-PIN.md
```

Add a line to the brief (or the launch message) naming the report path, e.g. `<scratch>/sol-map-pin-report.md`.
Afterwards: run the tests, build with `--map`, check the pin and Find nearest in the browser (light and dark, desktop
and phone), deploy behind Access (see `handbook/DEPLOY.md`), verify the gate, commit on `claude/handbook` and
fast-forward `main`.
