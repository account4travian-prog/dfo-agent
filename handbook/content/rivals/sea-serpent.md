---
title: The sea serpent
summary: Sethrakul and The Old Coil.
stage: rivals
order: 10
gate: level 8
status: draft
tags: [sea serpent, Sethrakul, events, questlines]
verified: 0df2d87eb
---

> [!tip] At a glance
> - **The Old Coil** introduces the sea-serpent story at character level 8 for a registered account.
> - The serpent event runs on a shared two-day cycle, with separate omen, rise, seal and sound phases.
> - Travel to the event site during the active window shown by the game.
> - One account receipt is available per serpent; reward limits and event timing are separate.

## Follow the event

The sea serpent, Sethrakul, appears under a shared event law rather than a private quest clock. Its cycle uses a 1,440-minute game day and alternates across two days. The omen comes at hour 2, the serpent rises at hour 5, the storm begins at hour 8 and the sound phase closes the event at hour 10.

The active engagement window begins at the rise and ends when the serpent dives after the sound phase. The storm does not close the waters: ships can still join during the late phase. The omen and the client's sighting/countdown text are the practical cues to use. Check those cues before travelling; the site does not remain open throughout the whole cycle.

## Begin with The Old Coil

At level 8, a registered online account can receive **The Old Coil**. It introduces the serpent through a three-step questline. Follow the current letter and quest instructions; the event may not be at the needed phase when you first receive a step.

The account service permits one serpent receipt per account for a given appearance. The source does not make that receipt a promise of a fixed item or Marks amount in this page, so check the result in the account ledger after the event.

> [!online] Online rule
> The serpent's phase is shared. Its service receipt is account-scoped, and the event is not an offline Daggerfall Unity encounter.

## Common mistakes

- **Travelling at the omen and expecting the fight to be available immediately.** The omen precedes the rise.
- **Waiting for the site after the sound.** The active window ends with the sound phase.
- **Confusing the quest with the clock.** A quest step can wait for the event even when the quest itself is active.

## Next

- [Festivals and Starfall](../bay/festivals-and-starfall.md)
- [Revenants](revenants.md)

## Sources

- `src/net/serpent/serpentLaw.js`: `SERPENT_DAY_MINUTES`, cycle schedule, `serpentAdmits`, `serpentHolds`
- `src/net/serpent/serpentBrain.js`: joining the fight during the late phase
- `src/systems/serpent/serpentOmen.js`: `sightingLine`, `serpentCountdownWords`
- `src/systems/questlines/qlLines.js`: `oldCoil` and level/account gate
- `server-account/src/marks.js`: `claimSerpent`
- Research: `handbook/research/W1.md`, `handbook/research/Q1.md`, `handbook/research/X1.md`
