---
title: Curse cure quests
summary: Follow hunter letters and distinguish confirmed vampire and werebeast cure actions from leads, delays and choices that keep the curse.
stage: reference
order: 70
gate: none
tags: [quest, cures, vampirism, lycanthropy, choices]
verified: e4f093166
status: draft
---

Checked against `e4f093166`. This page describes DFO Online.

> [!tip] At a glance
> - Establish whether you have an infection or a completed curse.
> - Read the hunter letter and record each newly named contact.
> - Treat a revealed coven or map as a lead, not confirmation of a cure.
> - Read irreversible choices before attacking or transferring the curse.

## What every version shares

| Field | Shared shape and variations |
|---|---|
| Entry | Curse-related hunter letter; vampire and werebeast scripts differ |
| Prerequisite | Relevant completed curse; ordinary infection treatment is separate |
| Where | Generated contacts and dungeons; a werebeast branch reveals a named coven |
| Time | Several clocks and contact windows; online deadlines charge played time |
| Outcome | Explicit cure action, retained curse or further information |
| Instance | Choose **Your instance** when offered for the assigned destination |

## How to read the offer

Read the letter, then record region, contact, destination, token or vial, deadline and the choice you are being asked to make. Check **Quests** and **Time remains** after each conversation. A contact can disappear when a window closes; do not assume every wait is a deadline or every clock starts together.

[Lycanthropy and vampirism](../../hold/curses.md) distinguishes infection treatment from completed-curse removal. A disease-stage remedy is not evidence that an established curse will disappear. These letters are separate from the introductions in the [questline ladder](../questline-ladder.md); no immediate letter arrival is promised.

## The shapes you will see

The cure category contains two scripts. These are branches within them, not additional quests.

1. **Vampire bloodline investigation.** **Cure for Vampirism** (`$CUREVAM`) introduces vampire contacts and a token. Follow the Keeper of the Bloodline lead to distinguish the actual bloodfather from another ancient vampire.
2. **Vampire cure or loyalty.** In `$CUREVAM`, killing the bloodfather invokes the cure. Another choice lets you stay loyal and keep vampirism. Killing the other ancient vampire changes standing without invoking the cure.
3. **Werebeast bloodline route.** **Cure for Lycanthropy** (`$CUREWER`) leads through a priest, an alchemist's vial and the last descendant. Confirming the transfer invokes the cure and legal consequences. Read this choice before giving the vial to the child; it affects another person.
4. **Werebeast research route.** `$CUREWER` also offers dungeon documents leading toward **Glenmoril Coven**. Reading the documents reveals further locations. Those reveal tasks do not themselves invoke a cure. Follow the resulting offer; do not assume arriving at the coven completes treatment.

## Quick path

1. Confirm your current infection or curse state.
2. Read the relevant letter and record the contacts and windows.
3. Follow conversations before searching newly revealed destinations.
4. Retain tokens, documents and vials for their specific interactions.
5. Read the final choice, then check the resulting curse state and journal.

## What gets players stuck

1. Recheck prerequisites, unread mail, latest contact and exact building. A cure quest is not ordinary clan work.
2. Confirm the quest instance. Search the 3D map, secret doors and dressing for documents; generic loot is not a substitute.
3. Check contact windows and the clock before another trip. Hunters and disappearing contacts can be scripted events.
4. Confirm identity before killing. Neither a dead ancient vampire nor a revealed coven proves a cure occurred.
5. Report the ID, site and last entry if blocked. Online reload, replacement tokens and reversal of completed choices are unverified.

## Rewards and standing

The practical outcome is your curse state. [Quest rewards](../quest-rewards.md) explains ordinary payment separately. Online failure protection does not erase scripted standing or legal changes, and the sources establish no universal potion, shrine interaction or guaranteed kinder route.

## Sources

- `handbook/quests/quests.json`: category `cures`, `$CUREVAM`, `$CUREWER`.
- `upstream/snapshot-e4f093166/vendor/dfu-quests/Quests/$CUREVAM.txt`, `$CUREWER.txt`: task structure and cure actions.
- Under that snapshot: `src/systems/quest/clock.js`, `quest.js`, `actions.js`; curse prerequisites and arrival context documented in `handbook/content/hold/curses.md`.
- `docs/23-playing-online.md`; `docs/research/quest-research.md`, sections 3 and 5.
