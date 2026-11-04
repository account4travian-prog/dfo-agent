---
title: Coven work
summary: Carry coven ingredients, escort people and follow remote contacts while separating recovery jobs from dangerous deliveries.
stage: reference
order: 67
gate: none
tags: [quest, pattern, covens, ingredients, escorts]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Record the coven, remote sites, requested objects and return contact.
> - Bring back the assigned ingredients, not ordinary substitutes.
> - Read delivery and rescue instructions before attacking.
> - Treat a cure effect as a specific branch, not a promise from every witch.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Giver | Coven questor |
| Gate | Offer-specific eligibility; no universal cure entitlement |
| Where | Generated remote buildings, contacts and dungeons |
| Time | Offer-specific deadline; online deadlines charge played time |
| Completion | Return ingredients, deliver an object, escort someone or defeat a designated foe |
| Instance | **Your instance** when offered; private quest dungeons are full-size |

## How to read the offer

Record region, destination, object, recipient, deadline and return coven. Remote sites make the return journey part of your preparation. Check **Quests** and **Time remains** before setting out again. Keep letters and supplied items until the task confirms completion.

An accusation, feud or supernatural problem does not establish the required action. Check whether you must recover evidence, remove an enemy or deliver something. The checked coven examples do not establish a general exorcism procedure or a separate coven-feud ladder. Follow the actual offer rather than importing the steps from [temple errands](temple-errands.md).

## The shapes you will see

1. **Ingredient circuit.** **A Great Errand** (`Q0C10Y00`) places different ingredients in separate dungeons. Return with each assigned object and confirm each hand-in; clearing one dungeon does not finish the circuit.
2. **Combat ingredient.** **The Daedra's Heart** (`Q0C4XY04`) gives a heart to a quest foe through an injury trigger. Inspect the defeated carrier and return the heart. Generic monster loot is not the assignment.
3. **Escort and rescue.** **Public Relation** (`Q0C00Y03`) escorts a child to a remote house before reporting back. **The Imprisoned Witch** (`Q0C00Y07`) requires the supplied clothing when contacting the captive.
4. **Dangerous delivery.** **A Treacherous Gift** (`Q0C0XY02`) changes the recipient into an enemy. Killing that enemy changes the return outcome. Read feedback before treating the transformation as an instruction to kill.
5. **Recovery or removal.** **The Libel** (`Q0C00Y01`) requires a document from a remote temple; **Problems with Vampires** (`Q0C00Y06`) requires the designated dungeon kill. These objectives need different completion checks.
6. **Special mixture.** **A Special Mixture** (`Q0C00Y04`) supplies a quest potion for a mage. Using it invokes cure actions and changes the delivery outcome; it is not ordinary sale stock.

## Quick path

1. Identify the action and record all remote destinations.
2. Retain supplied objects and prepare access tools and healing.
3. Travel to the named contact or quest instance.
4. Complete each ingredient, escort, delivery or combat step.
5. Read updates, return to the correct coven and confirm completion.

## What gets players stuck

1. Confirm the remote building and instance before searching nearby sites.
2. Check secret doors and unexplored rooms on the 3D map; inspect dressing and carriers for ingredients.
3. Separate quest objects from loot. Recheck the clock before another dungeon or return journey.
4. Read prompts before killing or consuming anything. Coven work can have standing, disease or legal consequences.
5. Report the ID, site and last entry if blocked. Online reload and replacement-item recovery are unverified.

## Rewards and standing

See [quest rewards](../quest-rewards.md) for eligible gear and variable payment, and [cures](cures.md) for curse routes. Ordinary online failure protection does not erase explicit scripted consequences. **The Covens' Hoard** is a separate [questline](../questline-ladder.md).

## Sources

- `handbook/quests/quests.json`: category `covens`, example IDs above.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/<id>.txt`: those IDs, task structure only.
- Under that snapshot: `src/systems/quest/clock.js`, `quest.js`, `actions.js`; `src/systems/instancePlaces.js`.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5; linked handbook context.
