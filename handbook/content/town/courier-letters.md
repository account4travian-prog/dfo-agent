---
title: Courier letters
summary: Questline letters arrive on a paced schedule and only reach you outdoors in a town during the day.
stage: town
order: 100
gate: none
tags: [courier, letters, questlines, time]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - A questline's next step waits one character hour after the previous step ends.
> - New lines are paced too: the runner will not start one while another line's letter is still on its way.
> - A courier can deliver only when you are outdoors in a town by day.
> - If a letter cannot find you, it stays pending; the questline window tells you what it is waiting for.

## When letters arrive

Questlines use letters to introduce their next step. After a step ends, its line waits one hour of character time before the next step can begin. Opening several lines does not make their first letters arrive together: the runner spaces new lines and letters by an hour and waits for a pending first letter to reach you.

Delivery has a place and time requirement. Be outdoors in a town during the day. A courier that reaches you somewhere else does not complete delivery, and the letter remains on its way until the conditions are met.

## What to do when you are waiting

Open the Quests view to see a line's steps and its current wait. You can keep playing while a letter is pending; return to a town street during daylight when you want to receive it. A letter wait is different from a quest deadline. Online, quest delays marked for the shared clock are shortened; deadlines keep their full length and run only while you play. See the later [questline ladder](../reference/questline-ladder.md) for the broader system.

## Next

- [Time and weather](time-and-weather.md)
- [The NPC guilds](npc-guilds.md)

## Sources

- `src/systems/questlines/qlLineRunner.js`: `STEP_GAP_S`, `mayBegin`, `letterOnItsWay`
- `src/systems/quest/clock.js`: `ONLINE_DELAY_SECONDS`, `questWaitsShort`
- `src/systems/questlines/qlLines.js`: `lineOpens`
- `src/systems/quest/actions.js`: `GivePc` delivery conditions
- Research: `handbook/research/Q1.md` (letters and pacing only)
