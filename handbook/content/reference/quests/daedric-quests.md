---
title: Daedric quests
summary: Read each Prince's request, follow its generated targets and contacts, and check artifact or branch consequences before committing.
stage: reference
order: 69
gate: none
tags: [quest, daedric, princes, artifacts, choices]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Treat each Prince's request as its own assignment.
> - Record the target, destination, reporting contact and deadline.
> - Read refusals and counteroffers before choosing.
> - Distinguish the promised artifact from ordinary loot and gear rewards.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Giver | One named Prince; a mortal contact can handle completion |
| Gate | Access to that Prince's offer; the index alone does not establish summoning availability |
| Where | Generated dungeons, buildings and contacts |
| Time | Request-specific deadline; online deadlines charge played time |
| Reward | Named artifact or branch-specific outcome, not a universal purse |
| Instance | **Your instance** when offered; private quest dungeons are full-size |

## How to read the offer

Write down the Prince, requested action, region, site, target, object, deadline and final contact. A kill request may pay through a librarian or another intermediary. Do not return to the original encounter merely because you have defeated someone underground.

Check **Quests** and **Time remains** after letters or demands. Read refusal prompts carefully: refusing can end an offer rather than postpone it. This page does not establish that a refused request returns. One Prince and one request can still contain several stages and competing outcomes.

## The shapes you will see

1. **Kill and report.** **Lady Azura's Quest** (`T0C00Y00`) requires the assigned dungeon target and then the librarian contact. The scripted reward is **Azura's Star**; unrelated kills do not meet the condition.
2. **Remote reward contact.** **Clavicus Vile's Quest** (`V0C00Y00`) separates the dungeon kill from a contact in a generated tavern. Record both destinations before travelling.
3. **Delivery or combat branch.** **Hermaeus Mora's Quest** (`W0C00Y00`) includes an injury-triggered offer involving a magic item and a changed target location. Read the prompt and current objective before continuing to attack or delivering anything.
4. **Moving target.** **Molag Bal's Quest** (`20C00Y00`) can move its mage to another dungeon after injury. Read the quest map to reveal the hideout. A missing opponent can indicate a new stage rather than a failed spawn.
5. **Counteroffer.** **Nocturnal's Quest** (`40C00Y00`) introduces alternative artifacts and a betrayal branch. That branch changes standing and later events. An attractive item is not evidence that the original request is complete.

## Quick path

1. Read the request and any refusal consequences before accepting.
2. Record the action, contacts, generated sites and deadline.
3. Prepare access tools and equipment suitable for the assigned target.
4. Enter the quest instance when offered; pause for injury-triggered choices.
5. Follow new letters or locations and reach the stated completion contact.

## What gets players stuck

1. Confirm the latest target location, building and instance before retracing a dungeon.
2. Inspect the 3D map, secret doors and unexplored rooms. Look for maps and quest objects among dressing and containers.
3. Keep assigned objects apart from sale loot. Check the clock before following a second destination.
4. Read branch and legal consequences before attacking a town contact. Ordinary failure protection does not make every choice harmless.
5. Report the ID, site and last entry if blocked. Online reload, artifact replacement and refusal recovery remain unverified.

## Rewards and standing

See [quest rewards](../quest-rewards.md) for special-reward exceptions and [loot rarity](../../gear/loot-rarity.md) for Artifact as a separate category. Using **Oghma Infinium**, Mora's reward, consumes the book and opens attribute advancement: treat that as a lasting character choice. Reversal is unverified. Ordinary online failure costs no faction standing; explicit branches can still change it.

## Sources

- `handbook/quests/quests.json`: category `daedric`, example IDs above.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/<id>.txt`: those IDs, task and artifact declarations only.
- Under that snapshot: `src/systems/quest/clock.js`, `quest.js`, `actions.js`, `offerFlow.js`, `_offerResponse`; `src/systems/instancePlaces.js`; `src/systems/artifactEffects.js`, `ARTIFACTS.OghmaInfinium` handler.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5; linked handbook context.
