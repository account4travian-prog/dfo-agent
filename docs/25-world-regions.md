# The World, Region by Region

Studied against online source commit `4bba28c6c` (2026-10-20). This guide says what the supplied code and design record establish. `MAPS.BSA` supplies climate by map pixel; the source's `REGION_NAMES` table names regions but does not assign one climate to each whole region. Terrain words below follow the region names and the stated feature footprints. Check the local forecast and map pixel before planning for snow, heat, food or a harvest. The live climate and weather systems can cross those boundaries gradually.

For danger tiers, quest order, public versus private dungeons, Renown and a level-7 plan, use [The Play Guide](23-playing-online.md). For features added 17–20 October, use [What's New Since 17 October](24-whats-new-2026-10.md). This guide focuses on where things are.

## Read the ground before you travel

DFO uses the Iliac Bay's map regions, then applies climate and height at the actual pixel. The climate set includes Ocean, Desert, Desert2, Mountain, Rainforest, Swamp, Subtropical, Mountain Woods, Woodlands and Haunted Woodlands. The `Haunted Woodlands` label is in the source table; its comment says its location is uncertain. Weather uses climate, season, time, height and drifting air. Snow cover follows what falls and melts; a mountain can be snowy above a clear valley, and a jungle can be wet without snow. Climates & Calories uses the enabled survival tier for warmth and food. For the current weather and snow behavior, see [What's New Since 17 October](24-whats-new-2026-10.md). Check the game's forecast and conditions rather than treating a whole region as one climate.

The region list below groups the names from `REGION_NAMES` into readable travel areas. The grouping is for the map guide, not an additional game mechanic. Early-story names worth recognizing are Privateer's Hold, Daggerfall, Wayrest, Sentinel, Direnni Tower and Orsinium; [The Play Guide](23-playing-online.md) covers the questline order and level gates. “Why go” names the systems the source puts there or the ordinary reason represented by the region's terrain. Gathering is also climate-specific: forests provide more trees, mountains more veins, swamps and rainforests more herbs, and desert pixels no trees. The exact node set and tier change by pixel and day.

*Sources: `src/formats/mapsTables.js` (`REGION_NAMES`, `CLIMATES`); `src/net/nodeLaw.js` (`NODE_COUNTS`, `nodeCount`); `src/systems/weather/airTemperature.js`; `src/systems/weather/snowpack.js`; `bible/06-Systems/Climates-Calories.md`; `docs/23-playing-online.md` (early quest destinations and gates).*

## The High Rock crown and western Bay

