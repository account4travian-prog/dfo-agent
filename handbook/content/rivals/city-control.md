---
title: City control
summary: Seats, influence, the weekly Turning, edicts and sieges.
stage: rivals
order: 60
gate: renown 10
status: draft
tags: [city control, seats, influence, guilds, sieges]
verified: e4f093166
---

> [!tip] At a glance
> - Player guilds compete for a town's seat, its **Charter**, through influence; membership gives nothing.
> - The week runs Turning to Turning. Pledges lock at the **Reckoning** (Friday 18:00 UTC); the Turning settles Sunday 18:00 UTC.
> - An account is capped at 2,000 influence per seat per week; a Palace needs 6,000, a Crown 30,000. A held Charter has upkeep and can be challenged by a Right of Siege.

## Which towns have seats

A seat is a town's player-guild Charter. The three **Crown seats** are **Daggerfall**, **Wayrest** and **Sentinel**; every other location with a Palace in its records is a **Palace seat**. A town without a Palace has none, and a location is one seat however many Palaces it holds. Crown reach and the Free Lands' Watch bonus boost claims.

## Pledge a town

The week has three parts: **Muster**, from Sunday's Turning; **Reckoning**, its last 48 hours; **Turning**, when everything settles. A Guildmaster or Officer pledges during the Muster: one seat in a region, in up to five regions. Pledges lock at the Reckoning, but influence earned then still counts. A guild that holds a seat is pledged there automatically and cannot pledge to another seat in that region; unpledged work earns nothing. Influence counts for the guild your account is bound to — the first guild one of your characters contributes to that week — and only from a character seven days in the guild.

## Earn influence

| Contribution | Influence | Limits |
|---|---|---|
| The Watch | 1 per tick | Online in the seat town, moving; 60 a UTC day |
| Oblivion Gate | 300 a receipt | 3 claims in the region must agree; 900 an account a week |
| Renown in the region | 1 per 20 XP | 400 an account a week |
| A home in the seat town | 25 a whole day | 5 homes per guild at that seat |
| Seat writ | 1 per Mark of value | Own units count fully; bought units at Tribute's rate |
| Tribute | 1 per 10 Marks | Spent; at most a fifth of the guild's whole week at that seat; Guildmaster only |
| Orc Raid camp | 50 a camp | During its Tide; 5 a day, 250 an account a week |

Each account contributes at most **2,000 influence per seat per week**. Ten percent of a guild's influence carries into the next week as **Legacy**.

## Thresholds, fees and upkeep

| Seat | Claim threshold | Fee | Upkeep a week |
|---|---:|---:|---:|
| Palace | 6,000 | 8,000 Marks | 2,500 × the server's activity scale |
| Crown | 30,000 | 80,000 Marks | 15,000 × the server's activity scale |

A claim needs the threshold and the fee in the guild's Marks treasury. If the second claimant is within 10% of the first on an unheld seat, neither takes it: the two fight a **Tourney**.

Holding more than one seat costs more: upkeep rises 25% per extra seat-weight and defence falls 5%, with a Palace weighing 1 and a Crown 3. Standing starts at 50 and caps at 100, and shifts defence. A short Marks balance puts the Charter into Neglect at −10 Standing, and a second short week in a row lapses it.

## What holding a Charter gives

The holder sets a whole-number **Tithe** once a week: up to 10% at a Palace and 15% at a Crown, a Market Hall raising the cap. It comes from local sales and board fees and goes to the guild's treasury.

The holder sets one **Edict** a week, paid at the Turning; the same Edict cannot repeat except **Market Day**, which cuts shop prices 10% for everyone. Members get 10% off at a Palace or 15% at a Crown, and Standing 80 adds 5%.

## Sieges and fortifications

The Turning names a Right of Siege for a held seat. The holder picks the day and start hour, Wednesday to Saturday between 16:00 and 02:00 UTC (default Wednesday 20:00). A Palace battle lasts 30 minutes, a Crown battle 45, a Tourney 20, and rosters close 10 minutes before. A side fields 10 at a Palace or 20 at a Crown, plus up to 2 or 4 Sellswords; a fighter must have been seven days in the guild at the Turning and bound to it in the week that won the Right.

At a Palace the attackers take the Gate, Market and Temple banners, then hold the Throne: 2 of 3 banners opens it, and the Throne must stay uncontested for 120 seconds. A Palace with tier-3 Walls adds a Gatehouse. At a Crown they need 3 of 4 banners, then the Gatehouse, then 180 seconds on the Throne. A Gatehouse must be breached. If time runs out the holder keeps the seat.

