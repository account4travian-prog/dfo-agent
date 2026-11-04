---
title: Festivals and Starfall
summary: Seasonal events, Soul Cakes and falling stars.
stage: bay
order: 50
gate: registered
status: draft
tags: [festivals, starfall, soul cakes, seasonal events]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Festival dates come from the event calendar and can change. Check the current season in the game.
> - The Witches' Festival enables Soul Cake finds and the related Starfall night.
> - Starfall uses an omen, a brief gather window and three falling stars per night.
> - Account-side find and reward limits apply; do not mistake an event window for a daily personal allowance.

## Seasonal events

The festival calendar determines which seasonal activity is available. The Witches' Festival is the festival tied to Soul Cakes and Starfall. Its questline, **The Thirteenth of Frostfall**, opens at character level 6 for a registered account while the festival is staged. The event's configuration supplies the current dates, so an older date list is not a reliable standing schedule.

Soul Cakes are event finds. The account service enforces a daily ceiling of 120 cakes and a separate ceiling of 1,500 find requests. Night finds are worth more under the festival law. Those are account limits, not promises that every search will find a cake.

## Follow a Starfall

Starfall's omen tells you a fall is approaching. There are three stars in a Starfall night. A fall has a short gather period, so watch the event indication and act promptly rather than relying on a remembered location or a fixed local hour. The heart star is tied to the Witches' Festival calendar.

1. Check that the festival and Starfall are active.
2. Read the omen and follow the live event indication.
3. Gather during the marked window.
4. Check the account receipt and your daily Starfall claims afterward.

Starfall claims are limited to nine stars per account per UTC day, and Starfall rewards share the daily combat Marks ceiling with other combat events. For event timing across the wider world, see [World events and their clock](world-events.md).

> [!online] Online rule
> Festival dates, finds and Starfall claims are controlled by DFO's event and account-service laws. The event's configured calendar and the account receipt are authoritative.

## Common mistakes

- **Using last year's dates.** The event calendar is configuration data, not a permanent date rule.
- **Confusing attempts with rewards.** The find-request limit and Soul Cake cap count different things.
- **Expecting Starfall to stay open.** Each star has a short gather window; follow its omen and live phase.

## Next

- [World events and their clock](world-events.md)
- [The sea serpent](../rivals/sea-serpent.md)

## Sources

- `src/net/festivalLaw.js`: festival dates, find limits and Soul Cake law
- `src/net/starfall/starfallLaw.js`: fall count, omen, gather window and claims
- `src/systems/starfall/starfallNight.js`: `starfallNight`, heart-star relation to festival calendar
- `src/systems/questlines/qlLines.js`: `thirteenthFrostfall` gate
- `server-account/src/stars.js`: account Starfall claim ceiling
- Research: `handbook/research/W1.md`, `handbook/research/Q1.md`, `handbook/research/X1.md`
