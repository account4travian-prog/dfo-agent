---
title: The Covens' Hoard
summary: Hunt gold-lit champions, recover a coven lieutenant's key, and choose whether to keep it or seal it away.
stage: reference
order: 49
gate: other "After The Burning Doors; online; registered account"
tags: [quest, questline, elite-dungeons, weir-key, choices]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Finish **The Burning Doors** online with a registered account.
> - Kill gold-lit champions while their step is active, then report to **Ysolde Marnhel**.
> - Search the named lieutenant's body for the quest key.
> - Compare keep and seal before answering: the usable key grant is once per account.

Checked against `e4f093166`. Walkthrough and choices contain spoilers.

## Line facts

| Field | Value |
|---|---|
| Giver | Ysolde Marnhel, Master Conjurer of Wayrest's Mages Guild |
| Opens when | After The Burning Doors; online; registered account |
| Steps | Three: QLCH01–QLCH03 |
| Tier | 3 throughout |
| Where it starts | Letter; generated magery meeting place |
| Feature/event needs | Elite Dungeon champions; no additional step `needs` switch |
| What it unlocks | The Weir Road; account-checked Covenbane and optional Weir Key |

## How the line starts

Receive Ysolde's letter outdoors in town by day. New lines begin at most once per character hour, with no other first letter in flight. Check **Quests** for the prior-line gate or a held step. If setup cannot find a required site, let it retry from a suitable town. Follow the generated hall in the current journal; Wayrest is Ysolde's affiliation, not a fixed meeting address.

## Step table

| Step | Quest | Objective | Outcome effect |
|---|---|---|---|
| 1 | **Gold-Lit** | Kill three Elite Dungeon champions; report | Standard pay; lieutenant lead |
| 2 | **The Lieutenant** | Kill named lieutenant; recover and deliver key | Standard pay; key decision |
| 3 | **What the Key Opens** | Meet Ysolde; keep or seal | Branch rewards; line completion |

## Walkthrough

### 1. Gold-Lit

Read the letter for Ysolde's hall and town, then hunt three of the covens' gold-lit champions in Elite Dungeons. Their gold light identifies the relevant enemies; ordinary dungeon kills do not replace the required action. Follow current exploration information rather than a fixed dungeon pin. Count kills during this step, rather than assuming earlier victories satisfy it.

When the third champion falls, the journal changes to a report objective. Return to the hall it names and speak to Ysolde for standard payment. Visiting early only produces a reminder; it does not finish the assignment. The kill window gives way to a separate meeting deadline, so check the updated time remaining before another expedition. There is no branch here. Party help does not remove the need to check your own objective progress.

### 2. The Lieutenant

Read the new journal entry as soon as the step begins. It names a generated dungeon, a particular coven lieutenant and Ysolde's return hall. Travel to that dungeon and defeat the named lieutenant. Another gold-lit champion is no substitute for this target. Inspect the body and take the wrapped quest key before leaving; a completed kill objective alone is not the hand-in.

Carry the key to Ysolde and speak to her at this step's hall. The script checks possession for delivery and pays the standard outcome. If the hand-in stalls, compare your inventory and journal destination before repeating the fight. Use **Your instance** when the quest dungeon offers it; party members retain separate quest progress. This recovered quest item is not yet the usable account-backed Weir Key awarded by the final choice.

### 3. What the Key Opens

Receive Ysolde's next letter and visit its named hall. She asks whether you will keep the key or give it to the Order of the Hour for sealing. Both choices pay the Guild's fee and complete the line. Keeping requests a usable Weir Key from the account service; sealing trades that grant for greater payment, Order standing and a named ring option.

Before choosing keep, check whether another character on your account has already received this line's key. The grant cannot be repeated by running another character through the story. The service also requires the Burning Doors witness condition; local completion alone is not proof of entitlement. If the key does not arrive, inspect the account claim state. No reversal is scripted. Answer before the meeting deadline rather than leaving the decision unresolved.

## Choices and outcomes

| Final choice | Payment | Other effect |
|---|---|---|
| Keep | Standard | Once-per-account Weir Key, subject to service checks |
| Seal | Greater | Order of the Hour standing gain; **Hourkeeper's Linen Signet**, Ring option |

## Rewards and what it unlocks

The sheets specify tier 3. **Covenbane** is awarded at the final step under the service's prior-line check. Completion opens **The Weir Road** with either choice; sealing does not provide its key. See [Elite Gates](../../late/elite-gates/) for other key sources. Named gear remains subject to equipment fitting and a one-item claim; successful quests can earn general online Renown. See [quest rewards](../quest-rewards/).

## If it goes wrong

1. **Journal:** check target, key possession, generated hall and deadline.
2. **Quests tab:** distinguish active objectives from pending account claims.
3. **Held step:** confirm registration, prior-line completion and site setup; retry from a suitable town.
4. **Instance/party:** use the offered quest instance; check each player's progress separately.
5. **Retry timing:** success normally waits one character hour; failure/setup failure waits one character day. Online deadlines charge played time. Failure costs no faction standing.
6. **Report:** record step ID, objective and claim state through [How this guide is checked](../how-this-guide-is-checked.md). Reload/abandon recovery is unverified.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [Elite Gates](../../late/elite-gates/) · [Dagon's Breach](../../rivals/dagons-breach/)

## Sources

- `handbook/quests/quests.json`: `lines.covensHoard`, QLCH01–QLCH03 objectives/outcomes.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js`: `QL_LINES`, `lineOpens`, `unmetNeeds`.
- `upstream/snapshot-e4f093166/src/systems/questlines/sheets/questlines.json`: QLCH01–QLCH03 tiers/branches/rewards.
- `upstream/snapshot-e4f093166/src/systems/questlines/quests/QLCH01.txt`: `_slain_`, `_paid_`; `QLCH02.txt`: `_haskey_`, `_handed_`; `QLCH03.txt`: `_keepway_`, `_sealway_`, `_hall_`.
- `upstream/snapshot-e4f093166/src/net/questlineClaims.js`: `QL_SERVICE_LINES.covensHoard`; `upstream/snapshot-e4f093166/server-account/src/questlines.js`: `wholeSql`, key/title checks.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLineRunner.js`: `startStep`, `STEP_GAP_S`, `RETRY_GAP_S`.
- `docs/23-playing-online.md`, `docs/research/quest-research.md`: letters/instances/recovery; `handbook/content/reference/quest-rewards.md`, `questline-ladder.md`: rewards/progression.
