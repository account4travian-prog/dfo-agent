# Caps, Timers and Catch-Up

*Source snapshot: DFO main `4bba28c6c` (2026-10-20). This is an online-only inventory. “Account” means the registered account where the service says so; character and pair limits are called out separately. A world schedule or a rate limit is not automatically an earning cap.*

## Hourly limits

| System | Enforced limit | Scope and reset | What it means |
|---|---|---|---|
| Renown reports | `RENOWN_XP_REPORT_MAX = 5,000` XP per report; `RENOWN_XP_HOUR_MAX = 15,000` XP per clock hour | Account-wide across characters; hour buckets roll on the service clock hour. Reports are sent at most once per `RENOWN_REPORT_MS = 60,000` ms under normal tracking. | A single report cannot claim more than 5,000. The hourly amount is the account cap on service-reported XP (including Starfall credit). Court-writ Renown is credited by a separate path explicitly outside this hourly bound. Reported XP can be clipped to the remaining hourly allowance. |
| Profession service | `PROF_OPS_MAX = 600` requests per `PROF_OPS_WINDOW_S = 3,600` seconds | Account-wide rolling rate window. A harvest, withdrawal, delivery and choice each count. | This is a request-rate ceiling, not a limit on legitimate gathering XP or harvests per day. |
| Marks service | `MARKS_OPS_MAX = 120` operations per `MARKS_OPS_WINDOW_S = 3,600` seconds | Account-wide rolling rate window. | Exchange and guild Marks moves count; this is not a limit on all ways of earning Marks. |
| Market | `MARKET_POSTS_MAX = 60` new posts per `MARKET_WINDOW_S = 3,600` seconds; `MARKET_OPS_MAX = 120` other market operations per same window | Account-wide rolling rate window. | Limits listing/order churn, not sales value per hour. Active listing and order counts are in the once/active table. |

*Sources: `src/net/renown.js` (`RENOWN_XP_REPORT_MAX`, `RENOWN_XP_HOUR_MAX`, `RENOWN_REPORT_MS`); `server-account/src/renownTracks.js` (hour bucket and report decision); `src/net/professionLaw.js` (`PROF_OPS_MAX`, `PROF_OPS_WINDOW_S`); `src/net/marksLaw.js` (`MARKS_OPS_MAX`, `MARKS_OPS_WINDOW_S`); `src/net/marketLaw.js` (`MARKET_POSTS_MAX`, `MARKET_OPS_MAX`, `MARKET_WINDOW_S`).*

## Daily limits and daily world resets

