# Improving DFO's NPCs: what the game and its servers allow

*A developer's map of the constraints, written before choosing a scope. Studied at DFO commit `bc80d4ee`
(2026-10-13). Paths are inside `upstream/daggerfall-js-source/`. Where something comes from general knowledge of
Cloudflare rather than from DFO's code, it's marked **(platform)**: check the current limits before relying on
them.*

## 1. What exists today

| Layer | What it is | Where |
|---|---|---|
| **Daggerfall's own NPCs** | Quest people ("Person" resources) placed by the quest engine; static NPCs in buildings (shopkeepers, priests, guild staff); the street "population" of random walkers. | `src/systems/quest/person.js`, `src/characters/staticNpc.js`, `src/systems/townPopulation.js` |
| **Conversation** | Daggerfall Unity's TalkManager, ported 1:1. Each answer is decided by a dice roll: Personality/5 + tone modifiers against a per-NPC seeded roll from 0 to 20. | `src/systems/talk.js`, `talkTopics.js` (`reactionTier012`), `topicTree.js`, `answerPipeline.js` |
| **Living World** (DFO's own, Oct 2026) | ~9,400 lines. A census of residents from each town's buildings; daily schedules; travel, caravans, road trouble, dungeon dives, outlaws, companies; residents talking to each other in scripted 2-3 line exchanges; news that spreads between towns; per-character regard. | `src/systems/livingWorld/` (27 files), `bible/06-Systems/Living-World*.md` |
| **Enemy AI** | Daggerfall Unity's classic motor (untouched), plus "Enhanced AI": a navmesh, tactics, cover and telegraphed attacks. It replaces only *movement*; senses, decisions and attacks stay classic. On by default. | `src/characters/enemyMotor.js`, `src/ai/` (~4,000 lines, incl. a nav **Web Worker**) |
| **Server-held NPC state** | Daggerfall's 22 guilds as online "Chapters": membership, weekly Merit, Strength, officers, settled on a weekly "Turning". | `server-account/src/npc*.js`, `src/net/npcChapterLaw.js` |

What the Living World does **not** do: residents make no decisions about the actual state of the world. Their
days are drawn in advance from a seed. They remember nothing about each other, and only your *own character's*
relationship with them. Its town-wide "repute" currently changes nothing a player can see
(`Living-World-II.md`, AUDIT LW-II-2 W9).

## 2. The hard constraints

### 2.1 The servers run no game

> "The Cloudflare side introduces peers and relays bytes; it runs no game." (`bible/11-Multiplayer/Multiplayer.md`)

- **The relay** (`server/src/index.js`, ~8,900 lines): a Cloudflare Worker with one Durable Object per room (a world
  cell, a building, a dungeon, chat hubs, event courts). It routes WebSocket frames and keeps a small amount of room
  memory in the object's storage.
- **The account service** (`server-account/src/`, ~26,000 lines): a second Worker over one **D1** (SQLite)
  database, with 112 migrations, cron jobs every minute and every hour, and the characters' saves.
- **A room's live world is simulated by one player's browser**, the "host". Everyone else renders puppets. When
  the host leaves, the seat passes to the player who's been in the room longest.
- The exceptions, where the relay *judges* rather than just relays: sieges, duels, the open PvP zone, and boss
  fights. These are "referees" checking blows and vitality, not simulations of the world.

### 2.2 Clients can't simulate together

> "**lockstep is impossible here.** The frame loop is `requestAnimationFrame` with a variable `dt` and 110 source
> files call `Math.random` unseeded." (`Multiplayer.md`)

So shared behaviour comes in only three forms, and every NPC idea has to pick one:

1. **Deterministic from shared inputs.** Everyone computes the same answer from map data + a seed + the shared
   clock. That's how the Living World shows every player the same baker at the same oven, with no network
   traffic at all.
2. **Host-authoritative and streamed.** One browser decides and streams the result, the way dungeon foes are sent
   to puppets (`{t:'foes'}`, max 64 KiB a frame, 12 frames/s, `Online-Arc.md` WORLD2).
3. **Server-held, at a coarse grain.** A fact or a slow-moving state kept by the relay or the account service:
   raids (`src/net/raidLaw.js`), the Abyss "director" on the hub's alarm, the weekly guild Turning.

### 2.3 The servers never hold game data

> Seats-Arc law 5: Daggerfall's files never reach the servers. "A render of game data is game data."

The servers can't read towns, buildings, names or quests. When they need a game fact (which guild halls a town
has), they learn it as a **witnessed fact**: three accounts at least a week old, standing in the town, report the
same answer, and liars get ignored (`server-account/src/npcHalls.js`, `nodeLaw.js witnessedFact`). Any
server-side NPC state has to be keyed on ids the client can derive, never on data the server reads itself.

