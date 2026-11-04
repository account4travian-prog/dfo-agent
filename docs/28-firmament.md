# The Star Tree (Firmament)

Studied against DFO main at `4bba28c6c` (2026-10-20). The Firmament is DFO's 518-star passive tree. The game guide for choosing where to play, what to do, and when to take quests is [The Play Guide](23-playing-online.md); the feature roundup is [What's New Since 17 October](24-whats-new-2026-10.md). This page explains how to spend points in the tree and gives Tiger Fist a computed route.

*Source: `src/net/firmament/firmamentTree.js` (`FIRM_NODES`).*

## Open it and read the sky

Open the pause menu's **Growth** tab, then choose **Firmament**. The Firmament is drawn inside that tab; it can also open full screen. The other Growth pages cover Level and Specialisations. Captain's Stars is for a ship captain. See [What's New Since 17 October](24-whats-new-2026-10.md) for the short interface description.

The sky has seven free starting stars: six signs around the inner ring and **The Serpent** in the middle. Pick one start, then follow connected stars out from it. The Serpent is the middle route into all six signs. A start is not a combat skill choice; it is where your path begins.

| Start | Attributes on its sign card | Fight wedge | Life wedge |
|---|---|---|---|
| The Mage | Intelligence; start gives +2 Intelligence | Destruction, spell power and cost, Spell Points, wards | Enchanting and Provisioning experience, Medical skill |
| The Shadow | Agility, Intelligence; start gives +1 of each | Stealth, unseen blows, Illusion and short blades | Trading, caravan work, fencing and courts |
| The Thief | Agility; start gives +2 Agility | Archery, dodging, running and hunting beasts | Hunting, outfitting and climbing |
| The Steed | Speed, Strength; start gives +2 Speed | Long blades, charge, fists and stamina | Sailing, fishing and roads |
| The Warrior | Strength, Endurance; start gives +1 of each | Axes, blunt weapons, armor, health and fury | Mining, Smithing, Building and Logging |
| The Ritual | Willpower, Strength; start gives +2 Willpower | Restoration, undead and Daedra, spellsword attacks and wards | Herbalism, Provisioning and weather |
| The Serpent | Luck; start gives +2 Luck | The central start can reach every sign | No separate life wedge |

These are themes, not restrictions: any character can path across the tree. Each sign's inner combat wedge has seven clusters of small stars, notables and a keystone. The outer life ring has four profession clusters and a life keystone for each sign. Wayfarer's Roads connect the signs on the life ring and carry travel or carrying bonuses. A keystone is the end of its path: you can reach it, but cannot path through it to another star.

The game names the node tiers **small**, **notable** and **keystone**. Every allocated non-start star costs one point, whatever its tier or ring. Starts cost zero. Small stars often give one focused bonus. Notables tend to combine bonuses. A combat keystone makes a stronger trade, with a benefit and a cost; life keystones have no negative stat. The name **Star** is used for many small combat stars, and **Mote** for many small life stars, so use the visible location as well as the name when comparing them.

*Sources: `src/ui/growth/growthTab.js` (`drawGrowthTab`); `src/net/firmament/firmamentTree.js` (`SIGNS`, `SERPENT`, `START_KEYS`, `SKY`, node `kind` and `ring`); `src/net/firmament/firmamentLaw.js` (`firmCostOf`, `pathTo`); `bible/06-Systems/Firmament.md` §3; `bible/10-UI/Growth.md` §3.*

## Points: Renown stars and profession Craft points

Your Renown level gives **2 Stars for each level after Renown 1**. The formula is `2 × (Renown − 1)`: Renown 5 gives 8 Stars; Renown 10 gives 18; Renown 50 gives 98. Stars can buy combat or life stars. Combat stars must be paid from the Renown-Star purse.

Craft points come from profession ranks. The law sums your ranks across the ten profession tracks, limits each track to 100, then gives **1 Craft point per 8 total ranks**, rounding down. At 100 ranks in all ten tracks, that is 125 Craft points. Craft points can buy **life-ring stars only**. They cannot buy combat stars. When paying for life stars, the game uses Craft points first, then any remaining Renown Stars.

For this guide's future profession scenario, 100 ranks each in Herbalism, Mining, Smithing and Provisioning total 400 ranks, or **50 Craft points**. This is a planning assumption, not a claim about Tiger Fist's current ranks.

*Sources: `src/net/firmament/firmamentLaw.js` (`STARS_PER_RENOWN`, `starsFor`, `CRAFT_RANKS_PER_POINT`, `CRAFT_RANK_MAX`, `craftPointsFor`, `firmCostOf`, `fits`, `pointsLeft`); `server-account/src/firmament.js` (`firmament` allocation validation).* 

## How to allocate without getting lost

1. Choose a start. For Tiger Fist, the plan below starts at The Steed.
2. Buy a star connected to the start or to a star you already own. A path preview shows the shortest route to a distant star. If you select that destination, you must pay for every unowned star on the route.
3. Continue outward along stars you have already bought. You cannot jump to an isolated star or pass through another sign's start. A keystone ends a route.
4. Watch the two purses. Combat stars cannot cost more than your Renown Stars. All stars together cannot cost more than Stars plus Craft points; Craft points can only cover life-ring stars.

`pathTo` finds the shortest route from the allocated set. `allocatable` is true when a star is one step away. The service checks the saved tree with `treeFault`: the start must exist, every key must be a real and unique star, every allocated star must connect back to the start, and the total must fit the purses. `fits` checks the purse totals. If you refund a connecting star, the game also refunds stars that would no longer connect.

### Why stacking one damage bonus stops helping

The Firmament first caps each individual stat channel. For example, one weapon family damage channel can add at most **30%**, a combat skill at most **+15**, Strength at most **+15**, and evasion at most a **10%** chance. The channel caps are listed in `STAT_DEFS`.

Then DFO caps combinations when a blow is calculated. For a fist blow, the general weapon, melee and fist channels all contribute. Their ordinary combined gain is capped at **+30%** (and has a **−20% floor**). Extra conditions such as an unaware foe or a wounded attacker are added after that, but the whole blow bonus is capped at **+50%**. That is why another melee-damage star can stop adding damage once the shared cap is full, even if that star's own channel has not reached its individual cap. A keystone's drawback still counts after the positive gain cap.

Spell-cost reduction has its own **25%** group cap. Tiger Fist does not use spells, so this is not part of the plan. The life ring has different channels, such as profession XP and yield, carry weight, travel fatigue and gathering-action bonuses; those do not feed into combat.

*Sources: `src/net/firmament/firmamentLaw.js` (`pathTo`, `allocatable`, `treeFault`, `fits`, `STAT_DEFS`, `BLOW_CAP`, `BLOW_FLOOR`, `BLOW_TOTAL_CAP`, `CAST_COST_CAP`, `blowPct`, `castCostPct`); `src/systems/firmamentPowers.js` (`firmamentBlow`); `server-account/src/firmament.js` (server-side `treeFault` validation).* 

## Refunds and respec

You can experiment freely while your Renown is below 10: refunds cost **0 silver**. At Renown 10 or higher, each refunded star costs **10 silver**. The charge is based on the number of stars removed, including any stars that become disconnected. Silver is the separate currency the Firmament law charges for refunds.

A whole-tree respec removes the allocation and lets you choose a start again. It costs **10,000 gold**, whatever your Renown. That is a different action and price from refunding individual stars.

At Tiger Fist's current approximate Renown 5, trying a different route is therefore free under the current refund rule. You can use the Growth tab's Firmament before investing later points, too. The game calls the account's Marks balance "silver" in its interface; the service burns the refund charge from its Marks ledger.

*Sources: `src/net/firmament/firmamentLaw.js` (`REFUND_FREE_BELOW_RENOWN`, `REFUND_SILVER_PER_STAR`, `FIRM_RESPEC_GOLD`, `refundSilver`, `refundTakes`); `src/net/marksLaw.js` (`MARKS_KINDS`, `marksText`); `src/net/firmament/firmamentBook.js` (`respec`); `server-account/src/firmament.js` (`respecFirmament`).*

## What the Firmament does not do

For online play, the tree is active in ordinary play against the world. Its powers sleep while offline, while mentoring, and in refereed duels and arena bouts. A Firmament bonus never changes a blow or spell against another player. In a siege or the Wrothgarian zone, it can still affect your character against NPC foes; it does not amplify your attacks on players.

*Sources: `src/systems/firmamentLive.js` (`firmamentInForce`, `setFirmamentMentoring`); `src/systems/firmamentPowers.js` (`awake`, `withoutFirmament`, player blow and spell routes); `src/net/firmament/firmamentLaw.js` header comments.*

## Tiger Fist's star plan

### The scoring assumptions

The planner uses a beam search with width 120. At each budget step it compares connected partial trees and keeps the best legal candidates. It also searches complete paths to scored fist and guard targets so that a zero-value bridge can survive when it leads to a valuable star. Each milestone is a superset of the preceding one.

Damage stars are scored by their marginal change to L.blowPct(c, { skill: 'HandToHand' }). The score stops rewarding fist and melee damage at the shared blow cap. Negative blowTaken is strongly positive, followed by evade, Health, Health percent and armor, then Strength, Speed, Luck, Agility, Endurance and combat skills. The life score values Herbalism, Mining, Smithing and Provisioning, followed by carry weight and travel Fatigue. Magic channels score zero for Tiger Fist.

Current attributes and skills were not supplied. The model uses 50 for percentage-star inputs. It assumes an empty tree at Renown 5 and 50 Craft points from the four planned professions at rank 100; those Craft points are a future planning assumption.

*Sources: planner/tools/firmament-plan.mjs (weights, utility, beamToBudget); src/net/firmament/firmamentLaw.js (blowPct, STAT_DEFS, treeFault, fits, starsFor).*

### Start and fist-route constraint

The start is The Steed. The fist cluster is prioritized. The live graph requires st.r2 to reach st.c5.0, st.c5.6, st.c5.5 and st.c5.4; st.r2 gives +4 Long Blade. A legal Steed-start plan cannot take the fist cluster without that bridge. The plan excludes Steed's Charge (st.k) and its st.c1.* Long Blade cluster.

*Sources: src/net/firmament/firmamentTree.js (Steed nodes); src/net/firmament/firmamentLaw.js (pathTo, treeFault).*

### Renown Star additions

Each list gives that milestone's new stars in purchase order, paid with **Renown Stars only**. **Craft points are separate:** they arrive with profession ranks (1 per 8 ranks across your professions), not with Renown, so you won't have many for a long time. Spend each one on the life-ring route below as it arrives; the combat plan never depends on them. The totals below include the full 50-point life route as a future picture. Fist blow is measured after the shared 30% cap.

#### Renown 5 — 8 Renown Stars

1. Path of the Sign (st.s1): +2% Speed.
2. Path of the Sign (st.s2): +3% Strength.
3. Gate of the Sign (st.g): +1% Speed, +2% Strength.
4. Starway (st.r1): +3% melee weapon damage.
5. Starway (st.r2): +4 Long Blade; required fist-route bridge.
6. Star (st.c3.0): +2% Endurance.
7. Star (st.c3.1): +3% maximum Health.
8. Star (st.c3.2): +2% Endurance.

Fist blow +3%. Totals include +3% melee damage, +3% Health, +5% Strength, +2 Speed, +3% Speed and +4% Endurance. All 8 Renown Stars are spent.

*Sources: planner/tools/firmament-plan.mjs (Renown 5 output); src/net/firmament/firmamentTree.js (st.s1 through st.c3.2); src/net/firmament/firmamentLaw.js (starsFor, treeFault, fits).*

#### Renown 10 — 18 Renown Stars

Add, in order:

1. Star (st.c3.3): +3% maximum Health.
2. Star (st.c5.0): +3% hand-to-hand damage.
3. Iron Knuckles (st.c5.6): +5% hand-to-hand damage, +3 Strength, +4 Hand-to-Hand.
4. Star (st.c5.5): +3% hand-to-hand damage.
5. Pankration (st.c5.4): +8% hand-to-hand damage, +8 Hand-to-Hand.
6. Star (st.c2.0): +2% melee weapon damage.
7. Star (st.c2.1): +2% melee weapon damage.
8. Star (st.c2.2): +2% melee weapon damage.
9. Cavalier (st.c2.4): +4% melee weapon damage, +12 Health.
10. Iron Lungs (st.c3.4): +5 Endurance, +10 Health.

The fist cluster supplies +19% hand-to-hand damage; melee supplies +13%. Their raw sum is +32%, while blowPct returns +30%. The damage cap is reached here. All 18 Renown Stars are spent.

*Sources: planner/tools/firmament-plan.mjs (Renown 10 output); src/net/firmament/firmamentTree.js (`st.c3.*`, `st.c5.*`, `st.c2.*`); src/net/firmament/firmamentLaw.js (BLOW_CAP, blowPct).*

#### Renown 15 — 28 Renown Stars

Add, in order:

1. Gate of the Sign (wr.g): +2% Strength, +2% Endurance.
2. Starway (wr.r1): +1% maximum Health.
3. Star (wr.c2.0): take 1% less damage from blows.
4. Star (wr.c2.1): take 1% less damage from blows.
5. Star (wr.c2.2): take 1% less damage from blows.
6. Walking Fortress (wr.c2.3): +3 armor, take 3% less damage from blows.
7. Shield Wall (wr.c2.4): take 2% less damage from blows, +10 Health.
8. Starway (wr.r2): take 1% less damage from blows.
9. Threshold (wr.k1): take 1% less damage from blows.
10. Unflagging (st.c3.6): restore 0.2% Health each round, +3 Endurance.

Totals include blowTaken -10, +3 armor, +32 Health and +7% maximum Health. All 28 Renown Stars are spent.

*Sources: planner/tools/firmament-plan.mjs (Renown 15 output); src/net/firmament/firmamentTree.js (`wr.c2.*`, `wr.r*`, wr.k1, st.c3.6); src/net/firmament/firmamentLaw.js (STAT_DEFS).*

#### Renown 20 — 38 Renown Stars

Add, in order:

1. Crossroads (th.x): carry 3% more weight. This life star uses a Renown Star.
2. Gate of the Sign (th.g): +3% Agility.
3. Star (th.c4.0): +4% weapon damage against animals.
4. Star (th.c4.1): +4% weapon damage against animals.
5. Star (th.c4.2): +4% weapon damage against animals.
6. Star (th.c4.3): +4% weapon damage against animals.
7. Beastbane (th.c4.4): +10% weapon damage against animals, +3% bow damage.
8. Star (th.c6.0): take 1% less damage from blows.
9. Hard to Pin Down (th.c6.1): take 3% less damage from blows, +2 Agility.
10. Star (th.c6.2): take 1% less damage from blows.

The animal-damage stars are path stars leading to the Thief guard cluster. Totals reach blowTaken -15; fist blow stays +30%. Renown Stars: 37 on combat, 1 on a life star; none left.

*Sources: planner/tools/firmament-plan.mjs (Renown 20 output); src/net/firmament/firmamentTree.js (th.x, `th.c4.*`, `th.c6.*`); src/net/firmament/firmamentLaw.js (blowPct, STAT_DEFS).*

#### Renown 30 — 58 Renown Stars

Add, in order:

1. Star (st.c4.0): +1% Speed.
2. Star (st.c4.1): +1% Speed.
3. Star (st.c4.2): +1% Speed.
4. Star (st.c4.3): +1% Speed.
5. Lightning Reflexes (st.c4.4): +3 Speed, 2% chance to avoid a blow.
6. Star (st.c6.0): +3% Critical Strike.
7. Fencer's Footwork (st.c6.5): +6 Dodging, 2% chance to avoid a blow.
8. Starway (th.r1): +1% bow damage.
9. Starway (th.r2): +4 Dodging.
10. Threshold (th.k1): +3% bow damage.
11. Wind Runner (th.k): 6% chance to avoid a blow, +4 Speed, -3 armor.
12. Star (wr.c3.0): +2% blunt weapon damage.
13. Star (wr.c3.6): +2% blunt weapon damage.
14. Star (wr.c3.5): +2% blunt weapon damage.
15. Crushing Blows (wr.c3.4): +6% blunt weapon damage, +6 Blunt Weapon.
16. Star (wr.c5.0): +2% maximum Health.
17. Star (wr.c5.6): +2% maximum Health.
18. Troll's Blood (wr.c5.4): restore 0.3% Health each round, +8 Health.
19. Star (wr.c5.5): +2% maximum Health.
20. Giant's Heart (wr.c5.2): +18 Health, +3 Endurance.

Totals: fist blow +30%, blowTaken -15, evade 10%, +58 Health, +13% maximum Health. Renown Stars: 57 on combat, 1 on a life star; none left.

*Sources: planner/tools/firmament-plan.mjs (Renown 30 output); src/net/firmament/firmamentTree.js (`st.c4.*`, `st.c6.*`, th.k, `wr.c3.*`, `wr.c5.*`); src/net/firmament/firmamentLaw.js (blowPct, STAT_DEFS).*

#### Renown 40 — 78 Renown Stars

Add, in order:

1. Star (th.c3.0): +3% Running.
2. Star (th.c3.6): +3% Running.
3. Star (th.c3.5): +2% Speed.
4. Quicksilver (th.c3.4): +5 Speed, +5 Running.
5. Star (th.c5.0): +3% Critical Strike.
6. Star (th.c5.6): +3% Critical Strike.
7. Star (th.c5.5): +3% Critical Strike.
8. Vital Shot (th.c5.4): +4% bow damage, +6 Critical Strike.
9. Path of the Sign (wr.s2): +3% Endurance.
10. Star (wr.c7.0): +2% Strength.
11. Star (wr.c7.4): +2% Strength.
12. The Lady's Favor (wr.c7.3): +4 Endurance, +8 Health.
13. Crossroads (sh.x): carry 3% more weight. This life star uses a Renown Star.
14. Gate of the Sign (sh.g): +2% Agility, +2% Intelligence.
15. Star (sh.c4.0): +3% Critical Strike.
16. Star (sh.c4.1): +3% Critical Strike.
17. Star (sh.c4.2): +3% Critical Strike.
18. Star (sh.c4.3): +3% Critical Strike.
19. Exploit Weakness (sh.c4.4): +8 Critical Strike, +4% damage with all weapons.
20. Leather and Luck (th.c6.3): +2 armor, +4 Luck.

Totals: fist blow +30%, blowTaken -15, evade 10%, +66 Health and +13% Health. Renown Stars: 76 on combat, 2 on a life star; none left.

*Sources: planner/tools/firmament-plan.mjs (Renown 40 output); src/net/firmament/firmamentTree.js (`th.c3.*`, `th.c5.*`, `wr.c7.*`, `sh.c4.*`, th.c6.3); src/net/firmament/firmamentLaw.js (STAT_DEFS).*

#### Renown 50 — 98 Renown Stars

Add, in order:

1. Star (wr.c4.0): +2% melee weapon damage.
2. Star (wr.c4.1): +2% melee weapon damage.
3. Star (wr.c4.2): +2% melee weapon damage.
4. Star (wr.c4.3): +2% melee weapon damage.
5. Warlord (wr.c4.4): +5% melee weapon damage, +4 Strength.
6. Star (wr.c6.0): slaying a foe restores 1% Health.
7. Reaver (wr.c6.1): +7% weapon damage while below half Health, +2 Strength.
8. Crossroads (wr.x): carry 3% more weight. This life star uses a Renown Star.
9. Gate of the Sign (rt.g): +1% Willpower, +2% Strength.
10. Star (rt.c4.0): +3% Alteration.
11. Star (rt.c4.1): +3% Alteration.
12. Star (rt.c4.2): +3% Alteration.
13. Star (rt.c4.3): +3% Alteration.
14. Stoneskin (rt.c4.4): +3 armor, +5 Alteration.
15. Star (th.c2.0): +3% Dodging.
16. Star (th.c2.1): +3% Dodging.
17. Star (th.c2.2): +3% Dodging.
18. Acrobat (th.c2.3): 2% chance to avoid a blow, +5 Dodging, +5 Jumping.
19. Star (th.c3.1): +2% Speed.
20. Second Wind (th.c3.2): restore 0.2% Health each round, +3 Endurance.

Totals: fist blow +30%, blowTaken -15, evade 10%, +66 Health, +13% maximum Health, +5 armor. Renown Stars: 95 on combat, 3 on life stars; none left.

*Sources: planner/tools/firmament-plan.mjs (Renown 50 output); src/net/firmament/firmamentTree.js (`wr.c4.*`, `wr.c6.*`, `rt.c4.*`, `th.c2.*`, `th.c3.*`); src/net/firmament/firmamentLaw.js (blowPct, STAT_DEFS, starsFor, fits).*

### Steed's Charge comparison

The valid Renown 50 trees both produce a +30% fist blow. Without Steed's Charge and its st.c1.* Long Blade cluster, the modeled tree has blowTaken -15, evade 10%, +66 Health and +13% Health; its weighted score is 3779.6. The Charge tree has blowTaken -12 with the same evade and Health; its score is 3670.2. That tree gains Steed's Charge (+9% melee damage, +3 Speed, take 5% more damage from blows), but its melee damage adds nothing after the shared blow cap. The no-Charge plan scores higher and keeps the blowTaken channel at its -15 cap. Both comparison trees include st.r2 because the live graph requires it to reach the fist cluster.

These scores compare the planner's weights. They are not an official game formula.

*Sources: planner/tools/firmament-plan.mjs (steedComparison); src/net/firmament/firmamentTree.js (st.k, st.r2, `st.c1.*`); src/net/firmament/firmamentLaw.js (blowPct, STAT_DEFS).*
### Life-ring plan

Herbalism, Mining, Smithing and Provisioning at rank 100 each yield 50 Craft points. The planner modelled the full 50 as if available from the start, so it could lay out the whole route; in play you earn them slowly as your profession ranks rise (1 per 8 ranks), so buy this route's stars in order as each point arrives. Three Renown Stars also go to life stars, at Renown 20, 40 and 50. The life-route priorities are the four professions first, then carry weight and travel Fatigue. Other route stars are connections or incidental benefits.

At Renown 50 the plan has 53 life stars: 50 Craft-funded and 3 Renown-funded. Totals are +34% Herbalism experience and +26% yield, +12% Mining experience and +19% yield, +30% Smithing experience, +34% Provisioning experience, carry 25% more weight and 21% less travel Fatigue. Nothing remains unspent.

*Sources: planner/tools/firmament-plan.mjs (craftRanks, life scoring, printPlan); src/net/firmament/firmamentTree.js (life nodes); src/net/firmament/firmamentLaw.js (craftPointsFor, pointsLeft, treeFault, fits).*
### Rerun the planner

From the workspace root, run:

```powershell
$env:DFO_SRC = 'C:\path\to\daggerfall-js-source\src'
node planner/tools/firmament-plan.mjs
```

If `DFO_SRC` is unset, the script uses `upstream/daggerfall-js-source/src` relative to this workspace. It imports `firmamentTree.js` and `firmamentLaw.js` directly, prints every selected star in allocation order with its gains and running channel totals, checks each plan with `treeFault` and `fits`, and throws if any milestone breaks the superset rule. Adjust `weights`, `attrBase`, `skillBase` or `rankAssumption` in the script to model a different priority or profession target.

*Sources: `planner/tools/firmament-plan.mjs`; `src/net/firmament/firmamentTree.js`; `src/net/firmament/firmamentLaw.js`.*
