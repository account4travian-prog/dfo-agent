---
title: Making money
summary: What actually pays in DFO Online, the rates the source sets, and the routes that pay poorly.
stage: feet
order: 75
gate: none
status: draft
tags: [gold, marks, income, bounties, market, writs]
verified: e4f093166
---

> [!tip] At a glance
> - A full bounty pack of eight pays 50 gold in tier 1 (levels 1–3), 75 in tier 2, 90 in tier 3, 100 in tier 4 and 190–200 in tier 5 (level 15+).
> - A counter pays at most half what it would ask its best haggler, so vendoring is steady but slow.
> - Court writs pay Marks, up to {{fact crafts.courtWritsPerDay}} a UTC day; combat Marks share a {{fact marks.combatPerDay}}-a-day cap and exchange for gold at {{fact marks.bankGoldPerMark}} each.
> - The market can beat a counter, but charges a 1% listing fee, a 5% sale tax and sometimes a seat's Tithe.

## Two purses, one exchange

Gold is carried with the character; **Marks** are held by the registered account and spent on the market, guild seats and star refunds. The Bank of the Empire sells Marks for gold at {{fact marks.bankGoldPerMark}} gold each, up to {{fact marks.bankPerDay}} Marks a UTC day, and never the other way. See [Money and markets](money-and-markets.md).

## Quests and their reward tiers

A quest pays what its script says, then the questline layer scales the gold by the outcome's factor, bounded between 0.75 and 1.5, and offers three fitted gear choices at the quest's tier: tiers 1–2 start at Magic, tiers 3–4 at Rare, and no tier's floor is Legendary. No universal per-level reward exists, so read the card. Introduction steps pay 100–200 gold for the level 2–4 lines and 200–400 for the level 5 and 6 lines, the scripts' own ranges.

## Notice-board bounties

Each town board posts four hunts a game day; a character holds four, and a taken bounty lapses after a game day. The purse depends on the monster tier and the pack size:

| Bounty tier | Levels | Full pack of eight |
|---|---|---|
| 1 | 1–3 | 50 gold |
| 2 | 4–5 | 75 gold |
| 3 | 6–10 | 90 gold |
| 4 | 11–14 | 100 gold |
| 5 | 15+ | 190–200 gold |

A surface pack runs four to eight beasts, and each one short of eight takes a tenth off the full purse, so four pay 60%. A dungeon pack of two to four is valued as a surface pack of four, six or eight. Each bounty also pays a kit piece: half condition and never Magic below level 4, three-quarter condition and half Magic at 4–5, and full condition and the same chance from level 6.

## Gathering, crafting and ranks

The ten tracks run 0–100, and rank *n* takes 10 × *n*² experience: Journeyman (50) is 25,000 and Master 100,000. Only two crafts may pass Journeyman. Materials list at a price you choose and earn whatever a buyer agrees; the market sets no price of its own. Harvests also roll a Mark find — a 10% chance of 2–5 Marks, capped at 30 an account a day — and bodies, piles and searches roll 1–4 Marks at 5%, 12% and 15%, capped at 20. Crafted gear tops out at Masterwork, about one Rare roll, so world loot usually sells better than the anvil.

## Counter or market

An NPC counter buys eligible loot at once. Its offer starts from the item's value, quality, condition and the counter's quality, and online the sale is capped at half the counter's best-haggler ask; Mercantile and Personality move you under that ceiling. A found piece sells at its found condition, your own repairs add a third and a smith's paid repair adds nothing.

The market reaches other players. Listings last {{fact market.listingHours}} hours and an account may keep {{fact market.listingsMax}} live. Posting costs a 1% fee, at least 1 Mark; a sale pays 5% tax and may owe a seat's Tithe of 0–10%, or 0–15% under a crown seat. A buyer in another region pays a courier fee and waits. Compare the net; the fee is kept if the listing is cancelled.

## Court writs and Marks

