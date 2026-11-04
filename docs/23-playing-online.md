# The Play Guide

*Studied 2026-10-21 at DFO Online commit `4bba28c6c` (2026-10-20). Written for **Tiger Fist**, your online Khajiit
brawler ([The Strongest Melee Build](05-strongest-melee.md)). Every number here comes from DFO's own code or design records. The ones a game change could
quietly move are checked by automated tests, so the next sync tells us when this guide goes stale.*

## How to catch up with players who play ten hours a day

You can't out-grind someone with ten times your hours. You don't need to. DFO caps much of what one account can earn
each hour, day and week, and wherever a cap exists, a hardcore player's extra hours stop counting. Three rules follow:

1. **Spend your time on capped rewards first.** Take every daily allowance, every day. They reset at **00:00 UTC**,
   and a 10-hour player gets exactly the same amount. The full list is in
   [Caps, Timers and Catch-Up](27-caps-and-timers.md).
2. **Play the scheduled events, not the grind.** Event rewards dwarf kills. One fallen star or one town defence pays
   Renown equal to **15–30 kills** of level-8 foes (table below).
3. **Know the rules they learned by trial and error.** This guide and its companion guides come from the game's code. Most
   players never see the exact numbers: the quest-letter rules, private instances, spawned dungeons off the roads,
   danger by place, the permanent crafting limit. Make no permanent mistake: those cost a hardcore player nothing to
   redo, but cost you weeks.

The world, region by region, is in [The World, Region by Region](25-world-regions.md); city control and guild politics are in
[City Control and Guilds](26-city-control.md).

### What events pay, against grinding

A star held during the Witches' Festival and a town defended from a raid pay the same Renown: three quests at the top
level your Renown allows (`renownRaidXp`). A kill pays 7.5 per foe level, and a foe counts at most 3 levels above your
Renown.

| Your Renown | One star or one raid | One kill of a level-8 foe | Kills to match one event |
|---|---|---|---|
| 1 | 585 | 30 | about 20 |
| 5 | 945 | 60 | about 16 |
| 10 | 1,395 | 60 | about 23 |
| 15 | 1,845 | 60 | about 31 |

For scale: Renown 10 takes 5,510 XP in total, Renown 15 takes 23,350. Each event pays once per account. The sea
serpent pays double a raid.

### The event clock: plan a session around it

| Event | When | What it pays |
|---|---|---|
| **Starfall** (festival, until 7 Nov) | three stars an hour, at :45, :52:30 and :00 (real time), near towns in one coven's region | each star: raid-sized Renown, gold, 1–3 Starfall Glass, a Magic-or-better piece; up to **9 claims a day** |
| **Dagon's Breach** (world boss) | one a game day, so every **two real hours** | once per account per gate |
| **Town raids** | rolled each game day across the regions | Renown worth three quests, once per raid |
| **The sea serpent** | every **four real hours**, at the game's dawn | Renown worth six quests, once per serpent |
| **Motherlodes** | three a day, in eight-hour blocks | ore, plus a Marks reward once per day |

A two-hour session can usually catch a Breach, a raid and several stars. [What's New Since 17 October](24-whats-new-2026-10.md) explains each event.

### Your daily checklist (resets 00:00 UTC unless noted)

| Do this | Daily cap |
|---|---|
| Starfall stars (festival only) | 9 claims |
| Combat Marks from Breaches, raids, the serpent, Elite Breach Redoubts and stars | 150 Marks, shared between them |
| Court writs (deliveries on the Work tab) | 3 writs: Marks, profession XP and Renown outside the hourly cap |
| A Motherlode | 1 Marks reward |
| Marks from gathering finds / from corpses, piles and searches | 30 / 20 |
| Rare (high-tier) hides | 3 |
| Soul Cakes (festival only) | 120 |
| City influence from the Watch ([City Control and Guilds](26-city-control.md)) | 60 (weekly caps reset Sunday 18:00 UTC) |

### Group up with the strong players

- **Mentor mode is automatic.** In a party, anyone three or more levels above the group is scaled down to it, so a
  veteran friend fights at your level and the dungeon spawns for it. You can share content with anyone.
- **Kills aren't split.** Every member earns the whole kill, +10% per extra member in the room. Join a guild, party
  with its regulars, and let their knowledge carry you through events.

### Where hours still win (be honest about it)

No daily cap stops a long session's character levels and skill practice, profession harvesting (until the day's map
nodes run out), quest chains, repeated dungeon respawns, or market trading. You won't match a hardcore player there,
and you don't need to: stay on par in capped rewards and knowledge, and spend your remaining time on one of these, not
all of them.

