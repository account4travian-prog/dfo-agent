---
title: Renown
summary: "Online's own ladder from 1 to 50: what earns it, its caps, and what it unlocks."
stage: feet
order: 20
gate: none
tags: [renown, experience, online progression]
verified: 0df2d87eb
status: draft
---

> [!tip] At a glance
> - Renown is a separate, online-only level kept for each character by the account service.
> - Earn Renown XP from eligible kills, quests, parties and several shared activities.
> - Every source pays 75% of its full-rate amount; an account can receive at most {{fact renown.hourlyXpCap}} XP per real hour.
> - Renown adds online Health and Spell Points and opens systems at set thresholds.

## A second level

Renown runs from level 1 to {{fact renown.max}}. It does not replace character level: your Daggerfall skills still
determine character-level progress, while Renown tracks online progression. The account service keeps one Renown
track per character and supplies the authoritative level. Offline play does not earn or apply Renown.

## What earns Renown

You earn XP when you defeat eligible foes or finish quests. Your foe or quest level is read no more than three levels
above your current Renown, so high-level content cannot skip the early curve. The kill reward is shared with players
who struck the foe recently. A party adds a bonus per eligible member present; each player earns XP rather than
sharing a single pool.

The service also credits certain witnessed activities: defending a town raid, defeating the Sea Serpent, winning Arena
bouts, holding Starfall stars, and filling court writs. These awards follow their own event rules and are subject to
the same account-wide hourly cap.

> [!online] XP rate and cap
> Each source pays 75% of its full-rate XP, rounded down. One account can receive no more than
> {{fact renown.hourlyXpCap}} XP in a real clock hour across its characters. A second character does not provide a
> second allowance. The service does not keep XP above that cap for later.

## What Renown changes

Each Renown level after the first adds 3 maximum Health and 2 maximum Spell Points while you play online. The bonus
adjusts with the level and disappears offline; the underlying character save remains separate.

Renown also opens later systems. Your own-world elite spawns begin at Renown 5. Revenants are held until Renown 10.
The [Firmament](the-firmament.md) grants stars as your Renown rises, and other later systems have their own gates.

## Common mistakes

- **Counting the hourly cap per character.** It belongs to the account and is shared across its characters.
- **Assuming the cap stores overflow.** XP beyond the limit in that clock hour is not banked.
- **Reading Renown as character level.** The two tracks advance for different reasons.

## Next

- [The Firmament](the-firmament.md)
- [The hero's threat](heros-threat.md)

- [The progression map](progression-map.md)
## Sources

- `src/systems/online/onlineLane.js`: online mod policy; neither Renown nor the Firmament is a vendored mod override
- `src/net/renown.js`: `RENOWN_MAX`, `renownRate`, `renownCeiling`, `renownKillXp`, `renownQuestXp`,
  `renownPartyXp`, `RENOWN_XP_HOUR_MAX`, `renownBonus`
- `src/net/renownTracker.js`: `RENOWN_ASSIST_MS`, `neverPays`
- `server-account/src/renownTracks.js`: `reportRenownXp`
- `src/systems/eliteFoes.js`: `ELITE_FOE_MIN_RENOWN`, `eliteRenownOpen`
- `src/systems/revenant/revenant.js`: `REVENANT_MIN_RENOWN`, `revenantHeld`
- Research note: `handbook/research/P2.md`; online-lane check: `handbook/research/M.md`
