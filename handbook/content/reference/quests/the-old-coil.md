---
title: The Old Coil
summary: Sail Hamid's packet lanes, face Sethrakul at sea, and choose between a sailor's offering and a scale trophy.
stage: reference
order: 52
gate: other "Level 8; online; registered account"
tags: [quest, questline, sailing, sea-serpent, choices]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Reach character level 8 online with a registered account.
> - Meet **Hamid al-Rasheen** at the tavern named in his letter.
> - Make qualifying port arrivals under sail while the packet-lanes step runs.
> - Follow the live serpent sighting, then compare the final blood/scale rewards.

Checked against `e4f093166`. Spoilers follow.

## Line facts

| Field | Value |
|---|---|
| Giver | Hamid al-Rasheen, a Sentinel packet captain |
| Opens when | Character level 8; online; registered account |
| Steps | Three: QLOC01–QLOC03 |
| Tier | 3 throughout |
| Where it starts | Courier letter; generated tavern |
| Feature/event needs | Sailing and shared Sea Serpent; no explicit `naval` step need in this line |
| What it unlocks | Satakal's Witness at the witnessed final step; no further line specified |

## How the line starts

Receive Hamid's letter outdoors in town by day. First letters are paced at most one new line per character hour, with no other first letter in flight. Check **Quests** for level, registration or a held step. Failed site setup retries later; use a suitable town. Hamid's Sentinel affiliation is not a fixed destination: read the generated tavern and town in each letter.

The line needs actual sailing, although its registry has no `naval` hold like the separate sea introduction. The serpent follows a shared event clock; receiving Hamid's letter does not summon it. See [the sea serpent](../../rivals/sea-serpent/).

## Step table

| Step | Quest | Objective | Outcome effect |
|---|---|---|---|
| 1 | **The Sailors' Tale** | Meet Hamid at the named tavern | Standard pay; sailing assignment |
| 2 | **The Packet Lanes** | Make port twice under sail | Standard pay at sea; serpent assignment |
| 3 | **The Shed Skin** | Slay Sethrakul; report and choose | Blood/scale rewards; witnessed title; completion |

## Walkthrough

### 1. The Sailors' Tale

Read Hamid's invitation and travel to the tavern it names. Speak to him for the sailors' account of Satakal and **Sethrakul**, the Old Coil. This first step is a meeting, not a serpent kill or a sailing quota. The conversation pays the standard outcome and lets the runner prepare the packet-lanes assignment.

If the captain is absent, compare the tavern and town together rather than searching every inn in Sentinel. The quest generates his meeting place. If the first letter has not arrived, return to courier conditions and the Quests tab rather than sailing out to trigger it. The waiting deadline applies to this conversation; missing it produces an unpaid failure. There is no branch here, and a party member meeting Hamid does not replace checking completion on your own quest copy.

### 2. The Packet Lanes

Read the journal when this step starts; the assignment appears directly. Make port twice under sail, with sufficient travel between arrivals as described in the journal. Use actual sailing and port arrival, rather than treating a purchased passage or repeated nearby docking as equivalent. Earlier voyages do not replace actions during the running step.

Hamid meets you from his packet when the second qualifying arrival registers. The script pays the standard outcome there and ends the step, so you do not need an inland tavern report for this assignment. If it stays active, inspect the port objective before travelling back to the first meeting place. Plan a real route between ports and check that each arrival counts. No reward branch occurs here. The script's sailing-season failure wording is not a separate Starfall-style opening gate for this line.

### 3. The Shed Skin

Receive Hamid's next letter and note its return tavern before setting out. Follow the current harbor sighting and event phase to fight Sethrakul at sea. Bring companions where possible; the quest does not turn this shared encounter into a private instance. A sighting, joining the fight or sailing past the site is not the serpent-slain objective.

After the kill registers, check your own journal and account receipt, then visit Hamid at this step's tavern. He asks whether to return the blood to the sea for Satakal or keep the scale. This prompt resolves the offering; no additional journey to a fixed harbor is scripted. Compare the table before answering. Both choices complete the line, but their payment, standing and named equipment differ. If he still asks for the kill, inspect progress before expecting the final choice.

## Choices and outcomes

| Final choice | Payment | Other effect |
|---|---|---|
| Blood offering | Lesser | People of Sentinel standing gain; **Walkabout Charm**, Cloth Amulet option |
| Keep scale | Greater | **Sethrakul's Scale**, Round Shield option |

No reversal task is scripted.

## Rewards and what it unlocks

Tier 3 sheets specify standard early payments and the final branch above. Named rewards obey equipment fitting and one-item claim rules. Successful quests can earn general online Renown, with no line-specific amount promised. See [quest rewards](../quest-rewards/).

**Satakal's Witness** requires the final service witness. A local quest update is separate from the account's serpent receipt and title check; a kill predating the line does not automatically qualify. Neither branch specifies a subsequent questline unlock.

## If it goes wrong

1. **Journal:** check sailing arrivals, serpent objective, current tavern and deadline.
2. **Quests tab:** inspect waiting steps and pending witnesses separately.
3. **Held step/event:** confirm registration and site setup; follow the serpent's current sighting window.
4. **Instance/party:** the serpent is shared; check each player's progress and receipt.
5. **Retry timing:** success normally waits one character hour; failure/setup failure waits one character day. Online deadlines charge played time. Failure costs no faction standing.
6. **Report:** send step ID and event/claim state through [How this guide is checked](../how-this-guide-is-checked.md). Reload/abandon recovery is unverified.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [The sea serpent](../../rivals/sea-serpent/)

## Sources

- `handbook/quests/quests.json`: `lines.oldCoil`, QLOC01–QLOC03.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js`: `QL_LINES`, `lineOpens`, `unmetNeeds`; `sheets/questlines.json`: QLOC01–QLOC03 rewards/branches.
- `upstream/snapshot-e4f093166/src/systems/questlines/quests/QLOC01.txt`: `_met_`, `_inn_`; `QLOC02.txt`: `_lanes_`; `QLOC03.txt`: `_slain_`, `_home_`, `_poured_`, `_kept_`.
- `upstream/snapshot-e4f093166/src/net/questlineClaims.js`: `QL_SERVICE_LINES.oldCoil`; `upstream/snapshot-e4f093166/server-account/src/questlines.js`: serpent witness/title checks.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLineRunner.js`: `startStep`, `STEP_GAP_S`, `RETRY_GAP_S`.
- `docs/23-playing-online.md`, `docs/research/quest-research.md`: letters/recovery; `handbook/content/reference/quest-rewards.md`, `questline-ladder.md`: rewards/progression.
