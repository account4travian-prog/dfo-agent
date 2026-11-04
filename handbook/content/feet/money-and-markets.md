---
title: Money and markets
summary: Marks and other currencies, daily caps, the global market and court writs.
stage: feet
order: 70
gate: registered
status: draft
verified: e4f093166
tags: [marks, gold, market, writs, economy]
---

> [!tip] At a glance
> - Gold belongs to your character's save; **Marks** are held by your registered account.
> - The Bank of the Empire exchanges Marks for gold at {{fact marks.bankGoldPerMark}} gold per Mark, up to {{fact marks.bankPerDay}} Marks per UTC day. The exchange is one-way.
> - A Market listing costs a 1% fee, rounded up with a minimum of 1 Mark; a sale then loses 5% tax, rounded down, and any seat Tithe.
> - **Court writs** trade requested materials from Stores for Marks and profession experience.

## Gold and Marks are different

Gold is carried and saved with your character. Marks sit in the account ledger, where DFO can award them for witnessed activity and bounded gathering or loot finds. At the Bank of the Empire, you can exchange Marks for gold; the exchange goes one way. The source defines no gold-to-Marks conversion. The Marks service and the Bank both need a registered account.

The Bank pays less than a Mark's own yardstick: the record values a Mark at about **10 gold of play**, while the Bank pays {{fact marks.bankGoldPerMark}}. That spread is the price of turning account currency into carryable gold, and the {{fact marks.bankPerDay}}-Mark daily cap keeps it slow.

Different Marks sources have their own limits. Combat rewards share a daily account cap, and gather and loot finds each have separate daily bounds. See [Caps and timers](../reference/caps-and-timers.md) for the handbook's broader cap reference, and [Making money](making-money.md) for what pays.

## Buy and sell on the Market

The Market handles listings and buy orders in Marks. You can list eligible materials or items; a local buyer receives a purchase immediately, while a buyer in another region pays courier costs and waits for delivery. The live board shows current offers; do not assume another player's asking price is a fixed value.

| Rule | What it costs |
|---|---|
| Listing fee | 1% of the listing's whole worth, rounded up, at least 1 Mark; burnt when you post, and not returned if you cancel |
| Sale tax | 5% of the sale, rounded down |
| Seat Tithe | The holding player guild's rate, where a guild holds the seat: 0–10% at a Palace, 0–15% at a Crown, with a Market Hall raising the cap a point per tier |
| Courier | By the load: `ceil((units/20) × (1 + pixels/25))` Marks, at least 2; delivery takes 15 minutes plus a minute for every 10 pixels begun |
| Listing lifetime | {{fact market.listingHours}} hours, up to {{fact market.listingsMax}} live listings an account |

The seller receives the price minus the tax and any Tithe. The tax is worked out on the running total of a listing, so selling a stack a unit at a time does not avoid it. There is no Tithe where no seat holds the board's bailiwick; the seat rules are on [City control](../rivals/city-control.md).

> [!example] A 100-Mark sale
> You list goods worth 100 Marks. The listing fee is 1 Mark (1% of 100, rounded up), so you pay 1 Mark to post. If the whole listing sells, the tax is 5% of 100, or 5 Marks. With no seat Tithe the seller collects 95 Marks; a 10% Palace Tithe would take a further 10, leaving 85. The buyer pays the listed price either way.

Access requires a registered account and the Market, professions and Marks services to be open. Buy orders live 7 days, up to 20 an account.

## Fill a Court writ

The **Work** tab offers Court writs for requested materials. Fill one by delivering the requested quantity from your Stores; the writ pays Marks based on the material's value and adds profession experience. You can complete up to {{fact crafts.courtWritsPerDay}} writs per UTC day. Gathering materials for a writ is one way to connect the [Professions](professions.md) and economy systems.

> [!note] Other tokens
> Soul Cakes, Weir Keys and Welkynd Shards have separate uses and accounting. They are not general substitutes for gold or Marks.

## Common mistakes

- **Forgetting the listing fee is burnt.** Cancel a listing and the fee stays spent; the goods come back, the Mark does not.
- **Splitting a sale to dodge tax.** The tax is charged on the running total, so unit-by-unit sales pay the same.
- **Assuming every board takes a Tithe.** It applies only where a player guild holds the seat that covers the board.
- **Expecting to buy Marks with gold.** The Bank exchanges one way only.

## Next

- [Making money](making-money.md)
- [Gathering](gathering.md)

## Sources

- `src/net/realm/realmGoldLaw.js`: character-save gold and Empire account region
- `src/net/marksLaw.js`: `MARKS_MAX`, `MARK_WORTH_GOLD`, `MARKS_BANK`, `MARKS_COMBAT`, faucet and daily limit laws
- `server-account/src/marks.js`: account-held Marks and service enforcement, Bank exchange
- `src/net/marketLaw.js`: `MARKET_LISTING_S`, `MARKET_LISTINGS_MAX`, `MARKET_ORDERS_MAX`, `MARKET_PRICE_MAX`, `MARKET_TAX_PCT`, `MARKET_TITHE_PCT`, `listingFee`, `saleTax`, `saleTaxOn`, `saleTithe`, `sellerGets`, `COURIER`, `courierFee`, `courierSeconds`
- `src/net/townSeatLaw.js`: `TITHE_CAP` (Palace 10, Crown 15), Market Hall's extra point
- `server-account/src/market.js`: Market access requirements
- `src/net/professionLaw.js`: Court writ pay and experience
- `src/net/festivalLaw.js`, `server-account/src/eg.js`, `src/systems/gate/gateSpoils.js`: separate tokens and items
- Research note: `handbook/research/E2.md`