### 2.4 Integrity: nothing others see stands on one client's word

The **Integrity arc** (`bible/06-Systems/Integrity-Arc.md`) holds that anything another player can see, take or be
ranked against must not depend on a single client's honesty. Today that covers items, gold, duels, the PvP zone and
bosses. NPC state shared between players (an NPC killed for everyone, a town's mood) falls under the same rule:

- it needs bounds the server can check;
- or it needs witnesses;
- or it stays per character.

### 2.5 Budgets

| Budget | Today | Source |
|---|---|---|
| **Money** | The whole project targets **~$600/month**, including AI development tools and infrastructure | `SUPPORT.md` |
| **Players** | Designed for ~500 concurrent this year; a plan to 10,000 | `Scale-Arc.md` |
| **D1 (the account database)** | **One primary takes every write.** It overloaded at 500 players during a reconnect storm. A model puts steady load at ~197 requests / 1,073 reads / 264 writes per player-hour: ~743 statements/s at 2,000 players, beyond one primary by 5,000. | `Scale-Arc.md` |
| **A crowded cell** | 256 sockets per room; a capital full at 2,000 players would be ~90k pose sends/s and 20 MB/s out of one object | `Scale-Arc.md` |
| **Relay deploys** | **Every relay change disconnects every player.** Relay changes are bundled into rare, announced deploys; the account service can deploy without dropping anyone. | `server/wrangler.toml` |
| **Client CPU** | The Living World alone costs 2–5.5 ms of a frame in a great city (299 residents) after optimisation. Several merged PRs from 2026-10-12 are still cutting **3–8-second freezes** when entering the world, from traveller and holiday calculations. Players also run DFO on phones and handhelds (touch controls, ROG Ally reports). | `Living-World.md` LW-PERF; PRs #819, #820, #854 |
| **Save size** | Relationships are kept for at most 600 residents per character | `relations.js RELATIONS_MAX` |
| **Online time** | Two clocks, both from wall time: **the sky** (what the Living World and the lamps read): a game day every **real hour** (TimeScale 24 since SKY-SLOW, 2026-10-02); **the event clock** (raids, the economy, the relay's stamps): a game day every **two real hours** (TimeScale 12). `Online-Time-Arc.md` still quotes an older 48 (30 minutes). | `src/net/skyLaw.js` (`SKY_SEGMENTS`), `src/net/wire.js` `sharedClassicMinutes` |
| **(platform)** Durable Objects | Single-threaded per object; limited memory per isolate; CPU limits per request; storage per object | Cloudflare docs |
| **(platform)** D1 | One write primary per database; read replicas (DFO already uses them); a database size cap | Cloudflare docs |

### 2.6 Process rules a change must follow

These apply if the work is meant to be merged upstream:

- **Port Doctrine:** systems ported from Daggerfall Unity stay 1:1. TalkManager, quests and the classic motor are
  among them. Changing them is a *departure*: it needs the owner's approval and a row in Port-Ledger section A. New
  behaviour belongs in the **enhanced lane**, which can be switched off offline, and the classic behaviour stays
  available. The Living World is built exactly that way.
- **Quests must keep working.** Quest NPCs are placed by DFU's quest engine; Living World residents are kept
  separate from them (`Living-World.md` LW8: "a building's static NPCs stay DFU's own"). An NPC change must not move,
  rename or kill a quest's Person.
- **The four hosts rule:** a change must name all four scene hosts (`world.js`, `exterior.js`, `worldModes.js`,
  `dungeonContext.js`), each either wired or explicitly flagged.
- **Tests that fail when the rule breaks:** every pinned law must fail under a one-character mutation (the repo runs
  mutation tests from `tools/mutants/`). Every change updates the bible: anchored citations, Ledger rows, and checks
  in CI (`citeanchor`, `ledger`, ...).
- **Solo must not change** when no room is joined, and the game must still boot with no server present.
- **Outside PRs are accepted.** Contributor joaomdb3 has had 11 merged, mostly performance work in the house style,
  some within a day. The PR template asks for patch notes, what changed, and how it was verified.

## 3. What that leaves: four tiers of scope

Every NPC idea lands in one of these. They're ordered from cheapest and safest to most invasive.

| Tier | How it's shared online | Fits the architecture? | Costs | Good for |
|---|---|---|---|---|
| **A. Client-only, per character** | Not shared: each character has their own relationships, memories and dialogue state, saved with the character | **Yes**, it's how regard already works | Client CPU and save size only. No server change, no relay deploy. | Talk tied to regard and news; NPC memory of *you*; richer dialogue; personalities |
| **B. Deterministic, shared** | Everyone computes the same thing from seed + clock + map | **Yes**, it's how the Living World's schedules work | Client CPU and load-time freezes (already a sore point). Must be deterministic: no `Math.random`, no frame-time dependence. | Smarter schedules, relationships between NPCs, events, rumours that are the same for everyone |
| **C. Server-held, coarse** | The account service or a relay object holds slow-changing facts (per day or per week), fed by bounded client reports or witnesses | **Yes**, the guild Chapters, raids and the Abyss director already do this | D1 writes on one primary; integrity rules; witnessed facts for game data. Account-service changes don't drop players. | Shared consequences: an NPC dies for everyone, a town's mood, a faction's fortunes, persistent named NPCs who remember *players* |
| **D. Live, shared behaviour** | A room's host simulates NPCs in real time and streams them, as foes are streamed | **Possible but expensive.** Bandwidth limits per room, host handover, crowds. | Relay deploys that drop everyone; per-room bandwidth; host-migration bugs | NPCs reacting live to several players in the same street |

**A fifth option is not open: running NPC simulation on the server.** The design rejects it in so many words: "a
Durable Object running the simulation would be a second copy of the game in a Worker", and the servers can't hold
game data anyway.

### Where language models could fit

DFO already uses Claude in one place, `tools/translate.mjs`: a *build-time* pipeline that drafts translations and
keeps human edits. That precedent matters more than live generation does:

| Approach | Fit | Problems |
|---|---|---|
| **Build-time generation** (like `translate.mjs`): large banks of dialogue, rumours and personality lines written ahead of time, reviewed, committed as text | **Best fit.** Deterministic, free at runtime, works offline, no moderation risk in play. | Content only, not reasoning. Must not embed game text (Port Doctrine). |
| **Live, through a server proxy** | Possible | Per-line API cost against a $600/month budget; latency in play; moderating what players can make NPCs say online; answers that differ between players break determinism; prompt-injection through player text |
| **Live, on the player's device** (in-browser model) | Weak | Large downloads and memory on phones and handhelds; already a heavy client |

## 4. What to decide next

1. **Offline, online, or both?** Tier A and B work in both lanes. Tier C is online-only.
2. **Shared consequences, or per-character?** This choice decides between A/B and C.
3. **Upstream or a fork?** Upstream means the owner's approval, the bible's process, and fitting the enhanced lane.
   A personal fork means freedom, but it falls behind a project landing 3,000 commits a month.
4. **The first slice.** The parked idea (conversation reading Living World regard and repute,
   `memory: npc-talk-regard-idea`) is Tier A, needs no server change, and answers an open question the owner has
   already asked (Living-World-II "Mac's call 7").
