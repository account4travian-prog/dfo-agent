---
title: Thievery
summary: Stealth, backstabs, locks, pockets, stolen goods, and how the Thieves Guild and Dark Brotherhood find you.
stage: town
order: 62
gate: none
tags: [stealth, backstab, lockpicking, pickpocket, crime, guilds]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - **Crouch** with C to sneak; a foe's stealth check comes once a game minute, and slow movement skips checks.
> - A **backstab** needs the foe facing away; a success triples the blow.
> - Pickpocketing and lockpicking use the **Steal** interaction mode; a failed pickpocket is a crime and calls the watch.
> - **Stolen goods** carry a mark: merchants buy them but never reshelve them, and a conviction takes them.
> - The **Thieves Guild** and **Dark Brotherhood** cannot be joined by asking; tallies of 10 thefts or 15 murders invite you.

## Stealth

Hold **C** to crouch and sneak; the separate held Sneak action ships unbound. A foe within about 25 metres makes a stealth check once a game minute, reading your Stealth against the distance. Moving at less than half speed skips every other minute's check, while a fast mover that has already been encountered is detected outright.

## Backstabs

A backstab is a separate check. The foe must be facing away when your swing resolves, and the game rolls your **Backstabbing** skill; a success deals triple damage. Every back-facing swing trains the skill, even when the triple roll fails, and a **Watchful** revenant cannot be backstabbed. [Fighting](../hold/fighting.md) covers the swing itself.

## Locks

Hold **Left Alt**, choose **Steal**, and activate a locked door to pick it; any other mode tries the door normally, and its lock refuses. No lockpick item is needed. An interior door's chance is **Lockpicking** + 5 × (your level − the lock's value); an outside building door is **Lockpicking** − 5 × the lock's value. Both clamp between 5 and 95. A magically held lock (value 20 or more) cannot be picked.

A failed attempt records the skill you tried with; the same lock does nothing until your skill changes.

## Pockets and shops

In **Steal** mode within about 3.2 metres, activate a person to pick their pocket; you get one attempt per person. Against a townsperson it is your **Pickpocket** skill (5–95); against an enemy, each level you have over it adds five. Two successes in three pinch 1–6 gold; one in three finds nothing, and only the gold arm counts for the guild. Against a townsperson, a failure sets the **Pickpocketing** crime and calls the watch; against an enemy it alerts the room instead.

An open shop's stock trains Pickpocket, then a being-seen roll reads that skill, the shop's quality and your load; getting away takes the goods and counts for the guild, being seen is **Theft** and calls the guards. A shut shop's shelf has no roll and no guards but still counts as theft for the guild. A private container tallies the guild first, then rolls, with **Theft** and guards on a failure.

## Stolen goods and the fence

A stolen piece carries a mark through stacks, splits and trades. Merchants buy a marked piece but never reshelve it, and a guilty verdict takes every stolen piece you carry. The Thieves Guild's **fence** service sells magic items from rank 2; its spymaster opens at rank 4. The Dark Brotherhood sells potions at rank 1, makes them at 3, soul gems at 5, and keeps a spymaster at 7.

## What the law does

A crime is charged where it happens and lowers that region's standing. A first pickpocketing, trespass, vagrancy or attempted breaking-and-entering may be warned instead of arrested, but the charge still lands; getting away ends the chase, not the loss. A **Curfew** town doubles crimes' standing cost at night. [The law](the-law.md) covers court and recovery.

## How the crime guilds find you

The **Thieves Guild** invites at **10** thefts; the **Dark Brotherhood** invites at **15** murders, counting a murdered townsperson as 5 and a guard as 1. Crossing the tally stamps a letter: three game days classically, or 24 character minutes online, about two real minutes. The initiation starts only while you are **outside**, the tally freezes while a letter is pending, and it never fires twice. Joining reveals the guild's hall on your town map. [The NPC guilds](npc-guilds.md) covers ranks and services.

## In town, for a new character

- Do not test pickpocketing with a low skill: a failure is a crime.
- Do not force a lock you cannot pick; the attempt is spent until your skill moves.
- Do not carry stolen goods into a court date; a conviction takes them.
- Do not grind murders for the Dark Brotherhood. Murder leaves a lasting mark that a sentence does not fully clear.

## Common mistakes

- **Expecting stealth to guarantee a backstab.** The foe must face away, and the roll is your skill.
- **Expecting every pickpocket success to pay.** One success in three finds nothing.
- **Trying the same lock twice in a row.** The attempt is spent until the skill changes.
- **Applying to the Thieves Guild.** The tally invites you.

## Next

- [The law](the-law.md)
- [The NPC guilds](npc-guilds.md)

## Sources

- `docs/33-fighting.md` (stealth and backstabs), `docs/35-people-and-trouble.md` (crime, the watch, the crime guilds)
- `src/characters/enemy/enemyMotor.js`: `stealthChance`, `STEALTH_MAX_DISTANCE`, `_stealthCheck`; `src/scenes/hostCombat.js`: `backstabChanceOf`; `src/combat/formulas.js`: `backstabDamage`, `calculatePickpocketingChance`, `calculateShopliftingChance`
- `src/systems/talk/talk.js`: `pickpocket`; `src/world/actionSystem.js`: `interiorLockpickingChance`, `exteriorLockpickingChance`, `lookAtLockText`, `MAGIC_LOCK_THRESHOLD`, `attemptLockpicking`
- `src/systems/theft.js`: `privatePropertyTheft`, `shopliftAttempt`, `shopShelfTheft`; `src/systems/stolenGoods.js`: `STOLEN_MARK`, `landSold`
- `src/systems/crimeGuilds.js`: `THIEVES_GUILD_TALLY_TARGET`, `DARK_BROTHERHOOD_TALLY_TARGET`, `tallyCrimeGuildRequirements`, `handleStartingCrimeGuildQuests`, `CRIME_GUILD_LETTER_ONLINE_MINUTES`
- `src/systems/guild/guilds.js`: `INVITATION_ONLY`; `src/systems/guild/guildServices.js`: `thievesCanAccessService`, `brotherhoodCanAccessService`; `src/systems/guild/guildHallReveal.js`: `revealGuildHallsOnMap`
- `src/systems/standing.js`: `WARNABLE_CRIMES`, `warningDue`; `src/net/townSeatLaw.js`: `CURFEW`; `src/systems/inputActions.js`: `DEFAULT_BINDINGS`
