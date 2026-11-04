---
title: Privateer's Hold tutorial
summary: Use the fixed opening to learn controls, read the journal, find the exit and move into your first town.
stage: reference
order: 71
gate: none
tags: [quest, tutorial, opening, privateers-hold, controls]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Check your controls and inventory before exploring.
> - Open the journal to review active quests and keep notes.
> - Find and activate the exit; dismissing guidance does not move you outside.
> - Finish public-room exploration before leaving the Hold online.

## What the opening shares

| Field | Shared shape and variations |
|---|---|
| Index entry | **Tutorial** (`_TUTOR__`); its old pages are replaced in DFO |
| Place | **Privateer's Hold**; no generated quest destination |
| Entry | DFO's welcome tour and later contextual guidance |
| Progress | Learn controls and explore; no tutorial kill quota |
| Time | No delivery deadline for the welcome tour |
| Exit | Physically leaving uses the dungeon exit |

## How to read the offer

Read opening guidance, then check [controls and settings](../../begin/controls-and-settings.md). DFO's tour shows your bound actions. The quest browser retains the vendored `_TUTOR__` entry, but the live startup list does not start that script. Its former world-quest handoff starts separately; finishing old tutorial pages is not a prerequisite.

Press **L** for the journal's active quests or **N** for its notebook by default. Record what you want to revisit. Reread guidance under **Menu** → **Tutorials**. Read state belongs to your device, so a second character may not see already-read pages automatically.

## The shapes you will see

The category has one example ID, `_TUTOR__`. Its old sequence covers these subjects; DFO now teaches them through its catalogue rather than running that sequence.

1. **First controls and equipment.** The old script introduces inventory, attacks, rest and magic. DFO's welcome tour covers movement, interaction, bars, compass and menu. Check equipment and practise your actions; see [your first minutes](../../hold/first-minutes.md).
2. **Dungeon exploration.** The old sequence introduces doors, loot and interactive objects. Learn activation before attacking an object. This page supplies no room-by-room route or guaranteed treasure location.
3. **Exit transition.** `_TUTOR__` used a location trigger to advance after departure. In DFO, find the actual exit regardless of which guidance you have read; see [leaving the Hold](../../hold/leaving-the-hold.md).
4. **Town orientation.** The old city-entry stage introduced conversations, shops and work. DFO supplies contextual tutorials for its systems. Neither a shop purchase nor a guild assignment is an exit condition.

## Quick path

1. Read the opening guidance and check your current bindings.
2. Inspect your pack and ready equipment suited to your skills.
3. Explore while watching health and fatigue; review the journal as needed.
4. Find and activate the dungeon exit when ready to leave.
5. Continue toward town and use directions to find services and work.

## What gets players stuck

1. If a control does nothing, inspect its current binding and active menu before following a classic shortcut.
2. If exploration stalls, check the 3D map, unexplored passages and secret doors. An internal door is not the exit.
3. Separate ordinary loot from future quest goods. The tutorial has no required fetch object in the index; selling treasure is not an exit condition.
4. For missing guidance, check the Tutorials menu and popup setting. Do not wait for the retired script's timed pages or city-entry prompt.
5. Online, the public Hold refuses re-entry after departure; your private instance is separate. Record the script ID and last prompt if blocked. Reload recovery is unverified.

## Rewards and standing

The old script awards no gold purse or artifact; DFO's tour is guidance. See [quest rewards](../quest-rewards.md) for employment. In town, check shop hours and [the law](../../town/the-law.md) before entering buildings or resting.

## Sources

- `handbook/quests/quests.json`: category `tutorial`, `_TUTOR__`.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/_TUTOR__.txt`: prompt, timer, exit, city-entry and handoff structure only.
- Under that snapshot: `src/scenes/quest/questBridge.js`, `GAME_START_QUESTS`, `retireDfuTutorial`; `src/systems/tutorialCatalogue.js`, `tutorials.js`, `inputActions.js`, `startDungeon.js`; `src/scenes/instanceDoor.js`.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5; linked handbook opening pages.
