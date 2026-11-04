---
title: The Weir Road
summary: Reclaim Redoubts, defeat a warrior duke, and advise Corvane's account to the Empire.
stage: reference
order: 50
gate: other "After The Covens' Hoard; online; registered account"
tags: [quest, questline, elite-breach, redoubts, choices]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Complete **The Covens' Hoard** online with a registered account.
> - Prepare for the shared **Elite Breach**; check your Weir Key access.
> - Do each Redoubt assignment while its own step runs.
> - Return to **Corvane Tull** after each combat objective; compare the final truth/mercy choice.

Checked against `e4f093166`; spoilers follow.

## Line facts

| Field | Value |
|---|---|
| Giver | Corvane Tull, surviving Battlemage |
| Opens when | After The Covens' Hoard; online; registered account |
| Steps | Four: QLWR01–QLWR04 |
| Tier | 4 throughout |
| Where it starts | Letter; generated tavern |
| Feature/event needs | Shared Elite Breach and ordered Redoubt receipts; no extra step `needs` |
| What it unlocks | Weirwalker at the witnessed warrior-duke step; final story resolution |

## How the line starts

Receive the invitation outdoors in town by day, with at most one new line per character hour and no other first letter travelling. Check **Quests** for holds or building setup; retry from a suitable town. Sealing the previous key still opens this line; see [Elite Gates](../../late/elite-gates/) for entry.

## Step table

| Step | Quest | Objective | Outcome effect |
|---|---|---|---|
| 1 | **The Weir Gate** | Take a first Court; meet Corvane | Standard pay; next assignment |
| 2 | **The Torn Halls** | Take three Redoubts; report | Standard pay; duke assignment |
| 3 | **A Warrior Duke** | Take a Valkynaz's Redoubt; report | Standard pay; witnessed title |
| 4 | **The Battlemage's Account** | Advise Corvane | Truth/mercy rewards; completion |

## Walkthrough

### 1. The Weir Gate

Read Corvane's letter for the current tavern and town. The assignment introduces turning a Weir Key, raising an Elite Breach and taking its first Court. Follow the shared event's entry instructions rather than looking for a generated quest dungeon. If you lack a key after sealing the previous line's gift, check the linked system guide before planning entry.

The quest tracks a Redoubt taken, while the account service checks its receipt. Opening a gate without completing the combat objective is insufficient. Once the Court objective registers, visit Corvane at the letter's tavern for standard payment. His early response only reminds you to fight. A separate meeting deadline starts after the deed. Party participation does not automatically settle every member's journal or account claim, so check your own state before leaving.

### 2. The Torn Halls

Read the journal when this step opens; it begins directly, without another first-letter wait. Take three Redoubts of an Elite Breach while the assignment runs. The Court from your introduction does not replace these new actions. Use the current Breach's progression and party information to find the next fights, rather than travelling to a fixed tavern address from an older step.

After the third qualifying action, return to the tavern named in this journal and speak to Corvane. That report pays the standard outcome and advances the line. An early conversation only gives a reminder. Check both the local objective and the account's ordered receipts if they disagree. Shared combat can help you finish the fights, but a party member's completion is not proof of your own witness. The report has its own deadline after combat finishes.

### 3. A Warrior Duke

Receive Corvane's letter and pursue a Valkynaz's Redoubt in the torn halls. The sheet identifies these as every fifth Court. Follow the Breach's current progression to reach that fight; killing an unrelated daedra or taking an ordinary Redoubt does not satisfy the warrior-duke objective. Start this assignment before pursuing the qualifying deed so the local action can register.

Once the Valkynaz falls, read the updated journal and return to Corvane at its tavern. Reporting pays the standard outcome. This is also the line's title-bearing witnessed step, before the final conversation. Check the account claim if the journal advances without **Weirwalker** appearing. Earlier Redoubt witnesses must satisfy the required order. A shared Breach does not become a private quest dungeon because you have this assignment. Return before the separate meeting timer expires.

### 4. The Battlemage's Account

Receive the final letter and visit Corvane at its generated tavern. Hear his account of the Spire's fall, then advise him what to tell the Empire about the Secretary who surrendered the keys. This is a conversation step, with no additional Redoubt quota. The earlier combat does not finish the line until you give your answer.

Choose truth to preserve the full account and gain Knights of the Dragon standing, or mercy to support the Secretary's requested version and receive greater payment. Each route has its own named equipment option. Compare the table before answering; no reversal task follows. If Corvane is missing, check this letter's town and tavern rather than returning automatically to an earlier meeting place. The waiting window still applies, and missing it produces an unpaid failure rather than either branch reward.

## Choices and outcomes

| Final answer | Payment | Other effect |
|---|---|---|
| Truth | Standard | Knights of the Dragon standing gain; **Oathkeeper's Dragon Helm**, Helm option |
| Mercy | Greater | **Corvane's Spire-Blade**, Longsword option |

## Rewards and what it unlocks

Tier 4 pays gold/gear with fitting and one-item claims. Renown and Weirwalker are separate. No next line is specified; see [quest rewards](../quest-rewards/).

## If it goes wrong

1. **Journal:** check Redoubt type/count, current tavern and deadline.
2. **Quests tab:** inspect pending witnesses separately from completed objectives.
3. **Held step:** confirm prior line, registration, shared event access and building setup.
4. **Instance/party:** this Breach is shared; private quest instances cannot replace its receipts.
5. **Retry timing:** success normally waits one character hour; failure/setup failure waits one character day. Online deadlines charge played time; failure costs no standing.
6. **Report:** send step and receipt state through [How this guide is checked](../how-this-guide-is-checked.md). Reload/abandon recovery is unverified.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [Elite Gates](../../late/elite-gates/)

## Sources

- `handbook/quests/quests.json`: `lines.weirRoad`, QLWR01–QLWR04.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js`: `QL_LINES`, `lineOpens`, `unmetNeeds`; `sheets/questlines.json`: QLWR01–QLWR04 branches/rewards.
- `upstream/snapshot-e4f093166/src/systems/questlines/quests/QLWR01.txt`, `QLWR02.txt`: `_taken_`, `_paid_`; `QLWR03.txt`: `_felled_`; `QLWR04.txt`: `_truthway_`, `_mercyway_`, `_tavern_`.
- `upstream/snapshot-e4f093166/src/net/questlineClaims.js`: `QL_SERVICE_LINES.weirRoad`; `upstream/snapshot-e4f093166/server-account/src/questlines.js`: ordered witness/title checks.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLineRunner.js`: `startStep`, `STEP_GAP_S`, `RETRY_GAP_S`.
- `docs/23-playing-online.md`, `docs/research/quest-research.md`: letters/recovery; `handbook/content/reference/quest-rewards.md`, `questline-ladder.md`: rewards/progression.
