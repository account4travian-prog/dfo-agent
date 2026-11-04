---
title: Vampire clan work
summary: Follow clan letters, resolve rivalries and protect clan interests without assuming every assignment requires a kill.
stage: reference
order: 68
gate: none
tags: [quest, pattern, vampires, clans, letters]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Check your vampire state and clan assignment before looking for work.
> - Read the letter to expose its contact or destination.
> - Keep proof and research until the intended recipient accepts them.
> - Stop at intimidation feedback; killing can spoil that outcome.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Giver | Vampire clan contact introduced by quest mail |
| Gate | Vampire/clan prerequisites; initiation differs from member work |
| Where | Generated contacts and dungeons; no fixed clan-job itinerary |
| Time | Letter and assignment clocks vary; online deadlines charge played time |
| Completion | Conversation, delivery, proof, escort, intimidation or kill |
| Instance | Choose **Your instance** when offered; private quest dungeons are full-size |

## How to read the offer

Open the letter, then record the clan contact, region, site, target, proof, reporting person and deadline. Several scripts add conversation topics or reveal a dungeon only after reading or meeting someone. Carrying unread mail is not the same as following its lead.

Check **Quests** and **Time remains**. Vampire letters belong to curse and clan systems; do not assume the separate [questline ladder](../questline-ladder.md) describes their arrival. [Lycanthropy and vampirism](../../hold/curses.md) explains the curse and changed guild access. A cure request is a different decision from clan service.

## The shapes you will see

1. **Initiation.** **The Rite of Acceptance** (`P0A01L00`) reveals a dungeon through its letter, requires a vampire kill and then a meeting with the clan contact. Do not treat the first letter as completed initiation.
2. **Letter delivery.** **The Vampire's Letter** (`P0B00L01`) moves from a clan contact to another recipient, then back for payment. Reading the introduction and delivering the assigned letter are separate steps.
3. **Rival removal.** **Territorial Battles** (`P0B00L03`) puts proof on a rival ancient vampire. Recover and return that proof. **An Old Enemy** (`P0B00L04`) instead requires the assigned vampire kill and a report.
4. **Protecting secrecy.** **Deadly Knowledge** (`P0B00L06`) involves research and an alternate Mages Guild interest. This is a Masquerade concern in practical terms: who receives dangerous knowledge matters. Read the competing offer before choosing your recipient.
5. **Intimidation.** **Intimidation** (`P0B10L07`) rewards injuring and sparing the designated knight. Killing the knight changes the outcome and costs clan favour.
6. **Chaperoning.** **The Chaperone** (`P0B10L10`) takes a clan member to another vampire contact with possible attackers along the way. Reach that contact; fighting attackers alone does not finish the escort.

## Quick path

1. Confirm the relevant vampire and clan prerequisites.
2. Read the letter and note the objective and clock.
3. Meet the named contact before following newly revealed sites.
4. Enter the quest instance when offered and perform the assigned action.
5. Preserve proof, read branch prompts and report to the final contact.

## What gets players stuck

1. Recheck unread letters, current objective, exact building and instance.
2. Search secret doors and unexplored rooms on the 3D map; inspect the proof carrier's inventory.
3. Keep quest proof separate from sale loot. Ordinary boots or research-like objects may not substitute.
4. Recheck tight clocks and injury feedback. Clan favour and [the law](../../town/the-law.md) are separate concerns.
5. Report the ID, site and last entry if blocked. Online reload and sold-item recovery remain unverified.

## Rewards and standing

[Quest rewards](../quest-rewards.md) explains eligible gear and payment. Some scripts award no object. Online ordinary failure protection does not cancel explicit expiry or branch penalties; the clan scripts contain both. No fixed site or universal reward applies.

## Sources

- `handbook/quests/quests.json`: category `vampires`, example IDs above.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/<id>.txt`: those IDs, task structure only.
- Under that snapshot: `src/systems/quest/clock.js`, `quest.js`, `actions.js`; `src/systems/instancePlaces.js`; curse context in the linked handbook page.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5.
