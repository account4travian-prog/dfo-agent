---
title: Safe storage
summary: Where to keep gold, loot, materials and cargo, what each place can lose, and which one fits the goods.
stage: gear
order: 65
gate: none
status: draft
tags: [storage, bank, home, wagon, ship, stores, guild vault]
verified: e4f093166
---

> [!tip] At a glance
> - **Gold** is safest in the bank: an ordinary death takes one tenth of the gold you carry, and banked gold and letters of credit are outside it.
> - A **home** gives personal storage and a bed; entry defaults to Private.
> - A **wagon** carries goods but wears with travel; a **ship's hold** carries cargo at sea.
> - **Profession Stores** hold materials for crafting and writs; the Materials Bag holds 300 kg.
> - A **guild vault** is shared storage: 50 slots, plus 50 if the guild holds a hall.

## Match the storage to the goods

| Place | Holds | Cost or limit | What to know |
|---|---|---|---|
| **Bank of the Empire** | Gold and letters of credit | Any bank counter; letters cost 1% of their value, and the smallest letter is 100 gold | One account across all regions; carried coins weigh, account gold does not |
| **Home** | Items, a bed, a private cupboard | {{fact home.priceMin}}–{{fact home.priceMax}} gold; three homes per character; entry Private, Party, Public or Guild | The home belongs to the account; it does not hold gold |
| **Wagon** | Goods, up to its capacity | Small Cart 750 kg, Open Wagon 1,500 kg, Caravan 2,000 kg | An item in your pack; wears with travel; a town warden can move a badly parked team |
| **Ship hold** | Cargo at sea | Depends on the hull | A wreck is not a death, but a boarded wreck gives up a prize |
| **Profession Stores** | Materials for crafting, writs and the market | The Stores law's default cap is 5,000 units a material | Separate from your pack; writs spend from Stores |
| **Materials Bag** | Raw materials | 300 kg | Sold at General Stores; cannot be sold or dropped while it holds materials |
| **Guild vault** | Shared items | 50 slots, plus 50 with a guild hall | Rank decides deposit or withdraw; an officer's default withdrawal limit is 10 a day |

## What is lost where

| Event | Carried | Bank | Home | Wagon | Ship hold | Stores and bag | Guild vault |
|---|---|---|---|---|---|---|---|
| Ordinary death | One tenth of carried gold; items kept | Safe | Safe | Safe | Safe | Safe | Safe |
| Revenant kills you | As ordinary, plus the world-respawn check that can take a piece | Safe | Safe | Safe | Safe | Safe | Safe |
| PvP death in the Open Zone | Eligible carried items and cart contents can remain in shared remains | Safe | Safe | Cart contents exposed | Safe | Safe | Safe |
| Ship wrecked and boarded | — | Safe | — | — | About one third of the hold's worth, at most eight pieces, held for the boarder | — | — |

The ordinary death rule is the one to plan around: death takes a tenth of the gold you **carry**, rounded down, and leaves the bank and letters of credit alone. The Open Zone and the revenant's thief are separate systems with their own rules. See [Dying online](../hold/dying-online.md), [The Open Zone](../late/open-zone.md) and [Revenants](../rivals/revenants.md).

## The bank is for money, not goods

The bank takes gold and letters of credit; it does not store loot. Online, its account is shared across regions, so a deposit in one town is available in another. A letter of credit carries value without weight and can be deposited later, but its issue costs 1% of its value, with a 100-gold minimum. Keep only the traveling cash you are willing to lose. See [Banks](../town/banks.md).

> [!tip] Before you leave town
> Bank the purse, keep a travel allowance, and carry the gear you might use. The death penalty reaches carried gold only, so an empty purse is a cheap insurance policy.

## Homes, wagons and ships

A **home** is long-term storage with a bed and a door open at any hour. It belongs to your account, not one character, and each character may count three homes against its cap. The source does not state a single storage capacity for a home; the storage is the home's own. Entry settings decide who can follow you in, and Private is the default. See [Owning a home](homes.md).

A **wagon** is a pack item you deploy to carry goods, from a 750 kg Small Cart to a 2,000 kg Caravan. It is not a safe: it wears with road and load, and a town's wagon warden can relocate a team that blocks a road or overstays its parking allowance, with the wagon and cargo still yours at the relocation point. In the Open Zone, cart contents can be left in shared remains after PvP death. See [Wagons and hauling](../feet/wagons-and-hauling.md).

