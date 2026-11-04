---
title: Mages Guild fetches
summary: Find generated quest objects, follow building clues, and prepare for spell-dependent recovery jobs.
stage: reference
order: 52
gate: none
tags: [quest, pattern, mages-guild, fetches]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Record the object's name, destination and deadline before accepting.
> - Search secret rooms and dressing as well as containers.
> - Keep the quest object until its hand-in is complete.
> - Check whether the job requires a particular spell.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Giver/guild | Mages Guild questor at a guild hall |
| Typical gate | Membership and rank; some fetches admit non-members |
| Where it sends you | Generated dungeon or building; clues can change the destination |
| Time limit | Offer-specific; online deadlines charge played time — read the journal's Time remains |
| Reward shape | Gold, an item or another scripted outcome; eligible success can add gear and Renown |
| Instance | Choose **Your instance** when offered; private quest dungeons are full-size and admit your party |

## How to read the offer

Record region, site, object, contact, deadline and spell/tool requirements; the journal may omit details. Check **Quests** and **Time remains**. Prepare access tools, but distinguish opening routes from performing a required spell.

## The shapes you will see

1. **Loose dungeon ingredient.** **Grab an Ingredient** (`N0C00Y11`) and **Retrieve an Ingredient** (`N0B00Y04`) place a specific object underground. The journal names the assignment and destination. Return that object, not ordinary ingredients.
2. **Object carried by a foe.** **Mummy Wrappings** (`N0B00Y06`) attaches wrappings to the quest mummy after an injury trigger. Inspect the corpse and carry the quest wrappings back. Combat alone does not complete hand-in.
3. **Building search.** **Missing Book** (`N0C00Y10`) uses an informant and a thief whose location changes with the time of day. Follow clues among the house, tavern and shop; return the book.
4. **Spell-dependent task.** **Open a Chest** (`N0B00Y16`) requires **Open** after meeting the merchant. **Cast the Sleep spell** (`N0B00Y08`) requires **Sleep**. Follow the journal's action; neither is an ordinary fetch.
5. **Chained research.** **Azimuthal Vectors** (`N0B00Y17`) can involve a scholar, clues and several dungeons. Read journal stages and letters for the next site.

## Quick path

1. Check membership/rank and required spells or tools.
2. Record the object, site, deadline and recipient; leave carrying space.
3. Follow the named contact or travel to the generated destination.
4. Enter the quest instance when offered and search methodically.
5. Collect the specific object or perform the requested spell; read updates.
6. Carry the object to the named recipient and confirm completion before selling loot.

## What gets players stuck

Work through these checks in order:

1. Re-read the latest objective. Confirm town, building, contact schedule and instance before searching again.
2. Inspect the 3D map, secret doors, containers and dressing. Check locked routes.
3. Confirm the actual quest item is in your inventory. Do not sell it; generic loot with a similar name may not count.
4. Read combat feedback. Injury can place an item on a carrier; inspect the corpse after a fast kill. For slow progress, check contact timing or missing spells.
5. If you left, re-enter the same quest instance. Check **Time remains** before another trip or hand-in.
6. Report the ID, destination and last entry if blocked. Online reload, replacement-item and sold-item recovery are unverified.

## Rewards and standing

[Quest rewards](../quest-rewards/) explains payment: tier and gear choice depend on the quest and guild rank/character level. The carried object may be the objective, not payment. Online failure costs no faction standing; branch consequences remain. Offline failure differs.

## Next

- [Courier letters](../../town/courier-letters.md) for separate questline invitations.

## Sources

- `handbook/quests/quests.json`: the example IDs above.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/<id>.txt`: those IDs, task/reward structure only.
- `upstream/snapshot-e4f093166/src/systems/quest/clock.js`; `src/systems/instancePlaces.js` under that snapshot: clocks and instances.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5; [questline ladder](../questline-ladder.md) and related pages linked above.