| System | Enforced limit or schedule | Scope and reset | What it means |
|---|---|---|---|
| Gathering nodes | Each node slot can be harvested once by a character per UTC day. Wilderness pixels have finite climate-specific slots; trees/herbs/veins were explicitly left without a daily player harvest cap. | Node keys include UTC day; reset at `00:00 UTC`. Availability varies by pixel and climate. Bantha has 48 tree slots per pixel/day. | The practical limit is where you travel and the day's nodes, not a daily harvest counter. Fishing/hauling is not given a daily player cap by the profession law. |
| Rare hides / Deep Delver | High-tier hides: `HIGH_HIDES_PER_DAY = 3` per account/day. Unconfirmed dungeon veins: `DEEP_UNCONFIRMED_PER_DAY = 4` per account/day, at most the dungeon's own count. | UTC day. Confirmed dungeon veins use their finite 1–4 daily slots instead. | Deep Delver's extra yield is not a daily earning cap; the four-per-day rule is the anti-forgery bound for unconfirmed dungeon claims. |
| Motherlodes | Three world Motherlodes per UTC day (`MOTHERLODES_A_DAY = 3`); each account may earn the Motherlode Marks reward once per UTC day. Each lode admits up to 20 strikers. | World lodes are scheduled in three eight-hour blocks with up to six hours of rise spread; individual account reward resets `00:00 UTC`. | The ore and the Marks faucet are different limits. The 20-striker count is shared by all players on that lode. |
| Court writs | Three filled writs per account per UTC day (`COURT_WRITS_PER_DAY = 3`). | `00:00 UTC`. | Writ delivery also awards its own Marks and profession XP. |
| Marks from combat | `MARKS_COMBAT.perDay = 150` Marks/account/day, shared by Dagon gates, town raids, serpent, Elite Breach Redoubts and Starfall. The last award is clipped to the remaining amount. | `00:00 UTC`. | This is a shared ceiling, so earning the full amount from one activity leaves less for the others. |
| Other capped Marks faucets | Gathering finds: at most 30/account/day. Corpse, pile and search finds combined: at most 20/account/day. Bank exchange: at most 300 Marks/account/day. | All reset at `00:00 UTC`. | These are separate caps from the combat ceiling. Marks balance itself is capped at 10,000,000. |
| Festival Soul Cakes | At most 120 found per account per UTC day; the service also bounds find requests to 1,500/day. Night bonuses double a find's amount but do not raise the daily cap. | UTC day while the Witches' Festival is open. 2026 window: 20 Oct through 7 Nov inclusive (end instant 8 Nov 00:00 UTC). | Cakes belong to the account and are shared across its characters. Spending/offering moves the account count; it does not reset per character. |
| Starfall | Three stars fall each real-clock night/hour while the festival runs. An account can claim credit for at most nine stars on the UTC day each star fell; a star counts once per account. | Stars are at fixed points in each real hour; account claim count resets `00:00 UTC`. | Nine is the account reward limit, not the number of stars the world can spawn. Stars also share the 150 Marks combat cap. |
| Dagon's Breach | One gate per game day; one account claim per gate. Game day = two real hours. The gate opens 20:00–22:00 on the game clock (about ten real minutes). | World schedule, not a daily personal lockout. New game day/gate every two real hours. | More than one gate can occur in a UTC day. Account can claim each event once, subject to the shared combat Marks ceiling. |
| Town raids | Each account may claim one receipt per raid, after striking a raider and being present at the cleanse. Raids are placed on the shared two-real-hour game-day schedule; the law rolls half a raid per eligible region (maximum 32 raids per game day from `RAID_REGIONS_MAX = 64`). | New raid schedule each game day; each raid's own window is two game hours. | No separate daily account raid-count cap was found. Each raid is once per account and its reward shares the combat Marks ceiling. |
| Sea serpent | Sethrakul rises every two game days, i.e. every four real hours, at the dawn watch; the encounter runs from 05:00 to 10:00 game time. One receipt per account per serpent. | World schedule, not one-per-day. | Each encounter can be claimed once; its Marks share the combat ceiling. |
| Bounty board | Four postings per town per game day (`BOUNTIES_PER_DAY = 4`); a character can hold at most four active bounties, each lasting one game day. | Board refreshes on the game-day clock (two real hours); held bounty expires after 1,440 classic minutes. | This is a rotating board plus a character ledger cap, not an account-wide four-per-day completion limit. |
| Arena | A rated pair can produce at most five counted bouts per day and ten per Arena season. Further bouts are kept unrated. | Pair limits reset on UTC day and at the Arena season boundary; seasons are eight weeks from `ARENA_SEASON_EPOCH_S`. | It limits repeated rating farming against the same opponent, not each player's total daily matches against different opponents. |

