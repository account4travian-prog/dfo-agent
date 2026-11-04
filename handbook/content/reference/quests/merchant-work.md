---
title: Merchant work
summary: Plan merchant deliveries, recover assigned property and read changing instructions before fighting or handing goods over.
stage: reference
order: 66
gate: none
tags: [quest, pattern, merchants, delivery, recovery]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Record the shop, recipient, goods and deadline before accepting.
> - Keep assigned property separate from goods you intend to sell.
> - Check opening hours and the named person's location before another journey.
> - Read surrender or rescue prompts before continuing an attack.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Giver | Merchant questor; social work rather than a guild-rank ladder |
| Gate | Offer selection can depend on character level, reputation and other social restrictions |
| Where | Generated shops, houses, contacts and dungeons |
| Time | Assignment-specific deadline; online deadlines charge played time |
| Completion | Delivery, recovery, investigation or bringing someone back |
| Instance | Choose **Your instance** when offered; private quest dungeons are full-size |

## How to read the offer

Write down region, town, building, person, object, deadline and reporting contact. Identify whether the merchant wants an object returned, a delivery made or a person protected. Check **Quests** and **Time remains** after new letters arrive; the original destination may no longer be your next stop.

Use [shops and prices](../../town/shops-and-prices.md) for counter types and selling. A quest conversation and an ordinary sale are different interactions. The [questline ladder](../questline-ladder.md) describes the separate **The Merchant's Road** introduction.

## The shapes you will see

1. **Delivery with trouble.** **Smuggling** (`K0C00Y03`) supplies cargo for a remote contact. A letter and a guard can change the situation. Read the current directions and any demand before surrendering the goods.
2. **Missing property.** **A Rare Book** (`K0C00Y08`) places a specific book in a dungeon. Recover it and return to the merchant; an ordinary book from a shelf does not replace it.
3. **Exchange of loyalties.** **An Object Lesson** (`K0C00Y00`) combines a planted letter, recovered property and a competitor's counteroffer. Your recipient affects standing; possession alone does not settle the job.
4. **Protecting or recovering a person.** **The Recompense** (`K0C00Y09`) distinguishes bringing the assigned opponent back alive from killing them. Stop for injury feedback. **The Lost Child** (`K0C00Y05`) requires contact with the child and a return to the giver.
5. **Investigation.** **A Mix-Up** (`K0C00Y06`) moves among witnesses, evidence and generated buildings. Read letters and follow the latest lead rather than searching every shop.

## Quick path

1. Read the objective and record every contact and clock.
2. Plan access to the named shop or house and leave carrying space.
3. Collect supplied goods or visit the assigned site.
4. Select the quest instance when offered; complete the required interaction.
5. Read changed directions and reach the final recipient before selling anything.

## What gets players stuck

1. Recheck the exact building, person and instance. A closed shop or a witness who moved is not proof of a missing destination; ask for directions and check the time.
2. For dungeon property, inspect the 3D map, secret doors, containers and dressing.
3. Confirm you carry the quest object, not similar loot. Check the deadline before another outward or return trip.
4. Read combat feedback and legal consequences. Merchant employment does not suspend [the law](../../town/the-law.md).
5. Report the ID, site and last entry if blocked. Online reload and sold-item recovery remain unverified.

## Rewards and standing

[Quest rewards](../quest-rewards.md) explains variable payment and eligible gear. Ordinary online failure costs no faction standing; explicit branch changes and legal consequences remain separate. There is no universal merchant purse.

## Sources

- `handbook/quests/quests.json`: category `merchants`, example IDs above.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/<id>.txt`: those IDs, task structure only.
- Under that snapshot: `src/systems/quest/questLists.js`, `getSocialQuest`; `src/systems/quest/clock.js`, `quest.js`, `actions.js`; `src/systems/instancePlaces.js`.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5; linked handbook context.
