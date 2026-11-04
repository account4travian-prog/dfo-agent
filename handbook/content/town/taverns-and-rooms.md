---
title: Taverns and rooms
summary: Rent a room to rest in town, or buy food and drink while keeping the online price and rest rules in mind.
stage: town
order: 40
gate: none
tags: [tavern, rooms, resting, food]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Taverns stay open around the clock. Their rooms and menu are separate services.
> - A room is rented by the day; you can rent no more than 350 days in total.
> - Online, positive room, food and drink prices are halved and rounded up, with a minimum of 1 gold; a free room stays free.
> - A Knightly Order member can rent a room free. You can eat or drink once every four game hours.

## Rent a room

Choose the room service at a tavern and set the number of days. The base room price is 7 gold per day before haggling; online, the essential-price rule halves it. The total rental limit counts days you already have, so a free room does not bypass the 350-day ceiling. Members of a [Knightly Order](npc-guilds.md) receive free rooms.

The game advances time as you rest. You can rest in a town tavern without using the outdoor camp action, which is important because camping in town can count as vagrancy. See [the law](the-law.md).

## Food and drink

The tavern menu has food and drink at listed prices. Online, their essential prices are halved, rounded up, and never fall below 1 gold. Eating or drinking restores health based on the menu price, not the online discount. You can consume another item after four game hours.

Food can help when you need a small amount of healing or want to avoid spending a [potion](../gear/enchanting-spellmaking-potions.md). It does not replace managing fatigue, health and safe rest during a dangerous trip ([health, fatigue and rest](../hold/health-fatigue-and-rest.md)).

> [!tip] Check the clock
> A room stay moves game time forward. Shops may be open when you wake even if the hour changed, because online shop hours are relieved; your quests and other timers can still advance.

## Common mistakes

- **Camping in town instead of renting a room.** Camping in town can count as vagrancy while a rented room does not ([the law](the-law.md)). Cost: a fine or a legal-standing loss.
- **Renting for several days when you need one night.** A room is rented by the day and advances game time as you rest; a long stay burns gold and can move quest timers forward.
- **Treating tavern food as your only healing on a dangerous trip.** One item every four game hours is a small heal; it does not replace potions or a safe rest ([health, fatigue and rest](../hold/health-fatigue-and-rest.md)). Cost: dying with food still in your pack.

## Next

- [Talking to people](talking-to-people.md)
- [Time and weather](time-and-weather.md)

## Sources

- `src/systems/tavern.js`: `ROOM_COST_PER_DAY`, `MAX_RENTAL_DAYS`, `rentalDecision`, `TAVERN_MENU`, `tavernMenuPrice`, `canEat`, `eatOrDrink`
- `src/systems/buildingLocks.js`: tavern hours
- `src/systems/guild/guildVariants.js`: Knightly Order membership and room benefit
- `src/systems/shopStock.js`: `essentialPrice`, `ONLINE_ESSENTIALS_PRICE_SCALE`
- `src/systems/online/onlineLane.js`: online rule lane for essential prices
- Research: `handbook/research/T1.md` (taverns and rooms)
