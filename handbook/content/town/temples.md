---
title: Temples
summary: Join a temple, train with its clergy, and check which potions, spells, magic items, summoning and soul gems its divine offers.
stage: town
order: 63
gate: none
tags: [guilds, temples, training, potions, spells, summoning]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - Temples share one membership slot; joining a different temple replaces the old membership.
> - Temples train anyone, members at 100 × level and strangers at 400 × level, up to skill 50.
> - Every temple offers quests, donations and cure disease; the divine's rank table decides its other services.
> - Potions, spells and magic items at a temple are the temple's service, not a Mages Guild service.

## Joining and rank

Apply at a temple with non-negative standing, one temple skill at 22 and a second at 4. Membership is shared across the
temples, so joining another divine replaces the previous temple membership. Ranks run from 0 to 9; promotion reads
reputation and permanent skill values. Online personal rank stops at 7; 8 and 9 are chapter seats. Earned promotions are
applied immediately when you open the services.

## Services

Training, quests, donations and cure disease are available at every temple. The rest depend on the divine and your rank
in that temple; the source's temple table is the authority for the exact threshold.

| Service | What it does | Typical temple access |
|---|---|---|
| Training | Raise one of the divine's skills | Anyone; member price or non-member price |
| Quests | Temple work and quest sites | Open |
| Donate | Give gold to the temple | Open; affects standing |
| Cure disease | Treat a disease | Open; quoted gold |
| Buy Potions | Buy stocked potions | Arkay/Dibella/Zenithar 1; Mara/Stendarr 2; Akatosh 4 |
| Make Potions | Mix carried ingredients | Arkay 4; Akatosh/Dibella/Mara/Stendarr 5; Zenithar 6 |
| Buy Spells | Add a ready-made spell | Kynareth 3 |
| Make Spells | Design a spell | Kynareth 6 |
| Buy Magic Items | Buy enchanted stock | Julianos 3 |
| Make Magic Items | Enchant a carried item | Julianos 5 |
| Daedra Summoning | Attempt contact and a quest offer | Other temples 7; Zenithar 8 (Julianos 6) |
| Buy Soulgems | Buy empty or filled traps | Arkay 4 |

The Mages Guild has its own versions of the spell, magic-item, summoning, soul-gem and teleport services; use
[Mages Guild services](mages-guild-services.md) for those. The Mages Guild teleport is not a temple service.

## Training

Each divine trains its own list; Akatosh's includes Alteration, Archery, Destruction and Long Blade, while Arkay's
includes Axe, Restoration and Medical. A session takes three game hours, costs fatigue, raises one skill and can be taken
once every 12 game hours. The cap is 50. See [The NPC guilds](npc-guilds.md) for the shared price formula and Refined
Training reduction.

## Common mistakes

- Joining two temples and expecting both memberships to persist.
- Treating a temple's spell shelf as the Mages Guild's.
- Expecting every divine to sell the same potion or summoning service at the same rank.
- Paying the member price as a non-member; temples train strangers, but at 400 × level.

## Next

- [The NPC guilds](npc-guilds.md)
- [Mages Guild services](mages-guild-services.md)
- [Temple quests](../reference/quests/temple-errands.md)

## Sources

- `upstream/snapshot-e4f093166/src/systems/guild/guildServices.js`: `TEMPLE_TRAINING_SKILLS`, `templeCanAccessService`,
  `TEMPLE_DATA`.
- `upstream/snapshot-e4f093166/src/systems/guild/guildVariants.js`: temple membership groups and rank data.
- `upstream/snapshot-e4f093166/src/systems/guild/guilds.js`: joining and rank rules.
- `handbook/content/town/npc-guilds.md`: shared training and membership rules.
