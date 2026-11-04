---
title: Caps, timers and resets
summary: The limits players meet use different scopes: account totals, hourly service windows, event clocks, pair counts and world respawns.
stage: reference
order: 30
gate: none
status: draft
tags: [caps, timers, resets, account, events]
verified: e4f093166
---

> [!tip] At a glance
> - Check whether a limit is per character, account, event, pair or service before planning around it.
> - Daily account limits generally use the UTC day; the hourly service limits reset on the clock hour, not at midnight.
> - World schedules and dungeon respawns are clocks, not personal earning caps.
> - Event dates can change; use the live event notice for the current calendar.

## Account and service limits

These are the limits most likely to affect repeated activity. A request-rate limit controls how often the service accepts operations; it does not necessarily cap how much you can gather or earn. Every hourly limit below counts within a fixed clock hour and starts again at the top of the next one.

| Activity | Limit or clock | Scope |
|---|---|---|
| [Renown](../feet/renown.md) | {{fact renown.hourlyXpCap}} XP per account per clock hour, across all its characters; at most 5,000 XP counted per report (the game reports about once a minute) | Account; Court writ Renown is credited on a separate path. |
| [Profession service](../feet/professions.md) | 600 requests per clock hour (a harvest, a withdrawal, a delivery or a choice each count) | Account operation-rate limit, not a daily harvest counter. |
| [Marks service](../feet/money-and-markets.md) | 120 operations per clock hour (an exchange or a guild move each count) | Account operation-rate limit. |
| [Combat Marks](../bay/world-events.md) | {{fact marks.combatPerDay}} Marks per UTC day from Dagon's Breach, town raids, the sea serpent, Redoubts and Starfall together | Shared account UTC-day ceiling across combat reward sources. |
| [Bank of the Empire](../town/banks.md) | {{fact marks.bankPerDay}} Marks exchanged for gold per day (never gold for Marks), at {{fact marks.bankGoldPerMark}} gold per Mark | Account UTC day. |
| [Marks balance](../feet/money-and-markets.md) | 10,000,000 | Account or guild balance ceiling. |
| [Market](../feet/money-and-markets.md) | {{fact market.listingsMax}} active listings and 20 active orders; 60 new posts and 120 other operations per clock hour | Account; listings last {{fact market.listingHours}} hours, orders last seven days. |
| [Gathering nodes](../feet/gathering.md) | A node slot resets at 00:00 UTC and is once per character per day | Character and node slot; there is no general daily harvest counter, though rare high-tier hides are limited to three a day. |
| [Court writs](../feet/money-and-markets.md) | {{fact crafts.courtWritsPerDay}} writs | Account per UTC day. |
| [Motherlodes](../bay/world-events.md) | Three world lodes each UTC day, at most 20 strikers per lode; one Marks reward per account per day | Shared world schedule plus account receipt. |
| [Festival Soul Cakes](../bay/festivals-and-starfall.md) | 120 finds per account per UTC day; 1,500 find requests per day | Account; event dates are configuration and can change. |
| [Starfall](../bay/festivals-and-starfall.md) | Up to nine stars counted per account per UTC day (the day the star fell) | Account; its Marks also count toward the combat Marks ceiling. |
| [Bounties](../town/notice-boards.md) | Four postings per town board per game day; four active bounties per character | Game-day board schedule; a taken bounty lapses after one game day. |

## Event clocks and pair limits

