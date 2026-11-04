---
title: Craft specialisations
summary: The two-craft limit past rank 50, and profession specialisations.
stage: gear
order: 40
gate: registered
status: draft
verified: 0df2d87eb
tags: [crafting, specialisations, professions, progression]
---

> [!tip] At a glance
> - You may raise every gathering track, but only {{fact crafts.aboveJourneyman}} craft tracks may rise above Journeyman (rank {{fact crafts.journeymanRank}}).
> - Each profession track offers a specialisation choice at rank 50 and rank 100.
> - Disciplines that share a craft track also share its choice slots.
> - You can change a choice later for Marks, but the replacement takes time to become active.

## Choose for the work you do

Specialisations focus a profession. Some improve quality or material yields; others open a new kind of work or improve a specific product. The five craft tracks share their choices across eight disciplines, so a choice for Jewelcrafting or Cooking occupies the same track's specialisation slot as its paired discipline.

| Track or discipline | Rank 50 choices | Rank 100 choices |
|---|---|---|
| Mining | Prospector marks nearby veins; Deep Delver improves dungeon mining. | Motherlode Sense reveals daily Motherlodes sooner; Surveyor opens unwitnessed land ores and direct Cut Stone quarrying. |
| Logging | Lumberjack uses fewer chops; Forester improves Heartwood finds. | Charcoal Burner makes more Charcoal; Timberwright makes more planks. |
| Herbalism | Gardener adds a common herb; Botanist extends the steady window. | Seasonal Eye improves off-season gathering; Apothecary's Friend treats herbs as unbruised. |
| Hunting | Tracker marks nearby animals; Tanner improves hide curing. | Trophy Hunter opens later-gated trophy decor; Butcher improves meat yield and keeping quality. |
| Fishing | Angler widens the tug window; Netter adds fish to a school haul. | Deep-Sea improves Pearl and Slaughterfish chances; Pearl Diver improves Pearl chance. |
| Smithing | Weaponsmith or Armoursmith improves that item's quality. | Masterwright improves Masterwork chance; Quartermaster improves ingot and repair-kit yield. |
| Outfitting | Tailor improves clothing quality; Leatherworker improves leather armor quality. | Couturier opens later-gated two-colour dyes; Saddler opens a later-gated wagon upgrade. |
| Building: Carpentry | Bowyer improves bow quality; Joiner reduces furniture plank costs. | Siegewright improves rams and siege work; Master Joiner marks furniture with its maker. |
| Building: Masonry | Quarryman improves Rough Stone cutting; Builder reduces fortification stone needs. | Fortifier can prevent a seat wall from dropping on capture; Sculptor opens stone decor. |
| Provisioning: Alchemy | Brewer increases potion output; Distiller improves potent brews. | Master Alchemist improves potent brews; Transmuter converts metals with Mercury. |
| Provisioning: Cooking | Cook adds a serving; Field Cook saves fuel at your own Campfire. | Chef extends feast duration; Provisioner prevents rations and dishes from spoiling. |
| Enchanting | Efficient reduces costs; Disenchanter increases Arcane Essence yield. | Soulbinder improves points from filled soul gems; Runecaster lets you choose a Masterwork property from a selection. |
| Smithing: Jewelcrafting | Gemcutter improves set-gem enchantment points; Goldsmith lets Silver count as Gold. | Master Jeweller improves jewelry quality; Lapidary can set siege-cracked Gems as any gem. |

For tracks with paired disciplines, these are alternatives on the same track: you choose one specialisation at each rank threshold, not one per discipline. The choices marked as later-gated are not available until their related feature opens. Read the choice card before committing: specialisations are not all improvements to the same kind of work, and some matter only if you use that system.

## The rank-50 ceiling

Journeyman is the key planning point. You can continue raising all gathering tracks, but only {{fact crafts.aboveJourneyman}} craft tracks can cross rank {{fact crafts.journeymanRank}}. Disciplines that share Smithing, Building or Provisioning do not create extra craft slots. If you reach the ceiling, another craft cannot keep advancing past it until you make room under the limit.

Changing a specialisation costs Marks and has a waiting period; your current choice remains in effect until the change completes. The law sets the cost and delay. See [Money and markets](../feet/money-and-markets.md) for how Marks differ from gold.

## Next

- [Crafting](../feet/crafting.md)
- [Owning a ship](owning-a-ship.md)

## Sources

- `src/net/professionLaw.js`: `CRAFTS_ABOVE_JOURNEYMAN`, `JOURNEYMAN_RANK`, `SPEC_RANKS`, `RESPEC`, `SPECIALISATIONS`, `OWN_CHOICES`, `specOk`
- Research note: `handbook/research/E1.md`
