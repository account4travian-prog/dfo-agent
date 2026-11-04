---
title: Temple errands
summary: Distinguish exorcisms, relic recovery, healing, delivery and investigations before accepting a generated temple job.
stage: reference
order: 53
gate: none
tags: [quest, pattern, temples, errands]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Record the patient, recipient or target and every named destination.
> - Plan the return or delivery before accepting a tight clock.
> - Keep relics and medicine for their assigned recipient.
> - Read investigation updates before deciding whom to fight.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Giver/guild | Temple questor; some jobs belong to a particular deity's temple |
| Typical gate | Membership/rank for many jobs; non-member errands also exist |
| Where it sends you | Generated houses, contacts, remote sites or dungeons |
| Time limit | Offer-specific, sometimes tight or multi-stage; online deadlines charge played time — read the journal's Time remains |
| Reward shape | Scripted gold, religious object or gear; eligible success can add gear choice and Renown |
| Instance | Choose **Your instance** when offered; private quest dungeons are full-size and admit your party |

## How to read the offer

Record temple, region, building, contact, item and deadline. Identify the action: kill, investigate, heal, recover or deliver. Note the final recipient; deliveries can end away from the temple. Keep offer details alongside **Quests**; new entries can replace directions.

## The shapes you will see

1. **Haunting or exorcism.** **The Haunted House** (`C0B00Y00`) requires killing the assigned undead. **The Possessed Child** (`C0B00Y02`) uses contacts and a religious object. Follow the journal's house and leads; the child is not a hunt target.
2. **Relic recovery.** **The Relic** (`C0B10Y15`) places a talisman and lich in a dungeon; return the talisman, with defeating the lich affecting standing. **The Stolen Item** (`C0C00Y12`) uses a house contact. Follow the recovery objective.
3. **Healing.** **The Healing** (`C0C00Y10`) sends you between a patient and healer. Follow journal updates, obtain the remedy and carry it to the patient. Using it yourself is not hand-in.
4. **Delivery.** **A Delivery** (`C0B10Y07`) supplies a religious object for a remote recipient, with possible attackers. Deliver it before expiry; defeating attackers does not complete delivery.
5. **Heretic investigation.** **The Heretic** (`C0B00Y01`) moves through contacts, letters and evidence. Read journal stages and letters for the next lead. Investigate before attacking.

## Quick path

1. Check temple eligibility and prepare healing, access tools and suitable combat equipment.
2. Record the objective, destinations, recipient and deadline.
3. Collect or retain any supplied medicine, relic or letter.
4. Visit the named site; choose the quest instance when offered.
5. Perform the required interaction and read every new direction.
6. Reach the final recipient or return questor and confirm completion.

## What gets players stuck

Use this fix order:

1. Re-read the offer and newest entry. Confirm the exact temple, building, person and instance.
2. Search the 3D map for secret doors and unexplored rooms; inspect containers and dressing for missing relics.
3. Check inventory: retain quest medicine and relics; ordinary loot may not substitute.
4. Finish hunt kills; pause for investigation feedback before further attacks. Fast kills and slow triggers do not prove completion.
5. After leaving, return through the quest-instance option. Check **Time remains** before travel. Deadlines differ from requested waits.
6. Report the ID, site and last entry if blocked. Online reload and sold-item recovery remain unverified.

## Rewards and standing

See [quest rewards](../quest-rewards/): tier and gear choice depend on the quest and guild rank/character level. Payment varies. Success and deliberate branches can affect standing; online failure itself costs none. Offline failure differs. Failure protection does not erase branch or crime consequences.

## Next

- [Questline ladder](../questline-ladder.md) and [courier letters](../../town/courier-letters.md) for separate invitation-led lines.

## Sources

- `handbook/quests/quests.json`: the example IDs above.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/<id>.txt`: those IDs, task/reward structure only.
- `upstream/snapshot-e4f093166/src/systems/quest/clock.js`; `src/systems/instancePlaces.js` under that snapshot: clocks and instances.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5; related handbook pages linked above.
