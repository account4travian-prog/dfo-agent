---
title: Revenants
summary: "Remembered rivals: the Unquiet mark, ranks, escapes, lairs and judgement."
stage: rivals
order: 20
gate: renown 10
status: draft
tags: [revenants, rivals, renown, companions]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Revenants are remembered enemies, not a standard enemy respawn. A marked foe must survive a consequential fight.
> - Your revenant encounters begin at Renown 10; eligible foes must also meet the character-level floor.
> - A returning rival can gain rank and adapt to your past encounters. Rank is separate from companion level.
> - After defeating your own revenant, activate its remains and choose **Kill** or **Spare**.

## How an enemy becomes a rival

Some eligible elites and champions receive the Unquiet mark. The mark alone is not enough: the foe must survive a fight recorded as consequential before it can become a revenant. Ordinary enemies do not become rivals simply because you defeat them.

Online creation of your revenants waits for Renown {{fact revenant.minRenown}}, and the foe must be at least character level 3. At most three ordinary revenants can be hunting you at once. Dread has separate rules and is not included in that count.

## A rival returns

A revenant can flee when badly hurt, then return later through the shared encounter system. Standard return timing and the encounter chance use your character clock and the revenant's recorded state. The rival can gain ranks from recorded deeds, up to rank V. It may also adapt to your habits. These hunt rules describe a hostile revenant; they do not describe a companion after you spare it.

The source defines the return path, but a guaranteed encounter date is not promised: the return becoming due and the later encounter roll are separate steps. Watch the relevant event or journal information instead of treating the first return window as a fixed appointment.

## Judge the defeated revenant

When your own revenant falls, its remains can be activated for a judgement. Choose **Kill** to end the rivalry or **Spare** to attempt recruitment. A successful Spare records a sworn revenant in your retinue, subject to the retinue and active-slot rules on [Companions](companions.md).

> [!online] Online rule
> Revenant creation and return are online systems. The online lane enables their required enemy/loot systems; offline save behavior is not the authority for a shared rival encounter.

## Common mistakes

- **Assuming every elite is a revenant.** Only some receive the mark, and a consequential fight is needed.
- **Treating the return window as a guaranteed spawn.** The due time and encounter roll are distinct.
- **Using a companion's level to infer a rival's rank.** They are separate progressions.

## Next

- [Companions](companions.md)
- [The sea serpent](sea-serpent.md)

## Sources

- `src/systems/revenant/unquietMark.js`: Unquiet mark eligibility and roll
- `src/systems/revenant/revenant.js`: Renown/foe gates, consequential deeds, return and rank law
- `src/systems/revenant/revenantFate.js`: defeated-rival judgement
- `src/systems/online/onlineLane.js`: live online enemy/loot policy
- Research: `handbook/research/R1.md`; online precedence: `handbook/research/M.md`
