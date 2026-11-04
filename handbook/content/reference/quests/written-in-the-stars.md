---
title: Written in the Stars
summary: Allocate new Firmament stars and visit the astrologers who introduce your online growth choices.
stage: reference
order: 46
gate: other "Level 3 · online"
tags: [quest, questline, firmament, renown, astrologer]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Reach character level 3 online, then receive the astrologer's chart outdoors in town by day.
> - Use a registered account for the Firmament service, even though the line's opening gate only says online.
> - Allocate one new star for the first step and three more for the second.
> - Confirm changes in **Growth**, then return to the temple named in the current journal.
> - Do not refund and rebuy the same star for progress: each star counts once.

Checked against `e4f093166`.

## Line facts

| Field | Value |
|---|---|
| Giver | An astrologer; each step creates its own local spellcaster |
| Opens when | Character level 3, online |
| Steps | Two: QLIF01–QLIF02 |
| Tier | 1 in both sheets |
| Where it starts | A courier chart naming an astrologer at a local temple |
| Online/account/feature needs | Online line; a registered account for Firmament allocation; a town with a temple and suitable person for setup |
| What it unlocks | A second reading, then completion of the Firmament introduction; no separate tree-access reward is specified |

## How the line starts

The runner sends a chart once the level and online gate opens. You do not request this quest from an ordinary temple questor. Wait outdoors in town during daylight for delivery. Another line's pending first letter can hold yours back.

If nothing arrives, inspect **Quests** for the current wait and choose a substantial town with a temple when setup is due. The follow-up starts through the journal rather than another chart delivery. Its astrologer and temple can change.

## Step table

| Step | Quest | Objective | What the outcome changes |
|---|---|---|---|
| 1 | **The First Star** | Allocate a new Firmament star, then visit the named astrologer | Standard payment and access to the second lesson |
| 2 | **A Constellation of Your Own** | Allocate three additional new stars, then visit the current astrologer | Standard payment, named reward option and line completion |

## Walkthrough

### 1. The First Star

Read the chart for the astrologer, temple and town. Open the pause menu's Growth tab and its **Firmament** section, choose a connected star you want, and press **Accept** to keep the allocation. Renown supplies Stars; the quest asks you to spend through the Firmament rather than merely gain character levels or open the window. Return to the named astrologer once the objective completes.

If you see the service refusing access on a guest account, register before trying to allocate. If you see no points available, continue earning Renown and check your budget again. Allocations made before the quest runs are not retroactive quest actions. A successful reading pays you and advances the line. The choice of star affects your character, but the sheet has no alternate reward branch for different stars or signs.

### 2. A Constellation of Your Own

Read the fresh journal entry before travelling: this step sends you to another generated astrologer, potentially in a different temple or town. Allocate three further stars while this step is active, then visit that astrologer for the final reading. Plan connected purchases around the bonuses you actually want; the quest does not require a particular combat path or constellation shape.

If you see no progress after refunding and buying back a star, choose a star your character has not held before. The Firmament remembers previously held stars, so repeated purchases of the same node do not supply repeated quest credit. If the objective is complete but payment is missing, return to the current reading location and speak to its astrologer. That conversation finishes the introduction. No choice locks you to the astrologer's suggested role or changes the quest's standard payment.

## Choices and outcomes

The line has no branch. Your Firmament allocation remains a character-building decision, but both sheets have one successful reading outcome and one unpaid failure outcome. Do not confuse the freedom to choose stars with a quest reward choice.

## Rewards and what the line unlocks

Both steps specify tier 1 and standard payment, including script gold. The final sheet names **The Astrologer's Star**, an Amulet option. Equipment fitting can substitute a suitable base, and you keep one item from a gear offer.

The introduction teaches the Firmament; it does not award a free stock of allocation points. Renown supplies Stars at {{fact firmament.starsPerRenown}} per Renown level after the first. Successful quests can separately earn Renown XP under the general online tracker and account cap. Neither sheet sets a fixed Renown payment or faction-standing adjustment. See [quest rewards](../quest-rewards/) for those distinctions.

> [!note] Opening gate and usable service
> The line registry requires online play at character level 3. The Firmament service also requires registration to store your allocation; reaching the line's level gate alone does not make a guest's allocation work.

## If it goes wrong

1. **Journal:** confirm the active star count, current astrologer, temple and deadline.
2. **Quests tab:** distinguish a running lesson from a waiting next step.
3. **Held step:** confirm online access and registration; check your available points and accepted allocation.
4. **Letter/building:** stand outdoors in town by day for the first chart; use a town with a temple when setup retries.
5. **Private instance:** neither lesson needs a dungeon. A private room does not award Stars or bypass the account service.
6. **Retry timing:** a successful step normally waits one character hour; failed steps or failed setup wait one character day. Quest deadlines run while you play online, separately from courier delays.
7. **Report:** record QLIF01 or QLIF02, the objective and allocation state through [How this guide is checked](../how-this-guide-is-checked.md). Reloading or abandoning is not a promised fix.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [The Firmament](../../feet/the-firmament/) · [Renown](../../feet/renown/)

## Sources

- `handbook/quests/quests.json`: `lines.introFirmament`, QLIF01–QLIF02 names, objectives and outcomes.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js`: `QL_LINES` (`introFirmament`), `lineOpens`.
- `upstream/snapshot-e4f093166/src/systems/questlines/sheets/questlines.json`: QLIF01–QLIF02 `tier`, `objectives`, `outcomes`; QLIF02 `named`.
- `upstream/snapshot-e4f093166/src/systems/questlines/quests/QLIF01.txt`: `_courier_`, `_star_`, `_told_`, `_paid_`, `_wait_`, local temple/person declarations; QLIF02.txt in the same directory: `_stars_`, `_paid_`, fresh giver.
- `upstream/snapshot-e4f093166/src/net/firmament/firmamentBook.js`: `createFirmamentBook`, `FIRM_TAKEN_KEY`, `held`, `star-taken` emission and account access; `firmamentLaw.js` in the same directory: `STARS_PER_RENOWN`.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlActs.js`: `ACT_KINDS`; `qlLayer.js`: `act`; `qlLineRunner.js`: `STEP_GAP_S`, `RETRY_GAP_S`, `startStep`, `mayBegin`, `letterOnItsWay`, `ended`.
- `handbook/content/feet/the-firmament.md`: Growth/Firmament/Accept route; `handbook/content/reference/quest-rewards.md`: fitting and Renown rules; `handbook/content/reference/questline-ladder.md`: introduction context.
- `docs/23-playing-online.md` and `handbook/content/town/courier-letters.md`: letter pacing, setup and played-time rules.
