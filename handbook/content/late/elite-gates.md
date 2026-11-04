---
title: Elite Gates and the Elite Breach
summary: Follow The Weir Road, carry Weir Keys, and learn how Redoubts fit into the Elite Breach.
stage: late
order: 10
gate: other "After The Burning Doors"
status: draft
tags: [elite gates, elite breach, weir keys, redoubts]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Finish **The Covens' Hoard** before the **Weir Road** introduction line opens.
> - Weir Keys are inventory items used by the Elite Gate system; keep them available when you approach its service.
> - `/breach` opens the Elite Breach commands; `/breach help` lists them.
> - A Redoubt's Marks reward is per Redoubt and per account for an Arena week, not one reward for the whole Breach.

## Follow The Weir Road

The late-game progression is a questline, not a single character-level check. **The Weir Road** follows **The Covens' Hoard** and introduces the Elite Gate sequence. The questline table records the line and its step prerequisites; follow the current journal and gate prompts for the step you have reached.

The account service awards Weir Keys for qualifying Dagon's Breach kills and completed Elite Breach runs; the odds and pity rules differ by event. Your account balance appears as one stackable item in your pack. Using a key opens a start window and stakes one key when the service accepts the open, so keep the item in your pack and follow the live prompt.

## The Elite Breach and Redoubts

The Elite Breach is a shared, scheduled challenge built from halls called **Redoubts**. Its service and client share the gate's current law. Use `/breach` for the command entry and `/breach help` for the available commands.

Each Redoubt can pay **20 Marks** once per account per Redoubt per Arena week. That receipt also counts toward the shared combat-Marks daily limit. Completing one Redoubt therefore does not by itself spend every reward opportunity in the Breach; the receipt is scoped to that named Redoubt.

The ordinary elite and champion rules are separate from the Breach. Elites begin appearing in your own world at character level 3 and Renown 5; that gate does not unlock the Weir Road or guarantee a Breach entry.

> [!warning] Bring the right expectation
> Redoubt rewards are once per account, Redoubt and Arena week. Weir Key awards have different rules for Breach kills and completed Hours; there is no single drop rate for every event. Check the active service and quest text for current entry details.

## Common mistakes

- Treating level 3 and Renown 5 as the Elite Breach gate confuses ordinary elites with the later Weir Road progression.
- Assuming one Redoubt clears the weekly reward for every Redoubt ignores the per-Redoubt receipt.
- Treating the key's item template as proof of its issuance conditions skips the quest and server service that decide when you receive or spend it.

## Next

- [Abyss Dungeons](abyss-dungeons.md)
- [Arena seasons and the Royal Tourney](arena-seasons.md)

## Sources

- `src/systems/questlines/qlLines.js`: `QL_LINES` (The Covens' Hoard and The Weir Road prerequisites)
- `src/systems/eliteGates/weirKey.js`, `src/systems/eliteGates/weirKeyRow.js`: Weir Key identity, pack-only stack and item behavior
- `src/net/eliteGates/egLaw.js`, `src/net/eliteGates/egPay.js`, `server-account/src/eg.js`: Elite Breach law, entry and Weir Key award rules
- `src/net/marksLaw.js`: Redoubt receipt scope and combat Marks ceiling
- `src/systems/eliteFoes.js`, `src/systems/online/onlineLane.js`: elite gate and online enablement
- `src/net/chatCommands.js`: `/breach` and `/breach help`
- Research note: `handbook/research/L1.md`
