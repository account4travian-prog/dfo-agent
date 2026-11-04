---
title: The Merchant's Road
summary: Collect and deliver quest loads for stable masters and merchants through an introduction to hauling.
stage: reference
order: 56
gate: other "Level 3 · hauling introduction"
tags: [quest, questline, wagons, hauling, merchants]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Reach character level 3 and receive the stable master's note outdoors in town by day.
> - Find the giver at the named tavern, rather than assuming the local Stable is the quest destination.
> - Collect the actual quest sack and carry it to the person named in the journal.
> - A wagon is optional for these quests; buying one does not complete either delivery.

Checked against `e4f093166`; this guide describes DFO Online.

## Line facts

| Field | Value |
|---|---|
| Giver | A stable master; a new local contact for each step |
| Opens | Character level 3; no online or registered-account gate in the line |
| Steps | Two: QLIR01–QLIR02 |
| Tier | 1 throughout |
| Start | Courier note; local tavern contact and remote General Store |
| Feature needs | No step `needs` switch; no wagon ownership check |
| Unlocks | Next hauling assignment, then completion; no wagon granted |

## How the line starts

Wait outdoors in town by day for the note. Check **Quests** if another line's undelivered first letter delays yours.

Setup needs a local tavern contact and a remote **General Store** merchant. Failed setup retries later; be in a substantial town. No feature holds either step. The second assignment enters the journal directly with a fresh local stable master.

## Step table

| Step | Quest | Objective | Outcome |
|---|---|---|---|
| 1 | **A Wagon's Load** | Collect the local sack; deliver it to the remote buyer | Buyer pays; next haul follows |
| 2 | **The Long Haul** | Collect a remote sack; return it to this step's stable master | Stable master pays; line complete |

## Walkthrough

### 1. A Wagon's Load

Read the note for the stable master's tavern and town, then speak to that person to collect the load. This is a quest item, not a request to buy an equivalent collection of supplies. After collection, check the updated journal for the buyer's name, General Store and destination town. Record the full address before travelling, since a shop name alone can be misleading in a generated assignment.

Carry the sack to the named buyer and speak to them while you have it. Arriving in town without the load is not enough. A wagon can help with carrying goods, but this script does not require one: the delivery checks the quest sack and buyer interaction. You can carry the load yourself if your capacity allows. Keep it available for the hand-in rather than selling or discarding it. Payment comes from the buyer at the destination, so no return to the first stable master is required.

### 2. The Long Haul

Read this step's journal as a new assignment. The stable master is generated for this quest, often near the town where the previous delivery ended; do not assume the first giver is waiting for your return. Note both addresses: the remote merchant holding the load and the local tavern where this step's stable master receives it. The route now goes out to collect goods and back to the named recipient.

Travel to the listed General Store and speak to the named merchant. The sack is already paid for; collecting the quest item does not require purchasing replacement stock from the shop's trade inventory. Check that the journal records collection before leaving. Bring that sack back to the stable master at the current tavern and speak while carrying it. The return conversation awards payment and finishes the introduction. Neither a wagon purchase nor an unrelated merchant transaction replaces the two scripted interactions.

## Choices and outcomes

There is no branch. Your transport choice does not change the scripted payment outcome. Delivering the correct load succeeds; expiry is an unpaid failure.

> [!warning] Keep the quest load
> These assignments check their own sack. Ordinary goods of the same apparent kind do not substitute for it, and replacing a lost quest item is not a verified recovery method.

## Rewards and unlocks

Sheets specify tier 1 and standard payment; scripts award gold. The final **The Carter's Gauntlets** Gauntlets option is subject to fitting. Keep one item per gear offer; online success can earn capped Renown XP. See [quest rewards](../quest-rewards/). Completion grants no wagon or exclusive trade service.

## Recovery ladder

1. Read the journal's pickup and delivery addresses.
2. Check Quests for a wait or retry; confirm you carry the quest sack.
3. Use a tavern town for setup and daytime outdoor mail delivery.
4. Follow the named contacts; no private dungeon or hauling counter is involved.
5. Success normally waits one character hour; failure/setup retries after one character day. Online deadlines charge played time.
6. [Report](../how-this-guide-is-checked.md) quest ID, item state and addresses. Reload/abandon repair is unverified.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [Wagons and hauling](../../feet/wagons-and-hauling/)

## Sources

- `handbook/quests/quests.json`: `introRoad`. Snapshot root: `upstream/snapshot-e4f093166/`.
- Snapshot `src/systems/questlines/`: `qlLines.js` gates; `sheets/questlines.json` QLIR01–QLIR02; `quests/QLIR01.txt`, `QLIR02.txt` collection, `toting`, payment/place declarations; `qlActs.js` no hauling act; `qlLineRunner.js` pacing/retries.
- `handbook/content/feet/wagons-and-hauling.md`; reference `quest-rewards.md`, `questline-ladder.md`; `docs/23-playing-online.md`; `docs/research/quest-research.md`: recovery limits.
