---
title: Choosing a money route
summary: Pick between quests, bounties, gathering, crafting, writs and the market by time, caps and opportunity cost.
stage: feet
order: 76
gate: none
status: draft
tags: [money, gold, marks, opportunity cost, routes]
verified: e4f093166
---

> [!tip] At a glance
> - Take the capped routes first: combat Marks ({{fact marks.combatPerDay}} a UTC day), court writs ({{fact crafts.courtWritsPerDay}}), the bank exchange ({{fact marks.bankPerDay}} Marks), then spend the rest of the session on an uncapped route.
> - A bounty is the most reliable early loop: one posting, one pack, gold plus a kit piece.
> - An NPC counter always pays at most half its best-haggler price, so vendoring is steady but slow.
> - The market can beat a counter but pays on a buyer's schedule, not yours, and charges a 1% fee and 5% tax.
> - The route's real cost is the trip: count the journey both ways before choosing it.

This page is about choosing between income routes. [Making money](making-money.md) has the full rates; the point here is what each route costs you in time, caps and risk.

## What each route is for

| Route | What it pays | Limit or cost | The catch | Best when |
|---|---|---|---|---|
| **Quests** | Gold (the introduction steps pay 100–400), a gear choice, faction standing | One step at a time; travel to the giver | A step can wait an hour of character time for the next | You also want the questline's unlock |
| **Bounties** | 50 / 75 / 90 / 100 gold for a full pack in tiers 1–4, 190–200 in tier 5, plus a kit piece | Four postings per board per game day; a taken bounty lapses after one game day | The pack stands 4–10 map pixels away; the hunt is the trip | You want a predictable short outing |
| **Combat events** | Marks: gate 50, raid 30, serpent 40, Redoubt 20, star 30; gold and loot | {{fact marks.combatPerDay}} Marks per account per UTC day across all of them | The window is short and world-scheduled | The event is already near |
| **Court writs** | Marks equal to units × the material's Mark value × 1.2, plus profession XP and Renown | {{fact crafts.courtWritsPerDay}} writs per UTC day | Needs the material already in Stores | You already hold the material |
| **Gathering** | Materials at whatever a buyer pays, plus a 10% chance of 2–5 Marks per harvest (30 a day) | Node slots reset daily; travel to climates | No fixed material price exists | You are passing the nodes anyway |
| **Crafting** | Crafted goods at market prices; profession ranks; writ materials | Rank *n* costs 10 × *n*² XP; only two crafts above rank 50 | Long payback, and the market may not buy | You need the craft anyway |
| **Market** | A player's price minus a 1% listing fee, 5% tax and any Tithe | {{fact market.listingHours}}-hour listing; {{fact market.listingsMax}} live | A buyer must want it at your price | The good is wanted and you can wait |
| **Vendoring** | At most half the counter's best-haggler ask | None | Immediate but capped | You have spare loot and no plan for it |
| **Bank exchange** | {{fact marks.bankGoldPerMark}} gold per Mark | {{fact marks.bankPerDay}} Marks per UTC day, one way | Converts Marks you already earned | You have surplus Marks |

## Three rules of opportunity cost

1. **Count the round trip.** A hunt four map pixels away and one twenty pixels away can pay the same; the nearer one costs less of the session. The route planner prices roads cheapest and open ground dearest, so the shortest line is not always the fastest trip ([Overworld travel](../travel/overworld-travel.md)).
2. **Caps are account-wide, not per activity.** Once the day's {{fact marks.combatPerDay}} combat Marks are paid, another gate adds no Marks; the same is true of the Renown hour and the writ count. Switch routes rather than repeat a capped one.
3. **Carried takings are at risk.** An ordinary death takes one tenth of the gold you carry, and Open Zone death can expose carried items and cart contents. Bank before the risky leg, not after.

## A concrete early loop

This is an example of the arithmetic, not a guaranteed rate:

