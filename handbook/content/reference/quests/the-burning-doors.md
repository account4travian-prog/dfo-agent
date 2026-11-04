---
title: The Burning Doors
summary: Investigate Dagon's covens, close a Breach, and decide the embers' fate.
stage: reference
order: 48
gate: other "Level 10 · online · registered account"
tags: [quest, questline, dagons-breach, mages-guild, choices]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Reach character level 10 online with a registered account.
> - Receive Ysolde's letter outdoors in town by day; follow its generated meeting place.
> - Keep the rite-book sealed for Guild standing, or read it for greater pay and a standing cost.
> - Break the rite and close a Breach after their respective steps open.
> - Compare the final ember choices before answering.

Checked against `e4f093166`. Spoilers follow.

## Line facts

| Field | Value |
|---|---|
| Giver | **Ysolde Marnhel**, Wayrest Mages Guild Master Conjurer |
| Opens when | Character level 10, online, registered account |
| Steps | Five: QLBD01–QLBD05 |
| Tier | 3 in all five sheets |
| Where it starts | Courier; generated magery |
| Online/account/feature needs | Registration; ordered rite/Breach witnesses |
| What it unlocks | Doorwarden at witnessed closure; The Covens' Hoard after completion |

## How the line starts

Receive the runner's invitation outdoors in town by day. If absent, check **Quests** for gates or pending letters. Follow the current journal's generated hall and town.

## Step table

| Step | Quest | Objective | What the outcome changes |
|---|---|---|---|
| 1 | **A Letter from Wayrest** | Meet Ysolde | Payment; coven lead |
| 2 | **The Faithful** | Kill coven Summoner; deliver book | Pay/standing branch |
| 3 | **Breaking the Rite** | Kill omen's Summoner before opening; report | Rite witness; payment |
| 4 | **Through the Burning Door** | Defeat Breach Warden; report | Closure witness; payment; Doorwarden |
| 5 | **The Caged Broker** | Choose embers' destination | Standing; named option; completion |

## Walkthrough

### 1. A Letter from Wayrest

Read Ysolde's letter and travel to its named hall and town. She occupies a generated magery site; her Wayrest title does not identify a fixed address. Speak to her for the introduction and payment. This meeting explains the covens behind the Breaches and leads to the next assignment.

If you see no letter, check eligibility and courier conditions before travelling. If the meeting objective appears but you cannot find her, compare the current journal's place with your destination. You need a conversation here, rather than a boss kill. There is no branch. Missing the waiting window produces an unpaid failure, with a later retry.

### 2. The Faithful

Read the new letter for the coven dungeon, target Summoner and return hall. Defeat that Summoner and recover the rite-book from the body. Other coven kills do not replace the named target. Keep the book for delivery.

If you see the read-or-seal prompt, compare the choices below. Reading pays more but costs Guild standing; preserving the seal gives standard payment and gains standing. Both routes require delivery to Ysolde. If the kill is complete but the book objective is missing, inspect the Summoner's remains. If hand-in stalls, check that you carry the book at this step's hall. Both successful routes continue the line.

### 3. Breaking the Rite

With this step active, find the faithful's ritual at a Dagon's Breach omen. Defeat its Summoner before the door opens. This world-event deed differs from the previous dungeon kill. Breaking the rite weakens the door; the Breach still opens.

If you see the gate already open, seek another qualifying omen. A later Warden kill is a different objective. Once the rite action registers, Ysolde sends a letter naming your next meeting place. Receive it outdoors in town by day, then visit her for payment. A meeting deadline replaces the deed deadline, so the ritual alone does not finish the quest. Account witness checks remain separate from journal progress.

### 4. Through the Burning Door

With this step running, follow the active Breach's instructions to confront its Warden, **Valkynaz Ruhn**. Defeat him to close the door. A broken rite alone cannot complete this assignment: it requires closure and an account receipt. Follow current event information for the location and phase.

If you see Ysolde saying the door remains open, inspect the closure objective and receipt. A closure before this step opened does not automatically satisfy its witnessed sequence. Once it registers, return to the journal's hall before the meeting deadline. The report pays you. At this witnessed closure step, the service also awards **Doorwarden**, subject to its claim checks.

### 5. The Caged Broker

Receive Ysolde's letter and visit its named hall. This meeting asks you to choose the embers' destination: the Mages Guild, the Order of the Hour or the Sigil Broker. There is no separate collection quota or delivery trip to each recipient.