## Dungeons without the crowds

Public dungeons are often full of other players, and that's by design. A named dungeon is **one shared room for everyone**: what another player kills
stays dead for whoever comes next, and loose loot goes to whoever picks it up first. A cleared dungeon's foes and
chests come back only after **20 real minutes** (40 for an elite dungeon; `src/systems/dungeon/dungeonRespawn.js`).
So following a crowd into a popular dungeon means walking through rooms someone else already emptied.

There are two ways out:

- **Quest dungeons are private.** When one of *your* quests names a dungeon (or a building), its door asks
  **Public or Your instance**. Your instance is a copy for you and your party only. It is also the dungeon at its
  **full size**: online, most public dungeons are built smaller (`bible/11-Multiplayer/Instances.md`). An instance
  remembers what you cleared, and respawns on a real-time clock like a public dungeon. **Taking quests is how you get dungeons to
  yourself.**
- **The wilderness is full of dungeons nobody has found.** Online only, every empty map square (about 820 m across)
  has a **30% chance of a spawned dungeon** and **10% of an Elite one** (`src/world/spawnedDungeons.js`). They never
  stand on a road or within 300 m of a town. Every player sees the same ones, but almost nobody walks off the roads
  to find them. Leave the road and they turn up all around you.

## Where it's safe: danger by place

Move away from the crowds step by step, and not into the mountains. Distance itself doesn't make foes stronger. What sets the
danger is **what kind of place you're in** (BAL3, `bible/05-Combat/Balance-Arc.md`):

| Danger tier | Places | Foe health | Foe damage |
|---|---|---|---|
| 4 (base) | towns, mines, natural caves | x1 | x1 |
| 5 | Prisons, Spider/Scorpion Nests, **the wilds by day** | x1.07 | x1.02 |
| 7 | Harpy Nests, **the wilds at night** | x1.21 | x1.05 |
| 9 | Crypts, Orc Strongholds | x1.36 | x1.09 |
| 11 | Barbarian Strongholds | x1.50 | x1.13 |
| 14 | Vampire Haunts | x1.71 | x1.18 |
| 15 | Desecrated Temples | x1.79 | x1.20 |
| 18 | Dragon's Dens, Volcanic Caves | x2.00 | x1.25 |

Better places drop better loot: the same tier sets the odds of rare items. Read a dungeon's type before going in.
Online the sky runs a day every real hour (midnight on the hour, dawn at quarter past), so night comes round often. Wander by day while you're weak.

**Stay out of the Wrothgarian Mountains for now.** Most of that region is the **Open Zone**
(`bible/11-Multiplayer/Wild-Zone.md`): open PvP, foes **4x stronger**, and dying there drops everything in your bags
(and your cart), and a player who kills you takes one equipped piece. The loot is double, but it's a place for a
geared group, not a new character.

## How power works online: three ladders

1. **Daggerfall level and skills.** Your class has the fastest skill growth the game allows (x0.30, [The Strongest Melee Build](05-strongest-melee.md)). Online,
   **Master Skills** is always on: up to five class skills can go past 100, to 200 (two primary, two major, one minor;
   `src/systems/masterSkills.js`).
2. **Renown**, online's own level, 1 to 50. Each level adds **+3 health and +2 magicka** online, and it pays for
   stars on the **Firmament** (a Path-of-Exile-style passive tree with 518 stars, `bible/06-Systems/Firmament.md`).
3. **Gear**: loot rarity (Common → Magic → Rare → Legendary → Artifact), gem sockets, sigil sets, techniques.

### What earns Renown

