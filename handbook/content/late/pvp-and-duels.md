---
title: PvP and duels
summary: Start consensual duels, distinguish Arena ratings, and understand what open PvP puts at risk.
stage: late
order: 35
gate: none
status: draft
verified: e4f093166
tags: [pvp, duels, open zone, arena]
---

> [!tip] At a glance
> - Use another player's Inspect card to challenge them; they must accept.
> - An ordinary duel uses separate vitality and leaves your real health untouched.
> - Arena rated and casual bouts are separate from outdoor challenges.
> - The mountains and the ocean beyond Veilhaven's peace allow open PvP.
> - Open-zone death can cost carried goods and an equipped item, with a two-minute hold before return.

## Challenge another player

Meet the other player outdoors, open their **Inspect** card and choose **Challenge**. The other player receives a prompt and can accept or decline. You both need to remain alive, outdoors and near each other while the challenge becomes a bout. The source sets the challenge range to 10 metres.

An acceptance is followed by confirmation from the challenger. If you move away, enter a building or lose the connection during that exchange, do not assume the duel has begun. Wait for the game's countdown and ring rather than attacking on the strength of a chat agreement.

The ring forms around the midpoint between you. Stay inside it while fighting. Yielding, leaving the ring or disappearing from the room can give your opponent the win; reaching the bout's time limit produces a draw. Decline before the start if you do not want to fight. Accepting and then walking away is not the same decision.

## Understand the stakes

An ordinary duel is a refereed contest with its own **duel vitality**. Damage goes to that separate pool. Your real health is never reduced to make the result happen, and the duel does not heal your real character afterward. A duel loss therefore does not send you through the ordinary death-and-respawn penalty.

The result can count toward your account's duel win/loss record. That record is different from Arena rating. The checked duel source does not set selectable rated and unrated outdoor challenge modes, a gold wager, an item stake or an automatic purse payment to the winner. Do not interpret a recorded loss as an Arena rating loss, or promise another player that the game will enforce a private wager.

The consent applies to the pair in that bout. It does not authorize bystanders to damage either fighter in ordinary co-op. Elsewhere in normal shared play, player melee, arrows, spells and techniques do not become unrestricted attacks merely because players stand near each other.

## Separate Arena play from duels

The **Arena** uses its own rooms, matchmaking and bout rules. Its queue distinguishes rated competitors from casual, unranked competitors and matches like with like. Rated play can change your Arena rating; casual play is the route when you want an unranked match. Registered accounts are required for rated bouts.

Those distinctions belong to Arena play. The outdoor Challenge interaction is not a shortcut into its rated queue. Read [The Arena](../bay/the-arena.md) before joining if rating, eligibility or match rewards matter to your decision.

## Recognize open PvP ground

The **Wrothgarian Mountains Open Zone** allows attacks without a duel invitation. Its zone law reaches the region's places and dungeons as well as the open wilderness. A doorway is not a promise of safety. Check the zone warning when travelling, and use [The Open Zone](../late/open-zone.md) for the area's wider rules.

The **Eltheric Ocean** beyond **Veilhaven's peace** follows the same open-PvP death law. The peace includes the Veil, Veilhaven's surrounding waters and the protected way between them. Beyond it, islands, their towns and their ruins can be dangerous ground. Use [The Eltheric Ocean](eltheric-ocean.md) before planning a crossing; a port elsewhere is not automatically another Veilhaven.

## Prepare for an open-zone death

Open-zone death drops eligible possessions from your bag and an accompanying cart into shared remains. Nearby companions' eligible packs also fall under the drop rules. Protected categories include quest or bound possessions and supplies such as potions, ammunition, food and light sources. Letters of credit can drop. The zone drops half the relevant carried gold, rounded down, instead of applying the ordinary death penalty.

Worn gear stays on you after a death to a creature. If another player kills you, the killer may choose one eligible worn piece. That piece has a separate collection process: it is held for the killer, and the final loss depends on collection. Do not read the bag-drop exclusions as blanket protection for everything equipped.

You wait two minutes before returning; pressing Enter does not bypass that hold. Shared remains are lootable by others, so the wait is not private recovery time. For the ordinary rules outside these areas, read [Dying online](../hold/dying-online.md).

## Common mistakes

- Agreeing to spar without checking the ground: open PvP remains dangerous without a challenge.
- Accepting before discussing readiness: agree on space, equipment and when to begin, then follow the countdown.
- Carrying valuables on a practice trip: check your purse, letters, bag, cart and companions before entering an open zone.

## Next

- [The Open Zone](../late/open-zone.md)
- [The Eltheric Ocean](eltheric-ocean.md)

## Sources

All game paths below refer to snapshot `e4f093166`.

- `src/net/duel/duelSession.js`: handshake, `DUEL_RANGE_M`, `ringFor`, ring/end rules; no wager or rated-mode selector.
- `src/net/duel/duelRef.js`: `duelOpen`, `duelBlow`, `duelForfeit`, `duelStep`; separate vitality and refereed results.
- `src/net/duel/duelRecord.js`: `duelRecordText`, account win/loss display.
- `src/net/arena/arenaLaw.js`: `pairQueue`, `eloAfter`, registered rated-bout refusal.
- `src/systems/wild/wildZone.js`: zone scope, `WILD_DEATH_HOLD_S` (120), death-screen hold.
- `src/systems/wild/etherWild.js`: `etherInPeace`, `etherWildRingAt`, `ETHER_WILD_TEXT`.
- `src/systems/wild/wildDeath.js`: bag, cart, companion and worn-piece death rules.
- `src/systems/wild/wildDropLaw.js`: `keptOnWildDeath`, `wildCanLose`, `takeWildDrop`, `WILD_GOLD_LOSS`, `takeWildGold`, `wornOffer`.
- `src/net/wild/wildLaw.js`: shared remains, `remainsNamedFor`, `takeFrom`.
- `src/scenes/wildEscrowHost.js`: `createWildEscrowHost`, held-piece collection and return.
- Local orientation checked against the snapshot: `docs/35-people-and-trouble.md:40-48`; `docs/23-playing-online.md`, danger-by-place warning.
