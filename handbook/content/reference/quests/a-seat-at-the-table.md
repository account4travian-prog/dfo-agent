---
title: A Seat at the Table
summary: Win a tavern card hand, then a King's Gambit game, and report to the regulars who invited you.
stage: reference
order: 57
gate: other "Level 2 · King's Gambit for second step"
tags: [quest, questline, taverns, cards, kings gambit]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Reach character level 2 and receive a regular's invitation outdoors in town by day.
> - Win a hand of Hold'em or Iliac Hand while the first step runs.
> - Enable **The King's Gambit** for the second step; it is your own setting online.
> - Report each win to the regular named in that step's journal.

Checked against `e4f093166`; this guide describes DFO Online.

## Line facts

| Field | Value |
|---|---|
| Giver | A tavern regular; generated separately for each quest |
| Opens | Character level 2; no separate online or registered-account gate in the line |
| Steps | Two: QLIT01–QLIT02 |
| Tier | 1 throughout |
| Start | Courier-delivered playing-card invitation; local tavern |
| Feature needs | First step has none; second needs The King's Gambit enabled |
| Unlocks | Next game lesson, then completion; no exclusive table access |

## How the line starts

Wait outdoors in town by day for the invitation. The card starts the line. Another undelivered first letter can delay yours; check **Quests**.

Use a tavern town for setup retries. The second quest enters the journal directly with another regular. The King's Gambit defaults on but remains your setting online. Disabling it holds the second step; the first can still proceed.

## Step table

| Step | Quest | Objective | Outcome |
|---|---|---|---|
| 1 | **A Hand of Cards** | Win a qualifying card hand; report | Payment; Gambit lesson follows |
| 2 | **The King's Gambit** | Win a Gambit game; report | Payment; line complete |

## Walkthrough

### 1. A Hand of Cards

Read the invitation for the regular's name, tavern and town. Visit a tavern card table and play Hold'em or Iliac Hand while this quest is active. The tracked event is a hand whose main pot you win. Merely sitting down, watching another player, or leaving a hand unfinished does not meet that objective. You can play against locals or other players; the quest does not require beating the particular regular who sent the invitation.

Choose a stake you can afford while learning. The quest's later payment does not guarantee that your table play will be profitable. Watch the journal for the win to be recorded before travelling back. Once the report objective opens, speak to the invitation's named regular at the listed tavern. Winning alone does not end this step: that conversation pays and advances the line. A reminder from the regular means the required win has not yet been recorded.

### 2. The King's Gambit

Check Quests after the first report and read the new contact's address. This step creates another regular, so returning to the previous table's giver can leave you speaking to the wrong person. If the step is waiting on The King's Gambit, enable that feature before looking for its assignment. Ordinary card wins do not replace a Gambit victory. With the feature off, tables offer the other card games instead.

Play a complete King's Gambit game against a tavern regular or another player. Protect your king and defeat the opposing king; opening the board or winning an ordinary card hand is not the tracked event. Perform the win while this step runs, then check the journal for the report objective. Return to the regular named in this quest and speak to them. That conversation awards payment and completes the introduction. The script asks for a victory, without requiring a particular opponent or army composition.

## Choices and outcomes

There is no quest branch. Choosing a game, opponent or stake affects your play, not a permanent story outcome. Success advances the line; expiry produces an unpaid failure.

> [!tip] Check the kind of win
> The quests count different events: a card-hand win first, a Gambit-game win second. Complete the current objective before returning to its regular.

## Rewards and unlocks

Sheets specify tier 1 and standard payment; scripts award gold. The final **The Regular's Lucky Charm** jewel option has base Mark, subject to fitting. This is equipment, not Marks currency. Keep one item per gear offer; online success can earn capped Renown XP. See [quest rewards](../quest-rewards/). Completion grants no exclusive table access.

## Recovery ladder

1. Read the journal's game, regular and address.
2. Check Quests for a hold, wait or retry; enable Gambit for its step.
3. Use a tavern town for setup and daytime outdoor mail delivery.
4. Record the required win, then report. No private dungeon is involved.
5. Success normally waits one character hour; failure/setup retries after one character day. Online deadlines charge played time.
6. [Report](../how-this-guide-is-checked.md) quest ID, game and objective. Reload/abandon repair is unverified.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [Tavern games](../../feet/tavern-games/)

## Sources

- `handbook/quests/quests.json`: `introTables`. Snapshot root: `upstream/snapshot-e4f093166/`.
- Snapshot `src/systems/questlines/`: `qlLines.js` gates/needs; `sheets/questlines.json` QLIT01–QLIT02; `quests/QLIT01.txt`, `QLIT02.txt` `_won_`, `_paid_`, contacts; `qlActs.js`, `qlLayer.js` counts; `qlLineRunner.js` holds/retries.
- Snapshot `src/systems/features.js`: `KINGS_GAMBIT_KEY`, default and online scope.
- `handbook/content/feet/tavern-games.md`; reference `quest-rewards.md`, `questline-ladder.md`; `docs/23-playing-online.md`; `docs/research/quest-research.md`: recovery limits.