| Source | Renown XP |
|---|---|
| A kill | 7.5 per level of the foe, but a foe counts at most **3 levels above your Renown** |
| A quest | 75 + 30 per character level |
| Defending a town from a raid | worth **three top-level quests** (585 at Renown 1, 2,925 from Renown 27) |
| The sea serpent Sethrakul | worth six top-level quests (one every four real hours) |
| Partying | **every** member earns the whole kill, **+10% per extra party member** in the room |

Two lessons:

- **Crowds help if you join them.** Grouping doesn't split XP: a party of four earns 130% of each kill each. If a
  dungeon is full of players, invite them to a party instead of competing with them.
- **Quests and raids pay best early.** Quests also send you to private dungeons and pay gear (next section).

The hourly cap is 15,000 Renown XP per account, and a solo player never reaches it.

### The game pushes back after level 10 / Renown 15

Since 2026-10-17 (BAL11, `bible/05-Combat/Balance-Arc.md` section 17), foes grow with you. For each Daggerfall level
past 10 their blows land 7% harder and their health grows 4%, compounding, plus a smaller amount per Renown past 15.
At level 20 / Renown 30 a foe hits **2.3x** as hard as at level 10. You stay ahead only if your **gear and Firmament
keep up with your level**. Don't rush levels on weak equipment.

### What wakes up as your Renown grows

| Renown | What changes |
|---|---|
| 5 | **Elite foes** start appearing in the world: stronger, with better loot |
| 10 | **Revenants**: a marked foe that kills you, or flees at low health, can come back 2–4 game days later, stronger, with a new name, more loot and taunts. At most three hunt you at once. |

## Quests are the core loop now

The **Questlines overhaul** (2026-10-19, `bible/06-Systems/Questlines-Arc.md`) changed quests a lot:

- Every quest has **objectives and branches**, and everything lives in one Questlines window.
- A quest that pays gear offers you **a choice of three pieces**: a weapon, an armour piece and a jewel, fitted to
  your armour and your best weapon skills. Tier 1–2 quests pay Magic items, tier 3–4 pay Rare. Higher guild ranks
  give higher tiers.
- **Failing a quest costs you no faction standing online**, so try the harder quests.
- Each **guild you join shows a ladder** of the quests its ranks unlock.
- The questlines below start with a courier's letter once you reach the level. Most need a **registered account**,
  not a guest one, and you must be online.
- **Letters arrive slowly, by design.** At most one new line begins per hour of your character's clock (about seven
  real minutes online), and never while another line's first letter is still on its way. A courier hands a letter over
  only while you stand **in a town, outdoors, by day**, so time spent in dungeons, the wilds or at night holds them
  back. At level 7 about nine lines are open to you, so expect them one by one over a few town visits.
- **Check the Questlines list** on the pause window's Quests tab. Every line is listed with what it waits on:
  "Opens at level 10", "Continues with a registered account." and so on. If a line says it needs a registered account,
  that's why its letter never came.
- **Be in a proper town when a step comes due.** A questline's next quest starts wherever you are at that moment, and
  most introduction quests are set in *the town you're standing in*: The Court Crafter's first step needs a town with
  a **General Store** (and a smith to stand there); others need a tavern, an armorer or a temple. If you're in the
  wilds, a dungeon or a hamlet without that building, the step can't begin, the list says "Its next step could not
  begin here: it will be offered again", and it waits a day of your character's clock (about two real hours of play)
  before trying again. Spend that moment in a city or a large town.

| Opens at | Questline | What it introduces |
|---|---|---|
| level 2 | **The Court Crafter** | the professions (gather, then craft) |
| level 2 | A Seat at the Table | the tavern card game |
| level 3 | **Written in the Stars** | the Firmament, your passive tree |
| level 3 | The Merchant's Road | wagons and hauling |
| level 4 | **The Smith's Secrets** | gem sockets and tempering |
| level 5 | The Harbormaster's Word | ships |
| level 6 | **The Herald's Call** | the Arena in Daggerfall city |
| level 6 | **The Bay's Troubles** | raids on the roads and the restless dead |
| level 8 | The Old Coil | the sea serpent |
| level 10 | **The Burning Doors** → The Covens' Hoard → The Weir Road | Dagon's Breaches, then the Elite Breach |
| level 12 | The Hour That Was Not | the Super Dungeon (the Hollows of the Hour) |
| festival | The Thirteenth of Frostfall | the Witches' Festival's Starfall event (while it runs) |