*Sources: `src/net/nodeLaw.js` (`NODE_COUNTS`, `nodeCount`, `treeSlots`, `JUNGLE_TREE_SLOTS`); `src/net/professionLaw.js` (`HIGH_HIDES_PER_DAY`, `DEEP_UNCONFIRMED_PER_DAY`, `COURT_WRITS_PER_DAY`; CAP-OFF comment); `src/net/motherlodeLaw.js` (`MOTHERLODES_A_DAY`, `MOTHERLODE_THIRD_S`, `MOTHERLODE_RISE_SPREAD_S`, `MOTHERLODE_STRIKERS`); `src/net/marksLaw.js` (`MARKS_COMBAT`, `MARKS_FAUCETS`, `MARKS_BANK`, `MARKS_MAX`, `utcDay`); `server-account/src/marks.js` (`combatStrikeStatement`, `claimGate`, `claimRaid`, `claimSerpent`, `claimEg`); `src/net/festivalLaw.js` (`FIND_CAKES_PER_DAY`, `FIND_ASKS_PER_DAY`, `FESTIVALS`); `server-account/src/festival.js`; `src/net/starfall/starfallLaw.js` (`STAR_PER_NIGHT`, `STAR_HOUR_MS`); `server-account/src/stars.js` (`STAR_CLAIMS_DAY_MAX`, `claimStar`); `src/net/gate/gateLaw.js` (`GATE_EVERY_DAYS`, `gateTimes`); `src/net/raid/raidLaw.js` (`raidsPerDay`, `RAID_REGIONS_MAX`, `RAID_SLOTS_MAX`, `RAID_WINDOW_MINUTES`); `src/net/serpent/serpentLaw.js` (`SERPENT_EVERY_DAYS`, `serpentTimes`); `src/systems/bounty/bountyBoard.js` (`BOUNTIES_PER_DAY`, `BOUNTY_ACTIVE_MAX`, `BOUNTY_LIFETIME_MINUTES`); `src/net/arena/arenaLaw.js` (`ARENA_PAIR_DAY_MAX`, `ARENA_PAIR_SEASON_MAX`, `ARENA_SEASON_S`).*

## Weekly and seasonal limits

| System | Enforced limit or schedule | Scope and reset | What it means |
|---|---|---|---|
| Tides and seat week | Tides change each seat week. The week turns Sunday at 18:00 UTC. A season is eight seat weeks. | Sunday 18:00 UTC weekly Turning; season ends at its eighth Turning. | A Tide is a weekly world modifier to yields/costs, not a personal weekly gathering quota. Read the current Tide before choosing a route. |
| Seat influence | `WATCH_DAY_CAP = 60` watch influence per account/day; `GATE_WEEK_CAP = 900` gate influence and `RENOWN_WEEK_CAP = 400` Renown XP-derived influence per account/week; total `ACCOUNT_SEAT_WEEK_CAP = 2,000` influence/account/week. | Daily Watch at UTC midnight; weekly caps at Sunday 18:00 UTC Turning. | These cap political influence toward seats, not the character's actual Renown XP or Marks. |
| Elite Breach | A Redoubt pays its Marks once per account per Redoubt per Arena week; reward is under the combat Marks daily cap. | Arena week (seven days); its season is eight weeks. | The source supports a weekly claim limit for each Redoubt, not a blanket one-run-per-week limit on the whole Breach. |
| Royal Tourney | The same pair can have at most `ROYAL_PAIR_DAY = 3` counted bouts per UTC day. No separate weekly attempt or prize cap was found in the cited law. | The tournament is proclaimed for a seat week; sign-up closes ten minutes before battle. | A pair limit, not a whole-player daily cap. |
| Seasonal herbs | Herb node slots still reset daily. `SEASON_MULT = 1.5` and `OFF_SEASON_MULT = 0.5` change seasonal yield; they are not seasonal harvest quotas. | Seasons follow the online game calendar, while node slots reset at `00:00 UTC`. | Harvest availability is bounded by the daily node map, not a season-long player allowance. |
| Witches' Festival | Seasonal event, 20 Oct–7 Nov 2026 UTC. Starfall runs only while the event is open. | Event end is 8 Nov 00:00 UTC. | The daily Cake and Starfall caps above are inside this limited event window. The source has only the 2026 festival row staged. |

*Sources: `src/net/townSeatLaw.js` (`SEAT_WEEK_MS`, `SEAT_WEEK0_MS`, `WATCH_DAY_CAP`, `GATE_WEEK_CAP`, `RENOWN_WEEK_CAP`, `ACCOUNT_SEAT_WEEK_CAP`, `SEASON_WEEKS`, `SIGN_CLOSES_MS`, `ROYAL_PAIR_DAY`); `src/net/tideLaw.js` (`tideOf`, `tideYield`); `src/net/marksLaw.js` (Redoubt weekly once-per-account note); `src/net/nodeLaw.js` (`SEASON_MULT`, `OFF_SEASON_MULT`, `herbSeasonMult`); `src/net/festivalLaw.js` (`FESTIVALS`); `src/net/starfall/starfallLaw.js` (`starfallRuns`).*