1. **Start in a town.** Take a board bounty whose target is close, and note the one-game-day life of a taken posting.
2. **Do the hunt.** A tier-1 full pack of eight pays 50 gold; a four-beast pack pays 60% of the full purse (30). The pack also drops a kit piece at your level.
3. **Return and sell.** Keep usable gear, sell the spares at the counter and salvage Magic-or-better only if you need shards. A counter offer is immediate but capped at half its best-haggler price.
4. **Bank the gold.** Keep a small traveling purse.
5. **Repeat once.** Two bounties plus an introduction step (100–200 gold) is roughly 200–400 gold before loot, which is a useful start on training, repairs and a Portal Stone's five shards.
6. **Convert Marks if you have them.** The bank pays 8 gold a Mark, up to 300 Marks a day; the exchange never goes the other way.

## Choosing by session length

- **Under half an hour:** stay in the same region. A bounty plus a counter sale is the simplest loop; skip anything with a long approach.
- **About an hour:** one bounty and one introduction quest step, or a nearby event window and a sell.
- **Two hours:** one full game day. Take the capped rewards (combat Marks, a writ if you hold the material, the bank exchange), then one progress goal. Events can fill the gap between windows.

## What not to do

- **Grinding kills past the caps.** Renown stops paying at {{fact renown.hourlyXpCap}} XP per account-hour and combat Marks stop at {{fact marks.combatPerDay}} a day; kills still give loot and skill, but not those currencies.
- **Taking a bounty you cannot finish.** A taken posting lapses after one game day, about two real hours, and the kills do not carry to a fresh posting on another day.
- **Repairing before selling.** A smith's paid repair adds no sale credit and your own repairs credit a third; sell as found.
- **Listing without reading the net.** Fee, tax and Tithe can leave less than the counter offered; the fee is kept if you cancel.
- **Treating the bank exchange as profit.** It converts Marks you already earned; it does not create gold.

## Common mistakes

- **Choosing the highest-paying route instead of the one you can reach.** Travel can consume the whole session.
- **Taking a capped reward last.** If the cap turns mid-session, the reward you planned is gone for the day.
- **Carrying the session's takings back.** Bank at the first counter, not at the last one.

## Next

- [Making money](making-money.md)
- [Money and markets](money-and-markets.md)

## Sources

- `src/systems/bounty/bountyBoard.js`: `BOUNTIES_PER_DAY`, `BOUNTY_ACTIVE_MAX`, `BOUNTY_LIFETIME_MINUTES`, `BOUNTY_FULL_PURSE`, `purseShare`, `bountyGold`, `bountyItemRule`
- `src/net/marksLaw.js`: `MARKS_FAUCETS`, `MARKS_COMBAT`, `MARKS_BANK`; `src/net/professionLaw.js`: `writPay`, `COURT_WRITS_PER_DAY`, `xpForRank`, `CRAFTS_ABOVE_JOURNEYMAN`
- `src/net/marketLaw.js`: `MARKET_LISTING_S`, `MARKET_LISTINGS_MAX`, `MARKET_TAX_PCT`, `listingFee`, `saleTax`; `src/net/townSeatLaw.js`: `TITHE_CAP`
- `src/systems/shopStock.js`: `ONLINE_SALE_SHARE` (the half-price ceiling), `calculateTradePrice`
- `src/systems/questlines/qlRewards.js`: `PAY_PROFILES`, `OUTCOME_GOLD_MIN`, `OUTCOME_GOLD_MAX`; introduction quest scripts for the 100–400 gold ranges
- `src/net/renown.js`: `RENOWN_XP_HOUR_MAX`; `src/systems/deathPenalty.js`: `DEATH_GOLD_DIVISOR`
- `src/systems/travel/travelRoute.js`: `ROUTE_COST`; `src/systems/travel/travel.js`: route time
- Design records: `docs/34-money-and-loot.md`; `docs/27-caps-and-timers.md`
- Research: `handbook/research/X1.md` (caps), `handbook/research/W1.md` (events)