If you see the destination prompt, compare the table before selecting. Guild and Order routes give standard payment and their respective faction's standing. The Broker pays more but lowers Guild standing. Each supplies a different named gear option, subject to equipment fitting. Answering completes the line; no reconsideration task follows. Missing the meeting's waiting window instead produces an unpaid failure and a later retry.

## Choices and outcomes

| Step / choice | Payment | Standing change | Named option / consequence |
|---|---|---|---|
| Faithful: read the book | Greater | Mages Guild −3 | Deliver it afterward; line continues |
| Faithful: preserve the seal | Standard | Mages Guild +5 | Deliver it afterward; line continues |
| Broker: Mages Guild | Standard | Mages Guild +5 | **Ysolde's Ember-Rod**, Staff |
| Broker: Order of the Hour | Standard | Order of the Hour +5 | **Seal of the Hour**, Ring |
| Broker: Sigil Broker | Greater | Mages Guild −2 | **Broker's Dusk-Wing Mantle**, Left Pauldron |

No reversal task is scripted.

## Rewards and what the line unlocks

Tier 3 outcomes pay gold and eligible gear; greater payment improves effective tier. Keep one item per offer, subject to class fitting. Successful quests can earn general online Renown XP; the sheets set no amount. See [quest rewards](../quest-rewards/).

Completion opens **The Covens' Hoard**, followed by **The Weir Road**; see the [ladder](../questline-ladder/).

> [!warning] Failure protection has limits
> Online failure costs no faction standing. Branch penalties still apply.

## If it goes wrong

1. **Journal:** check step, generated places, target, book and deadline.
2. **Quests tab:** inspect the next task and unwitnessed deeds.
3. **Held step:** confirm online registration and required event order.
4. **Letter/building:** receive mail outdoors in town by day; retry setup in a substantial town.
5. **Private instance:** use the coven's offered quest instance. Breaches remain shared; party quest progress stays separate.
6. **Retry timing:** success normally waits one character hour; failure/setup failure waits one character day. Online deadlines charge played time; delivery and meeting clocks differ.
7. **Report:** send step, objective and receipt state through [How this guide is checked](../how-this-guide-is-checked.md). Reload/abandon repairs are unverified.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [Dagon's Breach](../../rivals/dagons-breach/)

## Sources

- `handbook/quests/quests.json`: `lines.burningDoors`, QLBD01–QLBD05 names, objectives, outcomes.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js`: `QL_LINES` (`burningDoors`, `covensHoard`, `weirRoad`), `lineOpens`.
- `upstream/snapshot-e4f093166/src/systems/questlines/sheets/questlines.json`: QLBD01–QLBD05 `tier`, `objectives`, `branches`, `outcomes`, `standing`, `named`.
- `upstream/snapshot-e4f093166/src/systems/questlines/quests/QLBD01.txt`: `_courier_`, `_met_`, `_wait_`, `_hall_` declaration; QLBD02.txt: `_slain_`, `_hasbook_`, `_handed_`, `_paidread_`, `_paidshut_`.
- `upstream/snapshot-e4f093166/src/systems/questlines/quests/QLBD03.txt`: `_broken_`, `_courier_`, `_met_`, `_wait_`, `_meet_`; QLBD04.txt: `_closed_`, `_notyet_`, `_paid_`, `_meet_`; QLBD05.txt: `_met_`, `_guildway_`, `_orderway_`, `_brokerway_`.
- `upstream/snapshot-e4f093166/src/net/questlineClaims.js`: `QL_SERVICE_LINES.burningDoors`, `QL_WITNESS_KINDS`, `qlStepClaimed`.
- `upstream/snapshot-e4f093166/server-account/src/questlines.js`: `QL_WITNESS_SQL`, `SINCE`, `UNTIL`, ordered witness/title checks.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLineRunner.js`: `STEP_GAP_S`, `RETRY_GAP_S`, `startStep`, `mayBegin`, `letterOnItsWay`, `ended`, witness claim handling.
- `handbook/content/reference/quest-rewards.md`, `handbook/content/reference/questline-ladder.md`, `handbook/content/rivals/dagons-breach.md`: rewards, witnessed sequence, private instances and onward gates.
- `docs/23-playing-online.md`, `handbook/content/town/courier-letters.md`: letter, setup and played-time rules.