| Region(s) | Ground and local conditions | What to find and why go |
|---|---|---|
| **Daggerfall**, **Wayrest**, **Daggerfall Bluffs**, **Glenumbra Moors**, **Ilessan Hills** | City, coastal bluffs, moors and rolling hills. Pixel climate still varies. | Daggerfall city has the **Arena** and the LeFay Monument outside Privateer's Hold. Wayrest is the other High Rock crown city and a port. City and town yards add stables and transport merchants; ports add shipyards. The surrounding countryside is ordinary exploration and gathering. |
| **Glenpoint**, **Glenpoint Foothills**, **Yeorth Burrowland**, **Bantha** | Foothills, lowlands and burrowland; check the pixel for woodland, swamp or mountain weather. The named Bantha region itself has no land in the map data. | Use roads and settlements for early travel. Bantha's shipped jungle is a separate footprint on Hammerfell's south-eastern shore. |
| **Dwynnen**, **Northmoor**, **Menevia**, **Alcaire**, **Koegria**, **Bhoriane**, **Kambria**, **Phrygias**, **Urvaius**, **Ykalon**, **Daenia**, **Shalgora** | High Rock's northern and central interior: named moors, hills and broad settled country. Climate remains pixel-defined. | These are the broad hinterland regions for towns, roads, wilderness dungeons and gathering nodes. A town's services and economy are local; a region name alone does not imply a better shop price. |
| **Ravennian Forest**, **Malekna Forest**, **Skeffington Wood** | Forest country. Woodland pixels are the strongest ordinary tree-node climates; Haunted Woodlands is a separate code climate, not a verified region label. | Go for Logging and woodland herbs, or explore away from roads for spawned dungeons. The local node roll determines what is present that day. |
| **Devilrock**, **Wrothgarian Mountains**, **Orsinium Area** | Mountain and rocky highland country. Snow and cold depend on elevation, season and local climate. | The Wrothgarian Mountains contain DFO's **Open Zone**. Its rings are The Foothills (x1.25 loot), The Passes (x1.5), The High Crags (x1.75) and The Heart (x2). Foes start at the zone's 4x health and damage, then scale with the ring (x5 to x8 total). The heart is not a level-7 destination. Orsinium Area and the Wrothgarian Mountains share Orichalcum as their signature ore. |
| **Betony**, **Anticlere** | Small island and march regions. | Both are among the three profession **Marches**: every gathering node there receives the march yield bonus. They are contested wealth, so the extra yield comes with territorial danger. |
| **Isle of Balfiera** | Island free land. | Its signature ore is Adamantium. It is a resource trip; check danger and current gate activity first. |
| **Cybiades**, **Islands in the Western Iliac Bay**, **Tamarilyn Point** | Islands, points and coastal ground amid the Bay. | Explore for wilderness locations and coastal routes. Island nodes follow the pixel's climate; the sea itself is for fishing rather than land nodes. |
| **Bjoulsae River** | River region. | Follow it as a geographic route and use nearby land for the normal pixel-based professions. Fishing uses eligible water pixels. |
| **High Rock bay coast**, **High Rock sea coast** | Shoreline and sea. Local land pixels meet the Bay's ocean pixels. | Coastal ports support passage and ship services. Sea fishing and the Bay's naval systems are the reason to go offshore. High Rock sea coast is townless for the Super Dungeon region census; a Hollow is stood near a great Bay city instead. |
| **Gen Tem High Rock village** | Generated village region. | Ordinary village stop; it is not a city/town yard or port just because it has buildings. |

*Sources: `src/formats/mapsTables.js`; `src/net/kingdomLaw.js` (`MARCH_REGIONS`, `FREE_LANDS`); `src/net/nodeLaw.js`; `src/systems/wild/wildZone.js` (`WILD_REGION`, `WILD_RINGS`, `WILD_RING_LOOT`, `wildRingName`, `wildRingLoot`, `applyWildFoe`); `bible/11-Multiplayer/Wild-Zone.md`; `bible/03-World/LeFay-Monument.md`; `bible/11-Multiplayer/Arena.md`; `bible/11-Multiplayer/Super-Dungeons.md`; `bible/03-World/Merchant-Yards.md`; `bible/03-World/Shipyards.md`.*

## The Hammerfell crown and eastern Bay

| Region(s) | Ground and local conditions | What to find and why go |
|---|---|---|
| **Abibon-Gora**, **Kairou**, **Pothago**, **Myrkwasa**, **Ayasofya**, **Tigonus**, **Kozanset**, **Satakalaam**, **Totambu**, **Ephesus**, **Santaki**, **Antiphyllos**, **Bergama** | Western and central Hammerfell interior, from desert country to settled land and coast. Use the actual pixel climate: desert climates have no trees and many veins; they do have herbs. | Sentinel is a major Bay city and a named early quest destination. Hammerfell crown regions carry Ebony veins across their climates. Satakalaam is on the south-eastern shore area touched by Bantha. |
| **Alik'r Desert**, **Dragontail Mountains**, **Dak'fron** | Desert and mountain terrain. Dak'fron has the distinct Desert2 climate in the source comment. | Desert pixels are useful for Mining and herbs, not Logging. The Dragontail range is mountain country, but it is outside the Wrothgar Open Zone footprint. |
| **Lainlyn**, **Lainlyn Cliffs**, **Mournoth**, **Gavaudon**, **Tulune** | Southern/eastern coast, cliffs and adjoining interior. Lainlyn and Mournoth sit in the Jungle of Bantha footprint. | Lainlyn is one of the **Marches**; its gathering nodes get the march bonus. Bantha is the richer Logging destination in its wood-bearing pixels. Lainlyn also anchors the jungle's coastal extent. |
| **Hammerfell bay coast**, **Hammerfell sea coast** | Bay shore and outer coast. | Ports, shipyards, sea passage and fishing. Bantha spans the south-eastern Bay shore, including the Lainlyn, Satakalaam and Mournoth vicinity; the jungle's edge blends into adjacent land. |
| **Gen Rai Hammerfell village** | Generated village region. | A village stop, not a port feature by default. |
| **Sentinel** | Hammerfell's crown city on the Bay coast. | Sentinel is an early journey destination and port city. The Hammerfell crown's Ebony vein signature applies across its climates. |