## Instance, loot and other timers

| System | Timer or limit | Scope and reset | What it means |
|---|---|---|---|
| Ordinary dungeon respawn | 20 minutes after a foe dies or container is emptied. Elite dungeon: 40 minutes. | Per foe/container, from its own last death/empty time; leaving does not restart the clock. | A world respawn timer, not a per-player cooldown. Wilderness and Super Dungeon use the shared `RESPAWN_MS` value instead. |
| Plain foe loot | At most three carried items including gold; ordinary foes in an Elite Dungeon: five. | Per foe death; bosses, world bosses and named/elite/champion/revenant foes are outside this plain-foe cap. | A per-kill supply cap; no daily gold earning cap was identified here. |
| Super Dungeon | Only one Hollow is active at a time. It rises in the most populated eligible region (at least two accounts in the census); it lasts up to 48 hours. A kill causes a three-minute collapse, then a two-hour cooldown; an unbeaten Hollow fades at 48 hours, then the two-hour cooldown applies. | World event clock. | This bounds how long the same Hollow exists, not a player's number of entries per day. No personal daily Super Dungeon entry cap was found. |
| Bounty | A taken bounty lapses after one game day (1,440 classic minutes). | Character-held bounty. | Already counted in the daily board section; it is a time-to-complete limit. |
| Market listings/orders | Up to 30 active listings and 20 active orders. Listings last 72 hours; orders last seven days. | Account's active board records; expiry frees a slot. | Open listings/orders are finite, but repeatedly posting is rate-limited separately above. |
| Wealth budget | `BUDGET_DEFAULT.enforce = false` (measure-only). | No live reset-based earnings cap while enforcement is false. | The `realm_wealth_hours` ledger records gains/losses and play time. In the measured default state excess gains are findings, not held trades. The code says staff can enable enforcement; do not assume that is active. |

*Sources: `src/systems/dungeon/dungeonRespawn.js` (`DUNGEON_RESPAWN_MS`, `ELITE_DUNGEON_RESPAWN_MS`, `dungeonRespawnMs`); `src/systems/foeLootCap.js` (`PLAIN_FOE_LOOT_CAP`, `ELITE_DUNGEON_FOE_LOOT_CAP`, `titledFoe`); `src/net/superDungeon/sdLaw.js` (`SD_LIFETIME_MS`, `SD_COLLAPSE_MS`, `SD_COOLDOWN_MS`, `SD_CENSUS_MIN`, `sdRise`); `bible/11-Multiplayer/Super-Dungeons.md` §§1–3; `src/systems/bounty/bountyBoard.js` (`BOUNTY_LIFETIME_MINUTES`); `src/net/marketLaw.js` (`MARKET_LISTINGS_MAX`, `MARKET_ORDERS_MAX`, `MARKET_LISTING_S`, `MARKET_ORDER_S`); `bible/06-Systems/Integrity-Arc.md` §INT5 (`realm_wealth_hours`, `BUDGET_DEFAULT.enforce`, measure-first behavior).*

## Account-wide and permanent bounds

| Limit | Scope |
|---|---|
| Renown progression | A Renown track belongs to a character; an account can hold at most 60 tracks. Each track stops at `RENOWN_XP_MAX` (Renown 50). The hourly cap still pools across all characters. |
| Professions | Gathering has no daily player cap beyond world node slots and the account's 600/hour service rate. Only two crafts may rise above Journeyman (rank 50); this is a permanent account/track choice, not a timer. |
| Motherlode / Starfall / combat marks | Motherlode reward once per account/day; Starfall once per (star, account) and nine per account/day; combat Marks are pooled account-wide. Alts do not multiply them. |
| Legacy inheritance | An heir's stats and skills receive bounded bonuses from the parent; the estate passes one quarter of carried gold, capped at 9,900. This is a boost on a new descendant, not a repeatable XP multiplier. |

