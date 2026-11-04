---
title: The Harbormaster's Word
summary: Sail between ports, deliver a cargo contract, and force a ship to surrender through the sea introduction.
stage: reference
order: 55
gate: other "Level 5 · Naval Combat"
tags: [quest, questline, ships, cargo, naval combat]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Reach character level 5; every step needs **Naval Combat**.
> - Receive notes outdoors in a town by day; prepare a ship for the actual work.
> - Sail to another port, then complete a delivery contract from the harbormaster's board.
> - Make an enemy ship strike its colors and report to the final step's named harbormaster.

Checked against `e4f093166`; this guide describes DFO Online.

## Line facts

| Field | Value |
|---|---|
| Giver | A harbormaster; local tavern contacts for first and final reports |
| Opens | Character level 5; no separate account gate in the line |
| Steps | Three: QLIS01–QLIS03 |
| Tier | 2 throughout |
| Start | Courier note; first contact generated at a local tavern |
| Feature needs | Naval Combat and Come Sail Away enabled for the sea check |
| Unlocks | Next sea lesson, then completion; no exclusive ship-access unlock |

## How the line starts

Wait outdoors in town by day. Check **Quests** for a hold or retry. Naval Combat is enabled online; the runner also checks Come Sail Away. Another undelivered first letter can delay yours. Use a tavern town for setup retries.

## Step table

| Step | Quest | Objective | Outcome |
|---|---|---|---|
| 1 | **Under Sail** | Reach another port under sail; report | Payment; cargo lesson |
| 2 | **A Hold Full** | Finish a board delivery contract | Bonus at delivery; combat lesson |
| 3 | **Strike Your Colors** | Force a ship's surrender; report | Payment; line complete |

## Walkthrough

### 1. Under Sail

Record the harbormaster's name, tavern and town for your return. Take a ship from a port and sail into a different harbor. Walking between coastal towns and buying passenger travel do not perform the sailing action. Use your own vessel or arrange one through a Shipyard; the invitation does not grant a free hull. Consult the ship guide before leaving.

The arrival must register as a voyage, with enough distance sailed between ports. Follow the journal's distance instruction rather than shuttling around the same quay. Watch for progress after berthing. If unfinished, check that you sailed from another port and the harbor recognized your arrival. Return to the named tavern contact once the report opens. That conversation pays and advances the line.

### 2. A Hold Full

At the helm beside a quay, open the harbormaster's board and accept a delivery contract. Choose a reachable destination, transport the assigned cargo and complete delivery. Carrying ordinary trade goods does not finish a board contract. The objective listens for the contract system to confirm success. Read the next note before choosing work so you know the quest is running.

This step has no final tavern conversation. The quest bonus arrives when delivery completes, in addition to the contract's payment. Check Quests before travelling back to the original giver. If the step remains active, inspect the contract status rather than assuming that arriving at any port is sufficient. A sailing arrival and a completed cargo contract are separate events. Finish the contract while this step runs.

### 3. Strike Your Colors

Read the final note for its new harbormaster, tavern and town; the first giver's address may differ. Prepare for a naval fight and seek the hostile ships described by the assignment. Make a ship strike its colors through your own ship's guns. Being present when someone else wins is not the required action. Check your vessel and supplies before sailing.

Watch for the surrender objective to complete. Cargo runs and land battles cannot substitute. The script does not require a trophy, prize or wreck boarding for the report. Once surrender is recorded, return to this step's named harbormaster and speak to them. The conversation pays and completes the line. Use the ship guide for wider naval risks and preparation beyond this introduction.

## Choices and outcomes

No quest branch is scripted. Success advances the sequence; expiry pays nothing.

## Rewards and unlocks

Sheets specify tier 2 and standard payment; scripts award gold. The final **Storm-Captain's Coat** Cuirass option is subject to fitting. Keep one item per gear offer; online success can earn capped Renown XP. See [quest rewards](../quest-rewards/). Completion grants no ship.

## Recovery ladder

1. Read the journal's current objective and return address.
2. Check Quests; confirm Naval Combat and Come Sail Away.
3. Use a tavern town for setup and daytime outdoor mail.
4. Check arrival, delivery or surrender progress; no private dungeon is involved.
5. Success normally waits one character hour; failure/setup retries after one character day. Online deadlines charge played time.
6. [Report](../how-this-guide-is-checked.md) quest ID and objective. Reload/abandon repair is unverified.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [Owning a ship](../../gear/owning-a-ship/)

## Sources

- `handbook/quests/quests.json`: `introSea`. Snapshot root: `upstream/snapshot-e4f093166/`.
- Snapshot `src/systems/questlines/`: `qlLines.js` gates/needs; `sheets/questlines.json` QLIS01–QLIS03; `quests/QLIS01.txt`–`QLIS03.txt` action/payment tasks; `qlLineRunner.js` `NEED_CHECKS`, retries; `qlActs.js`, `qlLayer.js` counts.
- Snapshot `src/scenes/harbourOffice.js`: `berthed`, `event`; `src/scenes/naval/navalHost.js`: `struckToMe`; `src/systems/features.js`.
- `handbook/content/gear/owning-a-ship.md`; reference `quest-rewards.md`, `questline-ladder.md`; `docs/23-playing-online.md`; `docs/research/quest-research.md`.