A **ship's hold** carries cargo at sea. A ship reduced to a wreck is not a death and its captain keeps the hold through the wreck, but a wreck another captain boards gives up about one third of the hold's worth, at most eight of its most valuable pieces, held by the account service for the boarder. See [Owning a ship](owning-a-ship.md).

## Materials and the guild vault

**Profession Stores** are the right place for materials. Crafting draws from them, court writs spend from them and the market can list from them, all without adding pack weight. The Materials Bag is the field option: 300 kg of raw materials carried separately from normal encumbrance. See [Professions](../feet/professions.md), [Gathering](../feet/gathering.md) and [Crafting](../feet/crafting.md).

A **guild vault** is shared storage with two limits: the shelves and your own permission. The guild gets 50 slots, plus 50 more while it holds a hall. Rank sets the default permission: a recruit and member may deposit, an officer may withdraw up to 10 items a day by default, and the guildmaster withdraws without limit; the guildmaster can grant any member a different level and limit. Before depositing anything valuable, read the current guild screen and confirm who can withdraw. See [Player guilds](../rivals/player-guilds.md).

## A storage routine that works

1. **Bank the purse** before every trip and keep only the cash you need.
2. **Put materials in Stores**, not in the pack, as soon as you are done gathering.
3. **Carry loot, not cargo**: a wagon on a dungeon trip is a liability more than a safe.
4. **Use the home for keepsakes and spare gear**, not as a bank for gold.
5. **Treat the guild vault as shared**: deposit only what you can afford to lose if permissions change.

## Common mistakes

- **Carrying the whole purse into a dungeon.** One death takes a tenth of it; the bank takes nothing.
- **Treating the home as a bank.** Gold sits in the purse or the bank, not in the home; a home's storage is for items.
- **Overloading a wagon and calling it safe.** Travel wear and parking rules apply, and Open Zone death can expose cart contents.
- **Depositing valuables in a guild vault without checking permissions.** An officer's default withdrawal limit still lets an officer take some; the guildmaster's word sets the rest.
- **Using the Materials Bag as general storage.** It holds raw materials and cannot be sold or dropped while it holds them.

## Next

- [Banks](../town/banks.md)
- [Owning a home](homes.md)

## Sources

- `src/systems/banking.js`: `goldRegion`, `withdrawGold`, `withdrawLetter`, letter commission and minimum; `src/systems/inventory.js`: `GOLD_PIECE_WEIGHT_KG`, `letterOfCredit`
- `src/systems/deathPenalty.js`: `DEATH_GOLD_DIVISOR`, purse-only deduction; `src/scenes/world.js`: respawn and revenant-theft branches
- `src/net/homeLaw.js`: `HOME_CAP`, `HOME_ENTRIES`, `HOME_ENTRY_DEFAULT`, `HOME_PRICE_MIN`, `HOME_PRICE_MAX`, `homeOnlinePrice`
- `src/systems/wagon/wagonKinds.js`: `SMALL_CART_KG` 750, `WAGON_KINDS` (Open Wagon 1,500 kg, Caravan 2,000 kg); `src/systems/wagon/wagonWarden.js`: parking and relocation
- `src/net/sea/seaPrizeLaw.js`: `SEA_PRIZE_SHARE` (one third), `SEA_PRIZE_PIECES_MAX` 8, `SEA_PRIZE_HOLD_S` (three days); `src/scenes/seaWreckHost.js`: wreck and boarding
- `src/net/professionLaw.js`: `STORES_MAX`; `src/net/bagLaw.js`: `BAG_KG_LIMIT` 300; `src/systems/materialsBag.js`: Materials Bag behaviour
- `src/net/guild/guildVaultLaw.js`: `GUILD_VAULT_SLOTS` 50, `GUILD_VAULT_HALL_SLOTS` 50, `VAULT_RANK_DEFAULTS`, `VAULT_LIMIT_CHOICES`
- Design records: `docs/34-money-and-loot.md` "Banking and keeping money safe"; `docs/23-playing-online.md` "The professions, in detail"
- Research: `handbook/research/E2.md` (homes, banking), `handbook/research/V1.md` (wagons, ships)
