---
title: Privateer's Hold walkthrough
summary: A textual route from the Hold's start to its exit and the road to Gothway Garden, with what to take.
stage: hold
order: 15
gate: none
tags: ["Privateer's Hold", walkthrough, opening, dungeon, tutorial]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - Your new character starts inside Privateer's Hold; the game's own welcome says to take what you need, find the way out and make for the nearest town.
> - **The source does not define the Hold's room layout, its interior foes or its loot.** This page is a procedure and a checklist, not a room-by-room map.
> - The way out is its **exit door**; activating it lands you outside on the entrance landing, facing out, beside the LeFay Monument.
> - Online, the Hold's public room is a **one-way door**: once you leave, it refuses re-entry. Finish what you want inside first.
> - Dying inside respawns you at the Hold's start marker, so a first death does not skip the dungeon.

## What the game fixes, and what it does not

The code fixes the start: a classic new game with Start In Dungeon on enters the Hold on the shipped start cell. It fixes two automatic quests, the five-page welcome tour, the exit-door behaviour, the respawn point and the one-way rule. It does **not** contain the Hold's interior layout, its foe placements, its traps or its loot; those come from the game's dungeon data, and no file in the source tree states them. Any page that draws you a fixed route is describing something the source does not hold.

So this walkthrough teaches the procedure the engine guarantees: how to leave, what the game expects you to do first, how to read the dungeon without a map, and what to check before stepping out.

## Before you move

1. **Read the welcome.** The tour's five pages are Welcome, Moving Around, Using Things, The Bars and the Compass, and The Menu and Saving. You can reread them from the menu.
2. **Open the journal.** **L** opens the LogBook on Active Quests; **N** opens the same window on Notebook. Both work underground.
3. **Check the pack.** You start with your class's starting gear and supplies. Equip the weapon and armour you intend to use; open the inventory with **I/F5/F6** as your skin shows.
4. **Set the controls you need.** Ready/sheathe weapon (**Z**), swing (**right mouse** by default), and the Weapon Technique key (the mouse's back side button) if you have a technique line.
5. **Read the bars.** Health, fatigue and magicka are in the HUD; the compass shows direction. You do not need to memorise the dungeon to leave it.
6. **Set the map key in mind.** **M** opens the map at your current place; in a dungeon that is the automap, which fills in as you explore.

## The route, as a procedure

1. **Start marker.** You begin at the dungeon's start/enter marker. Online, this is also where a death inside the Hold returns you.
2. **Sweep the first area.** Check containers, take what is light and useful, and test your weapon on the first foe you can handle. You do not need to clear the dungeon.
3. **Use the automap, not memory.** Press **M** as you go. The dungeon automap draws the parts you have explored; a corridor you have not walked is not on it yet. Use walls, doors and junctions as breadcrumbs: at each junction, mark the way you came by the door or stair you used.
4. **Every door is interactable.** **E** interacts; a locked door can be picked in **Steal** mode (hold **Left Alt**, choose Steal, activate the door). No lockpick item is needed. The chance is your Lockpicking skill against the lock's value, clamped 5–95; a failed attempt is spent until your Lockpicking changes. A magically held lock (value 20 or more) cannot be picked.
5. **Watch for action traps.** Dungeon action objects can damage you, drain magicka, cast a spell or set a global flag when triggered. There is no universal “safe” rule beyond watching what you step on and opening what you must. The source does not place a specific trap set in the Hold.
6. **Find the exit door.** Activating the exit runs the transition to the exterior. If a small cart is in your pack and the Dungeon Exit Wagon Prompt setting is on, the door asks before leaving.
7. **You step out facing outward.** The landing puts you at the entrance door you came in by, on its outside face, facing away from the door. The LeFay Monument stands beside that way out.
8. **Take the road to town.** Gothway Garden is the first town a new character walks into out of the Hold; the road from the Hold enters at the town's north side. The source does not state the walking distance, so follow the road and the map rather than a step count.

## What to take, and what to leave

Take what your class can use, weight permitting: the weapon you are skilled with, the armour you are allowed to wear, any potions and cures you start with, and a light source if you have one. Leave heavy spare weapons you cannot use; a first character has no bank and no cart on the way out.

The source does not guarantee a particular item in a particular room, so do not wait for a specific drop before leaving. If you find loot you cannot identify, carry it out; Identify is available in town.

> [!warning] The one-way door
> Online, once you are outside, the Hold's public room refuses re-entry with its own message. An instanced copy of the Hold can be entered any time, but the first dungeon's story door is a one-time passage. Finish quest objectives and take what you want before you activate the exit.

## Death inside the Hold

Online, a death inside Privateer's Hold respawns you at the Hold's start marker, not outside and not in a town. The ordinary online death cost still applies: you rise with half your maximum health and lose a tenth of the gold you carry (banked gold and letters of credit are untouched). Dying does not end the run.

That is deliberate: the Hold is where you learn to fight, and a death there cannot skip the tutorial. Elsewhere, a death returns you to the nearest temple, town or graveyard, or just outside the dungeon's door.

## Outside: the camp and the monument

The Hold's exterior carries the World of Daggerfall camp online. It can place thieves, assassins and rogues, each standing only on a high roll of the source's 21–30 band, so the ground outside is not always empty. The LeFay Monument stands beside the exit landing; interacting with it offers the flowers and the inscription rows. From there, follow the road to Gothway Garden's north entrance, where the town's bounty boards stand.

## Common mistakes

- **Waiting for a fixed route.** The source has no interior layout; use the automap and the exit door.
- **Trying to come back.** The online public Hold refuses re-entry after you leave.
- **Fighting everything.** You only need the exit; a full clear is optional.
- **Ignoring a failed lock.** It is spent until your skill changes; train or move on.
- **Leaving with an unfinished quest.** Check the journal before the exit.

## Next

- [Moving through the Hold](moving.md)
- [Leaving the Hold](leaving-the-hold.md)

## Sources

- `src/systems/settings/settingsDefaults.js`: `StartCellX`, `StartCellY`, `StartInDungeon`
- `src/systems/startDungeon.js`: `isStartDungeon`, `isPrivateersHold`, `HOLD_ONCE_TEXT`
- `src/systems/tutorialCatalogue.js`: `TUTORIAL_TOUR`, `welcome`; `src/systems/tutorials.js`: tutorial read state
- `src/scenes/quest/questBridge.js`: `GAME_START_QUESTS`
- `src/scenes/worldModes.js`: `tryExitDungeon`, `returnLanding`, exit-door wagon prompt, `onlineRespawn`, HOLD-ONCE arm
- `src/world/lefayMonument.js`: `LEFAY_TOWN`, `LEFAY_ROWS`, `MONUMENT_CLEAR_M`; `src/systems/gothwayBoards.js`: north-entrance boards
- `src/world/worldOfDaggerfall/wodPrivateersHold.js`: `HOLD_FOES`, `rollHoldFoes`
- `src/world/actionSystem.js`: `attemptLockpicking`, `interiorLockpickingChance`, `MAGIC_LOCK_THRESHOLD`, action trap objects
- `src/systems/deathRespawn.js`: `RESPAWN_HEALTH_FRACTION`, `SAFE_KINDS`; `src/systems/deathPenalty.js`: `DEATH_GOLD_DIVISOR`
- `src/systems/map/mapTabs.js`: the dungeon's automap sheet
- Research note `handbook/research/H1.md`; docs/36-guide-design.md (recovery-ladder contract)
