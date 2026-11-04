---
title: Town raids
summary: "Defending towns from raiders, introduced by The Bay's Troubles."
stage: bay
order: 30
gate: level 6
status: draft
tags: [town raids, events, combat, party]
verified: 0df2d87eb
---

> [!tip] At a glance
> - **The Bay's Troubles** introduces town raids at character level 6.
> - A raid is a shared event in a town. Its target and raider group are set for that event.
> - Fight in the town and remain there near the end if you want your contribution considered for the event result.
> - The second introduction step, **The Kneeling Dead**, waits until Renown 10.

## How a raid works

Raiders attack a selected town during a timed window. The raid targets 15–25 kills, and the event can begin at different points in the shared game day. Its duration is two game hours. Treat the event clock as the authority for whether a raid is active; the town's local time alone does not tell you its full state.

The relay keeps the raid's shared record even if players leave and return. To qualify for the cleanse receipt, you need to strike a raider and be present in town at the event's end. One account can claim one receipt for a given raid. Rewards use the shared combat Marks ceiling, so a receipt does not guarantee that you can collect more Marks that day.

## Join and contribute

1. Check the shared event information for the target town and active raid.
2. Travel to that town and fight its raiders. Party members can help, but the relay tracks participation by account.
3. Be in the town when the raid reaches its target and resolves.
4. Check your account's event receipt and Marks balance afterward.

Raids are not a private dungeon instance. They take place in the shared town cell, and the event record continues across player departures.

> [!online] Online rule
> Raiding Parties is forced on for the shared online world. The raid's kill ledger and reward receipt are relay/account-service records; local mod settings do not decide the shared event.

## Common mistakes

- **Arriving after the event ends.** A reward requires presence at the cleanse as well as a recorded strike.
- **Assuming the raid starts at one fixed game hour.** Its start varies within the scheduled day; check the live event information.
- **Mixing up the two quest gates.** The first Bay's Troubles step opens at level 6; its second step waits for Renown 10.

## Next

- [World events and their clock](world-events.md)
- [Meeting other players](../town/meeting-players.md)

## Sources

- `src/systems/questlines/qlLines.js`: `introBay`, **The Bay's Troubles** gates
- `src/systems/raidingParties.js`: raid event creation and target
- `src/net/raid/raidLaw.js`: `RAID_WINDOW_MINUTES`, `RAID_TARGET_MIN`, `RAID_TARGET_MAX`, event window law
- `src/net/raid/raidReceipt.js`: raid participation receipt law
- `server/src/index.js`: shared raid ledger and relay event handling
- `server-account/src/marks.js`: account receipt and shared daily combat Marks ceiling enforcement
- `src/systems/online/onlineLane.js`: Raiding Parties forced online
- Research: `handbook/research/W1.md`, `handbook/research/Q1.md`
