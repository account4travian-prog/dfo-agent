---
title: Hired carriages
summary: The carriage driver outside a walled city's gate sells instant land travel for a small daily fare.
stage: travel
order: 30
gate: none
tags: [travel, carriage, fast travel, immersive travel]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Carriages stand **just outside the gate of walled cities**. Hamlets and villages never have one.
> - Talk to the driver and choose **Fast Travel**, then pick a destination on the driver's map.
> - The default fare is **1 gold per travel day, plus 1 gold**. The fare screen shows the exact price before you pay.
> - You arrive at once, but your character's clock moves forward by the length of the trip.

## Where to find a carriage

A carriage driver waits with a carriage and [horses](horses.md) outside the gate of a walled city. Only four kinds of city-gate
block hold a driver (the gate blocks `WALLAA08` to `WALLAA11`), so only some cities have one. Every place with one is a
city; no hamlet or village does.

You board at the gate, not at the town's Stable or [Wagon Yard](../feet/wagons-and-hauling.md): those sell horses and wagons you drive yourself.

> [!tip] Finding the nearest one
> Large walled cities are the place to look. The handbook's [map](the-map-and-danger.md) can filter places by service, including carriages.

## Taking a trip

1. Walk out through the city gate and find the driver beside the carriage.
2. Talk to the driver and choose **Fast Travel**.
3. Pick a destination on the map. Online, the shipped settings allow cities, hamlets and villages, not only other
   carriage cities.
4. Read the fare and confirm. The game then performs a Daggerfall-style fast trip.

If you chose inn stops in the travel options, the fare includes inn charges. A long journey that crosses water can
include a ship fare when ship travel is selected and enabled.

## What it costs

The fare has a daily part and an optional inn part:

- a daily carriage fee for each whole day of land travel, plus one more daily fee;
- inn charges, if you chose to stop at inns.

The daily fee is a setting that defaults to 1 gold. With inns off and default settings, a trip costs 1 gold plus 1
gold for each complete travel day.

> [!example] Example
> A trip the game calculates at 3 whole travel days, with inns off and the default fee, costs 1 + 3 = 4 gold.

## Time passes

The trip is instant for you, but the world's clock for your character moves on by the trip's length. Shops may have
closed and the day may have turned by the time you arrive. A walked [overworld route](overworld-travel.md) spends that time as you travel instead.

## Limits

- Online, regional carriage restrictions are off by default, so a valid destination is not limited to the current
  region. The shipped destination types still apply.
- Fast travel can't enter or leave the Wrothgarian Mountains Open Zone (a [later](../late/open-zone.md) area).

## Common mistakes

- **Waiting for a carriage in a village or hamlet.** Only walled cities with the right gate blocks have a driver; every place with one is a city. Cost: a long walk or a missed trip.
- **Expecting the Stable or Wagon Yard to sell the carriage trip.** Those sell horses and wagons you drive yourself; the carriage is a separate driver outside the gate ([horses](horses.md), [wagons and hauling](../feet/wagons-and-hauling.md)). Cost: gold spent on the wrong purchase.
- **Forgetting that the fare moves your clock.** You arrive at once, but the trip advances your character's time by its length, so an errand timed for daylight can arrive after dark. Cost: a missed courier window or event.

## Next

- [Horses](horses.md)
- [Ships and passage](ships-and-passage.md)

## Sources

- `src/world/immersiveTravelGates.js`: `hasCarriageGate`, `IT_GATE_FILE` (the four gate blocks)
- `src/systems/immersiveTravel.js`: `carriageTripCost`, `carriageRefusal`, `isDestinationValid`
- `src/systems/modSettings.js`: `General.DailyCarriageFee` (default 1)
- `src/scenes/world.js`: `immersiveTravelService` (the driver's Fast Travel)
- `bible/06-Systems/Immersive-Travel.md`; `bible/06-Systems/Travel-Options.md` (TO-ONLINE, IT1)
