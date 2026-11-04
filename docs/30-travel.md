# Getting Around

*Checked 2026-10-21 against DFO Online main `4bba28c6c` (2026-10-20). This covers the online game. Carriage and guild fast travel advance the character's clock by the calculated trip time even when the player appears at once; party travel is the exception and takes no world time. For the broader play plan, see [The Play Guide](23-playing-online.md); for October additions, see [What's New Since 17 October](24-whats-new-2026-10.md).*

## The “cart method” is a hired carriage

Yes, land travel with a cart-like vehicle exists. The carriage is a paid fast-travel service, separate from the horse cart or wagon you buy and drive yourself.

Find the carriage driver standing with a carriage and horses just outside a walled city's gate. **Only cities have one:** the driver stands in four specific city-gate blocks (`WALLAA08`–`WALLAA11`), and on the player's own map data **410 of the Bay's 3,444 settlements** have such a gate, all of them cities. Hamlets and villages never do. The nearest to Privateer's Hold is **Chesterwark**, about 11 map squares (~9 km) south and slightly west; Daggerfall city also has one. The guide's map can filter towns by carriage. Talk to the driver and choose **Fast Travel**. The driver's map lets you choose an eligible town, village, or other allowed destination. Confirm the displayed fare and the game performs Daggerfall-style fast travel. You board at the city gate, not at the Stable or Wagon Yard. Immersive Travel's carriage records are added to the gate blocks; the driver is not a merchant-yard transport seller.

The fee has two parts: a daily carriage fee for each whole land-travel day, plus one more daily fee; and, if you selected inn stops, inn charges. The current setting defaults to **1 gold per day**. So with inns off and default settings, the carriage fee is one gold plus one gold for each complete land-travel day. The fare screen gives the exact amount. Long trips can also include a ship fare if ship travel is selected and enabled.

Online, this driver service is the way to take the paid, instant land trip. The held map's own land journeys are walked. A carriage is still subject to location eligibility and, when the regional setting is enabled, its region restrictions. In the Open Zone, fast travel cannot enter or leave the zone. Inside, the applicable Open Zone fee and cooldown also apply.

*Sources: `src/systems/immersiveTravel.js` (`carriageTripCost`, `carriageRefusal`, `isDestinationValid`); `src/systems/modSettings.js` (`General.DailyCarriageFee`); `src/world/immersiveTravelGates.js` (`hasCarriageGate`); `src/scenes/world.js` (`immersiveTravelService`); `bible/06-Systems/Immersive-Travel.md`; `bible/06-Systems/Travel-Options.md` (TO-ONLINE, IT1).*

## Walking and the Overworld Travel View

Walking is free and gives you the most control. You can travel at ground level, or open the Overworld Travel View and click a town, quest mark, or map point to walk there. It uses the streamed world: your character and mount cross real terrain, and other travelers can appear on the map. A land route follows roads when practical, may use tracks, and cuts across open ground when that is the route. The route planner scores road steps at 1, tracks at 1.6, and open ground at 3.5, so it can favor a longer road over a cross-country shortcut.

The Travel View has travel-speed settings of x5, x10, x20, x30, x40, x60 and x100. The default is x60 on open ground. x100 is available only on a road or track; leaving one caps the running rate at x60 without erasing your setting. In a town, a routed street leg runs at x5 and goes through open gates. If a needed gate is shut for the night, the journey stops there and tells you why. A physical horse's pace is still its own; the travel clock rate and the mount's movement speed are separate controls.

Travel can slow as alerted enemies approach, and foes can interrupt a journey. The encounter system can sometimes let a cautious traveler pass. A chase is visible on the Overworld within its displayed range. For danger by region and time of day, see [The Play Guide](23-playing-online.md); fast travel inside the Open Zone is separately capped at x20 off-road and x40 on a road.

