# City Control and Guilds

*For DFO Online, studied against main commit `4bba28c6c` (2026-10-20). This describes the built rules, not a live reading of who holds what today. `src/` paths below are inside the upstream source tree.*

A town’s **seat** is its player-guild Charter. One guild holds it at a time; that guild can rule parts of the town’s economy and build defenses. Other guilds compete by pledging influence, then may earn a scheduled siege. You can follow the contest without joining a large guild, and you can help materially even if your character is not ready to lead a war.

## Which places have seats?

The three **Crown seats** are Daggerfall, Wayrest and Sentinel. Each is a major city and its castle is the seat-holding guild’s hall. A **Palace seat** is every other base-game location whose building records contain a Palace. A hub without a Palace is not a seat. The code derives the list from the world’s locations at startup, so the complete list can depend on the installed base data; the Overworld map and each town’s card are the practical way to find them. A location is only one seat even if its records contain several Palaces.

The three Crowns cover their kingdoms; other seats lie in the kingdom regions, the three contested Marches (Betony, Anticlere and Lainlyn), or the Free Lands. A crown-holder gains influence reach in its own kingdom and the relevant Marches. Free Lands have no crown reach. A town with no Palace has no seat Charter, even if it is a regional hub.

*Sources: `src/systems/town/townSeats.js` `seatOfLocation` / `deriveTownSeats`; `src/net/townSeatLaw.js` `CROWN_SEAT_REGIONS`, `seatReach`; `bible/11-Multiplayer/Seats-Arc.md` §§3.1, 4.3.*

## Influence and the weekly Turning

Guilds choose where their work counts. Each week an Officer or Guildmaster can pledge to **one seat in a region**, across up to **five regions**. A guild holding a seat is automatically pledged there and cannot pledge to another seat in that region. Work done in an unpledged region earns no seat influence. Pledges lock for the final **48 hours**, the Reckoning.

The week is real time: **Sunday 18:00 UTC** begins the Muster; **Friday 18:00 UTC** begins the Reckoning; the Turning settles the week on the next Sunday at 18:00. The service does not need a scheduled job: the first seat request after the boundary settles that week once. During the Reckoning you can still add influence, but pledges are fixed and standings are visible.

| Contribution | Influence | Limits and requirements |
|---|---:|---|
| The Watch | 1 per signed tick | The relay issues a tick every 2 minutes while your online character is in the seat’s map pixel and has moved in the last 5 minutes. Up to 60 per account per UTC day. |
| Oblivion Gate | 300 per counted receipt | The service accepts a region when at least 3 claims agree. Up to 900 per account per week. |
| Renown earned in the region | 1 per 20 Renown XP | Up to 400 per account per week. |
| Home in the seat’s town | 25 per whole day | Up to 5 homes per guild at the seat. |
| Seat writ delivery | 1 per Mark of eligible material value | Your own gathered or crafted units count at full value. Bought units count only at Tribute’s rate. |
| Tribute | 1 per 10 Marks | Marks are spent; total Tribute is at most one fifth of that guild’s non-Tribute influence at the seat. Guildmaster only. |
| Orc Raid camp during its Tide | 50 per camp | Up to 5 a day and 250 per account per week. |

A character must have been in its guild for **7 days** before it contributes. Each account is bound to the first guild it contributes for during that week; its other characters cannot add to a rival guild’s war. One account contributes at most **2,000 influence per seat per week** across sources. Ten percent of guild influence carries as Legacy into the next week. A Crown can add reach to eligible palace seats in its kingdom; on a March, each relevant Crown adds **12.5%**. The Free Lands instead add **10% to Watch influence**.

At the Turning, the highest claimant needs **6,000 influence** for a Palace or **30,000** for a Crown. A new Charter costs the guild **8,000** or **80,000 Marks** from its Marks treasury. If the second claimant is within **10%** of the first on an unheld seat, neither takes it immediately: both fight a Tourney. A guild must have enough Marks to pay the fee.

At a held seat, the holder’s defence combines its own influence, Standing, any siege-hold bonus, crown reach where applicable, and Legacy. Fortifications affect the battle, not this calculation. The strongest eligible guild-seat pair receives each Right of Siege, with a guild and seat each used once; so a guild can receive at most one Right in a week. An unchallenged holder gains **5 Standing**. A seat that changes hands is in truce from an immediate repeat challenge.

