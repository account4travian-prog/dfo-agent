# Companions

*Studied 2026-10-21 at DFO Online commit `4bba28c6c` (2026-10-20). For Tiger Fist, your level-7 Khajiit hand-to-hand fighter. This describes the supplied code, not a live inspection of your character. Source paths below are inside `upstream/daggerfall-js-source/`.*

**Keep your first companion beside you for now.** It fights, earns its own star points, and grows more loyal through winning fights with you. Check its **Art** before choosing stars: some companions can heal you or raise your Strength without you casting a spell. Missions are a small timed reward system. Online, they do not run while you are logged off.

Open the enhanced pause menu, **Holdings → Companions**. Its card has **Call / Send away**, **Gear**, **Mission**, **Stars**, and **Release**. Holdings → **Revenants** describes the rivals still hunting you. For the wider online plan and recent changes, use [The Play Guide](23-playing-online.md) and [What's New Since 17 October](24-whats-new-2026-10.md).

*Sources: `src/ui/companionRoster.js` companionPageShown, row and its action handlers; `src/systems/revenant/revenantCompanions.js` swornFightWon, sendOnErrand; `src/systems/revenant/revenantErrands.js` errandStep; `src/systems/revenant/revenantArts.js` swornMendStep, swornArtStep. The opening recommendation is advice from those rules.*

## Where your companion came from

A revenant is a particular enemy the game remembers. A **sworn revenant** is one you defeated and chose to **Spare**. It is not an undead class you bought or a random companion assigned at login. I cannot reconstruct your particular companion's past without its record. The Revenants page shows remembered deeds.

The current life cycle is:

1. **A special enemy carries the Unquiet mark.** One in four eligible elites or champions is marked. Its title starts with **Unquiet**. Online, new revenants require **Renown 10**, which is separate from your character level. The enemy must be at least level **3**. Ordinary enemies, allies, the watch, quest foes, summoned foes, another player's puppets, warband followers, Arena fighters and Open Zone foes cannot become your new revenants.
2. **It survives a consequential fight with you.** A marked foe can become one by killing you, fleeing successfully, felling a companion, or routing you. Routing has a specific test: it recently hurt you, you fell below half health during that fight, and then you get **70 m** away or teleport out. Simply walking through a door is not that test.
3. **Flight is a major source.** A marked newcomer gets one **50%** flee roll below **35% health**. It runs for **8 seconds**, at **2.5 times** its walk speed. It escapes beyond **45 m**, or when its run ends more than **12 m** from you. Otherwise it is cornered and fights on. In shared dungeons this applies to foes owned separately by you, not the room's shared layout foes.
4. **It gets a name and returns.** It starts at rank I and normally becomes due after **2–4 days of your character's clock**. Brutal, Zealous and Unhinged revenants have the Vengeance ambition: **1–2 days**, then **55%** of eligible encounter rolls rather than the usual **40%**. These are encounter chances after it is due, not a guaranteed appointment. At most **three** hunt you; no new one is born while that limit is full. The Dread is counted separately.
5. **Surviving raises its rank, up to V.** A successful ordinary escape, slipping away from your judgement, or routing you raises an existing revenant each time. A killing-blow escape caused by unbroken will raises it only every **second** time. Killing you or felling a companion also raises it only every **second** time. A rank increase clears both partial counts. Your death is not required to develop a rival.
6. **Beat it, then choose Spare.** The final blow leaves your own revenant kneeling at **1 health**. Activate it to open **Kill / Spare**, select Spare, and confirm. It becomes sworn. It joins your side if a companion slot is open; otherwise it waits Away. With six already sworn, you must release one before sparing another. Left kneeling for over **90 seconds** of running world time, or left more than **60 m** away, it slips away. The judgement window itself holds that wait.

"Unquiet" means eligible to become a remembered rival. **Rank I–V** measures that rival's history and strength. Neither is the companion's separate **level 1–20** used for stars.

A hostile revenant that kills you online can also take **one eligible item** at respawn: your equipped weapon or a draw from the pack's **five most valuable** eligible pieces. It keeps at most **three** stolen items. Gold, letters of credit, locked pieces, quest items, summoned items, the Materials Bag, horses, carts and deeds are among the refusals. **Binding alone is not an exclusion in this theft function; locking is.** Sparing it returns what it took; executing it leaves the items in its pile. This theft is a hostile rival's rule, not something a loyal companion does when you fall.

*Sources: `src/systems/revenant/unquietMark.js` UNQUIET_MARK, markUnquiet, isUnquiet; `src/systems/revenant/revenant.js` REVENANT_MIN_RENOWN, REVENANT_MIN_LEVEL, REVENANT_MAX, revenantCandidate, revenantDeed, revenantFleeStep, dueFrom, revenantToReturn, revenantRoutable, revenantSpared, revenantTakes, pickTaken, revenantMayTake; `src/systems/revenant/revenantFeud.js` ROUT, TOOK_MAX; `src/systems/revenant/revenantUnquiet.js` BLOOD_RANK, TEAR_RANK, deedRanks, AMBITION; `src/systems/revenant/revenantFate.js` beginYield, yieldStep, beginSpare, finishExecution, REVENANT_YIELD_MS, REVENANT_YIELD_REACH.*

### Why a higher-rank one may not kneel immediately

From **rank II**, break its will during that encounter: hit its weakness, stagger it **once**, or perfectly dodge **one** of its blows. Otherwise the killing blow makes it tear away. Tiger Fist can use the stagger or dodge routes without magic or a different weapon.

A rank-I revenant gets an **80%** flee roll below **35% health**. From rank II, it gets a **35%** roll below **20% health**, alongside its will and flight craft. The roll is made once per encounter, not on every hit.

From rank III, it also has a last stand. The first killing blow restores **30% / 35% / 40%** health at ranks III / IV / V. It roars, cannot be hurt for **1.2 seconds**, then fights in a stronger second phase. You still have to finish that fight. Its rank-II signature and flight craft add further obstacles:

| Flight craft | Who uses it | Your answer |
|---|---|---|
| Smoke | other human class enemies | It uses Chameleon and runs. You can still hit it. |
| Blink | caster classes, spirits, liches, nymphs, orc shamans, daedra and atronachs | After **0.8 s** it begins a **0.6 s** fade. Silence or hold it before the rift opens, or hit it during the fade to make it run instead. |
| Sink | skeletons, zombies, mummies, vampires and spriggans | Hit during its **0.2 + 1.4 s** sinking sequence. It rises cornered. Its will can still make it tear away later. |
| Bolt | other kinds | Runs at **2.5 times** its walk speed. Chase or bring it down from range. |

The rival remembers your fighting habits and can learn up to **three adaptations**, limited by rank. A fist-dominated fight can teach **Unflinching**, resistance to hand-to-hand damage. Escaping after a fist or blunt hit leaves **Cracked**, reducing its poise to **70%**. An open-world escape can reveal a nearby lair and leave a **12-hour** trail: catch it there while warm and it starts at **60% health**. These hours are on your character's clock. Its oldest wound heals after **five days** left alone; a new wound restarts the count. Mastery rivals also train against remembered habits. Read its Revenants card before the rematch.

An ignored rival also festers: normally a wrath **three days past its due day**, then every **three days**. Mastery uses **two days**, then every **two**. At **three wraths** it gains a rank, up to V. Each stored wrath adds **10% health and 5% damage** at its next stand, then is cleared. These days do not pass while you are logged off. This is another way hostile ranks grow; a sworn companion does not fester.

*Sources: `src/systems/revenant/revenantFeud.js` WILL_RANK, WILL_STAGGERS, willBroken, LAST_STAND_HEALTH, LAST_STAND_ROAR, ADAPT_MAX, lessonOf, FESTER, WRATH_MAX; `src/systems/revenant/revenantFate.js` beginLastStand, beginTearAway; `src/systems/revenant/revenantUnquiet.js` CRAFT, fleeCraftOf, craftStep, WOUND, HUNT, trainLesson, AMBITION; `src/systems/revenant/revenant.js` rollRevenantFlee, revenantFleeHealth, revenantFleeStep, revenantDeed, applyRevenant, revenantFester. Design history: `bible/06-Systems/Revenants.md` §§17–23, 46–49; `bible/12-Enhanced-AI/Feud-Arc.md` Part B and built records. Older rank-III will and earlier flight figures there are superseded by the code.*

## What a sworn companion does

It follows you and fights hostile enemies. It uses the same companion layer as ship crew, but you do not need a ship. It follows your route through doors and uses portals to catch up if left over **40 m** behind, or over **6 m** above or below you while you stand on the ground. Your own normal attack routes protect companions from friendly fire. Activate its body to open its storage pack; **Gear** on its card controls what it actually wears.

There is no single health or damage number for every companion. Its species or class, normal equipment, rank, stars and loyalty matter. Three different levels must be kept apart:

| Number | What it controls |
|---|---|
| Your effective character level | A human/class companion's newly built body uses this, including party mentor scaling. Monster companions use their kind's level and health range. |
| Its original revenant rank | Multiplies sworn health and ordinary blows; sets equipment caps, art strength, errand strength and starting star points. |
| Its companion level | Comes from companion XP. Gives star points. The body builder does **not** use this level as its combat level. |

| Original rank | Sworn health multiplier | Sworn ordinary damage multiplier | Starting star points |
|---|---|---|---|
| I | ×1.25 | ×1.10 | 0 |
| II | ×1.50 | ×1.20 | 1 |
| III | ×1.75 | ×1.30 | 2 |
| IV | ×2.00 | ×1.40 | 3 |
| V | ×2.25 | ×1.50 | 4 |

Those are before stars and Devoted loyalty. Stars multiply over the rank bonus. Health is carried between bodies and locations; the code does not freshly roll and increase its saved maximum health at every door or player level-up. Changing health stars rescales both current and maximum health proportionally. It is not a free full heal.

**Its hostile strength is different.** A hunting revenant gets **+40% health and +15% damage per rank**, and a class rival is built at your effective level **+3 per rank**. A sworn one uses the gentler table above. Companion XP does not promote its original rank. I found no normal sworn rank-up or upgrade into the Dread.

*Sources: `src/scenes/crewAshore.js` createCrewAshore, CATCH_UP_M, CATCH_UP_DY; `src/scenes/world.js` companionPlace, openSwornPack, revenantAshore onStood; `src/combat/friendlyFire.js` isShipmate, sparedByPlayer; `src/characters/enemy/enemyEntity.js` makeEnemyEntity; `src/scenes/exteriorFoes.js` spawnFoe; `src/scenes/dungeonContext.js` buildFoeAt; `src/systems/revenant/revenantCompanions.js` applySwornStrength, SWORN_HEALTH_PER_RANK, SWORN_DAMAGE_PER_RANK, setSwornStars; `src/systems/revenant/revenant.js` revenantSpawnOptions, revenantDeed.*

### Arts: what it can do for Tiger Fist

**35%** of revenants are born with an art. The art is fixed by identity and kind, not chosen when you recruit it. A sworn art works at any rank. The Stars window also tells you what **Awakened Art would teach** one born without an art. That result is fixed too. Taking the star back removes the taught art; buying it again does not reroll it.

| Art | Base sworn effect, before Grave stars |
|---|---|
| Mending | When damage leaves you alive below **40% health**, heals **12% + 2% per rank** of your maximum health: **14–22%**. Cooldown **120 s**. Across all your Menders, at least half the triggering Mender's cooldown must pass before another Mending. |
| Ward | As it enters a fight, gives you a Shield worth **6 + 3 per rank** points for **6 magic rounds**. Cooldown **90 s**. |
| War Cry | As it enters a fight, gives you **4 + 2 per rank Strength** for **6 magic rounds**. Cooldown **90 s**. |
| Siphon | Periodically damages its target and heals you for **one quarter of the calculated strike amount**. |
| Barrage | Periodic single-target strike at **1.5 times** the base art damage. |
| Nova | Periodic strike against each eligible hostile within **5 m**, at **0.8 times** the base art damage. |

For the three attack arts, base art damage is **4.5 + your character level**, multiplied by **0.5 + 0.1 per rank**, then by the art's multiplier and Grave strength. The code rounds the strike. They begin after **3–6 s** of a fight and repeat every **16–22 s** before cooldown stars. Single-target strikes need the enemy within **12 m**, in sight and reachable through your own damage door. Nova has its shorter radius. These art kills count as your harm and can earn your normal kill rewards; errands do not use that combat route.

A taught art has **75%** of a born art's weight. Grave stars increase that weight and shorten cooldowns. They do not shorten the first strike's wait. Mending needs a standing companion and a surviving player: it cannot rescue an outright killing blow.

**My preference for Tiger Fist:** Mending for emergency healing, or War Cry for Strength. Ward is useful protection; Siphon supplies smaller periodic healing while attacking. Your lack of magicka does not prevent these companion effects. Keep your own potions: no art is constant healing, a cure-all or a resurrection.

*Sources: `src/systems/revenant/revenantArts.js` ARTS_CHANCE, ART_POOL, ART_LAW, drawArt, taughtArt, artOf, swornArtNumbers, artMagnitude, swornArtStep, swornMendStep; `src/systems/revenant/revenantFeud.js` SIG.PYRE_BASE, SIG.PYRE_PER; `src/systems/playerHeal.js` healMine; `src/ui/revenantStarsWindow.js` rvnArtNote. Siphon's sworn code heals from its calculated `n`; it does not measure actual health removed as the hostile Siphon does. The preference is advice.*

## Loyalty: keep winning together

Loyalty runs from **0–100**. It starts from personality:

| Personality | Starting loyalty | Personality | Starting loyalty |
|---|---|---|---|
| Honourable | 80 | Weary | 70 |
| Humorous | 65 | Cold | 65 |
| Witty | 60 | Zealous | 60 |
| Arrogant | 55 | Brutal | 55 |
| Craven | 45 | Unhinged | 40 |

| Event | Base change |
|---|---|
| Wins a fight at your side | +3 |
| A character day With you / Away | +2 / −1 |
| Called after recovering from a combat knockout | +10, once; reduced in proportion to any rest-shortening stars |
| Knocked out | −8 |
| You send it away again on the same character day | −10 for each repeated sending that day |
| You execute a revenant of its kind or faction while its living body is beside you | −15 |
| Successful errand | +4, once per errand |
| A day Resting or on an Errand | No daily loyalty change |

A fight won means it took a live target and later has none, with its last target dead. A target that fled or was removed does not count. It need not deliver the final blow. Road loyalty stars reduce **losses**, not gains; fractional losses carry forward rather than disappearing through rounding.

**Devoted: 90–100. Loyal: 50–89. Wavering: 20–49. Restless: below 20.** Devoted adds **×1.10 ordinary damage**, warns about a wind-up behind you, and adds **5 percentage points** to errand success odds.

Below **20**, it has a **15% daily desertion roll**, after that day's loyalty movement. Resting does not protect it from this roll; being abroad does. A deserter becomes a hostile **Oathbreaker**, at its existing rank. Below **10**, a Brutal, Craven or Unhinged one can instead become the **Betrayer** when damage leaves you alive below **25% health**. It turns where it stands and gains a rank, capped at V. Other personalities never use that betrayal rule. The online Renown gate holds betrayal while hostile revenants are held.

On either departure, it keeps the most valuable half of eligible items from its pack **and given equipment**, rounding the count up, but at most the remaining room in its **three-item** stolen-item allowance. The rest, protected items and its gold return to you. Recover its retained items by defeating, executing or sparing it again. Its companion XP and stars are lost with the old oath. Merely logging off causes no daily loyalty loss: these days use your character's clock.

*Sources: `src/systems/revenant/revenantFeud.js` LOYALTY_START, LOYALTY, LOYALTY_LABELS, DEVOTED, DESERT, BETRAY, sameKin, deserterSplit, TOOK_MAX; `src/systems/revenant/revenantCompanions.js` swornFightStep, swornFightWon, callRevenant, sendRevenantAway, swornWitness, betrayalStep; `src/systems/revenant/revenantStars.js` rvnLoyaltyMove; `src/systems/revenant/revenant.js` revenantFester, revenantDeserts, splitPack, revenantBetrays; `src/systems/worldTick.js` ownMinutes.*

## Equipment, falls and where it follows

### Give it useful spare gear

An eligible armed kind can wear **ten given pieces**: melee weapon, shield, helm, two pauldrons, cuirass, gauntlets, greaves, boots and one jewellery **charm**. Human classes, the equipment-table orcs and centaur use the armed route. Other kinds get the charm only. The Gear sheet shows the actual slots it can use. Bows cannot be given as weapons; archery is a property of the creature's kind, not taught by handing it a bow.

| Original rank | Highest weapon / plate metal | Highest rarity |
|---|---|---|
| I | Silver | Magic |
| II | Dwarven | Rare |
| III | Adamantium | Rare |
| IV | Orcish | Legendary |
| V | Daedric | Legendary |

A shield requires a whole, given one-handed weapon. A two-hander is refused while a shield is given. Taking the weapon back also returns the shield. Artifacts, Aetheric and Gilded gear, quest items, summoned items and broken pieces are refused. You cannot give something you are wearing.

Given pieces replace its rolled equipment in those slots. They **wear down and can break**. Take broken pieces back for repair. Rarity stat lines count; equip-time spells and player-only Legendary powers do not. Tiger Fist's forbidden Steel, Elven and Dwarven materials are not checks in the companion's gear refusal: an eligible companion can use them within its own rank cap. Do not equip them on Tiger Fist.

*Sources: `src/systems/revenant/revenantGear.js` GEAR_SLOTS, GEAR, armedKind, gearKeyOf, gearRefusal, wornGear, applySwornGear; `src/combat/enemyEquipment.js` equipmentVariantFor, enemyArmorValues; `src/systems/revenant/revenantCompanions.js` giftablePieces, giveSwornGear, takeSwornGear; `src/systems/equip.js` lowerCondition. Tiger Fist's restrictions: [The Strongest Melee Build](05-strongest-melee.md).*

### Death, travel and limits

| Situation | What the code does |
|---|---|
| Companion reaches its knockout floor | It is carried off through a portal, loses loyalty, and rests **480 character minutes: 8 character hours**, normally **40 real minutes of play online**, before waiting Away. **Call** it again after recovery. Rest stars shorten this. |
| You die normally | Your companion is not automatically killed or released. The layer handles the respawn as a change of place and brings the surviving party along, carrying health. A companion already knocked out still has its rest. Normal player death costs are in [The Play Guide](23-playing-online.md). |
| Log off | Its state, health, pack, equipment, XP and stars are saved with the character. No companion body stays online fighting for you. Your clock and online errand progress stop. Active spell effects carried between doors are not saved across a load. |
| Ordinary dungeon, private quest instance or building | It follows through the same layer. There is no general ban on companions in private instances. |
| Burning Court, Shattered Hour or Spire | The made-level rule explicitly keeps companions **outside**. Bodies return when you leave. These exceptions are not the rule for all instances. |
| Player duel | I found no duel-specific companion dismissal in the placement layer. Companion targeting excludes players, including peers. Do not count it as a fighter against your opponent. Duel vitality is held separately by the referee; Mending's ordinary-health hook is not a way to heal that bar. |
| Arena bout | The normal dungeon placement route has no separate Arena dismissal here. The bout-target rule excludes outsiders: a companion is not an extra bout fighter. This is different from the Burning Court's explicit ban. |
| Open Zone | Only **one sworn revenant** stands beside you, the first eligible With entry in record order. Other With entries wait outside. Its pack **and given equipment** are included in your death drop under the zone's item rules. No new revenants are made there. |

The Open Zone also blocks **Send away** and **Mission** for the sworn one at your side. You cannot give your items to one waiting outside the zone. If the one beside you is knocked out there, it hands its pack and given gear to you before leaving, rather than carrying them safely out. The release code still returns its things and ends its oath; it is not a temporary send-away command. See [The Play Guide](23-playing-online.md) for why this zone is a poor first-companion test.

You may keep **six sworn revenants** in total. Normally **three companions** can walk with you, shared with ship crew ashore. A newly spared revenant waits Away when those slots are full. **Send away** is reversible. **Release**, confirmed twice in the roster, ends the oath for good and returns its pack and given gear, with gold to your purse. Abroad, recall it before release.

A knockout rest uses the character clock, including raised time. **Errands deliberately use a stricter clock**, so the rest rule does not mean sleeping can finish a mission.

*Sources: `src/systems/revenant/revenantCompanions.js` REVENANT_RETINUE_MAX, REVENANT_REST_MIN, revenantParty wake/knock, restUntil, swornAtYourSide, callRefusal, leaveRefusal, leftWithYou, releaseRevenant; `src/systems/companionSlots.js` COMPANION_SLOTS; `src/scenes/crewAshore.js` createCrewAshore, carried effects; `src/scenes/world.js` companionPlace, clearSworn; `src/systems/madeLevel.js` MADE_LEVEL_RULES; `src/characters/enemy/enemyTargets.js` getTargets, boutGate; `src/net/duel/duelBar.js` duelVitality; `src/net/wire.js` ONLINE_MINUTES_PER_MS; `src/systems/wild/wildLeaf.js` WILD_REVENANTS_MAX, wildSwornAtSide; `src/systems/wild/wildDropLaw.js` wildPacks, takeWildDeath; `server-account/src/wild.js` wildFall and COMPANION-DROP; `src/systems/revenant/revenant.js` sanitizeCompanion, ensureMirror.*

## Stars: its own small sky

There are **30 purchasable stars around the free starting star, The Oath**, ten in each aspect: **Blade**, **Grave**, **Road**. Each costs **one point**, including notables and keystones. Buying a distant star through the UI costs all missing stars along the chosen path too. You get **one point per companion level after 1**, plus **one per original rank after I**:

**Points = companion level − 1 + original rank − 1.** The companion level cap is **20**. That means **19 points** for rank I, or **23** for rank V. You cannot buy the whole sky.

Every held star must connect back to the Oath through held stars. The paths below list stars outwards. Cross-links also join **Iron Sinew ↔ Relentless ↔ Dark Focus**, **Swift Rite ↔ Far-Walker ↔ Oathbound ↔ Iron Sinew**, and **Dark Focus ↔ Awakened Art ↔ Swift Rite**. These let you enter a branch sideways.

Refunds are **free whenever it is not abroad**, including while Away or Resting. Taking back a connecting star also refunds any stars that lose their only connection to the Oath. Right-click or hold a star to take it back; press **Accept** to apply the pending sky. These points belong to the companion, not your Renown Firmament. This is its own tree in the shared sky window, not the player's Firmament tree.

*Sources: `src/systems/revenant/revenantStars.js` RVN_STARS, RVN_STAR_CROSS, RVN_STAR_EDGES, rvnStarPoints, RVN_LEVEL_MAX, rvnHeldStars, rvnTakesBack; `src/systems/revenant/revenantCompanions.js` swornStarsRefusal, setSwornStars; `src/ui/revenantStarsWindow.js` mountRevenantStarsWindow; `src/ui/skyWindow.js` mountSkyWindow.*

### Every Blade star

Bonuses below add within a stat, then multiply the companion's rank-scaled body. "Damage" means its ordinary blows; art strength is separate.

| Path | Star, in outward order | Effect |
|---|---|---|
| Flesh | Grave-Cold Flesh | +5% health |
| Flesh | Knitting Bones | +5% health |
| Flesh | Iron Sinew | +10% health |
| Flesh | Hollow Heart | +5% health |
| Flesh | Deathless | +25% health; −10% damage |
| Fury | Old Grudge | +4% damage |
| Fury | Remembered Wounds | +4% damage |
| Fury | Relentless | +8% damage |
| Fury | Killing Edge | +4% damage |
| Fury | Bloodrage | +20% damage; −10% health |

All ten together give **+40% health, +30% damage**. Deathless's full path alone gives **+50% health, −10% damage**; Bloodrage's gives **+40% damage, −10% health**.

*Sources: `src/systems/revenant/revenantStars.js` RVN_STARS, rvnStarStats, RVN_STAR_MOST; `src/ui/revenantStarsWindow.js` NAMES; `src/systems/revenant/revenantCompanions.js` applySwornStrength.*

### Every Grave star

| Path | Star, in outward order | Effect |
|---|---|---|
| Power | Grave Whisper | +5% art strength |
| Power | Cold Breath | +5% art strength |
| Power | Dark Focus | +10% art strength |
| Power | Deep Well | +5% art strength |
| Power | Grave Pact | +15% art strength; −10% health |
| Rite | Quick Hands | Art cooldowns 5% shorter |
| Rite | Short Breath | Art cooldowns 5% shorter |
| Rite | Swift Rite | Art cooldowns 10% shorter |
| Rite | Ready Word | Art cooldowns 5% shorter |
| Between Dark Focus and Swift Rite | Awakened Art | Teaches the fixed art shown in the window if it has no born art, at 75% weight. Does not replace or improve a born art. |

The maximum is **+40% art strength and 25% shorter cooldowns**. Grave Pact's health cost still applies. A born rank-V Mender at those maxima heals **30.8%** per trigger every **90 s**; the side-wide gap is **45 s**. A taught Mender's strength is three quarters of that. These are formula results, not a promise that every cooldown finds you hurt enough to trigger it.

*Sources: `src/systems/revenant/revenantStars.js` RVN_STARS, RVN_STAR_MOST; `src/ui/revenantStarsWindow.js` NAMES; `src/systems/revenant/revenantArts.js` swornArtNumbers, swornMendStep, ART_LAW.*

### Every Road star

"Odds" below means **percentage points** added to the errand success formula, before its cap. Haul means gold and materials, **not gear count or rarity**.

| Path | Star, in outward order | Effect |
|---|---|---|
| Road | Road-Wise | +3 percentage points success odds |
| Road | Deep Pockets | +5% haul |
| Road | Far-Walker | Missions 15% shorter; +2 percentage points success odds |
| Road | Keen Eye | +5% haul |
| Road | Fortune's Road | +30% haul; a hard-won return brings back **nothing** |
| Oath | Bound Word | Loyalty losses 10% smaller |
| Oath | Quick to Mend | Knockout / hard-road / recall rests 10% shorter |
| Oath | Oathbound | Loyalty losses 20% smaller |
| Oath | Tireless | Rests 10% shorter |
| Oath | Undying Vigil | Rests 30% shorter; loyalty losses 20% smaller; missions 10% longer |

The full Road gives **+5 percentage points odds, +40% haul, 50% smaller loyalty losses and 50% shorter rests**. Far-Walker and Undying Vigil together give missions only **5% shorter**, because their time modifiers add. Without the Vigil, Far-Walker gives the full **15%** reduction.

*Sources: `src/systems/revenant/revenantStars.js` RVN_STARS, rvnStarStats, rvnRestMinutes, rvnLoyaltyMove; `src/ui/revenantStarsWindow.js` NAMES, rvnStarStatWords; `src/systems/revenant/revenantErrands.js` errandPower, errandOdds, errandMinutes, errandHaul.*

### Earning companion levels

A won fight gives **5 + enemy level XP**, counting enemy level at most **30**: **6–35 XP**. Its level starts at cumulative XP **round(75 × (level − 1)^1.7)**. Examples: level 2 at **75**, level 5 at **792**, level 10 at **3,142**, level 15 at **6,660**, level 20 at **11,193**.

Errands give **floor(15 × province days × (1 − road modifier) × danger)** XP on success, half before flooring on a hard road. They award XP only if the companion was **below level 10 when it returned**. That final award can cross the level-10 threshold; subsequent errands give none. XP and successful-errand loyalty are credited once per recorded errand seed. These rewards are companion XP, not character XP or Renown.

*Sources: `src/systems/revenant/revenantStars.js` RVN_XP, rvnXpWon, rvnXpErrand, rvnXpForLevel, rvnLevelOf, RVN_XP_MOST; `src/systems/revenant/revenantCompanions.js` swornFightStep, swornFightWon, returnFromErrand; `src/systems/revenant/revenant.js` PAID_KEEP.*

## A star plan for Tiger Fist's companion

This is my recommended **combat partner** plan, not a claim about your companion's present stars. Start with its health, then ordinary damage, then improve its art. It stays useful beside a fighter while you learn how often it falls. The two Blade keystones eventually offset much of each other's drawback.

The levels below assume **original rank I**, which has no starting bonus points. For rank II–V, use the same purchase order earlier: each extra original rank supplies one of these purchases at level 1. Your character being level 7 does not make the companion level 7.

| Companion level | Purchases in this order | Reason |
|---|---|---|
| 1 | Free Oath | No earned points yet at rank I. |
| 2–4 | Grave-Cold Flesh → Knitting Bones → Iron Sinew | +20% health and a useful cross-link. |
| 5–8 | Relentless → Killing Edge → Remembered Wounds → Old Grudge | Enter through Iron Sinew's cross-link. +20% ordinary damage without a health penalty. |
| 9 | Hollow Heart | Health reaches +25%. |
| 10 | Deathless | Health reaches +50%; ordinary damage falls to +10%. A safer intermediate step. |
| 11 | Bloodrage | Full Blade: +40% health and +30% ordinary damage. |
| 12–15, with a born art | Dark Focus → Deep Well → Cold Breath → Grave Whisper | Enter Dark Focus from Relentless. +25% art strength. |
| 16–19, with a born art | Quick Hands → Short Breath → Swift Rite → Ready Word | Art cooldowns 25% shorter. |
| 20, with a born art | Grave Pact if it survives comfortably | Final +30% health, +30% ordinary damage, +40% art strength, 25% shorter cooldowns. Keep the point elsewhere if the health cost hurts. |
| 12–17, without a born art | Dark Focus → Awakened Art → Swift Rite → Ready Word → Short Breath → Quick Hands | Awakens its fixed art, then reaches 25% shorter cooldowns through the cross-link. |
| 18–20, without a born art | Deep Well → Cold Breath → Grave Whisper | Final +40% health, +30% ordinary damage, +25% art strength, 25% shorter cooldowns and the taught art. |

**Move healing earlier if the preview says Mending.** At four points, a free respec can buy **Grave Whisper → Cold Breath → Dark Focus → Awakened Art**. That is level **5** for a rank-I companion, or immediately at level 1 for rank V. A born Mender needs no awakening: after the first three health stars, prioritise the Rite's cooldown path, then Dark Focus through Relentless. War Cry is another reason to bring Grave forward. If a companion has no art and you have not bought Awakened Art, Grave strength and cooldown stars give no immediate art benefit.

Original-rank bonus points can finish the omitted Grave star on the taught-art plan, or buy **Bound Word** and connected loyalty/rest stars. Do not buy Awakened Art for a born-art companion. Refund a branch freely if repeated knockouts show it needs more health or shorter rests. Keep it Devoted through shared wins; that adds damage without spending a star.

*Sources (legal paths and totals): `src/systems/revenant/revenantStars.js` RVN_STARS, RVN_STAR_EDGES, rvnHeldStars, rvnStarPoints, rvnStarStats; `src/systems/revenant/revenantArts.js` artOf, swornArtNumbers; `src/ui/revenantStarsWindow.js` rvnArtNote. Purchase priorities are advice, not a tested combat optimum.*

### Alternative: an errand companion

At rank I, buy **Road-Wise** at level 2, **Deep Pockets** at 3, **Far-Walker** at 4 and **Keen Eye** at 5. This gives **+5 percentage points success, +10% gold/materials and 15% shorter missions** for four points. It does not improve a fighting partner's ordinary blows.

At level 6, consider **Fortune's Road** only when the displayed odds justify risking an empty return. It adds haul, not better gear. On poor odds, keep the half haul instead. Extra points can enter **Oathbound** directly from Far-Walker, then go to **Quick to Mend**, **Bound Word** and **Tireless**. Undying Vigil reaches the largest rest reduction, but lengthens missions: I would leave it off a companion whose main job is fast errands. The exact level is earlier for a higher original rank, as above.

Its gear and original rank matter to success; its companion level itself does not enter the odds formula. Loyalty freezes while abroad, so loyalty-loss stars mostly help between missions. Put useful spare gear on it before sending it.

*Sources: `src/systems/revenant/revenantStars.js` RVN_STARS, RVN_STAR_CROSS; `src/systems/revenant/revenantErrands.js` errandPower, errandOdds, errandHaul; `src/systems/revenant/revenantCompanions.js` errandRefusal; `src/systems/revenant/revenant.js` revenantFester. This is an alternative recommendation.*

## Missions: what errands actually pay

Choose **Mission**, then a venture and province. Each venture uses the province's same duration and danger. The named city is drawn for the errand; it does not give a separate city reward table.

| Venture | Gold multiplier | Materials multiplier | Gear on a full success |
|---|---|---|---|
| Plunder | ×0.40 | ×0.35 | One piece per day of the actual road |
| Forage | ×0.15 | ×1 | 20% chance of one piece per errand |
| Sell-sword | ×1 | None | 25% chance of one piece per errand |

| Province | Character days | Active online play, before stars | Danger | Possible materials |
|---|---|---|---|---|
| High Rock | 1 | 2 hours | I | Oak logs, iron, steel ingots, wool, bear hide, jade |
| Hammerfell | 1 | 2 hours | II | Copper, sulphur, amber, scorpion hide, linen, gold material |
| Imperial Province | 2 | 4 hours | II | Silver, gold material, silk, cherry logs, emerald, steel ingots |
| Skyrim | 2 | 4 hours | III | Iron, orichalcum ore, bear hide, tiger hide, pine logs, sapphire |
| Valenwood | 2 | 4 hours | III | Spider hide, heartwood, venom, bat hide, resin, jade |
| Sumurset Isle | 3 | 6 hours | III | Moonstone ore/ingots, pearl, malachite, silk, mithril ingots |
| Elsweyr | 3 | 6 hours | III | Silk, amber, tiger hide, gold material, turquoise, tooth |
| Morrowind | 3 | 6 hours | IV | Ebony ore, dwarven ore/ingots, dreugh hide, diamond, silk |
| Black Marsh | 4 | 8 hours | V | Slaughterfish hide, venom, stinger, resin, ghostwood logs, pearl |

"Gold material" is the crafting good, separate from coin. Online a character day is **two real hours** at the clock's **12 game minutes per real minute**. Mission progress counts only time lived with the running world. Logoff, hidden-tab gaps, and accelerated rest, waiting or travel do not complete it. Far-Walker alone cuts these durations by **15%**: the two-hour route takes **102 minutes** of active play. Do not send your only fighting partner away expecting it back when you log in tomorrow.

*Sources: `src/systems/revenant/revenantErrands.js` VENTURES, ERRAND_PLACES, newErrand, errandMinutes, errandStep; `src/systems/revenant/revenantCompanions.js` chargeErrands; `src/net/wire.js` ONLINE_MINUTES_PER_MS; `src/ui/companionRoster.js` errandSheet and abroadLived text. Real durations are conversions of those constants.*

### Odds, rewards and risks

**Success odds = clamp(55% + 10 percentage points × (rank + gear power + Road odds strength − danger) + Devoted bonus, 30%, 95%).**

Each usable given gear piece adds **0.05** power, plus **0 / 0.10 / 0.20 / 0.35** for Common / Magic / Rare / Legendary. Total gear power caps at **2**, worth at most **20 percentage points**. Road-Wise adds **0.3 power** and Far-Walker **0.2**, worth **3 and 2 percentage points**, not 30% and 20%. Devoted adds **5 percentage points**. The UI calls odds Good from **75%**, Fair from **50%**, otherwise Grim.

For example, a bare rank-I companion with no Road stars or Devoted bonus has **55%** success in High Rock, **45%** in Hammerfell, and the **30% floor** in Black Marsh. Black Marsh is not a good default just because it sounds prestigious.

| Result | What happens |
|---|---|
| Success | Full haul, +4 loyalty once, companion waits Away for your Call. |
| Hard-won | Half haul and an **8-character-hour** rest, shortened by rest stars. A single gear piece is retained because halves round up. No successful-errand loyalty bonus and no post-knockout Call bonus. |
| Hard-won with Fortune's Road | No gold, materials or gear. It still rests. The companion-XP calculation still uses the hard-road half-share if it is eligible for XP. |
| Recall early | Comes back immediately with no haul and must rest. Confirm first. |

There is **no errand death, permanent loss or capture outcome** in these modules. There is an injured/resting outcome. At most **two** can be abroad. A recovering one cannot start; an abroad one cannot be called, released, equipped or have its stars changed. Its Road modifiers are copied when it sets out. Ordinary waiting companions can be sent too; in the Open Zone, the one at your side is refused.

The actual reward formulas are:

- **Coin:** floor(your character level × province days × a seeded value from **10 up to 18** × [1 + **0.25 × (danger − 1)**] × [1 + **0.10 × (rank − 1)**] × venture gold multiplier × result share × [1 + haul stars]). This uses your level at return, not companion level. For Tiger Fist at level 7, a successful bare rank-I High Rock Sell-sword gives **70–125 coin**, before any later level change.
- **Materials:** base units are **(3 + 2 × danger) × province days × venture materials multiplier × result share**, then haul stars increase them, with integer flooring. Draws favour cheaper goods by inverse material tier. Tier **5+** goods are limited to **one per day of the actual road**; later draws use cheaper goods where available.
- **Gear:** Plunder counts actual road days after Road time modifiers. A fractional road day gets a seeded chance of one extra day for gear and the fine-material allowance. Shorter missions therefore do not retain all the long trip's guaranteed pieces. Forage and Sell-sword keep their per-errand piece chance. Haul stars add no pieces.
- **Rarity per piece:** Legendary **0.5% + 0.4% × danger + 0.3% × (rank − 1)**; Rare **6% + 3% × danger + 2% × (rank − 1)**; Magic **50%**; otherwise Common. These are separate portions of one roll. The maximum Legendary chance is **3.7%**, at rank V / danger V. Pieces are minted at your character level at return.
- **Companion XP:** the rule in the levels section, paid on both successful and hard roads only while below level 10 at return. **No direct character XP, Renown or Marks reward** appears in the errand haul or return code.

Coin goes to your purse, gear to your inventory, and materials to the Materials Bag then inventory as needed. A return is processed on the companion layer's next running frame, not an interactive battle abroad. The errand is held in your character save; I found no separate account-service mission scheduler. The account service does enforce Open Zone companion inventory drops.

*Sources: `src/systems/revenant/revenantErrands.js` ERRAND, errandPower, errandOdds, oddsKind, errandHaul, pieceTier, deliverHaul; `src/systems/revenant/revenantGear.js` wornGear, gearPower, GEAR; `src/systems/revenant/revenantCompanions.js` errandRefusal, returnFromErrand, recallFromErrand, revenantParty.wake; `src/systems/revenant/revenantStars.js` rvnXpErrand, rvnErrandSky; `src/systems/revenant/revenant.js` ensureMirror; `server-account/src/wild.js` COMPANION-DROP. Examples are calculated from those formulas.*

### Why the missions feel shallow

They currently are **choose a destination and reward emphasis, wait, then receive a seeded result**. There is no mission map to play, tactical party assignment, sequence of encounters, dialogue branch, rescue from capture or province-specific story in this implementation. Province changes duration, danger, material pool and city text. Venture changes the reward mix. Rank, given gear, Devoted loyalty and Road stars modify the calculation.

FEUD's memory, adaptations, weakness, will, last stands, bands, lairs, theft, loyalty, desertion and betrayal are built. The later Unquiet trails, training, wounds and Dread are also built. They mainly deepen the **rival and hunting loop**, not the missions. The old "trails not built" note was followed by their implementation. Revenants still have no hierarchy where they lead other revenants or fight each other over territory. Do not read the design records' older recommendations as extra live mission features.

For your one- or two-hour sessions, use a second companion for errands when you have one. **High Rock** is the gentler starting route; **Forage** supplies that route's listed materials, **Plunder** supplies gear, and **Sell-sword** supplies coin. Choose a distant route for a specific material you need, not an assumed endgame jackpot. Keep your first dependable combat companion available.

*Sources: `src/systems/revenant/revenantErrands.js` newErrand, ERRAND_PLACES, VENTURES, errandHaul; `src/systems/revenant/revenantCompanions.js` sendOnErrand, returnFromErrand; `bible/12-Enhanced-AI/Feud-Arc.md` built records RVN1–RVN13; `bible/06-Systems/Revenants.md` §§42–49, especially §46.8 and the later trail implementation; confirmed by `src/systems/revenant/revenant.js`, `revenantFeud.js` and `revenantUnquiet.js`. Route and session choices are advice.*

## The Dread is a rival's final form

A hostile **rank-V** revenant that gets away again, has a lair, and has no other living Dread blocking it can ascend to **the Dread**. An ordinary escape or will tear-away can do it; merely slipping away while you delay the Kill / Spare choice cannot. This is **not** a companion level-20 promotion.

The ascent must be a deed that passes the rank-growth test. An ordinary escape does; a will tear-away still needs the **second** counted tear-away since its last rank increase. It must already be rank V before that deed, rather than just reaching V on it.

Only **one Dread** can exist at a time. It stops hunting the road, no longer takes one of the three hunting slots, and stays in its known lair. It does not flee, does not keep you out of judgement with unbroken will, and does not fester. Its health is **×1.5 over its hostile rank strength**. It has **two last stands**: rank V's **40%**, then **25%**. Finish it and choose:

- **Kill:** its named trophy is guaranteed **Legendary**. Its ordinary revenant drop still uses the normal rank rules; the trophy guarantee is not a second guaranteed Legendary gear drop. Its gold hoard multiplier is **×3**, compared with any larger plunder hoard rather than multiplied together with it.
- **Spare:** it becomes a normal sworn rank-V companion, with four starting star points. The code clears its Dread status. Do not expect the extra Dread health or two last stands on your side.

The other possible turns are the loyalty failures already described: Oathbreaker and Betrayer. A released companion's record closes. There is no built further sworn evolution, rank VI, or command hierarchy to unlock by sending missions.

*Sources: `src/systems/revenant/revenantUnquiet.js` DREAD, mayAscend, hoardOf, dreadStandHealth; `src/systems/revenant/revenant.js` revenantDeed, huntingRevenants, revenantToReturn, revenantForLair, revenantFester, revenantSpared; `src/systems/revenant/revenantFate.js` revenantLastStandDue, beginLastStand; `src/systems/revenant/revenantTrophy.js` revenantTrophy; `src/systems/revenant/revenantCompanions.js` applySwornStrength.*

## What to do with your first companion

1. Open **Holdings → Companions**. Read its rank, personality, loyalty, companion level and Art. In Stars, read the awakening preview if it has no art.
2. **Call** it if Away and recovered. Keep it with you through manageable fights. Aim for **90 loyalty** without repeatedly sending it away.
3. Spend its available stars using the combat plan. Bring Mending earlier if it has or can learn it. Press **Accept**.
4. Use **Gear** for suitable spare pieces. Check the rank cap and condition. An unarmed creature may have only a charm slot.
5. If it falls, let the rest finish, then Call it again. Repeated falls are a reason to strengthen it or choose gentler fights.
6. Keep potions and follow the staged content plan in [The Play Guide](23-playing-online.md). Save missions for when you can spare its help; they require active play time online.
7. Keep it and its valuables out of the Open Zone for now. Use **Send away** for a temporary absence, **Release** only when you mean to end its oath.

*Sources: the roster actions and laws cited above: `src/ui/companionRoster.js`; `src/systems/revenant/revenantCompanions.js` callRevenant, setSwornStars, releaseRevenant, leaveRefusal; `src/systems/revenant/revenantFeud.js` DEVOTED; `src/systems/revenant/revenantGear.js` gearRefusal. Checklist priorities are advice for Tiger Fist.*
