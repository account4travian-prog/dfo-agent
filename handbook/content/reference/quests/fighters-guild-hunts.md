---
title: Fighters Guild hunts
summary: Read generated hunt offers, distinguish house and dungeon targets, and recognise protection or capture jobs.
stage: reference
order: 51
gate: none
tags: [quest, pattern, fighters-guild, hunts]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Record the site, target and deadline before accepting.
> - Choose **Your instance** when the quest destination offers it.
> - Finish a hunt's required kills, then return to the hall.
> - Read protection and capture instructions before attacking.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Giver/guild | Fighters Guild questor at a hall |
| Typical gate | Membership and guild rank; some local hunts admit non-members |
| Where it sends you | Generated house, remote site or dungeon; protection adds people and destinations |
| Time limit | Offer-specific deadline; online deadlines charge played time — read the journal's Time remains |
| Reward shape | Script payment, often gold; eligible success can add gear and Renown |
| Instance | Private destination for you and your party when offered; quest dungeons are full-size |

## How to read the offer

Record region, site, creature, kill count, deadline and return contact; the journal may omit details. Species, count and payment vary. Check **Quests** and **Time remains**. These jobs differ from the [questline ladder](../questline-ladder.md).

## The shapes you will see

1. **House hunt.** **Wild Animal** (`M0B00Y06`) and **Unwanted Houseguest** (`M0B00Y07`) place beasts in generated buildings. The journal names the job and deadline; follow the assigned property, not a later dungeon lead.
2. **Dungeon hunt.** **Hunt for a Lycanthrope** (`M0B00Y00`) sends you underground. Kill the assigned foe, then report back. An injury message alone does not satisfy the kill task.
3. **Repeated attackers.** **A Rat Infestation** (`M0C00Y14`) and **Pack of Giants** (`M0B20Y02`) require multiple kills. Remain at the assigned site for further spawns; check completion feedback before returning.
4. **Protection and escort.** **Standard Protection** (`M0B21Y19`) moves from a guarded house through investigation to an escort. Read letters and journal updates for the next contact and safe destination.
5. **Capture exception.** **Runaway Pet** (`M0B00Y17`) uses injury followed by the supplied bell. Keep the animal alive. Its journal distinguishes capture from killing; do not apply the hunt rule here.

## Quick path

1. Check the offer's gate and objective; prepare suitable weapons and healing.
2. Record destinations, deadline and return contact.
3. Travel to the named site and select the quest instance when offered.
4. Complete the required kills, protection, escort or tool interaction.
5. Read new entries and letters before leaving; follow any changed destination.
6. Return to the hall for ordinary hunts, or the named final contact for exceptions.

## What gets players stuck

Use this fix order:

1. Recheck the offer, building and active objective. Confirm the private instance; a public room can lack quest targets.
2. Inspect the 3D map, secret doors, containers and dressing. Keep quest objects separate from sale loot.
3. For slow spawns, stay at the site and read updates. Finish hunt targets; for capture, stop attacking when the tool becomes usable. A fast kill cannot be assumed reversible.
4. After leaving, return through the same quest-instance option. Recheck **Time remains** and the return journey; leaving is not completion.
5. If blocked, record the quest ID, site and last entry for a report. Reload and sold-item recovery are unverified online.

## Rewards and standing

See [quest rewards](../quest-rewards/): tier and gear choice depend on the quest and guild rank/character level. Gold has no universal amount. Online failure costs no faction standing; deliberate branches can still change standing. Offline failure differs.

## Next

- [Quest rewards](../quest-rewards/)

## Sources

- `handbook/quests/quests.json`: the example IDs above.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/<id>.txt`: those IDs, task/reward structure only.
- `upstream/snapshot-e4f093166/src/systems/quest/clock.js`; `src/systems/instancePlaces.js` under that snapshot: clocks and instances.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5; related handbook pages linked above.