| Event | Clock or limit | What it means |
|---|---|---|
| [Dagon's Breach](../rivals/dagons-breach.md) | One gate per game day of the event clock (two real hours); entry window is 20:00–22:00 on that clock, about ten real minutes | Scheduled world event; a registered account claims each gate at most once. |
| [Town raids](../bay/town-raids.md) | Same two-real-hour game-day schedule; at most 32 raids per game day | One receipt per account per raid; the source establishes no separate daily raid count. |
| [Sea serpent](../rivals/sea-serpent.md) | Rises every second event-clock day (every four real hours) at the dawn watch | One account receipt per serpent. |
| [Arena](../late/arena-seasons.md) | Eight-week season; same rated pair counts five bouts per UTC day and ten per season | Later bouts between that pair can be played unrated. |
| [Royal Tourney](../late/arena-seasons.md) | Same pair counts three bouts per UTC day | Seat-week tournament, open through the week it is proclaimed; separate from the Arena season. |
| [Seat influence](../rivals/city-control.md) | 60 Watch per account per UTC day; gate influence at most 900 and Renown influence at most 400 per account per week; 2,000 per account per seat per week from all sources | Seat week; the Turning occurs Sunday at 18:00 UTC. |
| [Abyss Dungeon](../late/abyss-dungeons.md) | 48-hour unbeaten lifespan; three-minute collapse after defeat; two-hour cooldown; census needs two accounts | Shared world event, not a personal entry cooldown. |

## World timers are not personal caps

Ordinary dungeon foes and containers respawn {{fact dungeon.respawnMinutes}} minutes after they fell or were emptied, Elite Dungeon ones after {{fact dungeon.eliteRespawnMinutes}} minutes, and those in an Abyss Dungeon or the Open Zone's halls after 30 minutes. Each foe and container keeps its own clock, whoever comes and goes. These govern respawns in a world, not how many times your account may earn a reward. The Abyss Dungeon's own rise and fall follow its shared event cycle, above.

Online account daily caps use UTC boundaries, while service-rate limits use clock-hour windows. Each daily book turns its UTC day at its own moment — up to ten minutes after midnight — so a cap or node slot can lag a little past 00:00 UTC; see `src/net/dayTurn.js` `DAY_TURN_SPREAD_MS`. Event schedules run on the shared event clock (a game day every two real hours), which is not the sky's hour you see in the world. A seasonal event's active dates are configurable. When the event notice and an old calendar disagree, follow the current notice.

## A daily and weekly checklist

Keep this page open while you play. The boxes are saved in this browser and reset on the game's UTC clock; the limits themselves are in the tables above.

```checklist daily
- [ ] Check the Notice Board's Seat and Work tabs for writs and bounties you can fill.
- [ ] Spend the day's combat Marks and bank exchange before they reset.
- [ ] Clear the day's gathering node slots before the day turns.
- [ ] Post or refresh market listings you want seen today.
- [ ] Check the HUD event board for today's shared events.
```

```checklist weekly
- [ ] Check the guild's seat pledge before the Friday 18:00 UTC lock.
- [ ] Check the seat standings before the Sunday 18:00 UTC Turning.
- [ ] Review Arena and Royal Tourney pair counts before a rated bout.
- [ ] Review your Renown and craft plans before spending stars or a craft rank.
```

## Common mistakes

- Treating an operation-rate limit as a daily reward cap can make you stop an activity for the wrong reason.
- Treating all daily resets as local midnight ignores the UTC account bucket.
- Counting an event schedule as a personal cooldown mixes shared world timing with account receipts.
- Treating the Arena pair limit as a cap on every match ignores its pair scope.

## Next

- [Arena seasons and the Royal Tourney](../late/arena-seasons.md)
- [Questions new players ask](questions.md)

## Sources

- `src/net/renown.js`, `server-account/src/renownTracks.js`: `RENOWN_XP_REPORT_MAX`, `RENOWN_XP_HOUR_MAX`, the clock-hour window
- `server-account/src/accounts.js`: `overRate` (fixed clock-hour windows for the service rate limits)
- `src/net/professionLaw.js`, `src/net/nodeLaw.js`: profession request rates, node slots, hides, claims and writs
- `src/net/marksLaw.js`: operation rate, balance, combat, gathering and bank limits
- `src/net/marketLaw.js`: market operations, listing/order counts and lifetimes
- `src/net/motherlodeLaw.js`, `server-account/src/motherlodes.js`: Motherlode schedule and account receipts
- `src/net/festivalLaw.js`, `server-account/src/stars.js`, `src/net/starfall/starfallLaw.js`: event reward caps
- `src/net/gate/gateLaw.js`, `src/net/raid/raidLaw.js`, `src/net/serpent/serpentLaw.js`: shared event clocks and receipts
- `src/net/arena/arenaLaw.js`, `src/net/townSeatLaw.js`, `src/net/siege/siegeRef.js`: Arena, Royal Tourney and seat limits
- `src/systems/bounty/bountyBoard.js`: `BOUNTIES_PER_DAY`, `BOUNTY_ACTIVE_MAX`, `BOUNTY_LIFETIME_MINUTES`
- `src/net/wire.js`, `src/net/skyLaw.js`: the event clock (`sharedClassicMinutes`) and the sky clock; `RESPAWN_MS`
- `src/net/dayTurn.js`: `DAY_TURN_SPREAD_MS` (daily books turn up to ten minutes after 00:00 UTC)
- `src/net/superDungeon/sdLaw.js`, `src/systems/dungeon/dungeonRespawn.js`: shared and dungeon respawn timers (`dungeonRespawnMs`)
- Research note: `handbook/research/X1.md`; `handbook/research/L1.md`
