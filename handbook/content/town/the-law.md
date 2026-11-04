---
title: The law
summary: Crimes affect the region where they happen; understand how the watch responds, what court can impose, and how standing recovers.
stage: town
order: 70
gate: none
tags: [law, crime, watch, court, standing]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Legal standing is tracked separately by region, and a crime is charged where it happens.
> - The watch responds when a crime is witnessed or otherwise detected; leaving the area does not erase its standing loss.
> - If a guard catches you, surrender takes you to court. A guilty plea reduces a fine or prison term; a not-guilty plea uses Debate or Lie.
> - A temple can help repair standing. Banishment restricts entry to the region until its term ends or a pardon is obtained.

## What counts as a crime

The law tracks offenses such as [theft](thievery.md), breaking and entering, assault, murder, trespassing and vagrancy. The action and its detection rules vary: taking from a private container can be noticed when you close it, while attempting to force a locked door can attract attention. Some actions create a crime only if someone sees them. The game records legal standing for each region, so trouble in one region does not automatically become a charge everywhere.

## The watch

When a crime is witnessed, nearby townspeople or guards can raise the alarm. The watch pursues you in the town. A first minor offense may receive a warning in a region, but the crime still affects your standing. A known criminal can also be stopped by a wandering guard in the street and asked to answer the law.

If a guard lands a blow while you have an active crime, you can surrender or refuse. Refusing continues the chase. Surrender sets your health to 1 before court begins, so it is a way to end the pursuit, not a way to avoid the sentence.

## Court and recovery

At court, a guilty plea halves the fine and prison days for a fine-or-prison sentence. If you plead not guilty, choose Debate with Etiquette or Lie with Streetwise. The court makes a skill-based decision; an unsuccessful defense leaves the sentence in place. Banishment applies to particular serious crimes and bars you from that region for a period.

Paying or serving a sentence repairs much of the legal standing lost for the offense. Assault, Murder and treasonous offenses retain part of their mark. A temple's penance can restore standing, and negative standing also recovers over time. A regional temple can sell a pardon that lifts banishment early ([the NPC guilds](npc-guilds.md)).

> [!warning] Curfew
> A town seat's Curfew edict doubles the legal-standing cost of crimes and strengthens the night watch. Keep the edict in mind after dark; the edict belongs to a town's seat ([city control](../rivals/city-control.md)).

## Common mistakes

- **Running or dying to end a chase.** Getting away or dying ends the pursuit but does not repay the standing loss; answer the watch or court to repair it. Cost: a lasting legal mark in that region.
- **Pleading guilty without checking what sticks.** A guilty plea halves a fine or prison term, but Assault, Murder and treasonous offenses still keep part of their mark. Cost: standing you cannot get back cheaply.
- **Ignoring an active Curfew.** Under a Curfew edict crimes cost double legal standing and the night watch is stronger ([city control](../rivals/city-control.md)). Cost: double the standing loss for a mistake after dark.

## Next

- [Notice boards](notice-boards.md)
- [Time and weather](time-and-weather.md)

- [Standing and reputation](standing-and-reputation.md)
## Sources

- `src/systems/crimes.js`: `CRIMES`
- `src/systems/court.js`: `legalRepOf`, `lowerRepForCrime`, `startCourt`, `pleaGuilty`, `pleaNotGuilty`, `normalizeReputations`
- `src/systems/standing.js`: `WARNABLE_CRIMES`, `knownCriminal`, `BANISHMENT_MINUTES`
- `src/scenes/arrestFlow.js`: `onGuardHit`, `startCourtFlow`
- `src/net/townSeatLaw.js`: `CURFEW`
- `src/systems/guild/guildServiceActions.js`: temple penance and pardon services
- Research: `handbook/research/T3.md` (law and crime)
