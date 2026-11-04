---
title: The Court Crafter
summary: Gather materials, make a station-crafted piece, and report to the court's crafters through three introductory quests.
stage: reference
order: 45
gate: other "Level 2 · online · registered account"
tags: [quest, questline, crafting, gathering, professions]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Play online with a registered account at character level 2 or higher.
> - Receive the first note outdoors in a town by day; choose a town with a **General Store** and a smith.
> - Gather while the relevant step is active. Buying materials does not perform the required actions.
> - For the final step, make a piece at a crafting station; cooking and brewing do not count.
> - Read each new journal entry: the next crafter can have a different name and workplace.

Checked against `e4f093166`.

## Line facts

| Field | Value |
|---|---|
| Giver | A court crafter; each step creates its own local smith |
| Opens when | Character level 2, online, registered account |
| Steps | Three: QLIP01–QLIP03 |
| Tier | 1 throughout; an early crafting introduction |
| Where it starts | A courier note; the crafter works at a General Store in the town where the step starts |
| Online/account/feature needs | Online registration for the profession actions; a local General Store and smith for quest setup |
| What it unlocks | The next lesson, then completion of the crafting introduction; no separate profession-access unlock is specified |

## How the line starts

The runner sends a note rather than adding a normal quest offer to a smith's dialogue. Once eligible, stay outdoors in a town during daylight for delivery. New lines are paced, so another pending first letter can delay yours. Check **Quests** before moving on.

Use a substantial town when a step comes due. If its required building or person cannot be generated, the runner waits before trying again. Later steps enter the journal directly; do not wait for another physical note each time.

## Step table

| Step | Quest | Objective | What the outcome changes |
|---|---|---|---|
| 1 | **Of Rod and Root** | Catch three fish, gather three plants, then report | Payment and the next gathering lesson |
| 2 | **Ore and Timber** | Mine ore or stone three times, chop wood three times, then report | Payment and the making lesson |
| 3 | **Made by Hand** | Craft a station-made piece, then report | Final payment and line completion |

## Walkthrough

### 1. Of Rod and Root

Read the note for the crafter's name, General Store and town. Catch three fish and gather three plants while this step runs, then speak to that crafter. The tasks track fishing and gathering actions, rather than a purchase or a pile of stock already in your bag. The script does not take your gathered materials when you report.

If you see the crafter asking for more work, check both objectives before leaving again. Finishing the fish requirement does not finish the plant requirement. Use the journal's return location rather than assuming any smith can accept the report. Once both tasks are complete, speaking to the named crafter pays you and advances the line. There is no choice between different employers or rewards in this step.

### 2. Ore and Timber

Check the new journal entry after the line advances. This assignment creates another crafter in the town where it starts; the name and General Store can differ from the first step. Mine ore or stone three times and chop wood three times. The game counts the relevant gathering actions, so bringing purchased ore and timber is not a substitute.

If you see only one objective complete, continue the other kind of gathering rather than repeating the finished one. Once both are done, return to the smith named in this step's journal and speak to them. Nothing is taken from your stock by the report task. An early conversation only reminds you of the unfinished work; it does not replace it or choose a different outcome. Successful reporting pays you and opens the final lesson after the normal step delay.

### 3. Made by Hand

Make a piece at a crafting station, then visit the crafter named in the current journal. The script points to stations such as a forge, loom or mason's bench. Choose work you can make with your available materials and profession access; this quest does not specify one mandatory recipe or quality.

If you see no crafting progress after cooking food or brewing potions, make a station-crafted piece instead. Those activities do not emit the action this objective listens for. If the piece objective is complete but the quest remains active, speak to this step's crafter at its named General Store. The report finishes the line and pays the final reward. The script does not consume your piece in that conversation, and there is no branch asking you to commit to a permanent profession choice here.

## Choices and outcomes

The line has no branch. Each successful report advances the sequence; timing out produces an unpaid failure, followed by the runner's retry schedule.

## Rewards and what the line unlocks

All three sheets specify tier 1 and standard payment. The scripts pay gold; the final sheet adds **The Crafter's Thanks**, a named Ring option. Named bases remain subject to equipment fitting, and a gear offer lets you keep one item.

Successful quests can also earn online Renown XP under the general tracker and account cap. These sheets specify no faction-standing change or fixed Renown amount. Completing the line teaches gathering and crafting; it does not grant exclusive access to those systems. See [quest rewards](../quest-rewards/) for tiers and claim rules.

## If it goes wrong

1. **Journal:** reread the current crafter, store, town and unfinished actions; each step has a deadline.
2. **Quests tab:** check whether the line is active, waiting or retrying.
3. **Held step:** confirm online play and registration before attempting profession actions.
4. **Letter/building:** receive mail outdoors in town by day; be in a town with a General Store and smith when setup retries.
5. **Private instance:** no dungeon is required here. A private dungeon cannot replace gathering or station work.
6. **Retry timing:** successful steps normally wait one character hour; failure or failed setup waits one character day. Online deadlines charge played time; a delivery delay is separate.
7. **Report:** if the state contradicts your actions, record the step ID, objective, giver and town through [How this guide is checked](../how-this-guide-is-checked.md). Reload or abandon is not a guaranteed repair.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [Crafting](../../feet/crafting/) · [Courier letters](../../town/courier-letters/)

## Sources

- `handbook/quests/quests.json`: `lines.introCrafts`, QLIP01–QLIP03 names, objectives and outcomes.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js`: `QL_LINES` (`introCrafts`), `lineOpens`.
- `upstream/snapshot-e4f093166/src/systems/questlines/sheets/questlines.json`: QLIP01–QLIP03 `tier`, `objectives`, `outcomes`; QLIP03 `named`.
- `upstream/snapshot-e4f093166/src/systems/questlines/quests/QLIP01.txt`: `_courier_`, `_fish_`, `_herbs_`, `_paid_`, `_wait_`, local person/place declarations.
- `upstream/snapshot-e4f093166/src/systems/questlines/quests/QLIP02.txt`: `_ore_`, `_timber_`, `_ready_`, `_paid_`; QLIP03.txt in the same directory: `_made_`, `_paid_`, station-piece restriction.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlActs.js`: `ACT_KINDS`; `qlLayer.js` in the same directory: `act` (running-quest counts).
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLineRunner.js`: `STEP_GAP_S`, `RETRY_GAP_S`, `startStep`, `mayBegin`, `letterOnItsWay`, `ended`.
- `docs/23-playing-online.md`: questline letters and building setup; `handbook/content/town/courier-letters.md`: delivery and played-time rules.
- `handbook/content/reference/quest-rewards.md`: fitting, tier, Renown and failure rules; `handbook/content/reference/questline-ladder.md`: crafting introduction context.