*Sources: `src/systems/travel/travelRoute.js` (`ROUTE_COST`); `src/systems/travel/travelPace.js` (`PACE_STEPS`, `ROAD_PACE_MAX`, `OPEN_PACE_MAX`, `WILD_PACE_CAP`); `src/systems/travel/travelOptions.js` (`wayPace`, `applyRate`); `src/systems/travel/townWalk.js`; `src/systems/travel/regionChase.js`; `src/scenes/overworldForecastHost.js`; `bible/06-Systems/Travel-View.md` (OW-ROAD-TRUE, OW-TOWN-WALK, OW-CHASE-RANGE).*

## The Portal Stone

The Portal Stone replaces a land teleport for a character who cannot use magic. Buy one from a shopkeeper's service row for **5 Welkynd Shards**. The shards are the currency from dismantling qualifying gear. The stone is bound and consumed one use at a time.

Use it outdoors under open sky, choose a place on the map, then walk through the portal that opens in front of you. The portal remains for **30 seconds**, and other nearby players can use it too. Closing the map without choosing a destination spends nothing. The arrival is immediate and has no travel fare or travel cooldown.

It cannot be opened indoors, in water, aboard a boat, during a journey, near enemies, in a duel, or under siege wards. It also needs clear space and ground in front of you. Online teleport restrictions prevent using it to enter or leave the Open Zone or cross the Veil into the Eltheric Ocean.

*Sources: `src/systems/portalStone.js` (`PORTAL_STONE_SHARDS`, `PORTAL_OPEN_MS`, `portalHold`, `portalPlace`, `spendPortalStone`); `src/systems/gate/gateSpoils.js`; `src/scenes/world.js` (`openPortalStone`, `wildTeleportRefused`, `veilRefused`); `src/scenes/worldModes.js` (`portalRow`); `bible/06-Systems/Portal-Stone.md`.*

## Horses

Buy a horse at a town's Stable. A Stable offers three individually generated horses for that town's day; the listed price varies with its stats. A horse's Speed stat changes its ride pace, and holding sprint asks it to gallop. Galloping uses stamina; a winded horse must recover before galloping again.

Feed it oats, which a Stable sells, or apples. Under the default Boons care tier, hunger does not reduce stats or bond, but a starving horse cannot gallop. Under Hard care rules, hunger does reduce performance. A horse left at a Stable is fed there; one left waiting in the world grazes; a horse traveling with you eats oats from your pack over time. A Stable lets you change its coat, pattern, and leg markings for free; these are visual choices.

Riding is faster than walking on foot, but it is not a permanent speed multiplier: the horse's stat, hunger, gallop state, and care tier matter. The travel-speed dial controls accelerated journey time, not the horse's physical speed. The code has riding-aware movement and weapon animation, but no separate mounted-combat damage bonus. You dismount when entering a building or dungeon.

*Sources: `src/systems/merchantYards.js` (`stableHorses`, `STABLE_HORSES_OFFERED`, `yardStock`); `src/systems/steedCare.js` (`steedSpeedScale`, `hungerOf`, `canGallop`, `feedHorse`); `src/systems/transport.js` (`rideBaseFor`, `dismountOnTransition`); `src/systems/horse/horseCoats.js`; `src/combat/weapon/weaponRig.js`; `bible/06-Systems/Horse-Care.md`; `bible/06-Systems/Horse-Coats.md`.*

## Your own cart or wagon

Buy a Small Cart, Open Wagon, or Caravan at a town's Wagon Yard. Owning one means its item is in your pack; the Horse Cart and Cargo system can deploy it behind you and haul your carried goods. Capacities are **750 kg**, **1,500 kg**, and **2,000 kg**, respectively. A Small Cart needs one horse; the Open Wagon and Caravan need two horses to hitch. A horse is bought separately at a Stable. Larger wagons have more storage and some have seats or an enterable interior; they do not teleport you between towns.

Road use wears the wagon, and off-road travel wears it faster. A low-condition wagon becomes slow, but does not break beyond use. A Wagon Yard can mend it for gold; a Wagon Repair Kit repairs some condition in the field. Online, the town watch throws a wagon left on a road after **10 minutes**. A town also keeps at most **four teams** parked there; when there are more, it throws out the longest parked teams. The wagon and its cargo remain yours at the landing spot. Summon or walk to it.