*Sources: `src/formats/mapsTables.js`; `src/net/kingdomLaw.js`; `src/net/nodeLaw.js`; `src/world/jungle/banthaArea.js`; `src/world/jungle/jungleRegion.js`; `bible/06-Systems/Professions-Arc.md` §4.7; `bible/03-World/Bantha-Jungle.md`; `bible/03-World/Shipyards.md`.*

## The Bay's special terrain and places

### Wrothgarian Mountains: Open Zone

This is the named, map-marked open PvP zone. Four rings run inward: The Foothills, The Passes, The High Crags and The Heart. Their loot multipliers are x1.25, x1.5, x1.75 and x2. Foes have the zone base of 4x health and damage, multiplied again by their ring factor, for x5 to x8 overall. Dungeon piles average the ring factor; the heart always receives its extra pile roll. Death and PvP loss rules are severe. [The Play Guide](23-playing-online.md) has the practical risk summary. Tiger Fist at level 7 should stay out.

*Sources: `src/systems/wild/wildZone.js` (`WILD_FOE_HEALTH_MULT`, `WILD_FOE_DAMAGE_MULT`, `WILD_RING_LOOT`, `wildRingName`, `wildRingLoot`, `wildPileMore`, `applyWildFoe`); `bible/11-Multiplayer/Wild-Zone.md`.*

### Jungle of Bantha

The shipped jungle is on Hammerfell's south-eastern Bay shore, from the Lainlyn and Satakalaam vicinity east through Mournoth toward the map edge. Bantha is the notable southern Logging destination. For its canopy, haze, dirt trails and tree-node yield, see [What's New Since 17 October](24-whats-new-2026-10.md).

*Sources: `src/world/jungle/banthaArea.js`; `src/world/jungle/jungleRegion.js`; `src/net/nodeLaw.js` (`treeSlots`); `bible/03-World/Bantha-Jungle.md`.*

### Eltheric Ocean and the Iliac Bay

The **Eltheric Ocean** is a separate sea beyond the Bay's Veil, with its own Overworld, islands, towns, ruins, water depth, sea creatures and gathering nodes. It is an exploration destination, not part of the ordinary Bay coastline. For Tiger Fist it is a later voyage, not a level-7 shortcut.

In the **Iliac Bay**, ports are the useful anchors. Come Sail Away passage lets a player board a friendly ship and pay the captain's quoted fare to a known port. Shipyards stand at a port's seaward edge and provide ship services; piers and lighthouses are port features. Fishing works on eligible sea pixels. Sethrakul, the sea serpent, is a shared world encounter and a substantial Renown source; use [The Play Guide](23-playing-online.md) for its timing and reward. Abyss Dungeons are sea content, but the current Super Dungeon census excludes townless sea regions and stands old records near the great Bay cities.

*Sources: `src/world/ethericSea.js`; `src/net/nodeLaw.js` (Eltheric nodes and sea schools); `src/systems/naval/passage.js`; `bible/03-World/Eltheric-Ocean.md`; `bible/03-World/Passage.md`; `bible/03-World/Shipyards.md`; `bible/11-Multiplayer/Sea-Serpent.md`; `src/net/superDungeon/sdLaw.js` (`SD_TOWNLESS_REGIONS`); `bible/11-Multiplayer/Super-Dungeons.md`.*