Court writs take materials from Stores and pay units × material Mark value × 1.2, up to {{fact crafts.courtWritsPerDay}} writs a UTC day, with profession experience and Renown. Guild writs pay from a guild's Marks treasury, need the listed material, and pay at most 1.5 times its Mark value. Combat pays Marks too: a Dagon's Breach gate 50, a defended town raid 30, a sea serpent 40 (20 to a ship that did not stand half the fight), an Elite Breach Redoubt 20, a held fallen star 30 and a Motherlode 10. They share a {{fact marks.combatPerDay}}-Mark ceiling per account per UTC day, paid down to it rather than lost. At the bank the day's exchange is worth at most 2,400 gold.

## What pays poorly

- **Vendoring common loot.** The half-price ceiling makes a counter a steady trickle, not a plan.
- **Repairing before selling.** A smith's paid repair adds no sale credit, and your own adds a third.
- **Fighting past the combat cap.** After {{fact marks.combatPerDay}} Marks in a UTC day, gates and raids stop paying until the reset.

## Common mistakes

- **Counting the bank exchange as income.** It converts Marks you already earned; it does not create gold.
- **Treating bounty gold as the reward.** The gear roll and the Renown are often worth more than the purse.

## Next

- [Money and markets](money-and-markets.md)
- [Notice boards](../town/notice-boards.md)

- [Choosing a money route](money-routes.md)
## Sources

- Design records: `docs/34-money-and-loot.md`; `docs/23-playing-online.md` "Quests are the core loop now" and "The professions, in detail"
- `src/systems/questlines/qlRewards.js`: `PAY_PROFILES`, `OUTCOME_GOLD_MIN`, `OUTCOME_GOLD_MAX`, `REWARD_CHOICES`, `TIER_FLOORS`, `pieceRarity`, `scaleGold`
- Quest scripts `src/systems/questlines/quests/QLIP01.txt`, `QLIF01.txt`, `QLIT01.txt`, `QLIR01.txt`, `QLIG01.txt`, `QLIS01.txt`, `QLIS02.txt`, `QLIS03.txt`: gold ranges
- `src/systems/bounty/bountyBoard.js`: `BOUNTIES_PER_DAY`, `BOUNTY_ACTIVE_MAX`, `BOUNTY_LIFETIME_MINUTES`, `BOUNTY_TIERS`, `BOUNTY_FULL_PURSE`, `purseShare`, `bountyGold`, `bountyItemRule`
- `src/net/professionLaw.js`: `PROF_RANK_MAX`, `xpForRank`, `CRAFTS_ABOVE_JOURNEYMAN`, `JOURNEYMAN_RANK`, `writPay`, `COURT_WRITS_PER_DAY`
- `src/net/marksLaw.js`: `MARKS_FAUCETS`, `MARKS_COMBAT`, `combatStrike`, `MARKS_BANK`, `gatherFindOf`, `findChanceOf`, `lootFindOf`
- `src/net/marketLaw.js`: `MARKET_LISTING_S`, `MARKET_LISTINGS_MAX`, `MARKET_TAX_PCT`, `listingFee`, `saleTax`, `saleTithe`, `COURIER`
- `src/net/writLaw.js`: `WRIT_S`, `WRIT_PAY_PCT` (a guild writ's pay ceiling)
- `src/net/townSeatLaw.js`: `TITHE_CAP`; `src/net/eliteGates/egPay.js`: `EG_PAY_MARKS`
- `src/systems/shopStock.js`: `ONLINE_HAGGLE_MAX`, `ONLINE_SALE_SHARE`, `ONLINE_SALE_SKILL_WEIGHT`, `calculateTradePrice`
- `src/systems/tradeModes.js`: `saleConditionPercentage`; `src/systems/item/foundMark.js`: `foundSalePercentage`
- `src/net/recipeLaw.js` (crafted quality); `server-account/src/professions.js`: `craftCapSql`