*Sources: `src/net/renown.js` (`RENOWN_XP_MAX`, `RENOWN_TRACKS_MAX`); `src/net/professionLaw.js` (`CRAFTS_ABOVE_JOURNEYMAN`, `JOURNEYMAN_RANK`); `src/net/motherlodeLaw.js` and `server-account/src/motherlodes.js`; `server-account/src/stars.js`; `src/net/marksLaw.js`; `src/systems/legacy/legacyLaw.js` (`ESTATE_SHARE`, `ESTATE_MAX`) and `bible/06-Systems/Legacy-Arc.md` §5 (inheritance bonuses).*

## Catch-up levers

- **Mentor mode is automatic in a party.** A higher-level character mentors when the target would be at least three levels below their real level. The group reference is the harmonic mean of partner levels; the target is rounded reference level plus one, capped at the mentor's real level. The mentor's real save is untouched. Skills above 30 scale by `sqrt(target / real)` and cap at `5 × target + 40`; attributes shed a five-point-per-level pool, apportioned above 40; health/damage and gear protection are scaled; the dungeon spawn level and loot tables use the mentored level. The source explicitly says skill tallies above 100 are weighed against real skill, so weak foes do not train the mentor. It does not specify a bonus XP multiplier for the lower-level player.
- **Party Renown is additive, not split.** Every party member receives the full kill award, with +10% per additional member in the room; a full party of eight reaches +70%. This improves shared kill efficiency, but does not create catch-up levels for the lower member beyond the same kill award.
- **Legacy heirs inherit a little.** Each attribute gets `clamp(round((parent − 50)/10), 0, 3)`; each parent primary/major skill gets `clamp(floor(parent skill/20), 0, 3)`. Heirs also receive one quarter of carried gold up to 9,900 as a credit. This reduces some rebuild cost, but is a family system, not a rested bonus.
- **No rested or returning-player XP bonus was found** in the online Renown and mentor laws reviewed for this brief.

*Sources: `src/systems/mentorMode.js` (`mentorTargetLevel`, `mentorProfile`, `mentoredSkill`, `mentoredStat`, `effectiveLevel` and its top-of-file rule notes); `src/net/renown.js` (`renownPartyXp`, `RENOWN_PARTY_BONUS_PCT`, `RENOWN_PARTY_COUNT_MAX`); `src/systems/legacy/legacyLaw.js` (`BLOOD_MAX`, `HEARTH_MAX`, `ESTATE_SHARE`, `ESTATE_MAX`) and `bible/06-Systems/Legacy-Arc.md` §5; `server-account/src/renownTracks.js` (no rested credit path in the online report/account cap logic).*

## Where extra hours still matter

These activities do not have a verified daily/weekly per-player earning ceiling in the cited live laws, so long sessions can keep adding progress until ordinary progression, world availability, inventory/storage or the hourly service rate gets in the way:

- Character levels and ordinary skill practice, including Hand-to-Hand; the hourly Renown cap does not cap Daggerfall skill use.
- Profession harvesting XP and materials after the finite map nodes are exhausted, until the next UTC node refresh; there is no separate daily harvest counter. The number of useful nodes and travel time matter.
- Quest completion and loot outside the Renown account-hour cap; questline letters have pacing, but an already-open quest is not shown as a daily completion quota.
- Dungeon fights and ordinary loot over repeated respawns. Plain foe loot is capped per kill, not per hour. Bosses and named foes are excluded from that cap.
- Market sales and gold accumulation: the market limits active listings and posting rate, but the reviewed code shows no universal daily gold-earning cap. The wealth budget is measure-only by default.
- Arena matches against different opponents; the verified rating limit is per pair.

*Sources: `src/net/professionLaw.js` CAP-OFF comment and `src/net/nodeLaw.js`; `src/net/renown.js`; `src/systems/foeLootCap.js`; `src/net/marketLaw.js`; `bible/06-Systems/Integrity-Arc.md` §INT5; `src/net/arena/arenaLaw.js` pair caps.*



