---
title: Dark Brotherhood contracts
summary: Identify the assigned execution target, follow town or dungeon leads, and distinguish contracts from the one-time initiation.
stage: reference
order: 62
gate: none
tags: [quest, pattern, dark-brotherhood, contracts]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Record the target, destination, deadline and reporting contact.
> - Kill the assigned target; unrelated casualties do not replace it.
> - Follow town leads before searching every building.
> - Keep witnesses, guards and legal consequences in your plan.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Giver/guild | Brotherhood questor; invitation contact for initiation |
| Gate | Member contracts have rank requirements; the prospect test is one-time |
| Where | Generated dungeon, palace or town buildings |
| Time | Offer-specific deadline; online deadlines charge played time |
| Reward shape | Gold or another scripted outcome; eligible success can add gear and Renown |
| Instance | **Your instance** when offered; private quest dungeons are full-size and admit your party |


## How to read the offer

Record region, site, target description, deadline and return contact. Names and enemy types vary. Follow the assigned target, not a townsperson with a similar role. Check **Quests** and **Time remains**.

Joining needs an invitation and successful initiation; see [thievery](../../town/thievery.md) and [NPC guilds](../../town/npc-guilds.md). Do not assume a one-time assignment returns after refusal or failure.

## The shapes you will see

1. **Dungeon execution.** **A Fateful Song** (`L0B10Y01`) assigns a bard in a generated dungeon. Kill the quest target and report back; exploring the dungeon without the kill is insufficient.
2. **Variable opponent.** **A Knight Without Honor** (`L0B20Y02`) selects different combat classes. Follow the assigned site and completion feedback.
3. **Palace contract.** **An Anonymous Job** (`L0B30Y09`) and **Concerns of a Noble** (`L0B40Y04`) use generated palaces. Complete the execution there and return to the Brotherhood contact.
4. **Town investigation.** **Taking on the Thieves Guild** (`L0B50Y11`) involves local leads and possible target locations. Question the named contact and follow the location information before hunting the mark.
5. **Initiation exception.** **The Acceptance Test** (`L0A01L00`) is one-time. Follow the apothecary, supplied poison and decanter interactions, including replacing the decanter. Killing guards does not substitute for those steps.


## Quick path

1. Check eligibility and whether this is initiation or member work.
2. Record the target, destinations, contact and clock.
3. Prepare combat, access tools and a route back.
4. Follow contacts to the assigned site; select the quest instance when offered.
5. Perform the required execution or initiation interactions; read updates.
6. Return to the named contact and confirm completion.


## What gets players stuck

Fix order:

1. Recheck the target, current lead, building and instance. Generated locations are not fixed landmarks.
2. Ask for [directions](../../town/talking-to-people.md); search unexplored rooms and secret doors underground.
3. Confirm kill feedback. If a fast kill gives no update, do not assume another unrelated kill will repair it; preserve the last entry for reporting.
4. For initiation, check supplied items and required interactions. Poison and the decanter are quest objects, not ordinary loot to sell or consume.
5. Check the deadline and return contact. Guards and witnesses remain subject to [the law](../../town/the-law.md); a contract is no legal immunity.
6. Report the ID, site and last completed action if blocked. Online reload, replacement items and one-time retry recovery are unverified.


## Rewards and standing

[Quest rewards](../quest-rewards/) separates payment, eligible gear, Renown and standing. No universal purse applies. Ordinary online failure costs no faction standing; scripted consequences and crimes remain separate.

## Sources

- `handbook/quests/quests.json`: the six example IDs above, requirements, targets, time and rewards.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/<id>.txt`: those IDs, task structure only.
- `upstream/snapshot-e4f093166/src/systems/quest/clock.js`, `quest.js`, `actions.js`: online clocks and reputation.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5; related pages linked above.
