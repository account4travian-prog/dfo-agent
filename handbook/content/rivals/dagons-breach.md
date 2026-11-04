---
title: "Dagon's Breach"
summary: The Breach world boss, its portents and the Warden, introduced by The Burning Doors.
stage: rivals
order: 40
gate: level 10
status: draft
tags: [Dagon's Breach, world event, portents, questlines]
verified: 0df2d87eb
---

> [!tip] At a glance
> - **The Burning Doors** introduces Dagon's Breach at character level 10 for a registered account.
> - The shared event runs each two-real-hour game day, with an omen at 17:00 and an entry window from 20:00 to 22:00 on the event clock (two real hours per game day, so the window lasts about ten real minutes; this is not the sky clock you see).
> - A portent changes what happens at the Breach. Check the active omen and current event instructions.
> - The Warden and Breach phases are shared event rules; the questline advances through its witnessed steps.

## Read the Breach's phases

Dagon's Breach uses a 1,440-minute shared game day. The omen begins at 17:00, the gate rises at 19:00, entry opens at 20:00, and the gate seals at 22:00. Wrath follows at the end of the game day. These are game-clock times, not UTC schedule labels.

The event draws one of three portents: **The Vanguard**, **The Sundering** or **The Captive**. A **Dire Breach** can combine Vanguard and Sundering. Read the current event display to learn which portent is active and what the game expects you to do; do not assume the same encounter is present every time.

## Begin The Burning Doors

At character level 10, a registered account can begin **The Burning Doors**. Its five steps introduce the Breach story. Some steps wait for a witnessed event action, so progress is tied to the server's record rather than simply entering the quest location. The line leads to later content through **The Covens' Hoard** and **The Weir Road**; those later systems are covered in [Elite Gates](../late/elite-gates.md).

An account can claim a gate receipt once for each gate. Combat Marks earned from the event share the daily combat Marks ceiling with other combat events. Check your receipt and Marks ledger after the event.

> [!online] Online rule
> The Breach schedule, gate phases and reward receipts are DFO Online port/account systems. The game day drives the event; the account service records claims.

## Common mistakes

- **Arriving during the omen.** The gate does not open until 20:00 on the event clock.
- **Using UTC to read the event phase.** UTC is used for account-day limits; this gate follows the event clock, not UTC or the sky clock.
- **Expecting every visit to use the same portent.** Read the live event information.

## Next

- [World events and their clock](../bay/world-events.md)
- [Elite Gates](../late/elite-gates.md)

## Sources

- `src/net/gate/gateLaw.js`: game-day phases, entry window and claim law
- `src/net/gate/gateMods.js`: `The Vanguard`, `The Sundering`, `The Captive`, `The Dire Breach`
- `src/systems/questlines/qlLines.js`: `burningDoors`, **The Burning Doors** gate and steps
- `src/net/questlineClaims.js`: witnessed Breach questline steps
- `src/net/marksLaw.js`, `server-account/src/marks.js`: shared combat Marks and gate receipts
- Research: `handbook/research/W1.md`, `handbook/research/Q1.md`, `handbook/research/X1.md`
