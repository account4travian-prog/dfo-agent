# G: Progression gate map
Commit: 0df2d87eb · Researcher: Luna · Date: 2026-10-21

The table records gates on feature availability, not recommended character builds. `None` means no explicit progression threshold was found in the cited code; online-only features are called out as such. Locations, switches and event clocks can still control whether an already-unlocked feature is currently usable. Character level and Renown are separate ladders.

## Progression gates

| Feature | Gate type | Gate value | First met where/how | Citation |
|---|---|---|---|---|
| Create a character | Character level | New character | Character creation; no prior level | `src/systems/chargen.js:1` (`createCharacter`) |
| Enter the online world | Account | Guest or registered account | Sign in through Online; guests can enter | `src/net/identityToken.js:1` (`identity token`) |
| Online-only Renown track | Setting | Online | Character receives a separate online Renown track | `src/net/renown.js:33` (`Renown`) |
| Online health and magicka Renown bonus | Setting | Online | Added when character comes online | `src/net/renown.js:36` (`renownBonus`) |
| First character level | Character level | Level 1 | Starting character level | `src/net/identityToken.js:346-349` (`CHARACTER_LEVEL_MIN`) |
| Character-level ceiling | Character level | Level 1000 | Character-level system cap | `src/net/identityToken.js:346-349` (`CHARACTER_LEVEL_MAX`) |
| Renown ceiling | Renown | Renown 50 | Renown progression cap | `src/net/identityToken.js:256-259` (`RENOWN_MAX`) |
| First Renown level | Renown | Renown 1 | Starting Renown track; further levels require XP | `src/net/renown.js:92-100` (`renownXpFor`) |
| Weapon skills' ordinary mastery | Skill | Skill 100 | Raise an eligible weapon skill to 100 | `src/systems/weaponMastery.js:2-10` (`weaponClimb`) |
| Weapon effects past mastery | Skill | Above 100; effective climb bounded to 40 | Continue skill growth beyond 100, online only | `src/systems/weaponMastery.js:28,59-62` (`weaponClimb`) |
| Firmament first star | Renown | Renown 2 for first Renown-derived point | Open Firmament and spend points; each level past 1 adds two stars | `src/net/firmament/firmamentLaw.js:37-50` (`starsFor`) |
| Firmament profession points | Profession rank | 8 total profession ranks per Craft point | Raise ranks in any of ten tracks | `src/net/firmament/firmamentLaw.js:43-55` (`craftPointsFor`) |
| Free Firmament refund | Renown | Below Renown 10 | Refund allocated stars while under threshold | `src/net/firmament/firmamentLaw.js:354-364` (`refundSilver`) |
| Paid Firmament refund | Renown | Renown 10 and higher | Refund removed stars; silver cost per star | `src/net/firmament/firmamentLaw.js:354-364` (`refundSilver`) |
| Choose a Firmament birthsign | Character action | First allocation | First sign costs no refund fee | `src/net/firmament/firmamentLaw.js:362-364` (`refundSilver`) |
| Elite foe in online overworld | Renown | Renown 5; additionally foe level at least 3 | Reach Renown 5 for own-world elite rolls; shared dungeon selection stays room-wide | `src/systems/eliteFoes.js:69-82` (`eliteRenownOpen`) |
| Elite foe in shared dungeon | Place | Shared dungeon's foe selection | Enter a shared dungeon; its room-wide choice is not gated by an individual player's Renown | `src/systems/eliteFoes.js:18-20,72-82` (`eliteRenownOpen`) |
| Online Elite Dungeon tier | Setting / place | Online Elite spawn | Enter an Elite-spawn location; no character-level entry threshold found here | `src/systems/dungeon/dungeonTier.js:5-10,18-26` (`dungeonTier`) |
| Regular Dungeon tier | Place | Dungeon location | Enter a normal dungeon | `src/systems/dungeon/dungeonTier.js:18-32` (`dungeonTier`) |
| Abyss Dungeon tier | Place | Super-tier dungeon location | Enter a location marked `superTier` | `src/systems/dungeon/dungeonTier.js:18-32` (`dungeonTier`) |
| NPC guild membership | Quest | Guild-specific invitation/initiation | Complete that guild's joining quest; not an account-level gate | `src/systems/guild/guilds.js:713-732` (`guildInitiationQuestEnded`) |
| NPC guild rank review | Time | 28 days between rank changes | Wait after the previous rank-change date | `src/systems/guild/guilds.js:26-30,98` (`DAYS_BETWEEN_RANK_CHANGES`) |
| Questline level bands | Character level | 1-6 / 7-13 / 14-20 / 21+ | Quest rewards tier by player's level where no sheet tier or reputation overrides | `src/systems/questlines/qlLaw.js:188-203` (`levelTier`) |
| Questline tier from guild rank | Guild rank | Ranks 0-1 / 2-3 / 4-5 / 6+ | Guild quest tier follows membership rank | `src/systems/questlines/qlLaw.js:184-203` (`rankTier`) |
| Questline tier from reputation | Reputation | 10-19 / 20-39 / 40-59 / 60+ | Reputation-gated quest tier follows reputation band | `src/systems/questlines/qlLaw.js:186-203` (`reputationTier`) |
| The Burning Doors questline | Level + account + online | Level 10, online registered account | Reach level 10; line requires service-witnessed online play and account | `src/systems/questlines/qlLines.js:56-67` (`burningDoors`) |
| The Burning Doors, first letter | Same as line | Level 10; first quest QLBD01 | Open line at its level gate | `src/systems/questlines/qlLines.js:61-67` (`burningDoors`) |
| The Burning Doors, Faithful | Quest | Finish prior step | Continue to QLBD02 | `src/systems/questlines/qlLines.js:61-67` (`burningDoors`) |
| The Burning Doors, Breaking the Rite | Quest | Finish prior step | Continue to QLBD03 | `src/systems/questlines/qlLines.js:61-67` (`burningDoors`) |
| The Burning Doors, Through the Burning Door | Quest | Finish prior step | Continue to QLBD04 | `src/systems/questlines/qlLines.js:61-67` (`burningDoors`) |
| The Burning Doors, The Caged Broker | Quest | Finish prior step | Continue to QLBD05 | `src/systems/questlines/qlLines.js:61-67` (`burningDoors`) |
| The Covens' Hoard questline | Quest + online account | Finish The Burning Doors; online registered account | Unlocks after `burningDoors` completion | `src/systems/questlines/qlLines.js:70-80` (`covensHoard`) |
| The Covens' Hoard, Gold-Lit | Quest | Finish The Burning Doors | First step of next line | `src/systems/questlines/qlLines.js:75-79` (`covensHoard`) |
| The Covens' Hoard, The Lieutenant | Quest | Finish prior step | Continue to Weir Key objective | `src/systems/questlines/qlLines.js:75-79` (`covensHoard`) |
| The Covens' Hoard, What the Key Opens | Quest | Finish prior step | Choose the key's fate | `src/systems/questlines/qlLines.js:75-79` (`covensHoard`) |
| The Weir Road questline | Quest + online account | Finish The Covens' Hoard; online registered account | Unlocks after `covensHoard` completion | `src/systems/questlines/qlLines.js:82-93` (`weirRoad`) |
| The Weir Road, The Weir Gate | Quest | Finish The Covens' Hoard | First step of next line | `src/systems/questlines/qlLines.js:87-92` (`weirRoad`) |
| The Weir Road, The Torn Halls | Quest | Finish prior step | Continue through Elite Breach story | `src/systems/questlines/qlLines.js:87-92` (`weirRoad`) |
| The Weir Road, A Warrior Duke | Quest | Finish prior step | Continue through Elite Breach story | `src/systems/questlines/qlLines.js:87-92` (`weirRoad`) |
| The Weir Road, The Battlemage's Account | Quest | Finish prior step | Final step of line | `src/systems/questlines/qlLines.js:87-92` (`weirRoad`) |
| The Hour That Was Not questline | Level + online account | Level 12, online registered account | Reach level 12; line concerns Abyss Dungeons | `src/systems/questlines/qlLines.js:95-104` (`hourThatWasNot`) |
| The Hour That Was Not, Brass at Dusk | Quest | Level 12 and line open | First step | `src/systems/questlines/qlLines.js:100-103` (`hourThatWasNot`) |
| The Hour That Was Not, The Orrery of Endings | Quest | Finish first step | Continue into Abyss Dungeon objective | `src/systems/questlines/qlLines.js:100-103` (`hourThatWasNot`) |
| The Old Coil questline | Level + online account | Level 8, online registered account | Reach level 8; line introduces Sea Serpent content | `src/systems/questlines/qlLines.js:106-116` (`oldCoil`) |
| The Old Coil, The Sailors' Tale | Quest | Level 8 and line open | First step | `src/systems/questlines/qlLines.js:111-115` (`oldCoil`) |
| The Old Coil, The Packet Lanes | Quest | Finish first step | Continue along line | `src/systems/questlines/qlLines.js:111-115` (`oldCoil`) |
| The Old Coil, The Shed Skin | Quest | Finish prior step | Final step | `src/systems/questlines/qlLines.js:111-115` (`oldCoil`) |
| The Thirteenth of Frostfall | Level + account + event | Level 6, online registered account, Witches' Festival open | Reach level 6 during event; line only starts while event is staged | `src/systems/questlines/qlLines.js:119-129` (`thirteenthFrostfall`) |
| Festival line: Music in the Woods | Event | Starfall active | Start step only while stars are falling; waits if event closes | `src/systems/questlines/qlLines.js:20-23,123-128` (`thirteenthFrostfall`) |
| Festival line: The Coven on the Bluff | Quest | Finish first step | Continue within seasonal line | `src/systems/questlines/qlLines.js:123-128` (`thirteenthFrostfall`) |
| Festival line: Three Stars | Event + quest | Finish prior step and Starfall active | Waits for next star if the event is not active | `src/systems/questlines/qlLines.js:123-128` (`thirteenthFrostfall`) |
| Festival line: What the Thread Is Worth | Quest | Finish prior step | Final step | `src/systems/questlines/qlLines.js:123-128` (`thirteenthFrostfall`) |
| The Court Crafter | Level + online account | Level 2, online registered account | Reach level 2; introduction covers gathering/crafting | `src/systems/questlines/qlLines.js:131-141` (`introCrafts`) |
| The Court Crafter: Of Rod and Root | Quest | Level 2 and account gate | First introduction quest | `src/systems/questlines/qlLines.js:136-140` (`introCrafts`) |
| The Court Crafter: Ore and Timber | Quest | Finish prior step | Continue introduction | `src/systems/questlines/qlLines.js:136-140` (`introCrafts`) |
| The Court Crafter: Made by Hand | Quest | Finish prior step | Finish introduction | `src/systems/questlines/qlLines.js:136-140` (`introCrafts`) |
| The Smith's Secrets | Character level | Level 4 | Reach level 4; each step also waits for Loot rarity to be on | `src/systems/questlines/qlLines.js:145-154` (`introGear`) |
| A Stone in the Setting | Setting | Loot rarity on | First gear introduction step | `src/systems/questlines/qlLines.js:150-153` (`introGear`) |
| Tempered Again | Quest + setting | Finish prior step; Loot rarity on | Second gear introduction step | `src/systems/questlines/qlLines.js:150-153` (`introGear`) |
| The Harbormaster's Word | Character level | Level 5 | Reach level 5; naval deeds additionally need Naval Combat on | `src/systems/questlines/qlLines.js:156-166` (`introSea`) |
| Under Sail | Setting | Naval Combat on | Perform naval introduction deed | `src/systems/questlines/qlLines.js:161-165` (`introSea`) |
| A Hold Full | Setting | Naval Combat on | Perform naval introduction deed | `src/systems/questlines/qlLines.js:161-165` (`introSea`) |
| Strike Your Colors | Setting | Naval Combat on | Perform naval introduction deed | `src/systems/questlines/qlLines.js:161-165` (`introSea`) |
| The Merchant's Road | Character level | Level 3 | Reach level 3 | `src/systems/questlines/qlLines.js:168-177` (`introRoad`) |
| A Wagon's Load | Quest | Level 3 and line open | First road introduction quest | `src/systems/questlines/qlLines.js:173-176` (`introRoad`) |
| The Long Haul | Quest | Finish prior step | Second road introduction quest | `src/systems/questlines/qlLines.js:173-176` (`introRoad`) |
| A Seat at the Table | Character level | Level 2 | Reach level 2 | `src/systems/questlines/qlLines.js:179-188` (`introTables`) |
| The King's Gambit introduction step | Setting | King's Gambit on | Second table quest waits for setting | `src/systems/questlines/qlLines.js:184-187` (`introTables`) |
| The Herald's Call | Level + online | Level 6, online | Reach level 6 and play online | `src/systems/questlines/qlLines.js:190-199` (`introArena`) |
| First Blood | Quest | Level 6 and online line open | Win an Arena bout | `src/systems/questlines/qlLines.js:195-198` (`introArena`) |
| A Name in the Sand | Quest | Finish prior step | Win three bouts | `src/systems/questlines/qlLines.js:195-198` (`introArena`) |
| The Bay's Troubles | Level + online | Level 6, online | Reach level 6 and play online | `src/systems/questlines/qlLines.js:201-210` (`introBay`) |
| Raiders at the Gate | Quest | Level 6 and online line open | First Bay troubles step | `src/systems/questlines/qlLines.js:206-209` (`introBay`) |
| The Kneeling Dead | Renown | Renown 10 online | Reach revenant Renown threshold to proceed | `src/systems/questlines/qlLines.js:206-210` (`introBay`) |
| Written in the Stars | Level + online | Level 3, online | Reach level 3 and play online | `src/systems/questlines/qlLines.js:212-221` (`introFirmament`) |
| The First Star | Quest | Level 3 and online line open | Take a Firmament star | `src/systems/questlines/qlLines.js:217-220` (`introFirmament`) |
| A Constellation of Your Own | Quest | Finish prior step | Take three more stars | `src/systems/questlines/qlLines.js:217-220` (`introFirmament`) |
| Profession account service | Account | Registered account | Guest is refused at service entry | `server-account/src/professions.js:10-12,115-118` (`profession actor`) |
| Gathering professions | Account | Registered account | Any gathering-track action reaches registered-only service | `server-account/src/professions.js:115-118` (`profession actor`) |
| Crafting professions | Account | Registered account | Any craft action reaches registered-only service | `server-account/src/professions.js:115-118` (`profession actor`) |
| Profession rank 1 | Profession rank | Rank 0 to 1 | Perform qualifying profession actions | `src/net/professionLaw.js:85-108` (`rankOfXp`) |
| Profession tier 1 | Profession rank | Rank 0 | First profession tier is open at base rank | `src/net/professionLaw.js:104-110` (`tierOpen`) |
| Profession tier 2 | Profession rank | Rank 10 | Raise that profession to rank 10 | `src/net/professionLaw.js:104-110` (`tierOpen`) |
| Profession tier 3 | Profession rank | Rank 25 | Raise that profession to rank 25 | `src/net/professionLaw.js:104-110` (`tierOpen`) |
| Profession tier 4 | Profession rank | Rank 40 | Raise that profession to rank 40 | `src/net/professionLaw.js:104-110` (`tierOpen`) |
| Profession tier 5 | Profession rank | Rank 55 | Raise that profession to rank 55 | `src/net/professionLaw.js:104-110` (`tierOpen`) |
| Profession tier 6 | Profession rank | Rank 70 | Raise that profession to rank 70 | `src/net/professionLaw.js:104-110` (`tierOpen`) |
| Profession tier 7 | Profession rank | Rank 90 | Raise that profession to rank 90 | `src/net/professionLaw.js:104-110` (`tierOpen`) |
| Apprentice profession rank | Profession rank | Rank 25 | Raise any track to rank 25 | `src/net/professionLaw.js:88-103` (`rankName`) |
| Journeyman profession rank | Profession rank | Rank 50 | Raise any track to rank 50 | `src/net/professionLaw.js:88-103` (`rankName`) |
| Expert profession rank | Profession rank | Rank 75 | Raise any track to rank 75 | `src/net/professionLaw.js:88-103` (`rankName`) |
| Master profession rank | Profession rank | Rank 100 | Raise any track to rank 100 | `src/net/professionLaw.js:85-103` (`rankName`) |
| First profession specialisation | Profession rank | Rank 50 | Choose a rank-50 track specialisation | `src/net/professionLaw.js:127-135` (`SPEC_RANKS`) |
| Second profession specialisation | Profession rank | Rank 100 | Reach rank 100 and choose second specialisation | `src/net/professionLaw.js:127-135` (`SPEC_RANKS`) |
| Two crafts above Journeyman | Profession rank | At most two crafts above rank 50 | Train crafts beyond Journeyman; remaining crafts cannot pass that rank | `src/net/professionLaw.js:127-135` (`JOURNEYMAN_RANK`) |
| Market board | Account + setting | Registered account; board, professions and Marks open | Use Market while all three service switches are open | `server-account/src/market.js:10-13,106-118` (`marketOpen`) |
| Market listings | Account + setting | Registered account; market switches open | Open Market after account registration | `server-account/src/market.js:106-118` (`marketActor`) |
| Market buy orders | Account + setting | Registered account; market switches open | Open Market after account registration | `server-account/src/market.js:106-118` (`marketActor`) |
| Market auctions | Account + setting | Registered account; market switches open | Open Market after account registration | `server-account/src/market.js:106-118` (`marketActor`) |
| Market couriers | Account + setting | Registered account; market switches open | Use market delivery once account service is available | `server-account/src/market.js:106-118` (`marketActor`) |
| Materials Stores | Account | Registered account | Use profession store service | `server-account/src/professions.js:115-118` (`profession actor`) |
| Marks balance | Account | Registered account | Account service tracks Marks and market activity | `server-account/src/market.js:10-13,106-118` (`marketActor`) |
| Player guild founding | Renown + account | Renown 10; registered account service | Reach Renown 10 and submit guild-founding request | `src/net/guild/guildLaw.js:26-28`; `server-account/src/guilds.js:12,160` (`guild founder`) |
| Join a player guild | Account + invitation | Registered account; guild invite | Receive and accept invitation | `server-account/src/guilds.js:12,160,415` (`guild invite`) |
| Player guild ranks | Guild membership | Join guild | Assigned Recruit/Member/Officer/Guildmaster rank | `src/net/guild/guildLaw.js:35-40` (`GUILD_RANK_NAMES`) |
| Guild vault withdrawal | Guild rank | Guildmaster rank | Only rank 0 can withdraw | `src/net/guild/guildLaw.js:42-52` (`GUILD_POWERS`) |
| Guild rename | Guild rank + funds | Guildmaster; treasury fee | Guildmaster uses guild treasury | `src/net/guild/guildLaw.js:119-125` (`guild rename`) |
| Guild size limit | Guild membership | Per-guild member cap | Join a guild; code defines roster maximum | `src/net/guild/guildLaw.js:29-34` (`GUILD_MEMBER_MAX`) |
| Revenant system | Character level + Renown | Character level 3 and Renown 10 online | Both minima must be met before online revenants appear | `src/systems/revenant/revenant.js:112-116,254-259` (`revenantHeld`) |
| Unquiet mark / first revenant exposure | Renown | Renown 10 online | Reach Renown 10; revenant systems are held before then | `src/systems/revenant/revenant.js:112-116,510` (`revenantHeld`) |
| Revenant lair marks | Renown | Renown 10 online | Reach threshold; no lair marks while held | `src/systems/revenant/revenant.js:112-116,1361-1398` (`revenantHeld`) |
| Revenant companion | Renown + revenant outcome | Renown 10; swear a revenant | Revenant system must open and a revenant become sworn | `src/systems/revenant/revenant.js:112-116,1542` (`revenantHeld`) |
| Revenant rank progression | Revenant rank | Earn rank deeds | Rank is internal to revenant system; no character-level gate found | `src/systems/revenant/revenant.js:177` (`REVENANT_LEVEL_PER_RANK`) |
| Elite Gate appearance | Server event / time | Daily game-day schedule | Find the marked location during an active gate phase | `src/net/gate/gateLaw.js:20-29,71-97` (`gateAt`, `gatePhase`) |
| Regular Dagon's Breach | Server event | Daily timed gate | Reach the world location when its gate opens | `src/net/gate/gateLaw.js:20-29,71-97` (`gateAt`) |
| Elite Breach | Place / server event | Elite-tier breach | Attend a spawned Elite Breach; no universal character-level gate found in gate tier law | `src/systems/gateTier.js:17-28` (`gateTier`) |
| Abyss Breach tier | Place / build state | Super tier reserved for Abyss Breach | Tier law defines it, but code says no answering content yet | `src/systems/gateTier.js:2-8,17-20` (`GATE_TIERS`) |
| Elite Gates Redoubt | Event / place | Reach an open Elite Breach's Redoubt | Enter the event instance during its admission window | `src/net/eliteGates/egLaw.js:142-160` (`EG_ADMIT_MAX_MIN`) |
| Elite Breach admission | Event clock | At most 60 game minutes | Join while admission window remains open | `src/net/eliteGates/egLaw.js:149-157` (`EG_ADMIT_MAX_MS`) |
| Elite Breach Redoubt hold | Event clock | 180 game minutes base | Hold the Redoubt after breaching | `src/net/eliteGates/egLaw.js:152-157,244` (`EG_REDOUBT_HOLD_MIN`) |
| Elite Gate weekly rewards | Weekly event | Elite Gate week | Claim on weekly schedule; no character-level threshold found in cited gate law | `src/net/arena/arenaLaw.js:91-93` (`arenaWeekOf`) |
| Arena PvE ladder | Place / online service | Arena in Daggerfall | Speak with Arena Herald; ladder code has no character-level unlock | `src/systems/arena/arenaLadder.js:7-10,90-106` (`nextLadderBout`) |
| Arena PvP rated bouts | Account | Both fighters registered | Queue rated fight with registered account | `server-account/src/arena.js:404-405` (`rated accounts`) |
| Arena private-session hosting | Account | Registered account | Registered account hosts private session | `src/net/arena/arenaLaw.js:731-747` (`ARENA_TEXT`) |
| Arena spectator access | Account | Guest may watch | Watch without registration; fighting requires registration | `src/net/arena/arenaLaw.js:731-747` (`ARENA_TEXT`) |
| Arena season | Server event / calendar | Eight weeks from season Monday | Participate while current season runs | `src/net/arena/arenaLaw.js:11,85` (`arenaSeasonOf`) |
| Arena champion laurel | Recorded performance | At least 10 bouts against 5 foes | Meet both account-record thresholds | `src/net/arena/arenaLaw.js:423-425` (`laurelWorthy`) |
| Sea Serpent world encounter | Server event / place | Encounter-specific spawn | Find the serpent in its sea location; no level gate found in cited questline intro | `src/systems/questlines/qlLines.js:106-115` (`oldCoil`) |
| Witches' Festival event | Server event / calendar | Scheduled annual event | Play during published event interval | `src/net/festivalLaw.js:21-30` (`festivalAt`) |
| Seasonal Soul Cakes | Server event | Festival running | Earn cakes through listed event actions | `src/net/festivalLaw.js:55-75` (`FIND_SOURCES`) |
| Hearth Offering | Server event / contribution | Festival; offer cakes | Find offerings and contribute to event | `src/net/festivalLaw.js:71-80` (`OFFERING_STOCK_MAX`) |
| Starfall world event | Server event | Witches' Festival open | Starfall runs during the event calendar | `src/net/starfall/starfallLaw.js:27-31` (`starfallRuns`) |
| Motherlode event | Server event / place | Three UTC-day spawns | Find an active site; service picks from witnessed eligible ground | `src/net/motherlodeLaw.js:5-16` (`Motherlode law`) |
| Town raid | Server event / place | Raid begins at a settlement | Be in the affected town during raid | `src/systems/eventTimers.js:5-10` (`event schedule`) |
| Spawned dungeon | Place / server schedule | Spawned location exists | Discover its marked location; no level gate found in spawn location law | `src/world/spawnedDungeons.js:1` (`spawned dungeon`) |
| Elite spawned dungeon | Place + Renown for own-world roll | Elite spawn; own-world elites require Renown 5 | Reach Renown 5 for own-world elite roll; shared-room selection remains global | `src/systems/eliteFoes.js:18-20,72-82` (`eliteRenownOpen`) |
| Abyss Dungeon | Place / tier | Location marked Super | Enter an Abyss-tier dungeon; no universal level gate established by tier classifier | `src/systems/dungeon/dungeonTier.js:18-32` (`dungeonTier`) |
| Wrothgarian Mountains Open Zone | Place / feature | Region's Open Zone | Travel to the Wrothgarian Mountains; explicit level gate not found in cited sources | `src/world/tamriel/tamrielGeography.js:1` (`Tamriel geography`) |
| Eltheric Ocean | Place / travel | Ocean route | Reach the sea; no level requirement found in cited gate sources | `src/world/oceanHoles.js:45-58` (`ocean hole geometry`) |
| The Veil | Place / travel | Sea route beyond the Veil | Find or travel through the Veil; explicit level gate not found in cited sources | `src/world/oceanHoles.js:45-58` (`ocean hole geometry`) |
| Portal Stones | Item / place | Buy or acquire a Portal Stone | Any shop sells stones; use works in the open world and opens teleport map mode | `src/systems/portalStone.js:8-16` (`Portal Stone`) |
| Mages Guild teleport | Guild membership / rank | Mages Guild rank and setting dependent | Join/rank up in Mages Guild and use eligible teleport service | `src/systems/guild/guilds.js:152-155` (`questRankFor`) |
| Recall spell | Skill / spell access | Spell available to character | Acquire/use Recall through magic system; no fixed level threshold found in reviewed sources | `src/systems/travel/travel.js:1` (`travel`) |
| Horse and cart | Place / setting | Horse/cart availability | Buy or use where the Horse Cart and Cargo availability predicate holds | `src/systems/horse/horseCartLaw.js:2-13` (`Horse Cart and Cargo law`) |
| Carriage hire | Place | Walled city carriage stop | Reach a walled city and use its travel service | `src/systems/immersiveTravel.js:1` (`immersive travel`) |
| Home ownership | Account + location + gold | Town building; one owner per building | Buy at the building's front door; online home is registered to one character | `src/net/homeLaw.js:3-18` (`home law`) |
| Court writs | Quest / location | Court board and eligible writ | Reach a court board and meet individual writ conditions | `src/net/writLaw.js:1` (`writ law`) |
| Guild writs | Guild membership / rank | Eligible NPC guild and writ | Join guild and access its writ board | `src/net/writLaw.js:1` (`writ law`) |
| Legacy heir | Character death / lineage | Retire or lose a character; eligible lineage | Choose or create an heir after qualifying lineage event | `src/systems/legacy/legacyLaw.js:3-14,19-32` (`lineageLawFindings`) |
| Legacy blood inheritance | Lineage | Parent stat produces 0-3 blood | Create heir from a qualifying parent record | `src/systems/legacy/legacyLaw.js:19-20` (`BLOOD_MAX`) |
| Legacy skill inheritance | Lineage | Parent primary/major skill; 0-3 gift | Create heir from qualifying family lineage | `src/systems/legacy/legacyLaw.js:21-22` (`HEARTH_MAX`) |
| Legacy estate | Lineage + gold | Quarter of fallen purse, capped at 9,900 | Create heir with pending estate | `src/systems/legacy/legacyLaw.js:23-32` (`ESTATE_SHARE`) |
| Dragonling / companions | Feature state | Companion feature available | No character level gate found in cited companion slot law | `src/systems/companionSlots.js:1` (`companion slots`) |
| Guild chapter | Player guild | Existing player guild | Guild creates/holds a chapter; no character gate identified in cited guild law | `src/net/guild/guildLaw.js:26-40` (`guild founding`) |
| City control seat | Server event / guild | Guild control system active; hold seat | Join player guild and participate in seat contest | `src/net/townSeatLaw.js:1-7` (`seat law`) |
| Weekly Turning | Server event / calendar | Weekly Turning schedule | Participate in current city-control week | `src/net/townSeatLaw.js:1-7` (`seat law`) |
| Siege | Guild / place | Seat contest and defending/attacking guild | Join qualifying guild and enter siege location | `src/net/townSeatLaw.js:1-7` (`seat law`) |
| Fortifications | Guild rank / place | Eligible seat and fortification action | Eligible guild actor builds fortifications | `server-account/src/seatForts.js:1` (`seat fortifications`) |
| Dagon's Breach questline steps | Service witness | Relay receipt for each online event deed | Complete each quest objective while online | `src/net/questlineClaims.js:2-18` (`questline claims`) |
| Elite questline rewards/titles | Quest + service witness | Finish all steps; service verifies receipt | Complete final step; claim is server witnessed | `src/net/questlineClaims.js:2-18` (`questline claims`) |
| Guest access to profession quests | Account | Registered account | Guest can see no service-credited profession questline | `src/systems/questlines/qlLines.js:40-46,131-140` (`LineOpens`) |
| Guest access to endgame questlines | Account + online | Registered online account | Endgame lines require service receipts | `src/systems/questlines/qlLines.js:8-10,40-46` (`LineOpens`) |
| Firmament access | Setting / online | Online | Firmament introduction itself opens at level 3; tree uses Renown and profession points | `src/systems/questlines/qlLines.js:212-220`; `src/net/firmament/firmamentLaw.js:37-55` (`starsFor`) |
| Firmament specialization node | Renown / profession rank | Spend available Stars or Craft points | Earn points from Renown or total profession ranks | `src/net/firmament/firmamentLaw.js:37-55` (`craftPointsFor`) |
| Dagon's Breach opening event | Server event / clock | Daily game clock | Find gate during its rise/open interval | `src/net/gate/gateLaw.js:20-29,71-97` (`gateTimes`) |
| Wrothgarian / Open Zone's elite encounter | Place + Renown | Own-world elite threshold Renown 5 | Renown 5 enables own-world elite rolls in online zones | `src/systems/eliteFoes.js:72-82` (`eliteRenownOpen`) |
| Enemy champion baseline | Character level | Enemy level at least 3 for elite status | Character/world enemy generation; low-level foes cannot qualify | `src/systems/eliteFoes.js:69-87` (`ELITE_FOE_MIN_LEVEL`) |
| Shared dungeon elite status | Place | Room's selected foe | Room's pick is shared and does not use each player's Renown | `src/systems/eliteFoes.js:72-82` (`eliteRenownOpen`) |
| Offline Elite foes | Setting | Offline loot rarity enabled | Offline route uses loot rarity setting rather than online Renown gate | `src/systems/eliteFoes.js:80-96` (`elitesAllowed`) |
| Join Thieves Guild | Invitation quest | Invitation through quest | Crime quest chain sends invite; not a walk-in application | `src/systems/guild/guilds.js:606,713-732` (`guildInitiationQuestEnded`) |
| Join Dark Brotherhood | Invitation quest | Invitation through crime quest | Complete qualifying initiation quest | `src/systems/guild/guilds.js:652,713-732` (`guildInitiationQuestEnded`) |
| Mages Guild quest rank | Character level or guild rank | Uses higher of player level and membership rank | A high-level member can receive level-ranked quest | `src/systems/guild/guilds.js:152-155,469-482` (`questRankFor`) |
| Knightly Order quest rank | Character level or guild rank | Uses higher of player level and membership rank | A high-level member can receive level-ranked quest | `src/systems/guild/guilds.js:152-155,469-482` (`questRankFor`) |
| Other NPC guild quest ladders | Guild rank | Rank requirements | Guild quest offers follow membership/rank requirements | `src/systems/questlines/qlLadders.js:31-47` (`ladders`) |
| Festival line start eligibility | Event + account | Festival open; registered online account; line's level threshold | Line runner checks opens and event needs before display/start | `src/systems/questlines/qlLines.js:40-46,119-129` (`LineOpens`) |
| Sea serpent story eligibility | Level + account | Level 8 and registered online account | Old Coil opens at level 8 | `src/systems/questlines/qlLines.js:106-115` (`oldCoil`) |
| Wrothgar Elite Gate presence | Event / location | Current Elite Gate spawn | Encounter site is generated; no fixed Renown threshold present in cited Elite Gate tier classifier | `src/net/eliteGates/egLaw.js:142-160`; `src/systems/gateTier.js:17-28` (`gateTier`) |
| Elite Breach loot/rewards | Event completion | Complete valid run / Redoubt | Service adjudicates event receipt; no level gate stated in law cited | `src/net/eliteGates/egLaw.js:226-228` (`egGoodEnd`) |
| Renown XP from kills | Character action | Kill eligible foe; foe level used up to 30 | Perform qualifying kill; Renown cap and hourly limits apply | `src/net/renown.js:174-206` (`renownKillXp`) |
| Renown XP from quests | Quest | Complete eligible quest; level contribution capped at 30 | Quest payment contributes Renown XP | `src/net/renown.js:178-206` (`renownQuestXp`) |
| Renown party bonus | Party | Party of up to 8 | Earn Renown XP while grouped; bonus is 10% | `src/net/renown.js:183-189` (`RENOWN_PARTY_BONUS_PCT`) |
| Renown weekly/hourly pacing | Time / account | 15,000 XP per account per hour | Renown reports share hourly allowance across characters | `src/net/renown.js:44-47,272-280` (`RENOWN_XP_HOUR_MAX`) |
| Renown report bound | Service action | 5,000 XP per report | Each client report capped by service | `src/net/renown.js:272-280` (`RENOWN_XP_REPORT_MAX`) |
| Character skill swaps | Skill / feature | Character progression path | Exact threshold not located in reviewed gate sources | `src/systems/skills.js:1` (`skills`) |
| Specialisation paths | Skill threshold | Mastery / skill requirements | Individual paths list their own requirement; no single universal gate found | `src/systems/weaponMastery.js:2-10` (`weaponClimb`) |
| Rest and healing | Place / setting | Safe resting conditions | Rest where allowed; code describes rest and exhaustion rules, not a character-level gate | `src/systems/rest/rest.js:1-14` (`rest recovery`) |
| Shops and town services | Location | Reach an appropriate settlement/building | Enter the building; no level gate found in shop stock declaration | `src/systems/shopStock.js:1` (`shop stock`) |
| NPC conversations | Location | Reach NPC and valid topic | Talk to NPC; interaction follows faction/topic availability | `src/systems/talk/talk.js:1-17` (`talk foundation`) |
| Banks | Location | Reach bank building | Use bank service; no character-level gate found in banking law | `src/systems/banking.js:1-16` (`banking law`) |
| Taverns and rooms | Location | Reach inn/tavern | Use tavern service; no character-level gate established in this law | `src/systems/tavern.js:1` (`tavern`) |
| First dungeon / Privateer's Hold | Quest / start | New character's start | Character begins at the opening dungeon | `src/systems/startDungeon.js:1` (`start dungeon`) |
| LeFay Monument exit | Quest / place | Find monument in Privateer's Hold | Interact with dungeon exit monument | `src/systems/activateGate.js:1` (`activateGate`) |
| First town | Location | Exit Privateer's Hold | Travel to a settlement; no additional level gate | `src/world/worldOfDaggerfall/wodPrivateersHold.js:1` (`Privateer's Hold`) |

## Proposed stage placement

Use the stage IDs and titles from `handbook/stages.json`. Rows below assign each family of features to the earliest relevant stage. The detailed per-quest rows above inherit the same assignment as their parent line unless specified.

| Stage id | Features to place here | Gate evidence / note |
|---|---|---|
| `begin` | Account creation, guest/registered distinction, interface, online Renown distinction and online rules | Account gate is the first login; guest entry exists. Account-restricted features should be previewed here, then explained at `crafts` where first usable. `src/net/renown.js:33-47`; `server-account/src/professions.js:115-118` |
| `creation` | Character creation, level 1, starting skills and class, paths with permanent character implications | Character starts at level 1. `src/net/identityToken.js:346-349`; `src/systems/chargen.js:1` |
| `hold` | Movement/combat/survival, first dungeon and exit; first passive progression concepts | These are available from the opening dungeon with no later gate. `src/systems/startDungeon.js:1`; `src/world/worldOfDaggerfall/wodPrivateersHold.js:1` |
| `town` | NPC guild joining, ranks and services; banks, shops, taverns, law; first town-facing services | Location and individual quest gates determine access; do not imply a universal character-level gate. `src/systems/guild/guilds.js:713-732` |
| `travel` | Travel modes, portal/Recall, settlements, sea, region and location gates | Earliest access follows reaching a town and then world travel; place-based, no general character-level gate found. `src/world/oceanHoles.js:45-58` |
| `growth` | Character level, Renown, elite foe gate at Renown 5, Firmament, profession ranks as point source, refunds at Renown 10, masteries and skill paths | Current `world` stage says Renown 5; elite foes support it. Firmament starts at Renown 1 with no stars, then earns two per Renown level. `src/systems/eliteFoes.js:72-82`; `src/net/firmament/firmamentLaw.js:37-50` |
| `quests` | All introductions and questlines, sorted by their specific gates: levels 2, 3, 4, 5, 6, 8, 10 and 12, plus quest chaining and setting/event dependencies | Existing `quests` stage is appropriate, but line start gates differ; account/online and seasonal requirements belong on their own badges. `src/systems/questlines/qlLines.js:54-221` |
| `together` | Chat/party/social features, shared dungeons and Arena; account restrictions for ranked/private Arena | Available from start per stage definition; account-gated PvP details belong here. `server-account/src/arena.js:404-405`; `src/net/arena/arenaLaw.js:731-747` |
| `crafts` | Ten profession tracks, crafting/gathering, Stores, Materials Bag, market, Marks, trade, homes | The registered-account gate makes this stage's placement right; profession rank tiers are sub-gates. `server-account/src/professions.js:115-118`; `server-account/src/market.js:106-118` |
| `world` | Own-world elites, world events, raids, spawned/Elite dungeons, Dagon's Breach, Starfall and Motherlodes | Renown 5 opens own-world elite rolls, but other activities are time/place gated and may be accessible earlier; do not apply a blanket Renown 5 gate to all world events. `src/systems/eliteFoes.js:72-82`; `src/net/gate/gateLaw.js:20-29` |
| `rivals` | Revenants/companions at Renown 10; player guild founding at Renown 10 plus 10,000 gold; city control after guild access | Stage gate Renown 10 matches revenants and founding. Guild joining is invite/accept, not Renown-gated. `src/systems/revenant/revenant.js:112-116`; `src/net/guild/guildLaw.js:26-28` |
| `late` | Elite Breach cycles, Redoubts, Abyss Dungeons, Wrothgar Open Zone, Veil/ocean travel, Arena seasons/tournament, legacy | Keep gate as `Varies`: these combine event timing, place, completion chain, account and lineage gates; some cited systems have no universal player level gate. `src/net/eliteGates/egLaw.js:142-160`; `src/systems/questlines/qlLines.js:70-103` |
| `reference` | Glossary, caps, timers, command/key lists, sync notes | Always available; reference pages do not need a player progression gate. `handbook/stages.json` (stage definition) |

### Features that do not fit the current stages cleanly

- **Playing with others (`together`)** is stage 7 but marked available from the start. Consider moving its first-contact page or a short social-access primer into `begin` or `hold`, leaving mature group and PvP rules in `together`.
- **The stage gate “quests: first courier letter” is too broad.** Most tutorial questlines begin at levels 2-6, while named storylines begin at levels 8, 10 and 12; a registered account and sometimes a server event are also required. Keep one quest stage but expose per-line gate badges instead of implying one letter unlocks every line.
- **`world` is not uniformly gated by Renown 5.** Own-world elite foe rolls are; the daily Dagon's Breach is clock/location-gated, and the code does not establish a global Renown 5 requirement for all world activities.
- **`rivals` is not uniformly gated by Renown 10.** Revenants and player-guild founding are; guild membership requires an invitation, while city politics require guild/seat conditions.
- **Profession activity has an additional rank ladder inside `crafts`.** A registered account opens the system, but harvest/craft tiers then require profession ranks 0, 10, 25, 40, 55, 70 and 90.
- **Late content has no single threshold.** Event clocks, location, prior quest completion, server witness receipts, account state and instance entry conditions combine. Keep `late` at `Varies` and state the exact gate on each feature page.
- **Some references in travel/building/service areas use subsystem entry files rather than the authoritative rule declaration.** Those rows identify no gate found in the inspected declaration; verify the individual service rule when drafting its full page.

