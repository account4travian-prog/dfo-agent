---
title: Your first week
summary: A session plan for levels 1 to 5, the introduction questlines they open, and what to check before you spend.
stage: feet
order: 5
gate: none
status: draft
tags: [first week, session plan, questlines, spending, banking]
verified: e4f093166
---

> [!tip] At a glance
> - Register before you invest in professions, trade, guilds or event rewards; a guest's work in those systems is not recorded.
> - Bank your carried gold before you leave town: an ordinary death takes one tenth of it.
> - **The Court Crafter** and **A Seat at the Table** open at level 2, **Written in the Stars** and **The Merchant's Road** at level 3, **The Smith's Secrets** at level 4 and **The Harbormaster's Word** at level 5.
> - Letters reach you only outdoors in a town by day, and a new line starts no sooner than an hour of character time after the last.
> - Star refunds are free below Renown {{fact firmament.refundFreeBelowRenown}}; the two-craft limit above Journeyman is permanent.

## The first five levels

Levels 1 to 5 are where DFO Online hands out its first systems. Each introduction questline opens at a set character level, arrives as a courier letter, and sends you to one NPC in your current town. Two habits carry the stretch: keep your purse in the bank, and register before you invest in anything the account service tracks.

## Before you invest an evening

**Register early.** A guest can play at once, but professions and Stores, the global market, player guilds, Marks, Soul Cakes and Starfall claims are refused or not recorded. Registration adds a username and password to the same account and keeps what you have done; save the eight recovery codes. See [Your account](../begin/your-account.md).

**Bank before you leave.** An ordinary online death returns you to a safe point at half health and takes one tenth of the gold you carry, rounded down. Banked gold and letters of credit are outside that penalty, and any bank counter reaches the same Empire account online. See [Dying online](../hold/dying-online.md) and [Banks](../town/banks.md).

**Join a guild for private work.** NPC guilds take applications at their halls; the check is standing and guild skills, not a joining fee. The design records point a new character at the Fighters Guild hall in Gothway Garden. Guild quests give you your own dungeon and a reward card, and guild training stops at skill 50. See [The NPC guilds](../town/npc-guilds.md).

## A session plan

1. Leave Privateer's Hold for Gothway Garden.
2. Register, bank your gold and join a guild at its hall.
3. Take one guild quest or a notice-board bounty and finish it; a quest dungeon is your own instance.
4. Sell the spare loot, keep what you can use, and bank the purse again.
5. Stand outdoors in town by day until a letter arrives; the **Quests** tab shows what each line waits for.
6. Do the step the letter opened. The next step of that line waits an hour of character time, and no new line begins while another line's first letter is on its way.

## The introductions, level by level

| Level | Questline | Where the letter sends you | What it starts |
|---|---|---|---|
| 2 | **The Court Crafter** (registered account) | A court crafter at the local general store | Gathering, crafting, Professions and Stores |
| 2 | **A Seat at the Table** | A tavern regular at a tavern | The card tables; its second step waits for The King's Gambit |
| 3 | **Written in the Stars** (online) | An astrologer at a temple | The Firmament and its stars |
| 3 | **The Merchant's Road** | A stable master's note; collect the load at a tavern | Wagons and hauling |
| 4 | **The Smith's Secrets** | An armorer at an armory | Sockets and the Reforge; its steps wait for Loot rarity |
| 5 | **The Harbormaster's Word** | A harbormaster at a tavern | Ships and the sea; its steps wait for Naval Combat |

The steps pay gold as well as teach: the level 2–4 lines pay 100–200 gold a step, and the level 5 sea line 200–400 (the quest scripts' ranges). A step starts wherever you are, so be in a proper town: the Court Crafter needs a general store, and the others a tavern, armory or temple. A step that cannot begin says so and waits a day of character time.

## Before you spend

| Choice | What it costs | What to know first |
|---|---|---|
| Firmament star | One point per star; Renown supplies two per level after the first, and the first sign is free | A refund is free below Renown {{fact firmament.refundFreeBelowRenown}}; after that it costs {{fact firmament.refundCostPerStar}} Marks a star, and a whole-sky respec costs {{fact firmament.respecGold}} gold |
| Craft rank | 10 × rank² XP a track: rank 50 is 25,000 and Master is 100,000 | Only two crafts may pass Journeyman (rank {{fact crafts.journeymanRank}}); the account service holds a third at rank 50 |
| Mastery | One of five slots, spent when a skill reaches 100 | A mastery can never be undone: two primary, two major and one minor slot |
| Gold | One tenth of the carried purse per death; the large purchases are later | Bank it. A skill swap costs 100,000 gold and a path reset 200,000 |

## Common mistakes

- **Playing for days as a guest.** The profession work, market trades and event rewards you earned were not recorded and cannot be claimed after you register.
- **Carrying the purse into a dungeon.** One death takes a tenth of everything you carry.
- **Pushing a third craft to 50.** It is held one experience point short of rank 51 for good; the two crafts you raise above 50 are the permanent pair.
- **Waiting for letters in the wilds or at night.** The courier needs you outdoors in a town by day.
- **Refunding stars after Renown 10 without counting the cascade.** A connecting star takes its dependents with it, and each is charged.

## Next

- [Levelling online](levelling-online.md)
- [Renown](renown.md)

- [Planning a session](session-planner.md)
- [The progression map](progression-map.md)
## Sources

- Design records: `docs/32-questions.md` "What should I do in my next session?"; `docs/23-playing-online.md` "Now (level 1–5)" and "The questlines"
- `src/systems/questlines/qlLines.js`: `QL_LINES`, `lineOpens`; `introCrafts` (level 2, online, registered account), `introTables` (level 2, `kingsGambit`), `introFirmament` (level 3, online), `introRoad` (level 3), `introGear` (level 4, `lootRarity`), `introSea` (level 5, `naval`)
- Quest scripts `src/systems/questlines/quests/QLIP01.txt`, `QLIF01.txt`, `QLIT01.txt`, `QLIR01.txt`, `QLIG01.txt`, `QLIS01.txt`: givers, buildings and gold ranges
- `src/systems/questlines/qlLineRunner.js`: `STEP_GAP_S`, `mayBegin`
- `src/systems/quest/actions.js`: `GivePc` delivery conditions (outdoors in a town by day)
- `src/systems/deathPenalty.js`: `DEATH_GOLD_DIVISOR`
- `src/net/firmament/firmamentLaw.js`: `STARS_PER_RENOWN`, `starsFor`, `REFUND_FREE_BELOW_RENOWN`, `REFUND_SILVER_PER_STAR`, `FIRM_RESPEC_GOLD`
- `src/net/professionLaw.js`: `CRAFTS_ABOVE_JOURNEYMAN`, `JOURNEYMAN_RANK`, `xpForRank`
- `server-account/src/professions.js`: `craftCapSql` (a third craft held one XP short of rank 51)
- `src/systems/masterSkills.js`: mastery slots and permanence
- `src/systems/skillSwap.js`: `SKILL_SWAP_GOLD`; `src/systems/arcanePaths.js`: `SPEC_RESET_GOLD`
- `server-account/src/accounts.js`: registration and recovery codes
