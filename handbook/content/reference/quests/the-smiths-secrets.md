---
title: The Smith's Secrets
summary: Set a gem, try the Reforge, and report to local armorers through an introduction to improving gear.
stage: reference
order: 54
gate: other "Level 4 · Loot Rarity"
tags: [quest, questline, gear, sockets, reforging]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Reach character level 4; both steps need **Loot Rarity**.
> - Receive the armorer's note outdoors in a town by day.
> - Bring your own gem and a piece with an available socket.
> - Complete each improvement while its quest is active, then report to its named armorer.

Checked against `e4f093166`; this guide describes DFO Online.

## Line facts

| Field | Value |
|---|---|
| Giver | An armorer, generated separately for each step |
| Opens | Character level 4; no separate online or registration gate in the line |
| Steps | Two: QLIG01–QLIG02 |
| Tier | 1 throughout |
| Start | Courier note; local armory and armorer |
| Feature needs | Loot Rarity for both steps; forced on online |
| Unlocks | Next lesson, then line completion; equipment systems are already available |

## How the line starts

Wait outdoors in town during daylight. The note starts the line. Another line's undelivered first letter can delay yours.

Check **Quests** if nothing arrives. Loot Rarity must be available before the first step starts. A missing local armory or suitable person can prevent setup; move to a larger town for the retry. The second step starts through the journal, with a newly generated armorer.

## Step table

| Step | Quest | Objective | Outcome |
|---|---|---|---|
| 1 | **A Stone in the Setting** | Socket a gem and report | Payment; reforge lesson follows |
| 2 | **Tempered Again** | Reforge a piece and report | Payment; line complete |

## Walkthrough

### 1. A Stone in the Setting

Read the note for the armorer's name, shop and town before doing the work. Set a gem in an available socket while this quest runs, then speak to that armorer. The quest listens for the socketing action. A piece that already had a gem before the assignment is not proof that you performed the lesson. You supply the gem; the letter does not give you a starter stone.

Use the socket controls in your pack or at the Reforge. Choose a piece you can work on and identify it first. The assignment accepts any gem rather than demanding a particular kind or grade. Setting it has no separate service charge, but the stone becomes part of the item. Check the journal after setting it: once the report objective opens, return to the named shop. Speaking early only produces a reminder. The report pays and advances the line.

### 2. Tempered Again

Read the new journal entry before returning to the first armorer. This step creates another local armorer, so the report can belong to a different person and town. Visit a Mages Guild's **Identify** service for the **Reforge**. Bring an identified, unworn Magic or Rare piece with an eligible affix, plus Welkynd Shards and gold. Review the service's requirements before spending anything; the quest does not supply the materials or require a particular item base.

Perform a reforge while this step is active. Reforging rerolls an eligible line, so the result can be less useful than the old value. The quest checks that you used the operation, not that you obtained a stronger piece. Socketing another gem or choosing Hone does not perform this task. Once the journal records the reforge, speak to this step's armorer at the named armory. That report pays and completes the introduction.

## Choices and outcomes

There is no quest branch. Your gem and reforge selections affect equipment, not the line's outcome. Successful reports advance it; expiry is an unpaid failure.

> [!warning] Keep a gem deliberately
> Ordinary unsetting destroys the stone. Use the Reforge's paid **Extract** service if you want it returned intact.

## Rewards and unlocks

Both sheets specify standard payment and tier 1; the scripts award gold. The final sheet adds **The Armorer's Temper**, a named Cuirass option subject to equipment fitting. You keep one item from a gear offer. Successful quests can also earn online Renown XP under its normal limits. See [quest rewards](../quest-rewards/) for claim rules. Completion introduces improvements without unlocking exclusive access to them.

## Recovery ladder

1. Read the journal's current armorer, address and objective.
2. Check Quests for a hold, wait or retry; confirm Loot Rarity.
3. Use an armory town for setup and daytime outdoor mail delivery.
4. Check socket availability, identification, equipment state and materials; report after the action.
5. No private dungeon is required.
6. Success normally waits one character hour; failure/setup retries after one character day. Online deadlines charge played time.
7. [Report](../how-this-guide-is-checked.md) the quest ID and objective. Reload/abandon repair is unverified.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [Loot rarity](../../gear/loot-rarity/) · [Sockets and reforging](../../gear/sockets-and-reforging/)

## Sources

- `handbook/quests/quests.json`: `introGear`; `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js`: `QL_LINES`, `lineOpens`, step `needs`.
- Same snapshot's `src/systems/questlines/sheets/questlines.json`: QLIG01–QLIG02 tiers, outcomes, named reward; `quests/QLIG01.txt`, `QLIG02.txt`: `_set_`, `_forged_`, `_paid_`, person/place declarations.
- Same questline directory: `qlLineRunner.js` gates, pacing, retries; `qlActs.js`, `qlLayer.js` action counting. Snapshot `src/systems/reforge.js`, `src/systems/loot/lootRarity.js`: improvement rules; `src/systems/features.js`: online policy.
- `handbook/content/gear/loot-rarity.md`, `sockets-and-reforging.md`; `handbook/content/reference/quest-rewards.md`, `questline-ladder.md`; `docs/23-playing-online.md`; `docs/research/quest-research.md`: recovery limits.
