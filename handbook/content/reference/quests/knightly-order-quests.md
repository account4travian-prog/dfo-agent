---
title: Knightly order quests
summary: Distinguish traitor hunts, monster clearing and rescues, then report the right result to your order.
stage: reference
order: 63
gate: none
tags: [quest, pattern, knightly-orders, hunts, rescues]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Record the order, destination, target and deadline.
> - Read whether the job needs a kill, several kills or a conversation.
> - Speak to a rescue target before returning to the hall.
> - Treat order standing and immediate payment as separate benefits.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Giver/guild | Knightly order questor |
| Gate | Member jobs depend on rank; some work admits non-members |
| Where | Generated dungeons or local houses; rescues add a person to find |
| Time | Assignment-specific deadline; online deadlines charge played time |
| Reward shape | Scripted outcome and standing; eligible success can add gear and Renown |
| Instance | Choose **Your instance** when offered; full-size private quest dungeons admit your party |


## How to read the offer

Record order, region, site, target, action and return contact. Enemy type, destination, eligibility and reward vary. Check **Quests** and **Time remains**. Read rescue instructions before assuming an escort route.

See [NPC guilds](../../town/npc-guilds.md) for joining and rank. Non-member work does not establish membership. These jobs differ from the [questline ladder](../questline-ladder.md).

## The shapes you will see

1. **Traitor hunt.** **Retribution** (`B0B00Y01`) and the non-member **The Traitor** (`B0C00Y05`) place a nightblade in a generated dungeon. Defeat the assigned foe, then report back.
2. **Monster hunt.** **Killing a Giant** (`B0B40Y09`) and **More Trouble with Orcs** (`B0B20Y07`) require the designated dungeon kill. Clearing unrelated enemies is not the objective.
3. **Dragon hunt.** **The Dragonslayer** (`B0B70Y16`) assigns a dragonling. Prepare for it and follow the generated dungeon.
4. **Rescue.** **The Princess** (`B0B00Y00`) places a person and vampire underground. Speak to the person, read updates and report back; the kill alone is insufficient.
5. **Local infestation.** **The Infested House** (`B0C00Y13`) admits non-members and requires multiple beasts. Stay at the assigned house for further attackers and confirm the required kills before returning.


## Quick path

1. Check the order and the offer's membership or rank requirement.
2. Record destination, objective, deadline and reporting contact.
3. Prepare weapons, healing and tools for locked or difficult routes.
4. Enter the named site through the quest-instance option when offered.
5. Complete the assigned kills or speak to the rescue target.
6. Read updates and return to the questor for confirmation.


## What gets players stuck

Use this fix order:

1. Confirm the exact generated site and instance. A public room may lack the quest target; ask for [directions](../../town/talking-to-people.md) to a named house.
2. Check the 3D map, secret doors and unexplored rooms before declaring a person missing.
3. Re-read the action. Rescues need contact; infestations need more than the first kill. Check feedback after a fast kill rather than assuming the stage completed.
4. Keep any letters or quest objects apart from sale loot. A similarly named ordinary item is not a substitute.
5. Check **Time remains**, then revisit through the same instance option if necessary. Report the quest ID, destination and last entry if blocked. Online reload and item recovery remain unverified.


## Rewards and standing

See [quest rewards](../quest-rewards/) for eligible gear and Renown. Several scripts pay no gold. **The Dragonslayer** explicitly improves order standing. Rank gifts are separate services. Ordinary online failure costs no faction standing; scripted consequences remain distinct.

## Sources

- `handbook/quests/quests.json`: the seven example IDs above, requirements, targets, time and reward fields.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/<id>.txt`: those IDs, task structure only.
- `upstream/snapshot-e4f093166/src/systems/quest/clock.js`, `quest.js`: clocks and ordinary failure.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5; related pages linked above.
