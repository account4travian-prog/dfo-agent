---
title: Mages Guild services
summary: Find spells, magic items, soul gems and summoners, and check which membership opens each service.
stage: town
order: 65
gate: none
status: draft
verified: e4f093166
tags: [mages guild, spells, services, soul gems, daedra]
---

> [!tip] At a glance
> - Most guild services need membership and sufficient rank; buying Mages Guild spells is an exception.
> - Makers turn gold, an item or ingredients into capability. Check the finished cost before confirming.
> - Potions, fencing, spymaster work and knightly gifts belong to other organizations; this page keeps to Mages Guild services and links to them.
> - Online guild and temple summoners let you choose a prince on any day.

## Finding the guild

Visit a **Mages Guild** hall and speak to its service NPCs. Temples, Thieves Guild halls, Brotherhood sanctuaries and knightly orders offer different services.

Admission needs non-negative reputation and magic-school skills at 22 and 4. See [The NPC guilds](npc-guilds.md).

Its rank ladder is Apprentice (0), Journeyman (1), Evoker (2), Conjurer (3), Magician (4), Enchanter (5), Warlock (6), Wizard (7), Master Wizard (8), Archmage (9). Advancement checks reputation and permanent skills. Online, personal advancement stops at 7; the higher ranks are chapter seats. Opening services applies an earned promotion immediately.

## Services and access

Ranks below are Mages Guild ranks. Where another organization offers the same service, the row says so and links to that faction page. Trade windows quote purchase and sale prices.

| Service | What it does | Rank needed | Cost/what it consumes |
|---|---|---|---|
| Training | Practise an offered skill | Guild member; temples train strangers too | Quoted gold, time and fatigue |
| Quests | Take Mages Guild work | Open | None beyond the quest |
| Identify | Identify an item | Open | No guild fee |
| Buy Spells | Add a ready-made spell | Public | Quoted gold |
| Make Spells | Design a spell | Guild member | Gold; carry a spellbook |
| Buy Magic Items | Buy enchanted stock | Rank 3; Julianos 3 at a temple | Gold |
| Make Magic Items | Enchant a carried item | Rank 5; Julianos 5 at a temple | Gold, eligible item; a filled gem if binding a soul |
| Teleportation | Choose a destination on the teleport map | Rank 8; paid option admits any member | Free at 8+; paid travel below it |
| Daedra Summoning | Attempt contact and a quest offer | Rank 6; Julianos 6, other temples 7 except Zenithar 8 | Summoning fee; failure still costs gold |
| Buy Soulgems | Buy empty or filled traps | Rank 4; Arkay 4 at a temple | Quoted gold |

**Paid teleportation** depends on your Travel Options setting, off by default. Below rank 8 its fee is `(8 - rank) * 200` gold. See [Mages Guild teleport](../travel/mages-guild-teleport.md) for world-boundary restrictions.

## Services that are not Mages Guild

Those services are listed here only because a player may have seen them in a guild or temple window. They belong to
another faction:

- **Potions, temple spells, Julianos magic items, temple summoning and Arkay soul gems:** [Temples](temples.md).
- **Selling magic items and the spymaster:** [The Thieves Guild](thieves-guild.md).
- **Brotherhood potions, potion making, soul gems and spymaster:** [The Dark Brotherhood](dark-brotherhood.md).
- **Armour and house gifts:** [Knightly orders](knightly-orders.md).
- **Fighters Guild training, repair, identify, donations and cure disease:** [The Fighters Guild](fighters-guild.md).

## Daedra summoning

Online guild and temple summoners list princes by name. Offline, they match the recorded day of year. The source describes fifteen of sixteen princes as annual summons, although its calendar lookup also includes Hircine's dated entry.

Glenmoril witches always select Hircine. Other covens draw a prince other than Hircine and remember the selection for the day; online that reroll uses the event clock, rather than the sky calendar.

The fee is `200000 - reputation * 1000`, using your standing with the summoner. Example: reputation 0 means 200,000 gold. Success uses the prince's separate reputation and weather bonus. Sheogorath can replace your selection. Failed attempts and repeat greetings cost gold; if no quest can be created in the region, you keep your money.

## Soul gems and Azura's Star

**Buy Soulgems** stocks empty and filled traps. Bought stock stays gone for the day. Filled traps supply Soul Bound; empty ones need captured souls.

**Azura's Star** is reusable: filling prefers an empty Star, while binding consumes an ordinary matching gem first. If only the Star supplies that soul, it empties and survives. See [Enchanting, spellmaking and potions](../gear/enchanting-spellmaking-potions.md).

## Common mistakes

- Joining for one service without checking its rank or another temple's offer.
- Treating rank prestige as spendable gold: service access uses standing and rank, while the bill consumes its listed resources.
- Expecting the offline calendar to govern online guild summoners, or every coven to offer every prince.

## Next

- [The NPC guilds](npc-guilds.md)
- [Temples](temples.md), [The Thieves Guild](thieves-guild.md), [The Dark Brotherhood](dark-brotherhood.md) and [Knightly orders](knightly-orders.md) for their own services
- [Enchanting, spellmaking and potions](../gear/enchanting-spellmaking-potions.md)
- [Mages Guild teleport](../travel/mages-guild-teleport.md)

## Sources

All paths below are in `upstream/snapshot-e4f093166/`.

- `src/systems/guild/guildServices.js`: `canAccessService`, subclass switches; `guildNpcServices.js`: `NPC_SERVICE`; `guildVariants.js`: `TEMPLE_DATA`.
- `src/systems/guild/guilds.js`: `GUILDS.MagesGuild`, `isEligibleToJoin`, `updateRank`; `src/net/npcChapterLaw.js`: `ROLL_BOOK_RANK_MAX`.
- `src/ui/guildServiceWindows.js`: training flows; `src/systems/guild/guildServiceActions.js`: `trainSkill`; `src/scenes/worldModes.js`: `openServiceFlow`.
- `src/systems/knightlyGifts.js`: `receiveArmorDecision`, `receiveHouseDecision`, `RECEIVE_HOUSE_RANK`.
- `src/systems/daedraSummoning.js`: `DAEDRA`, `summonsByName`, `daedraForSummoner`, `summoningCost`, `attemptSummoning`.
- `src/systems/shopStock.js`: `stockSoulGems`, `dayShelf`; `src/systems/mysticism.js`: `fillEmptyTrap`, `removeFilledTrap`.
- `src/systems/travel/travelOptions.js`: custom guild registration; `src/ui/travel/travelMapOptions.js`: `teleportCost`; `src/systems/modSettings.js`: `Teleportation.EnablePaidTeleportation`.

