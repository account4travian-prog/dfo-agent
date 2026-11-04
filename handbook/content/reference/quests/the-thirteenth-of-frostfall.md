---
title: The Thirteenth of Frostfall
summary: Hold fallen stars and decide the coven spindle's fate.
stage: reference
order: 53
gate: other "Level 6; online; registered account; Starfall event"
tags: [quest, questline, starfall, witches-festival, seasonal, choices]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - Begin at character level 6, registered online, during **Starfall**.
> - Ask a **Wyrd Sister**, or hold a star for Morwen's note.
> - Meet Morwen at the open-air coven.
> - Compare spindle choices; Heart-Star is optional.

Checked against `e4f093166`; spoilers follow.

## Line facts

| Field | Value |
|---|---|
| Giver | **Morwen**, Wyrd Sister of Glenmoril |
| Opens when | Character level 6; online; registered account; Starfall staged |
| Steps | Four: QLTF01–QLTF04 |
| Tier | 3 throughout |
| Where it starts | Letter/note; Glenmoril Coven |
| Feature/event needs | `starfall` on steps 1/3; ordered receipts |
| What it unlocks | Starwarden at step 3; spindle resolution |

## How the line starts

Check [Festivals and Starfall](../../bay/festivals-and-starfall/) and **Quests**. A Sister or raven brings the invitation. Ordinary couriers need town, outdoors, daylight; new lines wait one character hour and any pending first letter. Check event/site holds.

> [!online] Seasonal hold
> Steps 1/3 pause without failure when Starfall ends and resume when it returns. Steps 2/4 need no Starfall.

## Step table

| Step | Quest | Objective | Outcome effect |
|---|---|---|---|
| 1 | **Music in the Woods** | Hold a star; meet Morwen | Standard pay |
| 2 | **The Coven on the Bluff** | Kill Spinner; bring spindle | Thread branch |
| 3 | **Three Stars** | Hold three more stars | Standard/Heart-Star bonus; title |
| 4 | **What the Thread Is Worth** | Resolve spindle's fate | Final branch; completion |

## Walkthrough

### 1. Music in the Woods

Once the line is active, speak to a Wyrd Sister at a tavern door for Morwen's letter. That conversation is optional: if you hold a fallen star first, her raven brings a note instead. Follow the event's current indication to a fallen star and complete its hold. Seeing the fall alone is insufficient; check your objective and account receipt.

Travel to the revealed Glenmoril Coven after holding the star. Morwen's meeting triggers on arrival at this open-air site, rather than through an indoor NPC marker. The meeting pays the standard outcome and advances the line. If you arrive before holding a star, finish that objective first. If Starfall ends, check the seasonal hold before treating the paused step as a failure. No reward branch occurs here.

### 2. The Coven on the Bluff

Receive the raven's letter and follow its revealed Bluff Coven destination. Arrival brings out the Spinner and her sisters at the open-air site. Defeat the Spinner to receive the spindle directly; searching a corpse is not required. Killing all three sisters is an optional objective. The Spinner's death still costs Sisters of the Bluff standing, separately from your later reward choice.

Bring the spindle to Glenmoril Coven and meet Morwen on arrival. Choose whether to sell a length of thread or deliver it whole. Selling pays more; keeping it whole gains Glenmoril standing. If the ambush vanished before the Spinner died, the script can call it again on a later arrival. Check inventory and journal before retrying. Once the spindle registers, the step stops its waiting timer for the return.

### 3. Three Stars

With this step active during Starfall, hold three more fallen stars. The star from the first assignment does not replace these new holds. Follow live omens and gather windows rather than returning to a remembered fall location. Each qualifying hold needs your account receipt; party company does not make another player's receipt yours. Check progress after each event.

The Heart-Star is an optional bonus if held while this step runs. It improves payment and adds a named ring option, but is not required to finish. Do not delay an otherwise complete objective expecting a later bonus: the step ends automatically when its hold count is reached. Morwen's raven brings payment without a return trip. If the festival ends first, the runner holds this star-dependent step for the next eligible event.

### 4. What the Thread Is Worth

Receive Morwen's letter and return to Glenmoril Coven. Arrival starts the final decision: burn the spindle in Hircine's fire, sell it to the Mages Guild, or take it to Arkay's priests. Burning resolves the quest there. The other choices give you the spindle and a journal entry naming the person, building and town for delivery.

For the Guild or Arkay route, carry the spindle to that named recipient and speak to them. Choosing a destination alone does not complete either delivery. These town sites are generated; the Arkay route requires its specified temple, not any priest. Compare the rewards below before answering, since no reversal is scripted. If setup is held, check required buildings. This step has no Starfall need, but its own waiting deadline still matters.

## Choices and outcomes

| Step / outcome | Pay | Other effect |
|---|---|---|
| 2: sell thread | Greater | No sheet standing gain |
| 2: whole thread | Lesser | Glenmoril standing gain |
| 3: ordinary / Heart-Star | Standard / greater | Heart: **Heart-Star Ring**, Ring option |
| 4: burn | Lesser | Glenmoril gain; **Morwen's Hunt-Charm**, Amulet |
| 4: Guild | Greater | **Starglass Rod**, Staff |
| 4: Arkay | Standard | Order of Arkay gain; **Thread-Cutter**, Dagger |

## Rewards and what it unlocks

Tier 3 follows [quest rewards](../quest-rewards/). **Starwarden** needs ordered star witnesses at step 3. Its Soul Cake purse pays once per account with the title during that account's festival. No next line is specified.

## If it goes wrong

1. **Journal:** check holds, spindle, destination/deadline.
2. **Quests tab:** distinguish objectives from pending witnesses.
3. **Held step/event:** check Starfall on steps 1/3 and site setup elsewhere.
4. **Instance/party:** covens are open-air; check your receipts.
5. **Retry timing:** success waits one character hour; failure/setup failure one character day. Seasonal holds differ. Deadlines charge played time; failure costs no standing. Spinner-kill standing applies.
6. **Report:** send step/claim state via [How this guide is checked](../how-this-guide-is-checked.md). Reload/abandon is unverified.

## Next

- [Quest browser](../../quests/) · [Line ladder](../questline-ladder/) · [Quest rewards](../quest-rewards/)
- [Festivals and Starfall](../../bay/festivals-and-starfall/)

## Sources

- `handbook/quests/quests.json`: `lines.thirteenthFrostfall`.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js`: `QL_LINES`, `eventHolds`, `unmetNeeds`; `sheets/questlines.json`: QLTF01–QLTF04 rewards/optional objectives.
- `upstream/snapshot-e4f093166/src/systems/questlines/quests/QLTF01.txt`: `_sister_`, `_raven_`, `_met_`; `QLTF02.txt`: `_lost_`, `_spinnerslain_`, `_hasspindle_`; `QLTF03.txt`: `_heart_`, `_held_`; `QLTF04.txt`: `_burnway_`, `_sold_`, `_cut_`.
- `upstream/snapshot-e4f093166/src/net/questlineClaims.js`: `QL_SERVICE_LINES.thirteenthFrostfall`; `upstream/snapshot-e4f093166/server-account/src/questlines.js`: `QL_PURSES`, ordered/title checks.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLineRunner.js`: `keepSeason`, `startStep`, retry constants.
- `docs/23-playing-online.md`, `docs/research/quest-research.md`; `handbook/content/reference/quest-rewards.md`, `questline-ladder.md`: letters/recovery/rewards/progression.