## A plan for Tiger Fist

### Now (level 1–5, Renown 1–5)

1. **Bank your gold.** A death online costs **a tenth of the gold you carry** (not the bank), and you rise at the
   nearest safe place at half health (`src/systems/deathPenalty.js`).
2. **Join the Fighters Guild** (or any guild) and run its quests. Each one gives you a private dungeon and a gear
   choice. This beats queuing behind other players in public dungeons.
3. **Do The Court Crafter** when its letter arrives (level 2) to start Herbalism and Alchemy (see below), and **Written
   in the Stars** (the Firmament) at level 3.
4. **Hunt for Gauntlets with a technique line** (see *Your gauntlet techniques* below). They unlock your two special
   moves, **Haymaker** and **Flying Kick**.
5. Hunt the **wilds by day** for spawned dungeons. Mines and natural caves are the gentlest (tier 4).

### Building up (level 5–10, Renown 5–15)

1. Elite foes appear from Renown 5. Learn their look before you fight them alone.
2. **The Herald's Call** (the Arena) and **The Bay's Troubles** (the watch) questlines at level 6. Its raids lead you to **town defences**, the
   biggest single Renown payout, and these are where other players are worth meeting.
3. Try an **Elite spawned dungeon** (marked "Elite"): three foes per spawn point with double health and damage, but
   20% better drops. Bring a partner.
4. Spend Firmament stars on **the fist line first**. Since BAL10 (2026-10-17) every blow bonus finally reaches bare
   hands: the Firmament's fist stars (**Iron Knuckles**: fist damage, Strength, +4 Hand-to-Hand), sigil-set powers and
   loot powers. The Steed's sign holds the biggest fist channel (up to 28%).

### Power (level 10+, Renown 15+)

1. **The Burning Doors** (level 10) begins the Dagon Cycle: Dagon's Breaches (Oblivion Gate world bosses), then the
   **Elite Breach**. This is where Atheric gear and titles come from.
2. **The Hour That Was Not** (level 12) opens the **Super Dungeon**, the hardest dungeon content.
3. Revenants hunt from Renown 10. When a strong foe is about to flee, finish it, or it may come back stronger.
4. **Past 100**: Hand-to-Hand keeps growing (its damage reads the skill, about x1.37 a blow at the top).
5. **Martial specialisation, a long-term goal.** The 15 martial paths each need *two* weapon skills mastered, and
   Tiger Fist has only one (Hand-to-Hand). A **skill swap** (100,000 gold) can trade one unmastered class skill for a
   weapon skill in the same group. Swapping Medical (a major) for Blunt Weapon would open the **Brawler** path
   (Knockout, a heavy blow at x1.6), or swap in Short Blade for the **Shadowdancer** (+10 Agility, +15 Dodging).
   Choosing a path is permanent unless you pay 200,000 gold to reset it.

### Your gauntlet techniques

Techniques are DFO's special moves, one key per weapon. Bare hands have two: **Haymaker** and **Flying Kick**.

**You need the right gauntlets, not just any gauntlets.** A technique is a **rolled line on a specific pair of
Gauntlets** (any material), shown on the item card as e.g. `Haymaker +18% [15-30]`. You get it by finding one: each
Magic piece has a 12% chance of a technique line, each Rare 30%, each Legendary 45% (never on a Common piece or a
sigil-set piece). Look for it on loot, shop stock and quest reward cards. Wear them and fight bare-handed.

| Technique | What it does | Damage | To hit | Fatigue | Cooldown |
|---|---|---|---|---|---|
| **Haymaker** | a heavy straight punch at the nearest foe in front of you, within 2.5 m | x1.8 your normal blow | +30 | 4 | 9 s |
| **Flying Kick** | aim at a foe (or the ground) 2–6 m away and leap onto it; hits every foe within 2 m of where you land. The only technique that works from a jump, a fall or a step off a ledge | x1.3 | +20 | 4 | 10 s |

