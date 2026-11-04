---
title: The Herald's Call
summary: Win Arena ladder bouts in Daggerfall and collect the Herald's introductory purses.
stage: reference
order: 58
gate: other "Level 6 · online"
tags: [quest, questline, arena, ladder, online]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Play online at character level 6 or higher.
> - Receive the Herald's broadsheet outdoors in a town by day.
> - Visit the Arena's Herald in Daggerfall and choose the **Ladder**.
> - Win a ladder bout for the first quest, then three more while the second quest runs.
> - Quest purses pay on the qualifying wins; no separate return conversation is scripted.

Checked against `e4f093166`; this guide describes DFO Online.

## Line facts

| Field | Value |
|---|---|
| Giver | The Arena's Herald |
| Opens | Character level 6, online; no additional registration gate in this line |
| Steps | Two: QLIA01–QLIA02 |
| Tier | 2 throughout |
| Start | Courier broadsheet; bouts at the Arena in Daggerfall |
| Feature needs | No step `needs` switch; online Arena ladder access for the actions |
| Unlocks | Next challenge, then introduction complete; no rated-rank unlock specified |

## How the line starts

Wait outdoors in town by day for the broadsheet. Another undelivered first letter can delay yours. Check **Quests** for the online gate or wait.

These scripts place no local person or building. The invitation can find you elsewhere; the bouts are at Daggerfall's Arena. The second challenge enters the journal directly after the step delay. Wait for it before earning its wins.

## Step table

| Step | Quest | Objective | Outcome |
|---|---|---|---|
| 1 | **First Blood** | Win a ladder bout | Automatic quest purse; next challenge |
| 2 | **A Name in the Sand** | Win three ladder bouts during this step | Automatic quest purse; line complete |

## Walkthrough

### 1. First Blood

Read the broadsheet and confirm First Blood is running before entering a bout. Go to the Arena in the city of Daggerfall and use the Herald at its gate to open the Ladder. Choose a ladder opponent and win your own bout. The quest counts the ladder victory event; a duel in the shared world, a player-versus-player Arena match, or watching someone else's bout does not perform that event. Practice in the pit also does not count.

Read the Arena's bout information before entering, since it uses its own match rules. The quest does not require a rated victory or a particular season rating. When the qualifying win is recorded, the script awards its gold and ends the step automatically. There is no generated quest NPC to find afterward for a report. Check Quests after the result to distinguish a completed first lesson from the next challenge waiting to begin.

### 2. A Name in the Sand

Wait for the second quest's journal entry before starting its work. This step counts three ladder wins made while it runs. The victory that completed First Blood does not carry forward into that total, and wins earned before the new assignment starts do not satisfy it. Use the Herald's Ladder again and keep checking the quest objective as you progress, rather than treating your overall Arena history as the quest's counter.

You need wins, not merely entries or finished matches. Losses and draws do not provide the victory event, and rated player matches remain separate from the ladder task. The script specifies no particular opponent names or requirement for consecutive wins. Once the required wins are recorded, the quest pays automatically and completes the line. You do not need to search for a tavern contact or click a separately generated Herald. Read the completion state and inspect any waiting gear offer before leaving the Arena.

## Choices and outcomes

There is no branch. Winning advances the introduction; expiry is an unpaid failure. Only ladder victories count toward success.

> [!online] Ladder progress and rating are separate
> The introductory quests count ladder bouts. Rated play has its own account and season rules; completing this line does not promise a rating increase or season prize.

## Rewards and unlocks

Sheets specify tier 2 and standard payment; scripts award gold on the win task. The final **The Crowd's Favor** Bracelet option is subject to fitting. Keep one item per gear offer; online success can earn capped Renown XP. See [quest rewards](../quest-rewards/). No account title, fixed rank or exclusive rated access is specified.

## Recovery ladder

1. Read the current journal's win requirement.
2. Check Quests for online status, delays or retries.
3. Receive mail outdoors in town by day; no local building is generated.
4. Confirm your own Ladder victory; practice, spectating and player bouts do not count.
5. No quest-dungeon instance is involved.
6. Success normally waits one character hour; failure retries after one character day. Online deadlines charge played time.
7. [Report](../how-this-guide-is-checked.md) quest ID, mode and result. Reload/abandon repair is unverified.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [The Arena](../../bay/the-arena/)

## Sources

- `handbook/quests/quests.json`: `introArena`. Snapshot root: `upstream/snapshot-e4f093166/`.
- Snapshot `src/systems/questlines/`: `qlLines.js` gates; `sheets/questlines.json` QLIA01–QLIA02; `quests/QLIA01.txt`, `QLIA02.txt` `_word_`, `_won_`, payments; `qlActs.js`, `qlLayer.js` counts; `qlLineRunner.js` letters/delays.
- Snapshot `src/scenes/arena/arenaBouts.js`: `verdict` ladder branch and relay `pve` victory action; practice/player exclusions.
- `handbook/content/bay/the-arena.md`; reference `quest-rewards.md`, `questline-ladder.md`; `docs/23-playing-online.md`; `docs/research/quest-research.md`: recovery limits.
