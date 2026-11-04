---
title: Quest rewards
summary: Compare quest payments, reward choices and questline gates before you decide what to pursue.
stage: reference
order: 42
gate: none
status: draft
verified: e4f093166
tags: [quests, rewards, questlines, tiers]
---

> [!tip] At a glance
> - Read the quest's outcome and reward card before choosing a branch.
> - A gear reward normally offers three cards; you keep one item.
> - Register before pursuing account-backed questline deeds and titles.
> - Claim waiting gear regularly: the reward queue has limited space.

## Read the payment before you leave

Open **Quests** and inspect your objectives, branches and expected reward. Gold, gear, faction standing, Renown and a questline deed are separate benefits. 

Gold starts with the quest script. Some scripts specify a range; the ordinary generated purse also considers your character level or guild rank, guild power and regional prices. There is no universal gold payment for a quest tier. A letter is quest mail, not payment.

An outcome can change that purse. Standard outcomes keep the script's amount; a lesser payment uses three quarters, while a greater payment uses one and a quarter times the amount and raises the gear reward's tier by one, within the tier limit. A betrayal can pay the other side's coin without awarding the betrayed guild's extra gear. A quest with its own special reward can retain that reward instead of adding a choice card.

## Choose one piece of gear

When an eligible outcome pays gear, you receive a choice normally containing a weapon, an armour piece and a jewel. You keep **one**, rather than collecting the whole display. The pieces are identified and checked against your class's equipment restrictions. If a category cannot produce a suitable piece, another armour piece or jewel can fill its place.

The weapon choice uses your two highest live skills among Short Blade, Long Blade, Axe, Blunt Weapon and Archery. Hand-to-Hand is not a weapon-card category. A fist-focused character should therefore compare the armour and jewellery rather than expect a fist weapon to appear. Fitting does not guarantee an upgrade over what you wear.

The rolled cards stay with the waiting offer, so reloading does not refresh them. A named questline reward uses its named base only when you can equip that base; otherwise that card can be an unnamed suitable item. Compare statistics before choosing.

## Understand tiers

A quest's tier is set when it starts. An explicit quest-sheet tier takes priority. Otherwise guild-rank requirements, reputation requirements or character-level bands determine it.

| Tier | Guild rank requirement | Reputation requirement band | Character-level band | Ordinary gear floor |
|---|---|---|---|---|
| 1 | 0â€“1 | Below 20 | 1â€“6 | Magic |
| 2 | 2â€“3 | 20â€“39 | 7â€“13 | Magic; each card has a 25% chance of Rare |
| 3 | 4â€“5 | 40â€“59 | 14â€“20 | Rare |
| 4 | 6 or higher | 60 or higher | 21 or higher | Rare |

These columns are alternative ways of assigning a tier, not requirements you must satisfy together. Social quests use your level band rather than interpreting their low requirement as guild rank. Higher tiers do not make ordinary choice rewards Legendary. A greater outcome can improve the effective tier, but it still stops at tier 4.

## Separate standing, Renown and deeds

Faction standing affects the guild or faction concerned. **Renown** is your separate online progression: a successful quest can earn Renown XP once through the online tracker. Its amount depends on the character-level formula and Renown ceiling, and the account's hourly cap still applies. A larger gold purse does not itself promise more Renown.

Questline deeds use another record. The account service must witness the relevant event after the line opens and in its required order. Closing a Breach before starting its line does not automatically satisfy a later witnessed step. The service checks receipts for deeds such as Breach closures, Redoubts, the Brass Remnant, the Sea Serpent and fallen stars. Titles and the Covens' Hoard's once-per-account Weir Key have their own checks; keeping the key is a branch choice. The Starwarden title can also pay Soul Cakes while the festival is open; this is a separate account reward.

## Failure, retries and private rooms

Failing an unfinished quest costs no faction standing online. That protection does not erase a deliberate branch's standing consequences or a crime's legal consequences. An unsuccessful quest also does not receive the success-only gear choice or successful-quest Renown payment.

A failed questline step is offered again after one day on your character's clock. Successful steps normally wait one character hour before the next step starts. These are character-clock delays, not a promise that every failed ordinary quest returns automatically. Read the journal's current state before travelling again.

A dungeon named by your active quest can offer a private instance for you and your party. Shared quest foes can be fought together, but each character keeps their own quest copy and progress. A private room helps you pursue your objective without public-room competition; it does not bypass reward gates or replace an account-service witness.

## Which questline first

Choose the system you want to learn next. These are opening gates; individual steps can wait for additional requirements.

| Your immediate goal | Line | Opening gate and later restriction |
|---|---|---|
| Craft or play tavern games | The Court Crafter / A Seat at the Table | Level 2; crafts require online registration, King's Gambit must be enabled for its step |
| Plan growth or haul goods | Written in the Stars / The Merchant's Road | Level 3; Stars requires online play |
| Improve equipment | The Smith's Secrets | Level 4; Loot rarity needed for its steps |
| Learn ships | The Harbormaster's Word | Level 5; Naval Combat needed for its steps |
| Try Arena or shared threats | The Herald's Call / The Bay's Troubles | Level 6 online; the revenant step waits for Renown 10 |
| Follow Starfall | The Thirteenth of Frostfall | Level 6, registered online, event open |
| Pursue the serpent | The Old Coil | Level 8, registered online |
| Begin the Breach chain | The Burning Doors | Level 10, registered online; then Covens' Hoard and Weir Road |
| Learn Abyss Dungeons | The Hour That Was Not | Level 12, registered online |

## Common mistakes

- Leaving cards unclaimed indefinitely: only twelve offers wait, and overflow can discard an offer.
- Expecting an event completed before the line opens to count as its witnessed deed.
- Confusing a character-clock retry with a real-world daily reset.

## Next

- [Browse every quest in the quest guide](../../quests/)
- [The questline ladder](questline-ladder.md) and [courier letters](../town/courier-letters.md)
- [Caps, timers and resets](caps-and-timers.md)

## Sources

- `upstream/snapshot-e4f093166/src/systems/quest/item.js`: `Item._createGold`.
- `upstream/snapshot-e4f093166/src/systems/quest/quest.js`: `endQuest`, QFAIL-FREE.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlRewards.js`: `PAY_PROFILES`, `TIER_FLOORS`, `bestWeaponSkills`, `fitsPlayer`, `rollRewardChoice`, `rewardTier`.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLaw.js`: `questTierOf`, `rankTier`, `reputationTier`, `levelTier`.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLayer.js`: `OFFERS_MAX`, `trimOffers`, `ending`, `take`.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLineRunner.js`: `STEP_GAP_S`, `RETRY_GAP_S`, `ended`.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js`: `QL_LINES`, `lineOpens`, step `needs`.
- `upstream/snapshot-e4f093166/src/net/questlineClaims.js`: `QL_SERVICE_LINES`; `upstream/snapshot-e4f093166/server-account/src/questlines.js`: `QL_WITNESS_SQL`, claim title/key guards.
- `upstream/snapshot-e4f093166/src/net/renown.js`: `renownQuestXp`, `RENOWN_XP_HOUR_MAX`; `upstream/snapshot-e4f093166/src/scenes/world.js:20934`: `renownQuestEnded`.
- `upstream/snapshot-e4f093166/src/systems/instancePlaces.js`: `questsAtSite`, `openerQuestOf`, `questInstanceEpoch`; `upstream/snapshot-e4f093166/bible/11-Multiplayer/Multiplayer.md`: Quests stay separate.