In the Open Zone, dying drops the wagon if it is with you, along with your bag contents; a parked wagon is not treated as being with you. This makes wagons a poor risk there. The Merchant's Road questline opens at level 3. Its two quests have you collect a load from a merchant in one town and carry the quest item to a merchant or stable master in another town for haulage pay. You can carry it in a wagon if you own one, but the quest does not require one. This is a scripted delivery job, not a general system for loading arbitrary goods into a wagon and selling the load: the code says that general wagon-load hauling is not built.

*Sources: `src/systems/wagon/wagonKinds.js` (`WAGON_KINDS`, `wagonTeamShort`); `src/systems/merchantYards.js` (`yardStock`); `src/systems/wagon/wagonUpkeep.js` (`rollWear`, `wagonState`, `mendPrice`, `kitMendWagon`); `src/systems/wagon/wagonWarden.js` (`offlineDue`), `src/net/wire.js` (`WARDEN_ROAD_MS`, `WARDEN_TOWN_CAP`, `wardenVerdicts`), `server/src/index.js` (`_parkWarden`); `src/systems/wild/wildDropLaw.js`; `src/systems/questlines/qlLines.js` (`introRoad`); `src/systems/questlines/quests/QLIR01.txt`, `QLIR02.txt`; `src/systems/questlines/qlActs.js`; `bible/06-Systems/Horse-Cart-And-Cargo.md`, `Wagons.md`, `Wagon-Upkeep.md`, `Wagon-Warden.md`.*

## Ships

There are two ways to travel by ship.

**Buy passage on a friendly ship.** At a port, find a friendly ship moored at its berth whose hull can carry a passenger: a Large Boat, Small Ship, or Carrack. Activate the ship and choose a port you have discovered. The displayed fare is **25 gold per 24 map pixels, plus 25 gold**, counting the entire voyage as sea. You pay even if you own a ship. The ship actually sails the Overworld crossing; it does not teleport. You must stay aboard for the passage to continue. Stepping ashore or otherwise leaving ends the passage, and goods in the ship's hold come ashore with you. A hostile encounter can interrupt the voyage; while you remain aboard, the captain resumes sailing.

**Own a ship.** Shipyards stand at ports. Buy hull parts or a deed there, assemble and place the boat, and sail it yourself; hire named crew at the port's Crew Hall if you need hands. Hull base prices are Rowboat **4,000**, Large Boat **8,000**, Small Ship **100,000**, Large Galley **200,000**, and Carrack **150,000 gold**. Repairs, crew and supplies cost extra. The Shipyard sells every hull; crew fees are shown for each recruit. An owned vessel gives you physical sea travel and is required to cross the Veil into the Eltheric Ocean. Passage-on-a-friendly-ship is only offered within the Bay.

