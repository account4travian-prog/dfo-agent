---
title: Leaving the Hold
summary: Find the dungeon's exit door to emerge outside Privateer's Hold, then follow the road toward Gothway Garden.
stage: hold
order: 90
gate: none
tags: ["Privateer's Hold", exit, Gothway Garden]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Leave through the dungeon's exit door; the transition places you outside the entrance you used.
> - A monument to Julian LeFay stands beside the Hold's exit landing.
> - Gothway Garden is the first town a new character reaches from the Hold.
> - Online, the public Hold is one way: after you leave, you cannot return to its public room.

## Find the exit

Follow the cave toward its exit door. Activating that door takes you outside and places you on the landing by the
dungeon entrance, facing outward. The source does not define the Hold's internal layout, so use the game's compass and
your own exploration to find the door.

## Continue toward town

The monument to Julian LeFay stands beside the exit landing. From there, follow the road toward Gothway Garden, the
nearest town and the first one a new character walks into after leaving the Hold.

> [!warning] The Hold is one way online
> The public online room refuses re-entry after you have left Privateer's Hold. Complete anything you want to do here
> before taking the exit.

Your own **private instance** of the Hold is different: you can enter it again at any time. It is a separate copy
for you and your party, not a way back into the public room.

## Next

- [Your first town](../town/reading-a-town.md)
- [Moving through the Hold](moving.md)

## Sources

- `src/scenes/worldModes.js`: `tryExitDungeon`, `returnLanding`, `exitDungeonNow`
- `src/systems/startDungeon.js`: `HOLD_ONCE_TEXT`, `isPrivateersHold`
- `src/world/lefayMonument.js`: `LEFAY1`, `LEFAY_TOWN`
- `src/systems/gothwayBoards.js`: `GOTHWAY-BOARDS`
- Research note: `handbook/research/H1.md`
- `src/scenes/instanceDoor.js`, `src/net/instanceRoom.js`: HOLD-ONCE (the public room is entered once; the
  Hold's instance any time)