*Sources: `src/net/townSeatLaw.js` `SEAT_WEEK_MS`, `SEAT_RECKONING_MS`, `SEAT_PLEDGE_REGIONS_MAX`, `accountSeatInfluence`, `turningPlan`, `CLAIM_THRESHOLD`, `CLAIM_FEE`, `CONTESTED_MARGIN`, `seatDefence`; `src/net/watchReceipt.js` `WATCH_TICK_MS`, `WATCH_MOVED_MS`; `server-account/src/seatInfluence.js` `pledgeSeat`, `creditGate`, `creditRenown`, `creditSeatWrit`, `claimOrcCamp`, `payTribute`; `server-account/src/seatTurning.js` `settleWeek`.*

## What holding a seat gives

**The Charter and its upkeep.** The guild pays **2,500 Marks a week** for a Palace or **15,000 Marks** for a Crown, multiplied by the server’s activity scale from **0.4 to 1.5**. Holding more than one seat increases upkeep by **25% per extra seat-weight** and cuts defence by **5% per extra seat-weight**; a Palace weighs 1 and a Crown 3, with the heaviest seat excluded from the extra. A short Marks balance puts the Charter into Neglect: **-10 Standing** for the first short week; missing upkeep a second week in a row lapses the Charter. Standing starts at **50**, is capped at **100**, and affects defence: each point above 50 adds 0.5%; each point below removes 1%. At zero Standing, the town can revolt. If a siege changes hands, the Charter moves to its winner.

