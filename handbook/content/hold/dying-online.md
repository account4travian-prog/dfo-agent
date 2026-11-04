---
title: Dying online
summary: Online death returns you to a safe point with half health and takes one tenth of the gold you carry.
stage: hold
order: 80
gate: none
tags: [death, respawn, gold, online]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - Death does not end your online character's run; you wake at a safe point.
> - In Privateer's Hold, you return to the dungeon's start marker.
> - You revive with half your maximum health, rounded down, with a minimum of 1.
> - The game takes one part in {{fact death.goldDivisor}} of the gold you carry, rounded down. Banked gold is untouched.

## Getting back

If you die in Privateer's Hold online, you return to the Hold's start marker. If you die in another dungeon, you wake
just outside its entrance. Above ground, the game chooses a nearby temple, town or graveyard as your safe point.

A party member's **Resurrect** spell is a separate rescue path: they target your fallen body, and a successful rescue
raises you where you lie. It withdraws the ordinary respawn's stated gold loss. It is not the same as choosing respawn,
and special areas or death states can prevent resurrection.

If you are alive but stuck, `/unstuck` offers another route: indoors it leaves by the door you entered; outdoors it
takes you to the nearest town. See [Keys and commands](../reference/keys-and-commands.md) for the command and cancellation.

PvP death in the [Open Zone](../late/open-zone.md) has separate loss and return rules. Do not apply this page's
ordinary carried-gold penalty to it.

## What death costs

You return with half your maximum health, rounded down, and at least 1 health. The game removes one part in
{{fact death.goldDivisor}} of the gold you carry, rounded down. Gold in the bank and letters of credit are not part of
this carried-gold penalty.

The online death screen lets you respawn immediately with **Enter** or wait for the automatic respawn. The loss is
shown on the death screen before the game applies it.

> [!tip] Before you head out
> Keep only the gold you need to carry. The death penalty applies to your carried purse, not your bank balance.

## What you keep

The ordinary death penalty does not destroy your items, equipment or quest items. It subtracts from your carried
gold, and the revival restores the living character rather than replacing their inventory. Banked gold and letters
of credit are outside that carried-gold deduction.

There are separate exceptions to item safety: the world respawn also checks whether a revenant killer takes a piece,
and the Open Zone has its own death drops. Keeping your pack through an ordinary death does not protect it from those
systems or undo wear from the fight.

## Common mistakes

- Carrying all your gold into a dungeon: the ordinary penalty reaches your whole carried purse.
- Skipping the bank before a risky trip: gold left in the bank is outside the carried-gold penalty.
- Entering an Open Zone fight unprepared: PvP death there follows separate rules, including death drops.

## Next

- [Leaving the Hold](leaving-the-hold.md)

## Sources

- `src/scenes/worldModes.js`: `onlineRespawn` (Privateer's Hold return)
- `src/scenes/world.js`: `respawnOnlinePlayer` (dungeon and exterior return)
- `src/scenes/world.js`: `resurrectInPlace`, ordinary revival, revenant theft and Open Zone branches
- `src/scenes/hostMagic.js`: `hasResurrect`, `fallenInReach`, fallen party-body targeting and cast gate
- `src/systems/deathRespawn.js`: `SAFE_KINDS`, `nearestSafeLocation`, `RESPAWN_HEALTH_FRACTION`
- `src/systems/deathRespawn.js`: `reviveForPlay` (revival changes without replacing inventory)
- `src/systems/deathPenalty.js`: `DEATH_GOLD_DIVISOR`, `deathGoldLoss`, `applyDeathPenalty`
- `src/systems/deathPenalty.js`: `stateDeathLoss`, `statedDeathLoss`, purse-only deduction and bank/credit exclusion
- `src/net/chatCommands.js`: `/unstuck` help; see the linked Keys and commands page
- `src/ui/deathScreen.js`: `ONLINE_RESPAWN_SECONDS`
- Research note: `handbook/research/H1.md`
