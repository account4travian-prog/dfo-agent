# Body port provenance and verification

The unmodified source is from the original DFO worktree `ai-game-interface-dfos-3bf743`, agent workspace at repository commit `30c43583c3fe3845afbda8ff1b8074867467d90c`. The worktree was read only. No license file was found in that repository; no additional license is asserted.

Original source SHA-256 values follow. The vendored core has the narrow per-tick combat guard described below; all other listed copies are byte-identical to their sources.

- `body/core.mjs`: `0f38174183db91d44ab6186b7a469dbf35ba41781ff9f6c24a5c875316b592a5`
- `lib/body-code.mjs`: `ca61c321fba3ae4c763db6013c28c76a5cbc184e8824a08fc9e1b3d7f36c9cad`
- `mind/autopilot.mjs`: `365d72006fe753daa608442a6fed3365b67de9f30f5a63503ec4764f6ef23b61`
- `mind/memory.mjs`: `f6242eb896ab4e5f1ae06d983725de34e8a442c1eeeb9be2433bf4d03cc121b8`
- `mind/placeMap.mjs`: `6264196bcd223bd040d16e54cad3bd0c8c335493e6f2d0f26c93294c488df80a`
- `mind/route.mjs`: `5f59a439c945d629bb486e7ab7bf5975dd8c2e2502438e888930f2c161c7523d`
- `mind/surroundings.mjs`: `f3132c61569f99c5c397239b1d5b1ad1b123dc63c1057a366db0973f48943fae`
- `checks/start-footing.mjs`: `6e5b97a932bab9c94937f410cfa35b41891c6f1f82792096792bfeffb239420d`
- `fixtures/trial-11-corridor.json`: `47b1801d03e47dbce91ba5ee4d6a30f2703d5809d008d9e929cd004b62f1445e`

The adapted vendored `body/core.mjs` SHA-256 is `4ae8a2f222eeb3c17b3ee7b83512e13b8d15a4317daa2fd625d7909776fd4d0a`. The Path A guard checks the chosen observed target, frame, freshness and health floor before every input tick; on failure it releases inputs and latches the failure until cleared. It also reports lostThroughSeq when the bounded event log overflows, so the executor can distinguish lost unread evidence from events already consumed. Round 3 adds fight closing to 1.3 m (or configured reach when shorter), permits door hazards and remembered door cells only during visible-foe closing, and allows a blocked step-in to swing within reach plus 0.3 m. These changes do not alter the per-tick guard.

The original regression tests were copied into test/body-*.test.mjs with import and fixture paths adapted; the executor, runtime and benchmark are new. The legacy Body has its original 50 ms clock, policy validation, lease, safeguards and observed-event machinery. Place memory and frontier selection use the original navigation implementation.

Run `node tools/native-benchmark.mjs` for model-free recorded and fake checks. No live game or model is used. This validates only the included checks; movement, bridge timing, real controls, actual exploration, and trial 13 rat combat remain pending live verification.

Path A adds selected-actor combat (750ms occlusion grace with input released), typed use-target/crosshair checks and moving-actor tracking. Current details are in docs/path-a/HANDOFF.md; inherited source hashes above remain the original reference hashes.

## Map picture provenance

`vendor/legacy-agent/mind/mapImage.mjs` is copied byte-for-byte from `agent/mind/mapImage.mjs` in the read-only original worktree `ai-game-interface-dfos-3bf743` (repository source commit `30c43583c3fe3845afbda8ff1b8074867467d90c`). Source SHA-256: `865dd2f54c792bd9af81b0a258227197603da16f2f46fe69229541e170fc245c`; vendored SHA-256: `865dd2f54c792bd9af81b0a258227197603da16f2f46fe69229541e170fc245c`. No adaptation to the place snapshot shape was needed. `src/mind/map-picture.mjs` writes the rendered PNG into a caller-provided run folder; it does not add a dependency.