The line's percentage raises the multiplier: a Haymaker +18% hits for 1.8 × 1.18 = x2.12.

**How to use it:**
- **The key is "Weapon technique"**, by default the **mouse's back side button** (Mouse3). Keyboard players: rebind it
  in Controls → Combat (F2 and F4 are free). On a phone it's the **Tech** hold button; on a gamepad, a d-pad choice.
- **Haymaker goes on the press.** **Flying Kick aims while you hold the key** (a marker shows where you'll land) and
  leaps on release; a quick tap kicks at whatever you're looking at.
- It's a real blow through the normal combat formula: it can miss, and it uses your Hand-to-Hand, crits and every
  bonus you have. It **won't fire if it would leave you with no fatigue**, so watch your fatigue bar.
- The HUD shows the technique's name and its cooldown, or the key when it's ready.
- Techniques never hit another player, and they sleep in duels.

**Using them well:** open a fight with a Flying Kick into a group, then Haymaker the biggest threat every 9 seconds
between normal punches. Athleticism (your class advantage) helps keep the fatigue for both.

**Improving the line:** at a Reforge, a technique can be turned into the other bare-hand one (Haymaker ↔ Flying Kick),
and a **Hone** raises its value to the top of its band (Magic 5–15%, Rare 15–30%, Legendary 30–50%). A non-Exalted
Legendary's technique can't be changed.

**No technique gauntlets yet?** Later, a **martial specialisation** (see the Power stage) gives a signature technique on
the same key whenever your gauntlets carry no technique line: for example the Brawler's **Knockout** (x1.6) or the
Strider's flying kick (x1.2).

### Your build's weak spots, and what covers them

- **Willpower 15**: spells land about 60% of their damage on you and poison gets through most of the time. Carry
  Cure Poison and resist potions. Alchemy covers this.
- **No spells**: no Recall, Levitate or Water Breathing. Use potions and, online, the **Portal Stone** for travel.
- **Personality 10**: townsfolk and shopkeepers like you less, so expect worse prices in shops.

## Building Tiger Fist: every system at a glance

Your character grows through several systems at once. This is the order to work them in; the details are in
[The Star Tree (Firmament)](28-firmament.md) (the star tree), [Building Your Character](29-build-systems.md) (everything else) and
[Companions](31-companions.md) (your companion).

| System | Do now (level 7, Renown ~5) | Next | Later |
|---|---|---|---|
| **Level-up points** (5 per level online) | Speed, then Strength | Luck, Agility | Endurance (online health has a floor tied to it) |
| **Skills** | Fight bare-handed with gauntlets on; rest to bank raises (one check per 6 game hours) | Fighters Guild training up to 50 (100 gold × your level as a member; Gothway Garden has a hall) | Past 100 only challenging foes teach |
| **Firmament (stars)** | Start at **The Steed** and buy the 8 stars below; refunds are free until Renown 10, so experiment | Fist cluster + melee to the **+30% cap by Renown 10** | Defence: 15% less damage taken by Renown 20, 10% evasion by 30 |
| **Masteries** (at skill 100, permanent) | Nothing yet | **Hand-to-Hand** first | Critical Strike (or Dodging), Running, Backstabbing, and Blunt Weapon for Brawler |
| **Techniques** | Look for **Gauntlets with a technique line** (Haymaker / Flying Kick) | Hone the line | Brawler's Knockout on the same key |
| **Gear** | Best armour in allowed metals (not Steel, Elven, Dwarven) | Amber (Luck) and Malachite (Endurance) gems; Dagon's Brand set for Strength and crit | **Gauntlets of the Rose** (Open Hand) |
| **Companion** | Keep it beside you; read its Art; aim for 90 loyalty | Health stars, then Blade damage stars | Art stars (Mending or War Cry are best for you) |
| **Martial path** | Save gold | Swap Medical → Blunt Weapon (100,000 gold) | Master both, choose **Brawler** |
| **Professions** | The Court Crafter questline | Provisioning (Alchemy + Cooking) and Smithing past 50 | Specialisations at 50 and 100 |

**Your first 8 stars (Renown 5), in order:** Path of the Sign (+2% Speed) → Path of the Sign (+3% Strength) →
Gate of the Sign (+1% Speed, +2% Strength) → Starway (+3% melee damage) → Starway (+4 Long Blade; it's the only
bridge to the fist stars) → Star (+2% Endurance) → Star (+3% maximum Health) → Star (+2% Endurance). At Renown 10 the
plan takes **Iron Knuckles** and **Pankration**, the two fist notables. [The Star Tree (Firmament)](28-firmament.md) lists every milestone star by star.

**Skip** Steed's Charge (its +9% melee costs 5% more damage taken, and you reach the same cap without it), every
spell and magicka star, and weapon-only gear lines (weapon damage, leech, elemental and slayer lines do nothing for
fists).

## The professions, in detail

**Are professions worth it? Yes, as a support skill, not as your main source of power:**

- Crafted gear tops out at **Masterwork**, which is about one **Rare** roll (`src/net/recipeLaw.js`). The best gear
  (Legendary, Atheric sigil sets, artifacts) comes from bosses and hard content, not the anvil.
- But for Tiger Fist, **Alchemy is close to essential.** You have no spells and no magicka, so potions are your only
  healing, cures, levitation and water breathing in the field.
- Gathering is unlimited and earns gold on the **global market**. Gold buys power: skill swaps, specialisations,
  repairs and other players' crafts.
- You can raise only **two crafts above Journeyman (50)**, for good. Choose them deliberately (see below).

Ten professions (`src/net/professionLaw.js`): five that **gather** (Mining, Logging, Herbalism, Hunting, Fishing) and
five **crafts** (Smithing, Building, Outfitting, Provisioning, Enchanting). Each runs from 0 to 100. Ranks are
Novice, then Apprentice at 25, Journeyman at 50, Expert at 75 and Master at 100. Reaching rank *n* takes
10 × *n*² XP, so Master is 100,000.

- **Gathering has no limit.** You can raise all five.
- **Only two crafts can pass 50, and that choice is permanent.** A third craft stops just short of rank 51.
- Specialisations unlock at 50 and 100 (changing one costs 1,000 Marks and a week).
- Crafting **quality** depends on how far your rank is above the recipe's. Well above it (45+ ranks), you get
  Superior 52% of the time and Masterwork 8%. Superior carries a Magic roll and Masterwork a Rare roll plus your name
  on the item.

**Recommended for Tiger Fist:**

| Pick | Why |
|---|---|
| **Provisioning** (Alchemy + Cooking) | potions are your healing and your utility. At 50, **Brewer** makes 3 potions a brew. Cooking feeds you under Climates & Calories. |
| **Smithing** (Armoursmith at 50) | armour wears out, and you need **repair kits** and armour in the metals you're allowed (iron, silver, mithril, adamantium, ebony, orcish, daedric). |
| **Herbalism** + **Mining** | feed both crafts, and sell the surplus. With **Deep Delver** (Mining at 50), dungeon veins yield double. |

Skip Enchanting and Jewelcrafting's spell lines (focus, cast speed, potency). They do nothing for a fighter with no
magicka.

## Quick reference

| | |
|---|---|
| Public dungeon respawn | 20 min, elite 40 min (real time) |
| Your instance | quest dungeons, Privateer's Hold, quest buildings; you + party; full size |
| Spawned dungeons | 30% normal / 10% elite per empty map square, never on roads |
| Elite dungeon | 3 foes per spawn point, x2 health, x2 damage, +20% loot |
| Death | lose 10% of carried gold; bank it |
| Renown per level | +3 health, +2 magicka (online) |
| Party bonus | +10% Renown per extra member, each earns the whole kill |
| Foe toughening | from level 10 / Renown 15 (BAL11) |
| Elites / revenants | from Renown 5 / 10 |
| Crafts above 50 | two, for good |
| Skill swap / path reset | 100,000 / 200,000 gold |
