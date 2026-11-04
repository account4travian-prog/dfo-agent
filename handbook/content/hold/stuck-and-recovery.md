---
title: Stuck and recovery
summary: A recovery ladder for a stuck character, a held quest or a missing NPC, and when to report a bug.
stage: hold
order: 85
gate: none
tags: [recovery, unstuck, bugs, quests, saves, reporting]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - Decide first whether the game is **holding** you (a rule, a wait or a wall) or a step has **bugged**; the answer changes the ladder.
> - **`/unstuck`** leaves a dungeon or building by the door you came in, or outdoors takes you to the nearest town. It has a cooldown.
> - There is **no developer console** in the port, so console commands are not a recovery route.
> - Online, a death is not a reset: you respawn with half health and a tenth of carried gold gone, and you cannot rewind the character.
> - A black screen or a game that will not start belongs in [Troubleshooting](../begin/troubleshooting.md), not this ladder.

## Held or bugged?

**Held** means the game is doing what it says: a quest step waits for a place, a day, a letter or a level; a door is locked; an NPC is elsewhere. **Bugged** means the stated condition is met and the step still does not move, or an object or person the quest names is not there at all.

Read the journal before anything else. **L** opens the LogBook on Active Quests and the pause menu's Quests tab lists every questline with what it waits on (“Opens at level 10”, “Continues with a registered account”). A step that says it could not begin here and will be offered again is held, not broken.

## The recovery ladder

1. **Read the journal and the questline list.** Note the exact objective, region, place and any time stated. If the journal does not name the region, place or person together, write down what it does say.
2. **Check the gate.** Questline steps open at levels, Renown, registered-account or online gates, and festival windows. A letter arrives in a town, outdoors, by day; one new line begins at most once per character hour. If the list says it is waiting for an account, that is the answer.
3. **Give a held step its condition.** Be in a proper town when a step comes due, at the right building kind; leave and re-enter the region; let the character clock advance. A failed online step costs no faction standing and steps re-offer.
4. **Use `/unstuck` for geometry, not for quests.** Type it in chat. Inside a dungeon or building it takes you out by the door you entered. Outdoors it takes you to the nearest town. It is not a quest teleport and it will not move a quest object.
5. **Handle the missing NPC or target.** Re-read the objective; check whether the quest named a building or a dungeon and whether you are in the right instance. Quest dungeons can be entered as **Your instance**; a party member's quest does not complete yours. If the named person is genuinely absent after a reload of the area, treat it as a bug and keep the journal text.
6. **Use death and loading only for position.** Online death returns you to the nearest safe place (or the Hold's start, inside the Hold) with half health and the gold loss; leaving the page and returning saves the character. Loading an underground online save wakes you above ground at the nearest safe place. None of these rewinds progress.
7. **Restart cleanly.** Reload the page; the online character checkpoints are attempted during play, when the page hides and on exit. Do not clear browser storage before you know what it holds. Offline, F9 saves and F11 loads; loading is disabled during online play.
8. **Report what you can reproduce.** `/bug` opens the private developer report form; `/report` is for player conduct. The issue tracker and Discord are linked from [Troubleshooting](../begin/troubleshooting.md).

## `/unstuck` in detail, and what it will not do

`/unstuck` is a chat command, not a key. Its rules are specific:

- **Indoors** (dungeon or building) it leaves by the door you came in.
- **Outdoors** it takes you to the nearest **city**, never into the Open Zone, and past the Eltheric Veil to the nearest freeport rather than back across the sea.
- **Cooldown**: 30 minutes normally, 60 minutes in the Open Zone. In the Open Zone it also runs a **five-minute wait** that you can cancel with `/unstuck cancel`, and it fails if another player is within 600 m; you cannot use it with another player that close.
- **Some made levels refuse it** or give their own way home (a court refuses it; an Elite Breach's Redoubt is the way home), so the command is not a universal exit.
- `/unstuck now` is refused; the only argument it takes is `cancel`.

There is no console. The port hides `ToggleConsole` because it has no console, so no console command can rescue a character, spawn an item or complete a quest. Anything that promises that is not DFO.

## Missing NPCs and quest objects

A named NPC can be in another building, another region, or inside a quest instance you have not entered. The journal may name a place without naming the person, and the quest may point at a building you have already passed. Work from the journal, use the map for the region and place, and check the **Quests** tab for the step's status. If the quest is sharing with a party, remember that each character keeps its own copy and progress; a party kill does not advance your objective unless the quest is yours and the objective is shared.

A quest object is not vendor loot: selling it can make the quest unrecoverable. If an item is gone, say so in the report rather than continuing to guess.

## Saves, deaths and what can be undone

Online, the character belongs to the account service, not to your browser. Checkpoints are attempted during play, on page hiding and on exit; a crash can lose recent progress. Loading an offline save cannot rewind an online character, and an online death is not a reload. Offline, F9/F11 are the classic save/load pair and an offline Project Legacy rise can respawn you at the gold cost.

What can be undone: dying (respawn), a bad position (`/unstuck`), a logged-off span (checkpoint), a stuck UI (reload). What cannot: a sold quest item, a completed permanent choice (mastery, specialisation path, a third craft above 50), or an online character's lost progress before the last checkpoint.

## Black screen or no start

If the game does not render or the page will not load, stop here and use [Troubleshooting](../begin/troubleshooting.md). Check the game data picker (ARENA2, not its parent folder), WebGL2, and the browser console message. The source does not promise a universal blank-canvas fix, and clearing site data can erase saves and imported game data. Record the visible message and where loading stops before changing anything.

## Common mistakes

- **Using `/unstuck` for a held quest.** It moves your body, never a quest state.
- **Expecting a console.** The port has none.
- **Clearing site data as a first fix.** It can delete saves and an imported data store.
- **Assuming a party shares quest progress.** Each character keeps its own copy.
- **Reporting without the journal text.** The exact objective, region and step wording is what a report needs.

## Next

- [Troubleshooting](../begin/troubleshooting.md)
- [Saving and returning](../begin/saving-and-returning.md)

## Sources

- `src/scenes/world.js`: `/unstuck` parsing, `UNSTUCK_COOLDOWN_MS`, `UNSTUCK_COOLDOWN_ZONE_MS`, `UNSTUCK_ENEMY_M`, `UNSTUCK_WAIT_MS`, `unstuckNow`, `unstuckOutdoors`, `unstuckCancel`
- `src/scenes/worldModes.js`: `unstuck` (dungeon and interior deferred exits)
- `src/net/chatCommands.js`: `HOST_COMMANDS`, `/unstuck` help line, `hostMisuseText`
- `src/systems/inputActions.js`: `HIDDEN_ACTIONS` (`ToggleConsole`, no console)
- `src/systems/madeLevel.js`: made-level `unstuck` rules (`refused`, `wayHome`)
- `src/ui/quest/questJournal.js`: `JOURNAL_MODES`; docs/36-guide-design.md: the recovery-ladder contract and its open save/reload caveat
- `src/systems/deathRespawn.js`: `SAFE_KINDS`, online respawn, underground-load wake; `src/systems/deathPenalty.js`: `DEATH_GOLD_DIVISOR`
- `src/systems/save/saveSlots.js`, `src/systems/cloudSaves.js`: save slots and cloud backup; `src/systems/saving-and-returning` behaviour in `handbook/content/begin/saving-and-returning.md`
- `src/net/privateReport.js`: `/bug`; `handbook/content/begin/troubleshooting.md`: troubleshooting route
- Research notes `handbook/research/Q1.md` (quest delays and re-offers), `handbook/research/H1.md` (death and respawn)
