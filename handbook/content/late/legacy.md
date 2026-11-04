---
title: Legacy
summary: Project Legacy is an optional family system that carries bounded inheritance and heirlooms across characters.
stage: late
order: 70
gate: none
status: draft
tags: [legacy, heirs, inheritance, heirlooms]
verified: 0df2d87eb
---

> [!tip] At a glance
> - **Project Legacy** is a player-owned mod; its family rules are not forced on every online character.
> - A descendant can inherit limited attribute, skill and gold benefits.
> - An eligible worn weapon or armour piece can become a family heirloom and improve across generations.
> - Treat inheritance as optional long-term continuity, not a substitute for a new character's own choices.

## Whether to use Legacy

Project Legacy tracks a family line with births, deaths, heirs and remains. Its enable switch belongs to the player online. If you leave the mod off, the port does not impose its inheritance rules on you.

When enabled, a descendant may receive **Blood** (attribute gifts) and **Hearth** (skill gifts), each capped at +3 for an inherited stat or skill. A waiting estate is one quarter of the deceased character's carried gold, up to 9,900 gold. That estate is separate from the death remains, which can contain one tenth of carried gold up to 2,500.

## Heirlooms and blessings

At a final death, the system selects an eligible weapon or armour piece that was worn. An heirloom already in the line remains the chosen piece; otherwise the most valuable eligible worn item is selected. Quest items, summoned items and certain special rarities are excluded.

Each time the lineage carries the heirloom home, it gains one generation, up to five. A weapon gains 5% damage per generation; armour gains 2 armour on the parts it covers per generation. Laying remains to rest can also give a +3 skill blessing, with a +9 cap on any one skill across the family.

## Common mistakes

- Assuming Legacy is an online rule for everyone ignores its player-owned enable state.
- Confusing the inherited estate with gold in remains combines two separate portions of carried gold.
- Expecting every equipped item to become an heirloom ignores the eligibility filter and the single selected keepsake.

## Next

- [Choices that are hard to undo](../creation/hard-to-undo.md)
- [Caps, timers and resets](../reference/caps-and-timers.md)

## Sources

- `src/systems/online/onlineLane.js`: Project Legacy's player-owned online state
- `src/systems/legacy/legacyLaw.js`: Blood, Hearth, estate and remains limits
- `src/systems/legacy/heirloom.js`: selection, generations, weapon and armour bonuses, blessings
- `src/ui/legacy/legacyDoor.js`, `src/ui/legacy/legacySuccession.js`: Legacy interface and succession flow
- Research note: `handbook/research/L1.md`
