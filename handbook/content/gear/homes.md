---
title: Owning a home
summary: Buying a home online, its storage, bed and entry settings.
stage: gear
order: 60
gate: registered
status: draft
verified: e4f093166
tags: [homes, housing, storage, towns]
---

> [!tip] At a glance
> - A registered account can buy an available town building as an online home at its door.
> - Online homes cost {{fact home.priceMin}} to {{fact home.priceMax}} gold; the price depends on the building's footprint and town size.
> - A home belongs to your **account**: every character of yours may use, furnish and sell it.
> - Each character may count up to three homes against its own cap; deleting that character releases the homes it bought.
> - Your home gives you storage, a bed and a door you can enter at any hour. Set entry to **Private**, **Party**, **Public** or **Guild**; the default is Private.

## Buy a town building

Online homes are bought at a building's front door and recorded by DFO's account service. Price reflects the building's ground footprint and the town's size, then is rounded and kept within the law's minimum and maximum. If the service cannot measure a building's footprint, that building is not offered for sale.

A home belongs to the **account** that bought it, not to one character. The character who bought it is recorded as the buyer: its three-home cap counts that home, and deleting that character removes the home from the online world. Every other character on the same account may walk in, keep it, furnish it, rent it out and sell it. A deed that a knightly order grants stays its knight's alone.

This is separate from an offline house in your save: offline ownership does not make a building your registered online home, and an online home does not change your offline save.

## Make the home yours

Your online home provides storage and a bed, and its door stays available to you at any hour. Other players' entry depends on the setting you choose:

| Entry setting | Who can enter |
|---|---|
| Private | You alone |
| Party | You and your party |
| Public | Anyone |
| Guild | Members of your character's guild |

New homes start Private. Change the setting when you want to share your home; the public listing identifies an online home and its owner.

> [!online] Online rule
> A home on the online registry controls online ownership and access. The source explicitly keeps an offline house's storage and bed for its owner when that building is separately purchased online by someone else.

## Next

- [Banks](../town/banks.md)
- [Taverns and rooms](../town/taverns-and-rooms.md)

- [Safe storage](safe-storage.md)
## Sources

- `src/net/homeLaw.js`: `HOME_CAP` (three per character), `HOME_ENTRIES`, `HOME_ENTRY_DEFAULT`, `homeOnlinePrice` and the price law
- `server-account/src/homes.js`: `ACCOUNT-HOMES` — a home is its account's, `char_id` is the buyer whose cap counts it, and `realm.js` `deleteRealm` removes a deleted character's homes
- `src/systems/online/onlineHomes.js`: online door, storage, bed and access behavior
- Research note: `handbook/research/E2.md`
