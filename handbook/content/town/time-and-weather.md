---
title: Time and weather
summary: Read the game clock for daylight and service hours, and use the weather and season as context for travel and outdoor conditions.
stage: town
order: 110
gate: none
tags: [time, weather, seasons, daylight]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - The game day has daylight from 6:00 to 18:00; darkness begins before 6:00 and from 18:00 onward.
> - Online, the shared world clock advances while you play. Waiting, resting and journeys can move your character's time forward.
> - Weather includes clear, overcast, fog, rain, thunder and snow; the enhanced lane can also produce desert sandstorms.
> - Weather and season affect the sky and light. Use the travel forecast before choosing a long outdoor route.

## Day and night

The day-night cycle controls daylight, street lighting and the classic building schedule. Online, service hours are relieved for shops, banks, libraries, palaces and guild halls, and city gates remain open at night. Other rules still use time: [couriers](courier-letters.md) need daylight for delivery, and travel, rest and quest clocks can move forward.

The shared online clock advances in the world while you are playing ([world events and their clock](../bay/world-events.md)). A fast [carriage trip](../travel/hired-carriages.md) advances your character's clock by the trip length; a [party trip](../travel/party-travel.md) to its leader arrives at the world's present. Check the travel method before assuming all trips spend the same time.

## Weather and seasons

Weather changes the sky and outdoor light. Rain and thunder darken daylight, snow and overcast skies reduce it, and fog affects visibility. A sandstorm is a desert weather condition in the enhanced lane. The calendar season also affects the sky and can change the weather conditions a region can produce.

Weather is not a travel timer or a promise that a road is safe. Check the route view's forecast and pace controls, then decide whether to travel now or use a different route. See [overworld travel](../travel/overworld-travel.md).

## Common mistakes

- **Planning around a still clock.** A carriage trip advances your character's clock by the journey even though you arrive instantly, so an errand timed for daylight can arrive after dark; party travel does not spend world time ([world events and their clock](../bay/world-events.md)). Cost: a missed courier window or event.
- **Treating a forecast as a safety guarantee.** Weather changes light and visibility, not the danger of the place or the length of the journey; a storm-darkened road still holds the same foes. Cost: a fight you did not prepare for.
- **Travelling at night when a questline letter is due.** Couriers hand letters over in a town, outdoors, by day ([courier letters](courier-letters.md)); a night in the wilds or in a dungeon holds that line back. Cost: a day of questline delay.

## Next

- [Courier letters](courier-letters.md)
- [Overworld travel](../travel/overworld-travel.md)

## Sources

- `src/world/worldClock.js`: `DAWN_HOUR`, `DUSK_HOUR`, day-night behavior
- `src/world/weather.js`: `WEATHER_TYPES`, `fogForWeather`, `weatherSunlightScale`
- `src/systems/weather/weatherField.js`, `src/systems/weather/weatherSim.js`: online weather field and simulation
- `src/systems/online/onlineLane.js`: enhanced-environments online setting
- `src/systems/worldTick.js`: shared online clock
- `src/systems/skyCalendar.js`: `skyMinuteOfEvent`
- `src/systems/weather/owForecast.js`, `src/scenes/travelView.js`: Overworld weather forecast
- `src/systems/buildingLocks.js`: `buildingHoursState`
- Research: `handbook/research/V1.md` (travel clock context; weather behavior verified directly in source)
