---
title: Your first minutes in Privateer's Hold
summary: Read the opening guidance, check your journal, and explore the cave toward its exit.
stage: hold
order: 10
gate: none
tags: ["Privateer's Hold", opening, tutorial, journal]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Start in Privateer's Hold and follow the welcome guidance: take what you need, find the exit, and head toward town.
> - The short tutorial tour introduces movement, interacting, the bars and compass, and the menu.
> - Press **L** to open the journal on active quests or **N** to open its notebook.
> - Explore at your own pace; the source does not define the Hold's room layout or a fixed route through it.

## Begin in the Hold

Your new character starts inside Privateer's Hold. The welcome tutorial introduces the immediate task: look through your
pack, find the way out of the cave, and make for the nearest town. It is guidance for your first minutes, not a
room-by-room map.

The tutorial tour has five short subjects: Welcome, Moving Around, Using Things, The Bars and the Compass, and The Menu
and Saving. Tutorial pages can be reread from the menu. Their read state belongs to your device, so a second character
does not necessarily see pages you already read.

## Check your journal

Press **L** to open the journal to active quests. Press **N** to open the same window to your notebook. The journal's
other views include finished quests and messages. Both keys work underground.

## Take a measured first look

Use the [controls](../begin/controls-and-settings.md) to move, look around and ready your weapon. This guide does not
give a fixed room-by-room route or promise a particular item in a specific room.

## Common mistakes

- **Leaving without checking the journal.** It gives you a place to review active objectives and notes.
- **Expecting to return to the public Hold later.** Online, leaving closes the ordinary route back in. Finish what you
  want to do here before exiting.

## Next

- [Moving through the Hold](moving.md)
- [Loot and inventory](loot-and-inventory.md)

- [Privateer's Hold walkthrough](privateers-hold-walkthrough.md)
## Sources

- `src/systems/settings/settingsDefaults.js`: `StartCellX`, `StartCellY`, `StartInDungeon`
- `src/world/worldOfDaggerfall/wodPrivateersHold.js`: `HOLD_FOES`, `rollHoldFoes` (online Hold additions)
- `src/scenes/world.js`: online call to `rollHoldFoes`
- `src/systems/tutorialCatalogue.js`: `TUTORIAL_TOUR`, `welcome`
- `src/systems/tutorials.js`: tutorial read state and rereading
- `src/systems/inputActions.js`: `LogBook`, `NoteBook` bindings
- `src/ui/quest/questJournal.js`: `JOURNAL_MODES`
- Research note: `handbook/research/H1.md`
