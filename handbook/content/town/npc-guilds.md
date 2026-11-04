---
title: The NPC guilds
summary: Join a guild, temple or knightly order through its own requirements, then earn rank to unlock services and training.
stage: town
order: 60
gate: none
tags: [guilds, temples, orders, ranks, training]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - Most guilds let you apply at their hall when your faction reputation and relevant skills meet the entry requirements.
> - Rank depends on both standing and permanent skill values; temporary skill boosts do not count.
> - Online, earned promotions are granted immediately when you open the guild services. Other rank reviews still follow their review rules.
> - Guilds and temples train skills only up to 50. Members pay 100 × character level a session; temples also train non-members at 400 × level; knightly orders train nothing.
> - A session takes three game hours and raises one skill, and your character can train again after 12 game hours.

## Joining

Ask at the hall of a Fighters Guild, Mages Guild, temple or knightly order to check whether you qualify. The ordinary application requires non-negative standing with the faction, one guild skill of at least 22 and a second guild skill of at least 4. Each temple shares a membership slot with the other temples, and all knightly orders share another; joining a different one replaces that membership.

The Thieves Guild and Dark Brotherhood are different. You cannot apply at their halls. Their membership begins with an invitation quest that follows the relevant crime tally, and you join only after completing that quest successfully. The online letter wait is shorter than the classic three-day delay.

## Rank and services

Ranks run from 0 to 9 under the guild's rank table. Higher rank needs higher faction reputation and skill values, and the required skills are read at their permanent values. In ordinary online play your own guild rank stops at 7; ranks 8 and 9 are chapter seats. Online, when you have earned a promotion, opening the services applies it at once; the usual 28-day review delay is not used for earned promotions. Demotion and probation still use review timing.

Services vary by organization. A temple can offer healing, a library or other services at its own rank thresholds. The Mages Guild adds services such as magic items, summoning and teleport at higher ranks. Its rank-8 teleport requires a chapter seat online. Check the hall's service list to see what your membership currently unlocks.

## Training

Guilds and temples train skills, but only to a cap of 50. A trainer refuses a skill whose permanent value is already above 50; a skill sitting exactly on 50 is still offered. Each session trains one skill, takes **three game hours**, and costs fatigue, so a session is a real commitment of your character's day.

The base price is the same formula everywhere: **100 × your character level** as a member, or **400 × your character level** as a non-member. At level 10 that is 1,000 gold a session as a member and 4,000 as a stranger, before any Refined Training reduction. Guild halls train members only; temples are the places that also train non-members. A character can train once every **12 game hours**, whichever skill and whichever trainer the session uses.

| Organization | Skills offered for training |
|---|---|
| [Fighters Guild](fighters-guild.md) | Archery, Axe, Blunt Weapon, Critical Strike, Giantish, Hand-to-Hand, Jumping, Long Blade, Orcish, Running, Short Blade, Swimming |
| [Mages Guild](mages-guild-services.md) | Alteration, Daedric, Destruction, Dragonish, Harpy, Illusion, Impish, Mysticism, Orcish, Restoration, Spriggan, Thaumaturgy |
| [Thieves Guild](thieves-guild.md) | Backstabbing, Blunt Weapon, Climbing, Dodging, Jumping, Lockpicking, Pickpocket, Short Blade, Stealth, Streetwise, Swimming |
| [Dark Brotherhood](dark-brotherhood.md) | Archery, Backstabbing, Climbing, Critical Strike, Daedric, Destruction, Dodging, Running, Short Blade, Stealth, Streetwise, Swimming |
| [Temples](temples.md) | Each divine trains its own list; for example Akatosh's includes Alteration, Archery, Destruction and Long Blade, and Arkay's includes Axe, Restoration and Medical |
| [Knightly orders](knightly-orders.md) | None; an order offers no training at all |

Roleplay & Realism's **Refined Training** service is in force online. It lowers a session's price most at low skill: the reduction is half the base price times the skill's remaining share of 50. A raw skill therefore trains for about half price, and a skill near 50 pays almost the full base. The variant also offers a five-day **intensive** course that costs `(session price + level × 8 + 72) × 5` and adds four permanent skill points after four days. It is offered only below skill 46 and is forced off online, because the shared world clock will not spend the four days it asks for.

## Services at a glance

| Organization | Main services |
|---|---|
| [Fighters Guild](fighters-guild.md) | Training, repair, quests, identify, donations and cure disease |
| [Mages Guild](mages-guild-services.md) | Training, quests, identify, spells (buying is public), spellmaking, magic items, soul gems, Daedra summoning and teleport at rank 8 |
| [Thieves Guild](thieves-guild.md) | Training, quests, selling magic items at rank 2 and the spymaster at rank 4 |
| [Dark Brotherhood](dark-brotherhood.md) | Training, quests, potions at rank 1, potion making at rank 3, soul gems at rank 5 and the spymaster at rank 7 |
| [Temples](temples.md) | Training open to anyone, quests, donations and cure disease, plus potions, spells, magic items, summoning and soul gems at the divine's own ranks |
| [Knightly orders](knightly-orders.md) | Quests, an armour gift by personal rank and a house at rank 9 |

The Mages Guild's ranks, spell shelf and summoning rules are detailed on [Mages Guild services](mages-guild-services.md).

> [!tip] Rank is not a single skill
> A high value in one skill is not enough by itself. Keep the standing requirement and the second qualifying guild skill in view as you work toward the next rank.

## Common mistakes

- **Expecting a knightly order to train you.** Orders offer no training; their gifts come from rank instead.
- **Paying for a session above 50.** A skill already past 50 is refused outright.
- **Training twice in a day.** The 12-game-hour cooldown applies per character across all trainers and skills.
- **Assuming a guild hall will serve a stranger.** Guild services need membership; temples are the exception for training.

## Next

- [The law](the-law.md)
- [Mages Guild teleport](../travel/mages-guild-teleport.md)

## Sources

- `src/systems/guild/guilds.js`: `isEligibleToJoin`, `calculateNewRank`, `updateRank`, `guildInitiationQuestEnded`, `MEMBER_TRAINING_COST`, `NON_MEMBER_TRAINING_COST`, `DEFAULT_TRAINING_MAX`
- `src/systems/guild/guildFactions.js`: `RANK_REQ_REPUTATION`, `membershipKey`
- `src/systems/guild/guildVariants.js`: temple and knightly-order membership groups
- `src/systems/guild/guildServices.js`: `TRAINING_SKILLS`, `TEMPLE_TRAINING_SKILLS`, `trainingSkills`, `trainingMax`, `trainingPrice`, `canAccessService` and the subclass service switches
- `src/systems/guild/guildServiceActions.js`: `TRAINING_COOLDOWN_MINUTES`, `TRAINING_HOURS`, `TRAINING_FATIGUE_LOSS`, `trainingTooSoon`, `tooSkilledToTrain`, `trainSkill`, `trainingOffer`
- `src/systems/roleplayRealism/rrRealism.js`: `rrTrainingCost`, `rrIntensiveCost`, `rrIntensiveOffered`, `RR_INTENSIVE_DAYS`, `RR_INTENSIVE_SKILL_POINTS`
- `src/systems/online/onlineLane.js`: `RefinedTraining.intensiveTraining` forced off online
- `src/systems/modSettings.js`: `RefinedTraining.*` defaults
- `src/systems/guild/guildServiceFlow.js`: `onPushEffects`
- `src/systems/crimeGuilds.js`: crime-guild invitation tally and online letter delay
- Research: `handbook/research/T2.md` (guilds and temples)