## Where the other place-based systems go

| System | Where it is | Why a player goes |
|---|---|---|
| **Arena** | Daggerfall city, in its centre-east block. | Arena quests and player or NPC fights. Its questline is in [The Play Guide](23-playing-online.md); do not confuse the city Arena with wilderness danger. |
| **LeFay Monument** | Outside Privateer's Hold, the opening dungeon in Daggerfall region. | A memorial and flower interaction at the first exterior a new character reaches. |
| **Raids** | The online system picks a town/region through the seat and raid law; it is a town defence, not a fixed map landmark. | Defending a raid is an excellent early group Renown goal. Follow current notices and map marks. |
| **World bosses and Dagon's Breaches** | Shared world encounter sites are selected by the encounter law and marked in the world; Breaches appear on land, not as a permanent region landmark. | Join others for boss rewards. The Dagon Cycle and Elite Breach are later progression; [The Play Guide](23-playing-online.md) gives their quest gates. |
| **Elite Gates** | Placed as marked gate encounters in the world; the exact site is generated by gate law. | High-end group challenge. Not for a level-7 solo fighter. |
| **Super Dungeons / Hollows** | A region is selected by the Super Dungeon census; regions without a town are excluded. A spawned/recorded sea Hollow is stood near a great Bay city. | Hard, shared group dungeon content. The current town-region selection avoids a Hollow in townless sea. |
| **Holdings** | The Holdings screen manages player homes, fleet, mounts and carts; owned homes and guild holdings are attached to their actual town/plot. | Manage transport or use a home. It is not one region-wide structure. |
| **Windmills** | Farm blocks in the world data, placed in multiple regions. | Landmark and environmental detail, not a special vendor or resource node. |
| **Merchant yards** | Outdoor yards in every city and town: horse stables and transport merchants. Villages, farms and dungeons are excluded. | Buy horses or scarce transports. |
| **Shipyards** | Port towns, on each town's seaward edge. | Buy or sell hulls, hire crew and use ship services. |
| **Profession signatures** | Daggerfall crown: Moonstone on the first two veins of a confirmed (witnessed) map square, across its climates. Wayrest crown: Mithril veins across climates. Sentinel crown: Ebony veins across climates. Orsinium/Wrothgarian free land: Orichalcum. Balfiera free land: Adamantium is its signature ore. Betony, Anticlere and Lainlyn marches: +25% yield on every node. | Target the metal or yield you need. The free-land and march trips are risky. |
| **Regional markets** | Prices are local to towns and their Prosperity, seat and market cycle; the law does not set one blanket markup by region. | Compare town cards and counter prices before selling or repairing. [What's New Since 17 October](24-whats-new-2026-10.md) explains the current economy. |

*Sources: `src/net/kingdomLaw.js`; `src/net/nodeLaw.js`; `src/net/townEconLaw.js`; `src/net/raidLaw.js`; `src/net/superDungeon/sdLaw.js`; `src/net/gate/gateLaw.js`; `src/systems/wild/wildZone.js`; `src/systems/merchantYards.js`; `src/world/merchantYards/merchantYardSites.js`; `src/world/lefayMonument.js`; `bible/03-World/LeFay-Monument.md`; `bible/03-World/Windmills.md`; `bible/03-World/Holdings.md`; `bible/03-World/Merchant-Yards.md`; `bible/03-World/Shipyards.md`; `bible/11-Multiplayer/Arena.md`; `bible/11-Multiplayer/World-Bosses.md`; `bible/11-Multiplayer/Breach-Portents.md`; `bible/11-Multiplayer/Elite-Gates.md`; `bible/11-Multiplayer/Super-Dungeons.md`; `bible/06-Systems/Professions-Arc.md` §4.7.*

## Where to go first

- **Safe Renown:** follow [The Play Guide](23-playing-online.md)'s early questlines in towns and private quest instances. For group play, answer a nearby town raid notice and party with the defenders. Stay in the familiar low-tier countryside and go by day.
- **Profession materials:** gather on nearby confirmed pixels first. For ordinary timber and herbs, use woodland; for ore, mountain or desert pixels. For a specific signature, plan later for Daggerfall Moonstone, Wayrest Mithril, Sentinel Ebony, or the Lainlyn/Betony/Anticlere march bonus. Do not go to Wrothgar for its Orichalcum yet.
- **Money:** gather what your current ranks can harvest, then sell where the town card and actual counter price are favorable. Bantha is the Logging destination when you're ready for the southern trip. Bank the proceeds; [The Play Guide](23-playing-online.md) covers death loss and the global market.
- **Group content:** start with the Arena or a town defence, per [The Play Guide](23-playing-online.md). Sea serpent, Breaches, Elite Gates, Super Dungeons and Wrothgar's Open Zone are later or group-led destinations. A level-7 fighter should avoid Wrothgar and should not enter a high-tier dungeon alone.

*Sources: `docs/23-playing-online.md`; `src/net/nodeLaw.js`; `src/net/townEconLaw.js`; `bible/06-Systems/Professions-Arc.md` §4.7; `src/systems/wild/wildZone.js`; `src/net/raidLaw.js`.*

## Map appendix

Each `where` field gives a locating cue for the map project: an exact region name, the named map place, or the source constant/module that defines a generated footprint.

```json
[
  {"name":"Alik'r Desert","kind":"region","region":"Alik'r Desert","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Dragontail Mountains","kind":"region","region":"Dragontail Mountains","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Glenpoint Foothills","kind":"region","region":"Glenpoint Foothills","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Daggerfall Bluffs","kind":"region","region":"Daggerfall Bluffs","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Yeorth Burrowland","kind":"region","region":"Yeorth Burrowland","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Dwynnen","kind":"region","region":"Dwynnen","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Ravennian Forest","kind":"region","region":"Ravennian Forest","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Devilrock","kind":"region","region":"Devilrock","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Malekna Forest","kind":"region","region":"Malekna Forest","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Isle of Balfiera","kind":"region","region":"Isle of Balfiera","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Bantha","kind":"region","region":"Bantha","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Dak'fron","kind":"region","region":"Dak'fron","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Islands in the Western Iliac Bay","kind":"region","region":"Islands in the Western Iliac Bay","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Tamarilyn Point","kind":"region","region":"Tamarilyn Point","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Lainlyn Cliffs","kind":"region","region":"Lainlyn Cliffs","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Bjoulsae River","kind":"region","region":"Bjoulsae River","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Wrothgarian Mountains","kind":"open_zone","region":"Wrothgarian Mountains","where":"WILD_REGION = 16 and ring constants in src/systems/wild/wildZone.js"},
  {"name":"Daggerfall","kind":"region","region":"Daggerfall","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Glenpoint","kind":"region","region":"Glenpoint","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Betony","kind":"region","region":"Betony","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Sentinel","kind":"region","region":"Sentinel","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Anticlere","kind":"region","region":"Anticlere","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Lainlyn","kind":"region","region":"Lainlyn","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Wayrest","kind":"region","region":"Wayrest","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Gen Tem High Rock village","kind":"region","region":"Gen Tem High Rock village","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Gen Rai Hammerfell village","kind":"region","region":"Gen Rai Hammerfell village","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Orsinium Area","kind":"region","region":"Orsinium Area","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Skeffington Wood","kind":"region","region":"Skeffington Wood","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Hammerfell bay coast","kind":"region","region":"Hammerfell bay coast","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Hammerfell sea coast","kind":"region","region":"Hammerfell sea coast","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"High Rock bay coast","kind":"region","region":"High Rock bay coast","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"High Rock sea coast","kind":"region","region":"High Rock sea coast","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Northmoor","kind":"region","region":"Northmoor","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Menevia","kind":"region","region":"Menevia","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Alcaire","kind":"region","region":"Alcaire","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Koegria","kind":"region","region":"Koegria","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Bhoriane","kind":"region","region":"Bhoriane","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Kambria","kind":"region","region":"Kambria","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Phrygias","kind":"region","region":"Phrygias","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Urvaius","kind":"region","region":"Urvaius","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Ykalon","kind":"region","region":"Ykalon","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Daenia","kind":"region","region":"Daenia","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Shalgora","kind":"region","region":"Shalgora","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Abibon-Gora","kind":"region","region":"Abibon-Gora","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Kairou","kind":"region","region":"Kairou","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Pothago","kind":"region","region":"Pothago","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Myrkwasa","kind":"region","region":"Myrkwasa","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Ayasofya","kind":"region","region":"Ayasofya","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Tigonus","kind":"region","region":"Tigonus","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Kozanset","kind":"region","region":"Kozanset","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Satakalaam","kind":"region","region":"Satakalaam","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Totambu","kind":"region","region":"Totambu","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Mournoth","kind":"region","region":"Mournoth","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Ephesus","kind":"region","region":"Ephesus","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Santaki","kind":"region","region":"Santaki","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Antiphyllos","kind":"region","region":"Antiphyllos","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Bergama","kind":"region","region":"Bergama","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Gavaudon","kind":"region","region":"Gavaudon","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Tulune","kind":"region","region":"Tulune","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Glenumbra Moors","kind":"region","region":"Glenumbra Moors","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Ilessan Hills","kind":"region","region":"Ilessan Hills","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Cybiades","kind":"region","region":"Cybiades","where":"REGION_NAMES in src/formats/mapsTables.js"},
  {"name":"Privateer's Hold","kind":"dungeon","region":"Daggerfall","where":"MAPS.BSA location name and CUSTAA30.RMB"},
  {"name":"Direnni Tower","kind":"quest_location","region":"Isle of Balfiera","where":"MAPS.BSA location name"},
  {"name":"Daggerfall Arena","kind":"arena","region":"Daggerfall","where":"GEMSAL03.RMB centre-east block in Daggerfall city"},
  {"name":"LeFay Monument","kind":"landmark","region":"Daggerfall","where":"Outside Privateer's Hold; world/lefayMonument.js"},
  {"name":"Jungle of Bantha","kind":"biome","region":"Lainlyn, Satakalaam, Mournoth","where":"banthaArea.js footprint"},
  {"name":"Eltheric Ocean","kind":"sea_zone","region":"Beyond the Iliac Bay Veil","where":"world/ethericSea.js and Overworld crossing"},
  {"name":"Iliac Bay ports","kind":"port_network","region":"Iliac Bay coasts","where":"MAPS.BSA port towns"},
  {"name":"Sethrakul","kind":"world_boss","region":"Iliac Bay","where":"Sea Serpent encounter law and world map mark"},
  {"name":"Abyss Dungeons / Hollows","kind":"super_dungeon","region":"Near eligible Bay town regions","where":"src/net/superDungeon/sdLaw.js and sdHost.js"},
  {"name":"Dagon's Breaches","kind":"world_boss","region":"Land regions selected by breach law","where":"Breach Portents law and world map marks"},
  {"name":"Elite Gates","kind":"group_encounter","region":"Generated marked world sites","where":"src/net/eliteGates/egLaw.js"},
  {"name":"Town raid defence","kind":"event","region":"Town selected by raid law","where":"src/net/raidLaw.js current notice/map mark"},
  {"name":"Merchant yards","kind":"service","region":"Every city and town","where":"merchantYardSites.js"},
  {"name":"Shipyards","kind":"service","region":"Port towns","where":"Town seaward edge; shipyard law"},
  {"name":"Windmills","kind":"landmark","region":"Farm blocks in multiple regions","where":"WorldData RMB farm overrides"}
]
```
