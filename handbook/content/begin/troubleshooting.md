---
title: Troubleshooting
summary: Check startup, performance and save problems, then report what you can reproduce.
stage: begin
order: 60
gate: none
status: draft
verified: e4f093166
tags: [troubleshooting, performance, browser, settings, cloud saves]
---

> [!tip] At a glance
> - Check whether the problem is game startup, online sign-in or a missing local save.
> - Confirm that you supplied ARENA2 before changing graphics settings.
> - Read the error beside a cloud action; a failed backup is not a completed backup.
> - Record what happens before clearing browser data or changing devices.

## When the game will not start

Start with [playing in the browser](playing-in-the-browser.md). The game needs your original **ARENA2** data and uses WebGL2 for rendering. 

If the picker appears, select the ARENA2 folder rather than its parent installation directory. The browser data source imports and remembers files in its own storage. That is different from the desktop app reading your folder on disk: moving the original folder is not, by itself, proof that an already imported browser copy has broken.

If startup still fails, record the visible message and the point where loading stops. Try reloading or a current browser. The source gives no universal blank-canvas fix or minimum graphics-card specification. If you try another browser, expect it to have a separate data store and to need its own game-data setup.

Do not use clearing site data as your first diagnostic step. The same browser can hold imported game data, local save slots and a guest session.  The source does not establish a recovery method for a local save whose only stored copy has been erased.

## When performance is poor

Open **Settings > Graphics**. The source groups controls under **Quality**, **Display**, **View distance & detail**, lighting, sky and water, plants, shadows and post effects. Start with the graphics preset and inspect the controls that remain available online.

Render scale, land view distance and cloud quality are useful settings to investigate because they change what your device draws. Compare the same place after each adjustment. Some settings are governed by online policy; a disabled or forced setting does not mean your browser failed to remember it.

The enhanced and classic lanes also need care. Online play enforces shared gameplay and world rules, while the interface skin remains your choice. Choosing a Classic interface does not turn off the online world's enhancements or change shared combat balance.  See [interface skins](interface-and-skins.md).

The source does not promise a frame-rate gain from a particular setting, nor does it identify one preset that suits every device. If performance remains poor, report where it happens: a crowded town, outdoors, underwater and a dungeon can present different workloads. 

## When the screen is difficult to read

Open **Settings > Accessibility**. The tab contains these sections:

| Section | What you can inspect |
|---|---|
| **Motion** | Head bobbing, camera recoil, technique motion, reduced motion, motion blur and vignette controls |
| **Readability** | Health/fatigue colour swapping, dim strength and SDF font rendering |
| **Danger shapes** | Danger palette and telegraph fill |
| **Large status bar** | Enable, docking, scale, alignment and weapon/horse offset controls |

The danger palettes include Standard, High contrast, Deutan-Protan and Tritan. Their implemented uses include the Elite Breach's danger shapes; do not assume they recolour every object in the game. Reduced motion likewise changes supported animations rather than promising to remove all motion. 

For an action that appears unresponsive, check the active binding before assuming it is broken. [Keys and commands](../reference/keys-and-commands.md) helps you distinguish a control problem from a quest or network problem.

## When a save or character seems missing

First establish which record you expect. An online character checkpoint belongs to the account service. Local browser save slots belong to this browser's storage. Optional cloud backups of local slots are a third record.

For an online character, sign into the same account and inspect **Online > Your online characters**. Online checkpoints are attempted during play, on page hiding and on exit. A crash or connection failure can still lose recent progress. Loading an offline save cannot rewind your online character.

For a local slot, return to the browser or device where you saved it. Cloud backup is an explicit action, not an automatic upload whenever you save. On another device, sign into the same account and inspect its available cloud cards. A cloud-only card can be downloaded; a newer backup can be restored over its corresponding older local copy through the offered action.

Read refusals literally. “Load this save once” means an older local card needs a character identity before backup. “No room” concerns the local import. Refresh the listing after a changed-backup refusal.  The cloud code imports the replacement before removing the older matching local copy, so a failed download does not intentionally delete it.

## Known issues and reporting

The snapshot contains fixes for earlier field reports, not a complete current known-issues list. Check the game's [issue tracker](https://github.com/Lattymoy/daggerfall-js-source/issues) for an existing report, or use the [DFO Discord](https://discord.gg/jM2JdwSM8w) for help identifying the problem. 

Use **`/bug`** for the private developer report form, especially for exploits or account-security problems. **`/report`** concerns player conduct. The project's README asks you to report exploits privately.

Include these details in a bug report:

- Browser and version, operating system, and browser or desktop app.
- Online or offline play, interface skin, relevant settings and visible game version if available.
- Steps from a working state to the failure, with expected and actual results.
- Exact error wording, location, quest title or affected save action, and approximate time.
- Whether it happens again, and which changes you tried with their results.

## Common mistakes

- Erasing browser storage before identifying which saves and credentials it contains.
- Expecting an account sign-in to copy every local slot automatically.
- Posting an exploit publicly instead of using the private report route.

## Next

- [Saving and returning](saving-and-returning.md)
- [How this guide is checked](../reference/how-this-guide-is-checked.md)

- [Stuck and recovery](../hold/stuck-and-recovery.md)
## Sources

- `upstream/snapshot-e4f093166/README.md`: WebGL2, original ARENA2 requirement, Reporting exploits and security issues.
- `upstream/snapshot-e4f093166/src/scenes/dataSource.js`: `ensureArena2`, IndexedDB imports and data-source fallback.
- `upstream/snapshot-e4f093166/src/ui/settings/settingsMap.js`: `CATEGORIES`, Graphics and Accessibility sections; `upstream/snapshot-e4f093166/src/ui/settings/settingsCopy.js`: large HUD labels.
- `upstream/snapshot-e4f093166/src/ui/eliteGates/egAccess.js`: `EG_DANGER_PALETTES`, reduced-motion and telegraph-fill law.
- `upstream/snapshot-e4f093166/src/systems/online/onlineLane.js`: `ONLINE_FORCED_PREFS`, `ONLINE_PLAYERS_OWN_PREFS`, OVH3 skin policy; `upstream/snapshot-e4f093166/src/ui/settings/settingsLaw.js`: online settings policy.
- `upstream/snapshot-e4f093166/src/systems/cloudSaves.js`: `CLOUD_REFUSALS`, `pushSlot`, `pullSlot`, `cloudOnly`, `dropReplaced`; `upstream/snapshot-e4f093166/server-account/src/saves.js`: `listSaves`, `putCard`, `putBlob`, `getBlob`.
- `upstream/snapshot-e4f093166/src/systems/save/saveSlots.js`: local slot storage; `upstream/snapshot-e4f093166/src/scenes/world.js`: `onlineCheckpoint`, `exitAutosave`, `whenPageHides`.
- `upstream/snapshot-e4f093166/src/ui/enhanced/enhancedMenu.js`: `paneOnline`, `cloudFor`, cloud-only grid and backup/restore actions; `upstream/snapshot-e4f093166/server-account/src/realm.js`: online character records.
- `upstream/snapshot-e4f093166/src/net/chatCommands.js`: `HELP_LINES`, `mailboxCommandOf`; `upstream/snapshot-e4f093166/src/net/privateReport.js`: private report route. Context: `docs/35-people-and-trouble.md`, Interface essentials.

