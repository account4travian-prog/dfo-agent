---
title: The Hour That Was Not
summary: Meet the Order of the Hour, break the Brass Remnant beneath an Abyss Dungeon, and choose who receives your account.
stage: reference
order: 51
gate: other "Level 12; online; registered account"
tags: [quest, questline, abyss-dungeon, order-of-the-hour, choices]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Reach character level 12 online with a registered account.
> - Receive **Prior Anselm Vey**'s letter outdoors in town by day.
> - Choose your recipient before descending through the **Abyss Dungeon**.
> - Break the **Brass Remnant**, then return to the Prior; entering the Orrery alone is insufficient.

Checked against `e4f093166`. Spoilers follow.

## Line facts

| Field | Value |
|---|---|
| Giver | Prior Anselm Vey of the Order of the Hour |
| Opens when | Character level 12; online; registered account |
| Steps | Two: QLHR01–QLHR02 |
| Tier | 4 throughout |
| Where it starts | Courier letter; generated temple |
| Feature/event needs | Shared Abyss Dungeon and Brass Remnant receipt; no extra step `needs` |
| What it unlocks | Witness of the Hour at the witnessed final step; no main-quest ending |

## How the line starts

Stand outdoors in town by day for the courier. A new line begins at most once per character hour, with no other first letter already travelling. Check **Quests** for level, registration or setup holds. If a required site cannot be generated, let setup retry from a suitable town. The journal names the Prior's temple and town; do not assume an Order affiliation identifies a fixed address.

The opening level belongs to this questline. It does not summon an Abyss Dungeon or replace the shared event's discovery and admission rules. Consult [Abyss Dungeons](../../late/abyss-dungeons/) before your expedition.

## Step table

| Step | Quest | Objective | Outcome effect |
|---|---|---|---|
| 1 | **Brass at Dusk** | Meet the Prior at his temple | Standard pay; introduction |
| 2 | **The Orrery of Endings** | Choose a power, break the Remnant, report | Recipient rewards; witnessed title; completion |

## Walkthrough

### 1. Brass at Dusk

Read the first letter and travel to the named temple in its named town. Speak to Prior Anselm Vey. This step introduces the Hour and its **Orrery of Endings** beneath the Abyss Dungeons; it does not yet ask you to defeat the Remnant. The meeting pays the standard outcome and lets the runner prepare the next step.

If the letter is absent, check courier conditions and the Quests tab before searching temples. If you find a temple without the Prior, compare the complete destination with the letter, including the town. His faction does not make every temple a valid meeting place. There is no branch or dungeon instance to resolve here. Visit before the waiting deadline; missing him produces an unpaid failure and the normal retry, rather than completing the introduction through exploration alone.

### 2. The Orrery of Endings

Receive the second letter and visit the Prior at its current temple. Choose which Bay power receives your findings. The first prompt lists three courts and an **Another power** option; that opens the other three choices. Compare the outcomes below before committing. The choice concerns this account of the Hour, not a main-story ending.

With the assignment active, follow the shared Abyss event, descend past the Orrery and break the Brass Remnant. A closed event or an ordinary quest dungeon cannot substitute for this encounter. Check your objective and account receipt after the fight, then return to the Prior at the journal's temple. He pays the selected outcome only after the deed and report. Party help does not guarantee your own witness, and seeing the Orrery without breaking the Remnant leaves the combat objective unfinished.

## Choices and outcomes

All choices require the same expedition and return. Each court route gains standing with that court; Underking and Blades routes also affect the Order of the Hour. No reversal is scripted.

| Recipient | Payment | Standing effect | Named option |
|---|---|---|---|
| Daggerfall | Standard | Court gain | **Lysandus's Remembrance**, Amulet |
| Sentinel | Standard | Court gain | **Sunfall Scimitar**, Saber |
| Wayrest | Standard | Court gain | **Eadwyre's Ward**, Kite Shield |
| Orsinium | Standard | Court gain | **Tusk of the Sixth Stone**, War Axe |
| Underking | Greater | Underking gain; Order loss | **Numidian Heartplate**, Cuirass |
| Blades | Lesser | Blades and Order gains | **Akaviri Oath**, Katana |

> [!warning] A deliberate branch still matters
> Online failure costs no faction standing. That protection does not cancel the Underking route's Order penalty.

## Rewards and what it unlocks

Both sheets specify tier 4; the final branch sets the payment and named gear option. Equipment fitting can substitute a usable base, and you keep one item from an offer. The source specifies no fixed Renown amount for this line; successful-quest Renown follows the general tracker and cap. See [quest rewards](../quest-rewards/).

**Witness of the Hour** belongs to the final witnessed step. The account service checks the Brass Remnant receipt in the line's eligible window; the journal and title claim can progress separately. Earlier event participation does not by itself prove that claim. This line specifies no next questline unlock and does not choose or finish a classic main-quest ending.

## If it goes wrong

1. **Journal:** check current temple, recipient, Remnant objective and time remaining.
2. **Quests tab:** distinguish unfinished combat from an unwitnessed account claim.
3. **Held step/event:** confirm level, registration and site setup; follow the Abyss event's current admission phase.
4. **Instance/party:** the Abyss event is shared. A private quest copy cannot replace its deed; check your own receipt.
5. **Retry timing:** success normally waits one character hour; failure/setup failure waits one character day. Online deadlines charge played time, separately from delivery delays.
6. **Report:** record step ID, event and claim state through [How this guide is checked](../how-this-guide-is-checked.md). Reload or abandon is not a verified repair.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [Abyss Dungeons](../../late/abyss-dungeons/)

## Sources

- `handbook/quests/quests.json`: `lines.hourThatWasNot`, QLHR01–QLHR02.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js`: `QL_LINES`, `lineOpens`, `unmetNeeds`; `sheets/questlines.json`: QLHR01–QLHR02 branches/standing/named rewards.
- `upstream/snapshot-e4f093166/src/systems/questlines/quests/QLHR01.txt`: `_met_`, `_temple_`; `QLHR02.txt`: `_another_`, `_chosen_`, `_broken_`, `_toldDaggerfall_` through `_toldBlades_`.
- `upstream/snapshot-e4f093166/src/net/questlineClaims.js`: `QL_SERVICE_LINES.hourThatWasNot`; `upstream/snapshot-e4f093166/server-account/src/questlines.js`: `QL_WITNESS_SQL.hour`, title checks.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLineRunner.js`: `startStep`, `STEP_GAP_S`, `RETRY_GAP_S`.
- `docs/23-playing-online.md`, `docs/research/quest-research.md`: letters/instances/recovery; `handbook/content/reference/quest-rewards.md`, `questline-ladder.md`: rewards/progression.