A defence adds 15 Standing (10 if the attackers reached the Throne) and 20% defence at the next Turning; a forfeit gives 10 and the same bonus. A capture moves the Charter, drops each fortification one tier and clears the former holder's Legacy.

Fortifications: **Walls** quicken defender waves; **Gatehouse** adds 50% gate vitality a tier and needs a Crown or tier-3 Walls; **Watchtowers** warn at half or a quarter of the defence; **Barracks** add guards; a **Market Hall** adds listings and Tithe cap; a **Shrine** adds gate influence and Standing. A project stands 2, 4 or 7 days after its last material, and seat writs supply it.

> [!example] What a guild does in a week
> A five-member guild targets a Palace. The Officer pledges during the Muster. Through the week they patrol the town for Watch ticks, run one gate and deliver gathered materials to the seat writ. Suppose four accounts finish on 1,500 influence each: that is 6,000, exactly the Palace threshold, and every account is under the cap.
>
> At the Turning the claim succeeds if the treasury can pay the 8,000 Marks fee and the coming week's upkeep. At an activity scale of 1.0 that is 2,500 Marks, so plan for about 10,500 Marks for the first week. A Crown's 30,000 needs about fifteen capped accounts, so Crowns usually belong to large guilds. These figures are an example, not a plan.

## Common mistakes

- **Confusing a pledge with a Charter.** The claim resolves at the Turning and must meet its tier's threshold and fee.
- **Contributing too early.** Your character must be seven days in the guild.
- **Burning Marks on Tribute first.** Tribute is capped at a fifth of the guild's whole week and is spent.
- **Assuming a guild can keep a seat without upkeep.** Unpaid Charters lapse, and several seats cost more.

## Next

- [Player guilds](player-guilds.md)
- [The Arena](../bay/the-arena.md)

## Sources

- `src/systems/town/townSeats.js`: `seatOfLocation`, `deriveTownSeats` (which locations have seats)
- `src/net/townSeatLaw.js`: `SEAT_WEEK_MS`, `SEAT_RECKONING_MS`, `SEAT_PLEDGE_REGIONS_MAX`, `WATCH_INFLUENCE`, `WATCH_DAY_CAP`, `GATE_INFLUENCE`, `GATE_WEEK_CAP`, `GATE_REGION_AGREE`, `HOME_INFLUENCE_DAY`, `HOMES_SEAT_MAX`, `RENOWN_XP_PER_INFLUENCE`, `RENOWN_WEEK_CAP`, `WRIT_INFLUENCE_PER_MARK`, `TRIBUTE_MARKS_PER_INFLUENCE`, `TRIBUTE_SHARE_MAX`, `ACCOUNT_SEAT_WEEK_CAP`, `SEAT_MEMBER_WAIT_S`, `SEAT_LEGACY_SHARE`, `CLAIM_THRESHOLD`, `CLAIM_FEE`, `CONTESTED_MARGIN`, `SEAT_UPKEEP`, `CROWN_SCALE`, `SEAT_WEIGHT`, `OVERREACH`, `STANDING_START`, `STANDING_MAX`, `STANDING_LOVED`, `STANDING_CHANGES`, `TITHE_CAP`, `MEMBER_DISCOUNT`, `SIEGE_WINDOW_DAYS`, `SIEGE_WINDOW_HOURS`, `BATTLE_LENGTH_MS`, `SIEGE_SIDE_MAX`, `SELLSWORDS_MAX`
- `src/net/fortLaw.js`: `FORT_WORKS`, `FORT_TIER_DAYS`, `WALLS_WAVE_STEP_MS`, `GATEHOUSE`, `RAM`, `barracksGuards`, `marketHallListings`, `shrineGateInfluence`, `watchtowerShare`
- `src/net/watchReceipt.js`: `WATCH_TICK_MS`; `src/net/tideLaw.js`: `TIDE_EFFECTS`
- `src/net/siege/siegeRef.js`, `siegeHerald.js`: battle field and announcements
- `server-account/src/seatInfluence.js`: `creditGate`, `creditRenown`, `creditSeatWrit`, `payTribute`
- `src/ui/seatTab.js`; `bible/11-Multiplayer/Seats-Arc.md`; research: `handbook/research/R2.md`, `W1.md`
