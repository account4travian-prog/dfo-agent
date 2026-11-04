---
title: Standing and reputation
summary: The three standing tracks — People, regional law and guild faction — and how each moves, recovers and gates.
stage: town
order: 75
gate: none
status: draft
tags: [reputation, standing, factions, crime, guilds]
verified: e4f093166
---

> [!tip] At a glance
> - DFO keeps three separate tracks: **People** reputation (a region's townsfolk), **legal standing** (per region) and **faction standing** (guilds, temples, orders).
> - Faction and legal standing both run from −100 to 100; guild rank *n* needs faction standing 10 × *n*.
> - A quest pays its faction +5 for success and −2 for failure; a crime costs legal standing and half as much People standing.
> - Negative standing recovers one point every seven game days, and a temple penance buys five points back for 200 gold the first time.
> - A change to one faction can propagate: its allies move half the amount the same way, its enemies half the other way.

## Three kinds of standing

Players say "reputation" for three systems. They are stored separately, and improving one does not improve the others.

| Track | What it is | What reads it | What it gates |
|---|---|---|---|
| **People** | The regional population faction's view of you | Town talk: greetings and the chance of a useful answer | Directions, topics and how much a stranger will engage |
| **Legal standing** | Your record with the law, tracked per region | The watch, the court, banishment | Whether guards stop you, what a court does, entry to a region while banished |
| **Faction standing** | Your standing with a guild, temple, knightly order or other faction | Joining and promotion, services, rank tests | Guild membership, rank, some services and training |

The People track is not a shop-discount stat: shop offers come from the counter's own price law and your Mercantile and Personality. The People track is about conversation. See [Talking to people](talking-to-people.md) and [Shops and prices](shops-and-prices.md).

## What moves each track

### Quests

A quest's end pays the faction it was given for. The quest law's values are +5 for success and −2 for failure (`questRepute.js` `QUEST_SUCCESS_REP`, `QUEST_FAILURE_REP`). Individual quest scripts can also carry their own reputation actions (`ChangeReputeWith`). The handbook's design records state that failing a quest costs no faction standing online, so treat the −2 as the offline/default hook rather than a reliable penalty online.

### Crimes

A crime is charged to the region where it happens. Each crime has a fixed legal loss, and the region's People faction takes half of it, truncating down:

| Crime | Legal loss | People loss (half) |
|---|---:|---:|
| Vagrancy | 1 | 0 |
| Trespassing, Smuggling, Piracy, Pickpocketing, Criminal conspiracy | 2 | 1 |
| Theft, Assault, Attempted breaking and entering, Breaking and entering, Tax evasion, Loan default | 8–10 | 4–5 |
| Murder | 20 | 10 |
| Treason | 36 | 18 |
| High treason | 75 | 37 |

A town Curfew doubles the **legal** loss only; the People's half stays as it is. See [The law](the-law.md) and [City control](../rivals/city-control.md).

### Faction service and propagation

A successful guild or temple service can move its faction: a temple donation has a chance to add one point of reputation, where the chance is `2 × the gift ÷ max(|current standing|, 1) + 1` percent (`guildServiceActions.js`). A faction reputation change can also propagate: allies take half the change the same direction, enemies half the opposite direction, and the walk climbs a faction's hierarchy. Helping one temple can therefore cool its enemies toward you without your doing anything to them.

### Bounty contracts

Finishing a bounty contract for a region's board improves that region's **legal** standing by two points (`standing.js` `CONTRACT_LEGAL_GAIN`). It is one of the few voluntary ways to repair a legal record.

## How standing recovers

- **Time.** Negative legal and faction standing each recover one point every seven game days (`court.js` `RECOVERY_INTERVAL_MINUTES`). This runs on the character's clock and continues across an absence — online time model's recovery-only walk. Positive standing instead drifts one point down toward zero every 112 game days of lived play (`NORMALIZE_INTERVAL_MINUTES`); an absence does not wear a positive standing down.
- **A sentence.** Serving or paying a court sentence returns about half the crime's legal loss, minus one (`court.js` sentence refund). A fine-plus-prison sentence can refund twice, a classic quirk the port keeps.
- **A temple penance.** A temple sells penance that moves five points of the region's legal standing back toward zero, never past it. The first costs 200 gold in a region and the *n*-th costs *n* times that (`standing.js` `PENANCE_POINTS`, `PENANCE_BASE_PRICE`).
- **A pardon.** Murder and treason can bring banishment. A temple sells a pardon that lifts it early; the first costs 2,500 gold and the *n*-th *n* times as much (`PARDON_BASE_PRICE`). The banishment itself is timed: thirty days on the calendar you see online (`BANISHMENT_MINUTES`).

## What each track gates

- **Guild joining** needs non-negative standing with the faction and two qualifying guild skills (`guilds.js` `isEligibleToJoin`). See [The NPC guilds](npc-guilds.md).
- **Guild rank** needs faction standing 0, 10, 20 … 90 for ranks 0–9 (`RANK_REQ_REPUTATION`), plus the rank's skill bars. Online, an earned promotion applies immediately when you open the services.
- **Legal standing** decides how the watch treats you, what the court imposes and whether you may enter a banished region.
- **People standing** decides how much a townsperson is willing to tell you. It does not change shop prices.

## Practical standing habits

1. **Take the court, do not run.** Leaving or dying ends the chase but not the record; a plea or a served sentence repairs part of it.
2. **Use the board for a region you need.** A finished bounty contract is +2 legal standing in that region.
3. **Bank a penance before a big purchase.** Five points for 200 gold is cheaper than the standing you lose by being refused a guild hall.
4. **Watch your allies.** A temple favour can lower a rival temple's standing with you; check the faction before donating heavily.
5. **Do not expect a positive score to last.** Lived play wears positive standing down toward zero; only negative standing drifts back.

## Common mistakes

- **Treating the three tracks as one number.** A guild that likes you does not make the town watch forgive a crime.
- **Running from the watch.** The pursuit ends; the legal mark stays until a sentence or time repairs it.
- **Donating without reading the chance.** The donation's chance falls as your standing rises, so large gifts to a faction that already likes you are poor value.
- **Ignoring propagation.** A change to one faction can move its allies and enemies; a favour for one temple is a statement about another.
- **Assuming a high positive score is permanent.** It drifts down every 112 game days of play.

## Next

- [The NPC guilds](npc-guilds.md)
- [The law](the-law.md)

## Sources

- `src/systems/faction/factionRep.js`: `getReputation`, `setReputation`, `changeReputation`, propagation (`ally`, `enemy`, `GENERIC_TEMPLE`, `GENERIC_KNIGHTLY_ORDER`), `MIN_REPUTATION`, `MAX_REPUTATION`
- `src/systems/guild/guildFactions.js`: `RANK_REQ_REPUTATION` (0, 10, 20 … 90), `MIN_REPUTATION`, `MAX_REPUTATION`
- `src/systems/guild/guilds.js`: `isEligibleToJoin`, rank tests; `src/systems/guild/guildServiceActions.js`: donation chance, service reputation
- `src/systems/quest/questRepute.js`: `QUEST_SUCCESS_REP` 5, `QUEST_FAILURE_REP` −2; `src/systems/quest/actions.js`: `ChangeReputeWith`
- `src/systems/crimes.js`: `CRIMES`; `src/systems/court.js`: `REPUTATION_LOSS_PER_CRIME`, `lowerRepForCrime` (People takes half), `legalRepOf`, `LEGAL_REP_MIN`, `LEGAL_REP_MAX`, `NORMALIZE_INTERVAL_MINUTES`, `RECOVERY_INTERVAL_MINUTES`, sentence refund
- `src/systems/standing.js`: `PENANCE_POINTS`, `PENANCE_BASE_PRICE`, `PARDON_BASE_PRICE`, `CONTRACT_LEGAL_GAIN`, `BANISHMENT_MINUTES`, penance and pardon services
- `src/systems/talk/talk.js`: `getReactionToPlayer` (People faction, biography and social-group moderation)
- Design records: `docs/23-playing-online.md` "Quests are the core loop now" (failing a quest online); `docs/27-caps-and-timers.md`
- Research: `handbook/research/T3.md` (law and crime); `handbook/research/T1.md` (talk and the People)