**Tithe and shop prices.** The holder sets a whole-number Tithe once each week: up to **10%** at a Palace and **15%** at a Crown (a Market Hall can raise either cap by one point per built tier). It comes from the seller’s proceeds and courier fees at boards in that seat’s bailiwick, and goes into the guild’s Marks treasury. The buyer still pays the listed price; the seller’s proceeds also lose the base **5% sales tax**. Tithe and the week’s other actions move Standing. The seat’s own Market Day Edict cuts shop prices by **10% for everyone**. Members of the holding guild also get **10% off** at a Palace or **15% off** at a Crown; Standing of 80 or more adds **5%**. Market Day and seat discounts combine, with other town pricing, at the law’s price floor. Town Prosperity still moves prices and depends on size, market cycles, seat standing and edict, raids, sea lanes and player activity. See the town economy entry in [What's New Since 17 October](24-whats-new-2026-10.md) for how Prosperity affects prices and what players can do for it.

**One Edict per week.** The Guildmaster or an Officer sets the Edict for the coming week; it takes effect only if the Turning can pay its cost. The same Edict cannot run two weeks in a row, except Market Day.

| Edict | Effect |
|---|---|
| Market Day | 10% lower shop prices for everyone in the seat town. |
| Open Gates | Homes in the town cannot be set private; Standing +3. |
| Curfew | Stronger guards at night; crime costs double legal reputation; Standing -2. |
| Levy | 10% of nearby gathering yields goes to the seat stockpile; Standing -2. |
| Festival | +5 to all attributes for one game day in town; Standing +10; costs 2,500 Marks at a Palace or 10,000 at a Crown. |
| Bounty | World of Daggerfall camps in the region pay double loot; the guild’s Marks treasury pays 20 Marks per camp, up to the amount set aside, for at most 5 claims per account per day. |
| Royal Tourney (Crown only) | A week-long, refereed duel ladder at the Crown city. A winner earns the Champion of that Kingdom title; 5,000 Marks are escrowed as the prize. |
| Conscription (Crown only) | Takes 2% of the kingdom Palace seats’ Tithe, or 1% from March seats, into the Crown’s Marks treasury. Payers lose 5 Standing. |

A held Palace also serves as the guild’s **hall**, including a 100-piece Charter Room. A Crown’s castle is its hall and has no such decor space. Guild members can use the hall’s services. Its upgrades can improve local crafting, travel or defense; for example, a Harbour at a coastal seat gives members a travel port, a Forge improves weapon and armor crafting steps, a Workshop improves Building steps, and an Apothecary improves jewelry quality, cooking XP and potion potency. An upgrade’s precise tier and effect appears in the Seat tab.

*Sources: `src/net/townSeatLaw.js` `SEAT_UPKEEP`, `CROWN_SCALE`, `OVERREACH`, `STANDING_START`, `standingModifier`, `CLAIM_FEE`, `TITHE_CAP`, `MEMBER_DISCOUNT`, `EDICTS`, `edictCost`, `standingWeek`; `server-account/src/seatHolding.js` `setTithe`, `proclaimEdict`, `titheAt`, `claimBounty`; `src/net/fortLaw.js` `FORT_WORKS`, `stationSteps`, `harbourPortFor`; `src/net/townEconLaw.js` `townProsperity`, `townShopFactor`; `bible/11-Multiplayer/Seats-Arc.md` §§7.1–7.6.*

## Sieges: the scheduled battle

A Right of Siege names an attacker. The holder sets the day and start hour from Wednesday through Saturday, between **16:00 and 02:00 UTC**; the default is Wednesday 20:00. Battles are moved into non-overlapping **two-hour slots** if one of their guilds already has another fight. Crown fights have fixed Saturday slots: Daggerfall at 20:00, Wayrest at 21:00, Sentinel at 22:00 UTC. The client announces battles at the Turning and **24 hours, 1 hour and 5 minutes** before they start. The roster closes **10 minutes** before battle. A Palace fight runs **30 minutes**; a Crown fight **45 minutes**.

The signing rules make this a guild fight, not an open arena. A fighter must be a member of the side’s guild for 7 days at the Turning and have been bound to that guild during the week that won the Right. The signing also binds that account to a side for the fight. A Guildmaster may hire up to **2 Palace** or **4 Crown Sellswords**; each non-member can serve only one side that week, and cannot have fought for the opposing guild in the previous four weeks. Anyone else may spectate; a room admits up to **60 spectators**. Palace sides are capped at **10**, Crown sides at **20**. This referee normalizes fighter health and clips hits and movement; battle results do not take your save’s gear or gold.

At a Palace, attackers capture the Gate, Market and Temple banners, then hold the Throne. Take **2 of 3 banners** to open the Throne and hold it uncontested for **120 seconds**. A Palace with a tier-3 Walls project also has a Gatehouse that must be breached. At a Crown, attackers must take **3 of 4 banners** and breach the Gatehouse before holding the Throne for **180 seconds**. A Gatehouse starts at **20,000 vitality**; attackers’ melee blows do one tenth damage to it. A Ram deals **500 damage every 10 seconds** while **2 attackers** stand within **3 metres**. A Ram has **3,000 vitality**. Defenders respawn every **20 seconds** at a Palace or **30 seconds** at a Crown; Walls shorten that wave interval by **3 seconds per tier**, to a **5-second minimum**. If time runs out, the holder keeps the seat. At an unheld Contested seat, the two claimants play a **20-minute Tourney** over the banners without a Throne. The side holding more banners wins; a tie goes to higher influence, and the winner still has to pay the Charter fee.

The holder wins more than time: if attackers raised a banner, a successful defense adds **15 Standing** and **20% defence at the next Turning**. A win for the attacker takes the Charter; each fortification falls one tier and the former holder loses its Legacy there. An attacker who does not show forfeits after ten minutes; the holder gets **10 Standing** and the same next-defense bonus. Fighters on either side can earn a once-per-Season Honour: each eligible fighter gets **50 Marks and 2,000 Renown XP** for the winning side, **25 Marks and 1,000 XP** for the losing side, plus a Warforged Steel, Standard-bearer’s Silk or Siege-cracked Gem roll. These rewards are separate from the Charter outcome.

*Sources: `src/net/townSeatLaw.js` `SIEGE_WINDOW_DAYS`, `SIEGE_WINDOW_HOURS`, `BATTLE_LENGTH_MS`, `SIEGE_SIDE_MAX`, `SELLSWORDS_MAX`, `SIEGE_HONOURS`; `src/net/siege/siegeRef.js` `fieldOf`, `battleStep`, `SIEGE_GATEHOUSE`, `SIEGE_RAM`; `src/net/fortLaw.js` `defendersWaveMs`, `GATEHOUSE`, `RAM`; `src/net/siege/siegeHerald.js`; `server-account/src/seatBattles.js`, `seatSiege.js`; `bible/11-Multiplayer/Seats-Arc.md` §§6.2–6.8.*

## Walls, Rams and other works

The holder builds from its stockpile and pays the upgrade’s Marks cost. A project stands **2, 4 or 7 days** after its last needed material arrives. Masonry’s **Builder** specialization at 50 uses 10% less stone; a Masonry 100 **Fortifier** on the defending roster can save the Walls from dropping at a capture once per Season. Carpentry 100’s **Siegewright** makes its project stand a day sooner and adds 50% Ram vitality. Writs posted for a seat can request the materials its stockpile needs.

Walls quicken defender waves. A Gatehouse raises gate vitality by **50% per tier** (up to tier 3); it can be built at a Crown or at a Palace whose Walls are tier 3. Watchtowers warn the holder when the strongest challenger crosses half, then a quarter of its defense. Barracks add **2 guards a tier**, up to 6. A Market Hall adds **25% listings per tier** and one percentage point to the Tithe cap. A Shrine adds **50 gate-kill influence per tier** (up to 2) and +1 Standing per tier. Forge, Workshop and Apothecary are described above. A Harbour can be built only at a coastal seat.

The attacker’s **Siege Camp** uses the same material writs. At the Turning, camp stock is spent; Ram Kits can become Rams for that battle. Delivering self-gathered materials is useful even if you will not fight: each eligible Mark of value adds one influence to the guild’s contest and supplies either its camp or its fortifications.

*Sources: `src/net/fortLaw.js` `FORT_WORKS`, `fortNeeds`, `fortStandsAt`, `defendersWaveMs`, `gatehouseVitality`, `ramVitality`, `watchtowerShare`, `barracksGuards`, `marketHallListings`, `shrineGateInfluence`; `server-account/src/seatForts.js` `fundFort`, `supplyForts`, `fortifierAt`, `siegewrightAt`, `campsSpent`; `server-account/src/seatInfluence.js` `creditSeatWrit`; `src/net/professionLaw.js` Builder, Fortifier and Siegewright rules.*

## Player guilds, Marks and chapters

You can join a player guild from an invitation, or found one if you have **10,000 gold and Renown 10**. A guild has up to **50 characters**. Its four ranks are Guildmaster, Officer, Member and Recruit; the Guildmaster may rename those ranks. Officers can invite, remove and promote or demote lower ranks, pledge seats, and operate held-seat levers. The Guildmaster alone withdraws from the guild’s gold treasury, pays Tribute from the guild’s Marks treasury, hires Sellswords and can relinquish a Charter. Any member can deposit gold or silver, put materials into Stores, and take their own materials back. The Members page spells out what each rank can do.

Guilds have a written ledger and a shared vault: **50 slots**, or **100 with a hall**; the Guildmaster grants and removes members’ vault access. They can buy a home as a hall, furnish it and display chosen heraldry (field, border and device); a held Palace automatically serves as the hall too. Guild names cost **25,000 gold** to change, with a two-week cooldown. A guild’s own Mark balance and its gold treasury are separate: Marks are account-server currency, capped at **10,000,000** in a guild balance; gold pays gold fees such as founding or renaming a guild, while seat claims, upkeep, works, Edicts and Tribute use Marks. Marks cannot be bought with gold. The Empire’s Bank exchanges Marks for gold at **8 gold per Mark**, up to **300 per account per UTC day**. Tribute burns guild Marks for influence.

A solo player contributes most reliably by joining a guild, then doing the work that fits a short session: patrol a pledged seat town while moving to earn Watch ticks; complete a gate or a town defense in a region the guild has pledged; or gather, craft and deliver requested materials to the board’s Seat writ. Keep the delivered units your own: bought materials earn far less. Guild influence only counts after your character has been in the guild seven days. A home in the target town helps its guild, if you already own one. A small guild can focus one seat, make sure its accounts spread out across eligible sources, and time a pledge before Friday’s lock. A few members will not casually reach the 6,000 Palace claim threshold alone, but each person can add measurable influence and help secure a siege right or defend a Charter.

There is also a separate **Chapters** system: your standing and ranks in the classic NPC Fighters, Mages and other guild factions. Player guilds can also maintain regional chapters, with their own Merit, hall writs, seasonal events and a separate ladder for NPC-guild offices. Those are not the town Charters described here. Joining an NPC guild and gaining its ranks can provide other benefits, but it does not pledge your player guild to a town seat.

A seat **Season lasts 8 weeks**. At its end, Standing moves halfway back toward 50, Legacy clears, and each fortification drops one tier, but Charters remain. A Crown holder earns a seasonal Crowned title; a guild that held a seat for the whole Season earns the Keeper title and its members wear that guild’s banner ribbon in the next Season.

### How Tiger Fist gets involved

At level 7, start with an existing guild rather than spend time founding one. Join a group whose members are active in the region you visit; ask which seat they are pledged to and whether they need a Watch presence, a writ delivery or a raid defender. A raid defense is a particularly good fit for Renown, combat Marks, the town economy and your NPC-guild chapter standing; an ordinary raid receipt does not itself add player-seat influence. The existing guide explains the Bay’s Watch and town-defense loop. While you are in a pledged seat town, the Watch can separately add influence. If combat isn't convenient, gather materials yourself and deliver them to an active seat writ. The best near-term payoffs are Marks and Renown from legitimate fights, the guild’s eventual siege Honour, and—if your guild holds the Charter—member shop discounts, hall stations and travel services. The Festival’s +5 attributes is also a temporary town benefit.

*Sources: `src/net/guild/guildLaw.js` `GUILD_FOUND_GOLD`, `GUILD_FOUND_RENOWN`, `GUILD_MEMBERS_MAX`, `GUILD_POWERS`, `GUILD_RENAME_GOLD`; `src/net/guild/guildVaultLaw.js` `GUILD_VAULT_SLOTS`, `guildVaultSlots`; `src/net/marksLaw.js` `MARKS_MAX`, `MARKS_BANK`, `MARK_WORTH_GOLD`; `src/net/townSeatLaw.js` `SEASON_WEEKS`, `seasonTitles`, `keptWholeSeason`; `server-account/src/guilds.js`, `marks.js`, `seatInfluence.js`; `bible/11-Multiplayer/Guild-Overhaul.md` §§GUILD2a–d; `bible/11-Multiplayer/Chapters-Arc.md` §§3–9; `docs/23-playing-online.md` “A plan for Tiger Fist”.*

## Where to read current politics

- **Overworld map:** hover a town to read its seat/control and economy card. The map mark identifies its tier and holder; siege colors indicate a battle is scheduled.
- **Town Notice Board → Seat tab:** see the Muster or Reckoning timer, current standings and pledges, your guild’s weekly influence, the Charter’s Standing, upkeep, Tithe, Edict, works and any battle. If your guild has authority, this is where its pledge, battle window, Tithe, Edict, tribute and works are managed. The same Seat tab is available from the Guild page.
- **Hall of Records:** read a seat’s Chronicle at its board, or the Hall of Records shelves in a Palace or one of the three castles. It records claims, sieges, Tourneys, revolts, Edicts and changes of holder, up to the newest **400 rows**. The Seat tab also has the Chronicle.
- **Announcements and battle HUD:** the siege is announced at the Turning and the three warning times above. Once in a battle, the siege HUD shows its field, banners, Throne and ladder. Late joiners can see the server’s event history. The guild roster’s Members page shows who is online and when other members last played.

The seat list, standings, records and control actions need a signed-in online session. This guide does not fetch live standings. Use the in-game Seat tab and map cards for the current holders and timers.

*Sources: `src/ui/seatTab.js` `createSeatTab`, `seatGuide`, `seatNextStep`; `src/net/townSeatBook.js` `createTownSeatBook`; `src/ui/hallOfRecords.js` `hallOfRecordsBook`; `src/net/townSeatLaw.js` `HALL_OF_RECORDS_ROWS`, `seatMapMark`; `src/net/siege/siegeSession.js`; `src/net/siege/siegeHerald.js` `createSiegeHerald`; `src/ui/travel/travelViewHud.js`; `bible/11-Multiplayer/Seats-Arc.md` §19; `bible/11-Multiplayer/Guild-Overhaul.md` GUILD-SEEN.*
