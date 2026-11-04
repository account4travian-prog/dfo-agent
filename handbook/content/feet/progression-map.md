---
title: The progression map
summary: How character level, Renown, Firmament stars, gear, professions and companions depend on each other.
stage: feet
order: 17
gate: none
status: draft
tags: [progression, level, renown, firmament, gear, professions, companions]
verified: e4f093166
---

> [!tip] At a glance
> - Two ladders run at once: **character level** from your skills, and **Renown** (1 to {{fact renown.max}}) from online activity.
> - Character level opens questlines and gives a fixed pool of attribute points; Renown supplies {{fact firmament.starsPerRenown}} Firmament stars per level after the first.
> - Renown opens elite foes at Renown 5 and revenants at {{fact revenant.minRenown}}.
> - Gear and the Firmament must keep up with the threat, which grows after character level 10 and Renown 15.
> - Only two crafts may pass Journeyman, and masteries are permanent: those are the long-term commitments.

## The six tracks

DFO Online does not have one experience bar. Six tracks advance in parallel, and each pays into the others.

| Track | What raises it | What it gives | Gate or limit |
|---|---|---|---|
| **Character level** | Uses of your class skills; the game checks about every six game hours | Health and attribute points; opens questlines | Questline steps open at set levels |
| **Renown** | Kills, quests, parties, raids, gates, writs and other witnessed acts | Health and spell points, Firmament stars, and system unlocks | {{fact renown.max}} levels; {{fact renown.hourlyXpCap}} XP per account-hour |
| **Firmament** | Renown pays Stars; profession ranks pay Craft points | Passive bonuses along one path, capped by channel | Refunds; whole-sky respec |
| **Gear** | Loot, crafting, quest reward cards and reforging | Damage, armour, techniques and affixes | Loot rarity; tier and material rules |
| **Professions** | Gathering and crafting work | Materials, goods, writ pay, Craft points | Two crafts above rank 50 |
| **Companions** | Spare a defeated revenant, then loyalty and levels | A second fighter with its own sky | Revenants begin at Renown {{fact revenant.minRenown}} |

The level-up numbers behind each row are explained on [Levelling online](levelling-online.md) and [Renown](renown.md).

## How the tracks feed each other

- **Character level → questlines.** Every introduction line opens at a character level (2, 3, 4, 5, and so on), so the fastest way to meet a system is to level normally. See [The questline ladder](../reference/questline-ladder.md).
- **Renown → stars and unlocks.** Each Renown level after the first pays {{fact firmament.starsPerRenown}} Stars. Renown 5 opens your own-world elites, Renown 10 opens revenants and companions, and Renown 10 is also the founding requirement for a player guild. See [Renown](renown.md) and [Elites and champions](../bay/elites-and-champions.md).
- **Professions → stars.** Craft points come from the sum of your profession ranks: one Craft point per eight ranks, capped per track. Craft points buy life-ring stars only; they never buy combat stars. See [The Firmament](the-firmament.md).
- **Renown and level → threat.** Foes gain health and damage from character level 11 upward, then from Renown 16 upward, compounding. That is why a fast level on weak gear makes the game harder, not easier. See [The hero's threat](heros-threat.md).
- **Companions → Renown.** Companions are a Renown 10 system; their own sky and loyalty are separate from yours. See [Companions](../rivals/companions.md).

## What to do first

The order that wastes the least is:

1. **Keep your class skills in use.** Character level is the key to the introduction lines, and each level gives a fixed attribute pool online (see [Levelling online](levelling-online.md)).
2. **Pick one or two crafts you will actually use.** A combat character usually wants a repair craft and a supply craft; a caster or hybrid may want Enchanting. Do not spread ranks across three crafts you intend to pass 50 — two is the permanent limit.
3. **Earn Renown through capped activities.** Events and quests pay Renown at a rate; quests also open the systems. The hourly cap is per account, so short sessions and long sessions converge.
4. **Spend stars on the offence you already use.** A damage channel is capped, so a tree that feeds one weapon family, one spell school or fists goes further than a scattered one. Fill the offence then the defence budgets.
5. **Replace gear instead of protecting it.** The threat grows; a found or quested piece at your tier is worth more than a repaired old one.
6. **At Renown 10, start the companion track** only after you have a reliable fight and a bank buffer.

## The permanent decisions

Some choices are cheap to change and some are not.

- **Firmament:** refunds are free below Renown {{fact firmament.refundFreeBelowRenown}}; after that they cost {{fact firmament.refundCostPerStar}} Marks a star, and the whole-sky respec costs {{fact firmament.respecGold}} gold.
- **Crafts:** only {{fact crafts.aboveJourneyman}} crafts may rise above Journeyman (rank {{fact crafts.journeymanRank}}). A third is held at rank 50.
- **Masteries:** chosen when a skill reaches 100, and a mastery can never be undone. You have two primary, two major and one minor slot.
- **Creation:** race, class, biography and a custom class's restrictions have no general undo; race and class are not editable later. See [Choices that are hard to undo](../creation/hard-to-undo.md).

## Common mistakes

- **Rushing level on weak gear.** Threat grows with level, so the character who levels fastest without gear or stars meets the hardest version of every fight.
- **Treating Renown as a second experience bar.** It is a separate ladder with its own cap and its own rewards; character level does not raise it directly.
- **Spending craft ranks on three crafts.** The service holds the third at rank 50; the earlier two are the pair you keep.
- **Choosing a mastery before planning the slots.** Masteries are permanent, and a build that needs two primary masteries should not spend a primary slot elsewhere.
- **Ignoring the Firmament's group caps.** A second star in a full channel adds nothing; check the shared cap before buying deeper.

## Next

- [Levelling online](levelling-online.md)
- [Renown](renown.md)

## Sources

- `src/net/renown.js`: `RENOWN_MAX`, `RENOWN_XP_HOUR_MAX`, `RENOWN_PARTY_BONUS_PCT`
- `src/net/firmament/firmamentLaw.js`: `STARS_PER_RENOWN`, `starsFor`, `CRAFT_RANKS_PER_POINT`, `REFUND_FREE_BELOW_RENOWN`, `REFUND_SILVER_PER_STAR`, `FIRM_RESPEC_GOLD`
- `src/net/professionLaw.js`: `PROF_RANK_MAX`, `xpForRank`, `CRAFTS_ABOVE_JOURNEYMAN`, `JOURNEYMAN_RANK`
- `src/systems/heroThreat.js`: `HERO_THREAT`, `stepsOf`, `heroThreatOf`
- `src/systems/eliteFoes.js`: `ELITE_FOE_MIN_LEVEL`, `ELITE_FOE_MIN_RENOWN`; `src/systems/revenant/revenant.js`: `REVENANT_MIN_RENOWN`
- `src/systems/levelEven.js`: `ONLINE_BONUS_POOL`, `evenHpFloor`
- `src/systems/masterSkills.js`: mastery slots and permanence; `src/net/guild/guildLaw.js`: `GUILD_FOUND_RENOWN`
- `src/systems/questlines/qlLines.js`: introduction level gates
- Design records: `docs/23-playing-online.md` "How power works online"; `docs/29-build-systems.md`
- Research: `handbook/research/P2.md`, `handbook/research/C3.md`