**Risks and range.** Hostile ships and sea events can interrupt a voyage. In the Bay, the sea has pirate traffic and the scheduled sea-serpent event ([What's New Since 17 October](24-whats-new-2026-10.md)). Beyond the Veil, the Eltheric Ocean's deeper bands have more dangerous corsairs and legendary ships. The Veil crossing is a sailed transition, not a Portal Stone, Recall, carriage, or passage route. Use the Fleet/Summon feature to reunite with a ship left on the far side.

*Sources: `src/systems/naval/passage.js` (`PASSAGE_HULLS`, `passageFare`, `passageDestinations`); `src/systems/travel/travel.js` (`calculateTripCost`); `src/systems/comeSailAway/comeSailAwayHulls.js` (`HULL_PRICES`); `src/systems/shipyards.js`; `src/systems/naval/shipCrew.js`; `src/systems/naval/etherShips.js`; `src/systems/naval/etherCrossing.js`; `src/scenes/naval/passageHost.js`; `bible/03-World/Passage.md`, `Shipyards.md`, `Captains-Sea.md`, `Eltheric-Ocean.md`.*

## A held coastal seat can add a port

If your guild holds a coastal seat with a Harbour, guild members can use that seat as a port in Travel Options, including its ship-port choices. This adds access to the travel-port list; it does not build a Shipyard or put a carriage at the seat.

*Sources: `src/systems/travel/travelPorts.js` (`hasPortFor`, `setSeatHarbours`); `src/scenes/world.js` (seat Harbour wiring); `bible/11-Multiplayer/Seats-Arc.md` §7.5; `bible/06-Systems/Travel-Options.md`.*

## Mages Guild teleport and party travel

**Mages Guild teleportation** is a separate, instant service from a Mages Guild hall. Paid service for guild members below rank 8 is controlled by Travel Options and is **off by default**. When enabled, the teleport costs `(8 − rank) × 200` gold: rank 1 costs 1,400 gold and rank 8 or higher is free. It uses the teleport map, not the Overworld's walked route. Like other online teleports, it cannot enter or leave the Open Zone or cross the Veil. Tiger Fist can use this only by joining the Mages Guild; the character does not need to cast a spell for the guild service.

**Party travel** is online-only. Type `/leader` or accept the prompt to travel to an online party leader on another map pixel. The member pays the normal fast-travel fare shown in the prompt; the travel takes no world time and lands beside the leader outdoors, or at the place's door if the leader is inside. When a leader starts a fast trip with nearby party members, they can answer **Yes** or **No** (or use `/travel`); each follower pays their own fare. They arrive beside the leader. This applies to the ordinary fast-trip popup; a walked Overworld route remains a walked route. Party teleport is also blocked across the Open Zone boundary and the Veil.

*Sources: `src/systems/travel/travelOptions.js` (`teleportCost` setting and Mages Guild registration); `src/ui/travel/travelMapOptions.js` (`teleportCost`, `TELEPORT_RANK_FREE`, `TELEPORT_COST_PER_RANK`); `src/scenes/world.js` (`openTeleportMap`, `teleportTo`, party travel command/refusals); `src/systems/party/partyTravel.js` (`offerLeader`, `propose`, `journey`); `src/systems/party/partyTravelLaw.js` (`leaderTripOf`); `src/systems/modSettings.js` (`Teleportation.EnablePaidTeleportation`); `bible/06-Systems/Travel-Options.md`.*

## The Open Zone: travel rules and risk

The Wrothgarian Mountains are an Open Zone. Ordinary fast travel cannot cross its boundary: you cannot teleport or take a fast trip into or out of the zone. Use the Overworld and its roads to enter, leave, and travel between its heights. Inside the zone, fast travel costs **2,500, 5,000, 10,000, or 15,000 gold**, based on the ring where you arrive, and has a **10-minute cooldown**. This applies to carriage travel inside as well. Overworld walking does not pay that fee or wait for that cooldown. Its travel speed is capped at x20 in wild ground and x40 on a road.

This is dangerous PvP country. See [The Play Guide](23-playing-online.md) before going; in particular, a death can cost the wagon and bag you brought in. Do not treat the fast-travel fee as protection from the zone's other risks.

*Sources: `src/systems/wild/wildZone.js` (`WILD_TRAVEL_FEES`, `WILD_TRAVEL_COOLDOWN_MS`, `wildJourney`); `src/systems/travel/travelPace.js` (`WILD_PACE_CAP`); `src/scenes/world.js` (`wildTravelGate`, `wildTeleportRefused`); `src/systems/wild/wildDropLaw.js`; `bible/11-Multiplayer/Wild-Zone.md`.*

## What replaced DFU map fast travel and Recall?

Online Overworld trips selected as a land journey are walked, not the old fade-to-destination map fast travel. The paid carriage and Mages Guild services are separate fast-travel options; the Portal Stone is the one-use map teleport. Party travel can carry you to your leader or let a gathered party follow a fast trip. Sea travel is either the sailed passage on a friendly ship or taking your own vessel.

Recall is a spell, so it is not an option for Tiger Fist's no-magic build. The online teleport rules also block Recall and other teleports into or out of the Open Zone and across the Veil. The Portal Stone replaces the general map-teleport role but follows those same online boundaries.

*Sources: `bible/06-Systems/Travel-Options.md` (TO-ONLINE, IT1, PORTAL1); `src/systems/portalStone.js`; `src/scenes/world.js` (`fastTravelTo`, `wildTeleportRefused`, `veilRefused`); `src/systems/immersiveTravel.js`.*

## Quick comparison

| Method | Cost | Speed | Where to start | Best for |
|---|---|---|---|---|
| Walk on foot | Free | Normal physical pace | Anywhere | Local exploration and careful routing |
| Overworld Travel View | No travel fare; x5–x100 clock rate subject to ground caps | Walks the real route; x100 only on road/track, x60 max elsewhere | Overworld toggle / click a town or mark | Long land routes you want to see and steer |
| Hired carriage | Trip fare: default daily fee plus travel days; optional inn charges | Instant arrival; travel time still advances your character clock | Carriage driver outside a walled city gate | Quick paid land trip between eligible places |
| Portal Stone | 5 Welkynd Shards per use | Instant | Any legal outdoor place; use item and choose a map destination | One-off teleport when time matters |
| Mages Guild teleport | `(8 − rank) × 200` gold below rank 8; free at rank 8+, if the paid-service setting is on | Instant | Mages Guild hall, teleport service | Guild members who want a direct town jump |
| Party travel | Normal fast-trip fare per traveling member | Instant, with no world time | `/leader`, `/travel`, or the party prompt | Catching up with a leader or traveling together |
| Horse | Purchase price shown by Stable; feed it if needed | Faster physical riding; brief gallop, then stamina recovery | Stable, then mount in the world | Physical road or field travel without caravan load |
| Cart or wagon | Purchase price shown by Wagon Yard; horse(s), feed and repairs extra | Physical team pace; load and condition can slow it | Wagon Yard, then deploy and hitch | Carrying goods over land; Merchant's Road jobs |
| Friendly-ship passage | 25 gold per 24 map pixels, plus 25 | Sailed real-world journey | Friendly passenger ship at a port berth | Travel between known Bay ports without owning a ship |
| Own ship | Hull: 4,000–200,000 gold by type; crew and upkeep extra | Sailed physical journey | Buy at Shipyard, then place and sail | Sea exploration, combat, and crossing the Veil |

*Sources: the functions and constants cited in the sections above.*

## How Tiger Fist should travel

At level 7, with limited play time and no magic, use the cheapest method that fits the destination:

1. **For Starfall and town events:** use the Overworld mark to walk to the event or raid site. If it is a long land trip and you need to save the session, compare the driver's fare with the Portal Stone's five shards; use the carriage for a legal town-to-town trip, or a stone for a single urgent jump.
2. **For raids and quest dungeons:** let the quest marker route you there. A mount helps with physical travel, but entering a dungeon dismounts you. For public activity, see [The Play Guide](23-playing-online.md)'s advice on quest instances, crowds, and danger by place.
3. **For sea destinations:** buy passage if a friendly ship is available and the route is within known Bay ports. It avoids the ship purchase and crew cost. Save ship ownership for when you want to explore, fight at sea, haul sea cargo, or cross the Veil.
4. **Avoid paid shortcuts into the Open Zone.** They cannot take you in or out, and the inside fee can reach 15,000 gold. Use its roads only with a prepared plan and accept its PvP risk.
5. **Do not buy a wagon solely for the Merchant's Road questline.** The quest supplies a carryable job item and can be completed on foot; buy a wagon when its hauling capacity will help your regular play.

*Sources: `src/systems/questlines/qlLines.js` (`introRoad`); `src/systems/naval/passage.js`; `src/systems/wild/wildZone.js`; `src/systems/portalStone.js`; `docs/23-playing-online.md`; `docs/24-whats-new-2026-10.md`.*
