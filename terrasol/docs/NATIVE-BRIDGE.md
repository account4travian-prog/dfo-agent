# Native bridge port

The tracked `vendor/native-agent` modules derive from the earlier DFO agent bridge; `manifest.json` records source and port hashes, engine revision and license. Paths were adapted for the newer engine, and the old online refusal was removed under the current task authorization. The port was not exercised online or in a running game.

`ensureNativePort()` verifies the engine revision and preflights all destination files and host seams before installing. It preserves unrelated engine changes and rejects differing bridge files. It patches world host installation, scene transitions and both world and dungeon teleport frame changes. It is safe to call repeatedly. Start the normal world host with `?agent` to install `window.__agent`; dungeon and interior modes use that same host. `readNative` reports unavailable explicitly and exposes a fresh scan's exact foe and thing entries as ordered `targets`; indexes are valid only for the returned observation.

The bridge uses player bindings and the world input hooks for look and attack. Continuous coordinates subtract the floating origin. Scene transitions and teleports increment the legacy frame; observations and scans carry it. No game, browser, online session, or model was launched during this port. Model-free tests and static bundle verification do not establish live gameplay reliability.

Visible foes carry a frame-scoped `targetId` tied to the underlying actor record. The ID is allocated only when a scan confirms visibility, remains stable while that actor moves within the frame, and changes after a frame change or bridge replacement. Current targeting must match it against a fresh scan; the ID does not expose a foe while it is unseen.

The installer records managed source hashes in `engine/.rowan-native-manifest.json`. On upgrade it replaces a module only if its current bytes match the last recorded hash (or already match the new source). A pre-existing installation without a receipt is adopted only when each existing module already matches the desired bytes. A conflicting edit or incompatible host seam stops the installation before any writes.
