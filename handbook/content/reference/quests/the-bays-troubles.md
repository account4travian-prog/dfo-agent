---
title: The Bay's Troubles
summary: Defend a shared-world town raid, then bring one of your revenants to its knees for the watch.
stage: reference
order: 47
gate: other "Level 6 · online; second step Renown 10"
tags: [quest, questline, town-raids, revenants, shared-world]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Begin online at character level 6; receive the watch's order outdoors in town by day.
> - Fight raiders and stay in the attacked town until the raid is repelled, then report to the named tavern.
> - Expect the second step to wait until Renown {{fact revenant.minRenown}}.
> - Bring one of your own revenants to its knees; another player can help with the fight.
> - After the kneeling objective, receive the watch's thanks outdoors in town by day instead of returning to a captain.

Checked against `e4f093166`.

## Line facts

| Field | Value |
|---|---|
| Giver | A captain of the watch, associated with the region's ruling faction |
| Opens when | Character level 6, online |
| Steps | Two: QLIW01–QLIW02 |
| Tier | 2 in both sheets |
| Where it starts | A courier order; the first captain waits at a local tavern named in the journal |
| Online/account/feature needs | Online; no registered-account condition in the line definition; step 2 needs Renown 10 |
| What it unlocks | The revenant lesson after the raid lesson, then line completion; no exclusive access to raids or revenants is awarded |

## How the line starts

The runner sends the captain's order when you qualify. Stay outdoors in a town by day for the courier, and check **Quests** if another first letter is pending. The first step needs a local tavern and a suitable captain when it starts; a small settlement can fail that setup.

After the raid report, the second assignment appears in the journal once its Renown requirement is met. It comes from another captain. Its eventual reward arrives by courier, so the first tavern is not a permanent headquarters for the line.

## Step table

| Step | Quest | Objective | What the outcome changes |
|---|---|---|---|
| 1 | **Raiders at the Gate** | Help repel a town raid, then report to the named captain | Standard payment; next lesson waits for its Renown gate |
| 2 | **The Kneeling Dead** | Have one of your revenants kneel, then receive the watch's letter in town | Standard payment, named weapon option and line completion |

## Walkthrough

### 1. Raiders at the Gate

Read the order for your captain's name, tavern and town. The raid itself can be in any town: follow the shared event information to the attacked settlement, fight its raiders, and remain there until the defence resolves. The quest's action requires a raid you fought in and your presence in its town when the raiders are driven off. Visiting an attacked town without contributing is not enough.

If you see the raid end without objective credit, check whether you struck a raider and stayed for the cleanse. Join a later raid if the requirement is still unfinished. Once the journal records success, return to the named captain at the named tavern. That report pays you and advances the line. The shared raid's event rewards are separate from this conversation's quest reward.

### 2. The Kneeling Dead

Wait for the Quests view to release this step at Renown 10. The objective concerns one of your own revenants: it must yield and kneel to you. Another player may strike the blows that force it down. The quest does not require you to deliver the final blow yourself, and a revenant belonging to someone else is not a substitute.

If you see a waiting Renown requirement, continue your ordinary progression rather than searching for a missing tavern giver. If the kneeling objective is complete but the quest remains active, go outdoors in a town by day and allow the watch's courier to deliver its thanks. The script waits for that letter before paying and ending. You may kill or spare the kneeling revenant under that system's rules; neither choice changes this quest's successful payment outcome.

## Choices and outcomes

The line has no quest branch. Killing or sparing a kneeling revenant belongs to the revenant system; QLIW02 checks the kneeling event and courier delivery, with the same success outcome afterward.

## Rewards and what the line unlocks

Both sheets specify tier 2 and standard payment, with script gold. The final sheet names **The Watch's Thanks**, a Mace option. Gear offers award one chosen item, and named bases remain subject to your equipment restrictions.

Neither quest sheet specifies a faction-standing adjustment or fixed Renown amount. The raid system has its own participation benefits, and successful quests can earn Renown XP through the general online tracker and account cap. Keep those rewards separate when checking what arrived. The line introduces shared threats; completing it is not the switch that enables town raids. See [quest rewards](../quest-rewards/) for the tier and payment rules.

> [!online] Shared town defence
> Town raids happen in the shared world. A private quest dungeon cannot stand in for the attacked town or satisfy the raid objective.

## If it goes wrong

1. **Journal:** check which action is unfinished and note the return tavern or courier instruction and deadline.
2. **Quests tab:** distinguish the raid assignment from the later revenant assignment.
3. **Held step:** QLIW02 waits for Renown {{fact revenant.minRenown}}; character level 6 alone is insufficient.
4. **Letter/building:** receive the order and final thanks outdoors in town by day. First-step setup needs a town with a tavern and captain.
5. **Private instance:** raids remain shared town events; private dungeon progress does not replace them. Each party member keeps their own quest progress.
6. **Retry timing:** success normally waits one character hour before the next eligible step; failure or failed setup waits one character day. Online quest deadlines charge played time, separately from delivery delays.
7. **Report:** record QLIW01 or QLIW02, objective state, event and town through [How this guide is checked](../how-this-guide-is-checked.md). Do not rely on reload or abandon to restore progress.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [Town raids](../../bay/town-raids/) · [World events](../../bay/world-events/)

## Sources

- `handbook/quests/quests.json`: `lines.introBay`, QLIW01–QLIW02 names, objectives and outcomes.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js`: `QL_LINES` (`introBay`), QLIW02 `needs`, `unmetNeeds`, `NEED_WORDS.renown`.
- `upstream/snapshot-e4f093166/src/systems/revenant/revenant.js`: `REVENANT_MIN_RENOWN`.
- `upstream/snapshot-e4f093166/src/systems/questlines/sheets/questlines.json`: QLIW01–QLIW02 `tier`, `objectives`, `outcomes`, QLIW02 `named`.
- `upstream/snapshot-e4f093166/src/systems/questlines/quests/QLIW01.txt`: `_courier_`, `_raid_`, `_told_`, `_paid_`, local tavern/person declarations.
- `upstream/snapshot-e4f093166/src/systems/questlines/quests/QLIW02.txt`: `_knelt_`, `_heard_`, `_paid_`, `_thanks_`; own-revenant and kill/spare scope notes.
- `upstream/snapshot-e4f093166/src/systems/raidingParties.js`: `cleanse`, `raid-repelled` emission.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlActs.js`: `ACT_KINDS`; `qlLineRunner.js`: `STEP_GAP_S`, `RETRY_GAP_S`, `startStep`, `mayBegin`, `letterOnItsWay`, `ended`.
- `docs/23-playing-online.md`, `handbook/content/town/courier-letters.md`: delivery and played-time rules.
- `handbook/content/reference/quest-rewards.md`, `handbook/content/reference/questline-ladder.md`, `handbook/content/bay/town-raids.md`: rewards, gates, shared raids and separate party progress.
