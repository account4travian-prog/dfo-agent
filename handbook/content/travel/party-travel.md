---
title: Party travel
summary: Meet a party leader through an offered fast trip, confirm the fare, and arrive beside them without advancing world time.
stage: travel
order: 80
gate: none
tags: [party, travel, fast travel, online]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Use `/leader` to offer to travel to your party leader; use `/travel` to answer the leader's round.
> - Each follower accepts their own fare before travelling.
> - Party travel arrives at the world's present and does not advance world time.
> - It cannot cross the Open Zone boundary or the Veil.

## Travel to a leader

When you are in a party ([meeting other players](../town/meeting-players.md)) and your leader is on another map pixel, `/leader` offers you a fast trip to them. Accept the offer and you arrive near the leader, or at the place's door if the leader is inside. The prompt shows your fare before you confirm; each travelling member pays their own.

The leader can gather the party for a round of travel with `/travel`. Followers have 30 seconds to join after the party sets out. If you miss that window, the offer points you back to `/leader` instead.

## Boundaries

Party travel is a fast trip to the leader, not a walked Overworld route. It arrives at the world's present and does not spend journey time. Online boundaries still apply: party travel cannot cross into or out of the [Open Zone](../late/open-zone.md) or across the [Veil](../late/eltheric-ocean.md). Use the [Overworld Travel View](overworld-travel.md) for a walked route.

## Common mistakes

- **Missing the 30-second follow window.** After the party sets out, a late follower loses the offer and must fall back to `/leader` and pay their own fare again. Cost: fares and time.
- **Assuming the leader's fare covers yours.** Each travelling member pays their own fare; a follower who cannot pay is left behind. Cost: a split party.
- **Trying to cross the Open Zone or the Veil with party travel.** The fast trip is refused at both boundaries ([Open Zone](../late/open-zone.md), [Eltheric Ocean](../late/eltheric-ocean.md)). Cost: a wasted attempt and lost group time.

## Next

- [The map and danger](the-map-and-danger.md)
- [Overworld travel](overworld-travel.md)

## Sources

- `src/systems/party/partyTravel.js`: `/leader`, `/travel`, follow window
- `src/systems/party/partyTravelLaw.js`: `TRIP_FOLLOW_MS`, `leaderOfferRows`, `fareText`, `besideTargetOf`
- `src/scenes/world.js`: party travel boundary checks
- `src/systems/online/onlineLane.js`: `TRAVEL-ONLINE` party travel exception
- Research: `handbook/research/V1.md` (party travel)
