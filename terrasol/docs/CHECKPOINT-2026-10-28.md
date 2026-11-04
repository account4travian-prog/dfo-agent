# Checkpoint: relocated project and three-tier review

Date: 2026-10-28, America/Chicago. Checkpoint tag: `checkpoint/2026-10-28-three-tier-review`.

## Location and version control

The entire independent project moved from `%USERPROFILE%\Documents\DFO-TerraSol` to `%USERPROFILE%\Documents\DFO\DFO-TerraSol`. Its existing `.git` directory and history were preserved; Git did not need reinitialization. The native-control implementation baseline is commit `6c4ad57`. The relocation, adjusted resource paths, review prompt and proposed three-tier architecture are captured by the checkpoint tag.

The parent DFO repository locally excludes `/DFO-TerraSol/` through `.git/info/exclude`; this is not a submodule. Its pre-existing unrelated changes were preserved. The child project keeps its own commits. Engine, browser profile, saves, persona/memory, session logs and screenshots moved with the folder. Dependencies still use the existing junction to the parent's `upstream/daggerfall-js-source/node_modules`; the handbook now resolves to the parent's `handbook/content`.

Historical logs and receipts retain their original absolute paths as evidence. Those strings are not active configuration and were not rewritten. Runtime source resolves its project paths from its current location. The dedicated Codex authentication home remains outside this project and is not included in Git or backup artifacts.

## Exact status

- Existing runtime: Terra 6.1 tactical pilot and Sol 6.1 strategic planner, native bridge plus bounded local Body execution.
- New proposed direction: Luna immediate actions/tactics; Terra 6.1 medium-term/session planning; Sol 6.1 high-end decisions, post-session review, improvement planning and implementation. Exact Luna variant and three-tier routing remain pending.
- Independent review material: `docs/DEEPSEEK-REVIEW-PROMPT.md`, with the proposed design in `docs/THREE-TIER-MIND-PLAN.md`.
- All 121 model-free tests passed from the new location, including handbook lookup, role instruction paths, native installer and bridge resolution. The earlier focused native benchmark passed 83 overlapping checks.
- The engine remains at `e4f09316684d78d194553d3c94cbaa9bbdaa9b7b`; its installed bridge/host changes are generated from tracked port sources. Its nested repository is not included in the project Git history.
- No game, live trial or model call was started for relocation/review/checkpoint. Reliable live native play, real token savings and a completed hour trial remain unverified. The prior trial stopped after 21m18s.

## Local recovery artifacts

`data/checkpoints/2026-10-28-three-tier-review/` contains a separate character-memory snapshot, a checksum manifest and `source-history.bundle`. These remain local and ignored. The bundle contains this project's Git history and checkpoint tag. Game/browser saves and larger logs remain in the moved `data/` folder; they are not part of the Git bundle or a second full browser-profile backup. Keep that folder when making an external backup.

To inspect or recover source without resetting this checkout:

```powershell
git show checkpoint/2026-10-28-three-tier-review
git bundle verify data/checkpoints/2026-10-28-three-tier-review/source-history.bundle
# Choose a new, nonexistent destination when recovering:
git clone data/checkpoints/2026-10-28-three-tier-review/source-history.bundle <new-folder>
```

Recovery still requires the pinned engine/assets/dependencies and the local runtime data. Reinstall the tracked bridge through the existing installer when preparing a compatible engine. Do not treat restoring source as authorization to restart the game. Review the three-tier proposal independently before implementing its routing or running another gameplay trial.
