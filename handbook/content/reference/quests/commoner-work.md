---
title: Commoner work
summary: Follow local leads, find missing people, clear beasts from named buildings and deliver the actual quest goods.
stage: reference
order: 65
gate: none
tags: [quest, pattern, commoners, investigation, delivery]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Note the person, exact building, deadline and reporting contact.
> - Ask directions instead of searching every house in town.
> - Follow new leads before treating a missing person as a dungeon rescue.
> - Keep supplied goods for their recipient; similar loot may not count.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Giver/guild | Ordinary people; giver commonly recorded as peasant |
| Gate | Character level or reputation; some offers restrict gender, adult content or repeat acceptance |
| Where | Generated local buildings, remote houses, contacts or dungeons |
| Time | Assignment-specific, sometimes listed as variable; online deadlines charge played time |
| Reward shape | Scripted gold, an object or another outcome; eligible success can add gear and Renown |
| Instance | Choose **Your instance** when offered; private quest dungeons are full-size and admit your party |


## How to read the offer

Record town, building, person, object, deadline and return contact. Identify the action: investigate, rescue, kill, deliver or obtain a remedy. Local trouble can lead out of town. Check **Quests** and **Time remains**.

Use [talking to people](../../town/talking-to-people.md) for directions. One unhelpful answer does not prove a building is missing. These jobs differ from the [questline ladder](../questline-ladder.md).

## The shapes you will see

1. **Missing-person investigation.** **Missing Person Case** (`A0C00Y16`) uses local contacts and a hiding place. Follow named leads and report what you learn.
2. **Rescue from a house.** **The Abducted Child** (`A0C10Y02`) places the child at a remote house with possible assassins. Find and speak to the child, then return to the giver.
3. **Beasts indoors.** **The Exterminator** (`A0C00Y07`) creates repeated attackers at the assigned building. Stay for the required kills and return only after completion feedback.
4. **Delivery.** **The Delivery Boy** (`A0C00Y14`) stays local; **The Courier** (`A0C00Y15`) uses a remote recipient. Carry the supplied item and confirm delivery.
5. **Purchase or remedy.** **The Birthday Present** (`A0C01Y09`) involves a merchant and gift; **The Cure** (`A0C00Y11`) follows a patient and healer. Bring spending money and follow recipient instructions.


## Quick path

1. Read the offer and check any eligibility or purchase requirement.
2. Record the objective, named places, people and deadline.
3. Ask for directions and locate the assigned building.
4. Choose the quest instance when offered; investigate or search there.
5. Complete the conversation, kills, purchase or delivery; read updates.
6. Follow changed leads and reach the named final contact.


## What gets players stuck

Work through this fix order:

1. Re-read the latest lead. Confirm town, building and instance.
2. Ask several people for directions. Underground, check the 3D map, secret doors and unexplored rooms; there is no fixed pin.
3. Confirm the quest item, not similar loot. Inspect containers and dressing.
4. Check combat feedback: infestations need repeated kills, rescues need contact, and a fast kill does not prove every trigger ran.
5. Recheck the clock and final recipient. If blocked, report the quest ID, site and last entry; online reload and sold-item recovery are unverified.


## Rewards and standing

See [quest rewards](../quest-rewards/) for payment and eligible gear. Ordinary online failure costs no faction standing; scripted outcomes remain separate. **The Abducted Child** lowers Dark Brotherhood standing on successful rescue.

## Sources

- `handbook/quests/quests.json`: the seven example IDs above.
- `upstream/snapshot-e4f093166/src/systems/quest/questLists.js`: `getSocialQuest` gates; index membership labels are misleading here.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/<id>.txt`: those IDs, task structure only.
- `upstream/snapshot-e4f093166/src/systems/quest/clock.js`, `quest.js`, `actions.js`: clocks and reputation paths.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5; related pages linked above.
