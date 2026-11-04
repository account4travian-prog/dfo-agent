---
title: Lycanthropy and vampirism
summary: Recognize infection, understand each curse's benefits and costs, and follow the available cure quests.
stage: hold
order: 75
gate: none
status: draft
verified: e4f093166
tags: [lycanthropy, vampirism, disease, cure]
---

> [!tip] At a glance
> - Treat an infection before it becomes a permanent curse if you want to avoid the change.
> - Lycanthropy's attribute and skill bonuses apply in beast form.
> - Vampirism changes with sunlight; a raised hood protects you without granting the night bonus.
> - Feeding and the werebeast's urge are different requirements.
> - Both curses have cure quests; ordinary disease treatment applies to the infection stage.

## Recognize an infection

Attacks from a werewolf or wereboar can infect you with that creature's strain of **lycanthropy**. A vampire or vampire ancient can infect you with **vampirism**. Infection is chance-based. The infection gate refuses characters below level 2.

At first, you carry a disease entry. A warning dream follows after the infection day. Once more than three game days have passed, and the warning dream has been dismissed, the infection can turn into a full curse. Vampirism also passes through a false-death sequence before the transformation completes. Do not confuse that presentation with ordinary combat death.

Use Cure Disease during the infection stage; the disease system includes these infections in its cure handling. Once the full racial curse takes over, you need its separate cure path. See [Health, fatigue and rest](health-fatigue-and-rest.md) for ordinary disease care. You cannot stack both completed curses: an existing racial override rejects another infection.

## Live as a werewolf or wereboar

Your curse grants a **Lycanthropy** spell that changes your form. Entering beast form unequips both hands and replaces weapon use with claws. While transformed, you cannot open your inventory or hold conversations. Prepare your supplies and finish town business before changing.

In beast form, you gain +40 Strength, Agility, Endurance and Speed, plus +30 Swimming, Running, Stealth, Critical Strike, Climbing, Hand-to-Hand and Jumping. In human form those bonuses disappear. The transformed body's minimum weapon material to be hit is Silver; you also have disease immunity. These benefits do not remove your form's restrictions.

Entering beast form normally has a once-per-game-day gate. Hircine's Ring bypasses that gate and prevents the forced full-moon change and rising urge. Transformation healing has its own daily gate: repeated changes do not provide repeated full heals. The ring frees the change, not the healing.

Online, a full moon forces the change while it is up at night. At dawn the lock ends, and you can use the power to change back. This differs from the offline full-calendar-day rule. You do not automatically become human merely because the forced period ends.

After a game month without killing an innocent, your maximum-health ceiling starts shrinking. The source counts dead civilians and city-watch guards for satiation; killing an ordinary monster is not a substitute. Online Renown health sits above the base-health limiter. The curse therefore carries a continuing cost even when you prefer to stay human.

## Live as a vampire

Your vampire bonuses apply without a separate beast transformation. Out of sunlight, you gain +20 to Strength, Willpower, Agility, Endurance, Personality, Speed and Luck. The Anthotis clan also applies the modifier to Intelligence. You gain +30 Jumping, Running, Stealth, Critical Strike, Climbing and Hand-to-Hand, along with vampire spells, disease immunity and paralysis immunity.

Direct daytime sunlight reverses the affected attribute bonus to −20. This port does not burn you for being a vampire in sunlight. Indoors and underground, the sunlight penalty does not apply. A raised cloak or robe hood gives a neutral attribute modifier in sunlight: it shields you without making daytime count as night. Holy-place damage remains a separate danger.

Feed by landing an attack. You do not need to kill an innocent as a werebeast does. If you have not fed within the last game day, you cannot begin resting. Bare-headed vampires also face a daytime fast-travel refusal; raising a suitable hood removes that racial travel block.

Becoming a vampire changes the active guild-membership book. Your mortal memberships are preserved for a cure, but you use the vampire book while cursed. The Thieves Guild and Dark Brotherhood carry across that swap. Your clan also has its own initiation and quests; do not assume your previous guild access remains identical.

## Remove a completed curse

The **$CUREVAM** quest leads through a vampire contact and the Keeper of the Bloodline to your bloodfather. Slaying the bloodfather lifts vampirism. The quest also allows an outcome where you remain loyal to the vampires and keep the curse.

The **$CUREWER** quest starts with a priest. Its bloodline route involves an alchemist's vial and passing your curse to the last descendant. Another branch searches for a book, then information about Glenmoril Coven and a kinder cure. Finding that information is not itself proof you are cured. Follow the quest's actual completion state.

Online, curse quests roll at shorter character-time intervals while the relevant quest arm is idle. This does not guarantee an immediate letter. The checked sources establish these quests; they do not set a universal shrine interaction or ordinary potion that instantly removes either completed curse.

## Common mistakes

- Treating Cure Disease as a completed-curse cure: use it before the infection turns.
- Expecting human-form werebeast bonuses or unlimited transformation heals: both have explicit limits.
- Raising a hood and expecting the night bonus: sunlight becomes neutral under it.

## Next

- [Health, fatigue and rest](health-fatigue-and-rest.md)
- [Questions new players ask](../reference/questions.md)

## Sources

All game paths below refer to snapshot `e4f093166`.

- `src/systems/diseases.js`: `runMonsterHitArm`, werewolf, wereboar and vampire infection arms.
- `src/systems/infection.js`: `startInfection`, `infectionAccepted`, `infectionStep`, `DREAM_AFTER_DAYS`, `TURN_AFTER_DAYS`; disease-stage cure handling.
- `src/systems/lycanthropy.js`: `LYCANTHROPE_STATS`, `LYCANTHROPE_STAT_MOD`, `LYCANTHROPE_SKILLS`, `LYCANTHROPE_SKILL_MOD`, `lycanthropeAdvantages`, `morphSelf`, `morphHeals`.
- `src/systems/lycanthropy.js`: `lycanthropyMagicRound`, online `moonNight` branch, health limiter, `killedInnocent`, `racialSuppressInventory`, `racialSuppressTalk`, `cureLycanthropy`.
- `src/systems/vampirism.js`: `VAMPIRE_STATS`, `VAMPIRE_SKILLS`, `vampireStatMod`, `vampirismMagicRound`, `createVampirismCurse`, `onVampireHit`, `racialRestBlock`, `racialSunAverse`, `racialFastTravelBlock`, `cureVampirism`.
- `src/systems/passiveSpecials.js`: VAMP-DAY sunlight exclusion and holy-place damage branch.
- `src/systems/guild/guilds.js`: `activeMemberships`, `membershipsFor`, `carryInvitationOnly`.
- `src/systems/racialQuests.js`: `startRacialOverrideQuest`, `ONLINE_RACIAL_INTERVAL_MINUTES`, `racialArmIdle`.
- `src/systems/questlines/sheets/vampires.json`: `$CUREVAM`, `$CUREWER` objectives and outcomes; `P0A01L00` initiation.
- `src/systems/quest/actions.js`: cure action dispatch to `endVampirism` and `endLycanthropy` hooks.
