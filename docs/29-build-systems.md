# Building Your Character

*Studied 2026-10-21 against DFO main `4bba28c6c` (2026-10-20). This is the online ruleset. For the Firmament, see [The Star Tree (Firmament)](28-firmament.md). The broader play loop, quests, loot tiers and profession recommendations are in [The Play Guide](23-playing-online.md); recent additions are in [What's New Since 17 October](24-whats-new-2026-10.md). Paths in Sources are inside the read-only `upstream/daggerfall-js-source/` export unless identified as local docs.*

## 1. Character level and attributes

### Online uses classic skill leveling

The Oblivion Remaster-like “Virtue” system is present for offline play, but online is pinned to classic leveling. Skill raises are tallied from actions, then checked after more than **360 classic game minutes** have elapsed. A raise adds to the level sum built from primary and major skills (with the lowest major removed) and the highest minor. The level formula is `floor((current sum - starting sum + 28) / 15)`. The character sheet applies one level each time it handles a level-up; when the sum remains ahead, another check can make a further level available.

Each online level gives **5 attribute points**. The class’s hit points per level are rolled normally, but online maximum health is floored at the average the class would have earned at the character’s current permanent Endurance:

`floor(25 + h + (level − 1) × max(1, (trunc(h/2) + h)/2 + floor(END/10) − 5))`

Here `h` is class HP per level. Tiger Fist has `h = 30`; if Endurance is still 70 at level 7, the floor is **202 HP**. The live floor uses permanent Endurance, including Firmament gains, not temporary bonuses, and never lowers a higher rolled maximum. Renown’s separate health bonus is covered in [The Play Guide](23-playing-online.md).

**For Tiger Fist:** spend level points on **Speed first, then Strength**, followed by **Luck and Agility**, and Endurance after those. [The Strongest Melee Build](05-strongest-melee.md)’s combat measurements found Speed gave the largest fist DPS improvement because it shortens swings; Strength increases fist damage; Luck improves criticals; Agility helps hit chance, especially early. INT, WIL and PER do not add melee damage. The health floor lets you defer Endurance without permanently losing the average HP for your current Endurance. Raise Endurance if you want the floor itself higher.

### Skills’ 100 soft cap

Online Master Skills is always on. Unmastered skills can reach 100; a mastered class skill can reach 200. Past 100, the use cost is multiplied by **4x from 100–124, 8x from 125–149, and 16x from 150–199**. Each over-100 point is worth one quarter of a normal point in formulas, with extra effective-skill milestones of **+2 at 125, +3 at 150, +4 at 175, and +6 at 200**. Thus 200 reads as effective 140, not 200, for formulas. The permanent skill screen still shows the real value.

**For Tiger Fist:** keep levelling at a pace your gear can support. Foes in dangerous dungeons scale as combat skills master and continue past 100. Do not treat the 200 cap as a free multiplier.

*Sources: `src/systems/oblivionLeveling.js` `ONLINE_LEVELING_SYSTEM`, `usesVirtueLeveling`; `src/systems/advancement.js` `calculatePlayerLevel`, `raiseSkills`, `bonusPoolFor`, `applyLevelUp`, `SKILL_RAISE_CHECK_INTERVAL`; `src/systems/levelEven.js` `ONLINE_BONUS_POOL`, `evenHpFloor`; `src/combat/formulas.js` `hitPointsModifier`; `src/systems/masterSkills.js` `MASTERY_SLOTS`, `masterSkillsActive`; `src/systems/skillSoftcap.js` `SOFTCAP_TIERS`, `SKILL_MILESTONES`, `effectiveSkill`; local `docs/05-strongest-melee.md` “The attributes that matter, measured”.*

## 2. Raising skills in play

Before 100, a skill’s uses are banked in its use counter. After the 360-minute check, the game compares the counter with the skill’s next-raise cost. The base cost grows with the current skill value, the skill’s advancement multiplier, the career multiplier, and `1.04^level`; Reflexes adjusts counted uses. The class’s difficulty multiplier is **0.30**, the fastest class growth multiplier. Tiger Fist’s class and biography therefore already give very fast growth; keep using the skills you want to improve rather than grinding a low-value action.

Rest and time-advancing travel release eligible skill raises. The Stats screen reports use progress and the HUD can show when resting would raise a skill. The six-game-hour gate means the skill may have enough uses before a rest, but it is not awarded until the check is due.

| Skill | What counts in the online code | Practical approach |
|---|---|---|
| Hand-to-Hand | Each swing tallies the equipped attack skill; with fists selected, that is Hand-to-Hand. | Fight suitable foes with Gauntlets equipped and no weapon drawn. |
| Critical Strike | Tallied with each player swing, including swings that miss. | It grows alongside your main attack skill. |
| Dodging | Tallied when an incoming attack resolves against you. | Let real fights generate it; do not take avoidable hits just to train. |
| Running | Movement uses while running; at 100+, only actual ground moved counts. | Run between objectives. Standing against a wall does not train a master. |
| Stealth | Skill checks while sneaking. | Sneak during real approaches and when positioning matters. |
| Medical | Tallied by the game’s medical/healing action. | Use the existing rest and recovery loop; do not make a special grind of it. |
| Jumping, Climbing, Swimming | Corresponding movement checks; at 100+, progress needs real movement in the skill’s axis. | Use them on actual routes, not in place. |
| Backstabbing | A real backstab attempt. | Take safe rear attacks when combat gives the opening. |

From 100 onward, combat skill uses need a challenging foe; weak enemies teach less or nothing. Repeating the same use is damped: the recent-use counter has a **60-second half-life**, with a free burst of **40 combat uses** (utility has 6; magic has 10). Running, Jumping, Swimming and Climbing instead count actual motion past 100. Their stride requirements are **1 m for Running and Jumping, 3 m for Swimming, and 0.5 m vertically for Climbing**, with at most two uses’ movement credit banked. No AFK movement training.

Online guild training is available through guild service trainers. A guild member pays **100 gold × character level** per training, while the non-member rate is **400 × level** where a temple offers training; it cannot raise a skill above **50**. A level-7 character therefore sees the base rates of **700 / 2,800 gold** before any hall price factor. The Fighters Guild trains Hand-to-Hand. Guild membership is required for guild training; temples offer training to non-members. Training does not replace the classic level formula. Training and quest rewards for movement skills count as skill training, not movement, so they follow the ordinary tally rule even after 100. A guild hall’s local chapter can affect its price; check the quote before paying.

*Sources: `src/systems/advancement.js` `SKILL_ADVANCEMENT_MULTIPLIER`, `skillUsesForAdvancement`, `raiseSkills`, `skillCheckWait`, `skillAdvanceProgress`; `src/systems/skills.js` `tallySkill`, `tallyMovementSkill`; `src/systems/skillSoftcap.js` `overcapTallyWeight`, `MOVEMENT_SKILLS`, `SPAM_FREE_BURST`, `SPAM_HALF_LIFE_MS`; `src/scenes/hostCombat.js` `tallySwingSkills`; `src/scenes/worldTick.js` running/jumping tallies; `src/systems/guild/guildServices.js` `trainingSkills`, `trainingMax`, `trainingPrice`, `templeCanAccessService`; `src/net/npcChapterLaw.js` `chapterHallFactor`; local `planner/presets/tiger-fist.dfo-class.json` `advancementMultiplier`.*

## 3. Master Skills: choose five carefully

At 100, the game offers a permanent mastery choice if that career group has room. Tiger Fist can master **two of its three primary skills, two of its three major skills, and one of its six minor skills**. Miscellaneous skills cannot be mastered. A mastery cannot be undone. The online feature is already active; the first primary mastery displays an information box, then the skill screen offers eligible choices. Mastering one skill does not itself raise its value.

For Tiger Fist, my recommended five are:

| Slot | Master | Why / cost |
|---|---|---|
| Primary 1 | **Hand-to-Hand** | The build’s main damage skill. Its own formula continues to scale past 100; at 200 its fist-damage term is about **x1.37** against the skill-100 term. |
| Primary 2 | **Critical Strike** | Tallied on each swing and improves critical chance and damage. This is the more aggressive pick. If survival is the priority, choose Dodging instead: it reduces an attacker’s hit modifier, but gives up Critical Strike’s offense. |
| Major 1 | **Running** | Useful every session and trained by ordinary travel. Past 100 it rewards real movement, not key-holding. |
| Major 2 | **Stealth** | Helps the build’s approach and positioning and offers a second combat-adjacent skill to develop. Medical is the alternative if you prefer support and its real recovery actions. |
| Minor | **Backstabbing** | It is a direct combat skill: a successful check can triple a backstab’s damage once the skill is above 1. If you value mobility more, choose Jumping; it will require actual travel to train past 100. |

This set is for the original class. The Brawler route below replaces **Medical** with **Blunt Weapon** before choosing the second major mastery, so the adjusted long-term five are Hand-to-Hand, Critical Strike, Running, Blunt Weapon and Backstabbing. You can still raise Stealth and Medical to 100; they simply will not pass it under that slot plan. Keep the second primary slot available for a weapon skill if you prefer a different path.

*Sources: `src/systems/masterSkills.js` `MASTERY_SLOTS`, `masteryCandidates`, `masterSkill`; `src/systems/skillSoftcap.js` `effectiveSkill`; `src/systems/weaponMastery.js` Hand-to-Hand past-100 modifier; `src/combat/combatStats.js` `computeCombatStats`; `src/combat/pcaao.js` `pcaaoSkillsToHit`, `pcaaoCriticalStrike`, `pcaaoBackstabDamage`; `src/scenes/hostCombat.js` `tallySwingSkills`; `src/systems/skills.js` skill ids; local `docs/05-strongest-melee.md` “Past 100”.*

## 4. Martial specialisation and skill swap

A martial path needs **two mastered weapon skills** from Long Blade, Short Blade, Axe, Blunt Weapon, Archery and Hand-to-Hand. There are fifteen pairs. The path is chosen once; a **200,000-gold** specialisation reset clears the path, but it does not undo permanent masteries. The path is active only while Master Skills is active, both required skills remain mastered and the character is not mentoring. The signature move uses the Weapon Technique key when you hold a matching weapon or Gauntlets and the item has no technique line.

| Path | Required mastered skills | What it gives |
|---|---|---|
|---|---|---|
| Blademaster | Long Blade + Short Blade | Flowing Steel stacks up to +15% damage for 4 seconds. Thousand Cuts dashes 5 m and strikes foes passed for x1.0; struck foes take a half-strength follow-up. |
| Warblade | Long Blade + Axe | A kill gives +15% swing speed for 10 seconds. Rallying Cleave is a x1.1 wide sweep; the press grants +15% damage for 8 seconds. |
| Vanguard | Long Blade + Blunt Weapon | Foes deal 10% less damage. Judgement leaps up to 8 m for x1.3 around the landing; each of up to 3 foes hit heals 4% health. |
| Ranger | Long Blade + Archery | +20% damage against beasts. Mark of the Hunt is a bow shot through 3 foes (x1.2) or Long Blade pounce (x1.3); marked foes take +20% for 12 seconds. |
| Bladedancer (Skirmisher) | Long Blade + Hand-to-Hand | One foe hit in 10 misses. Cyclone strikes all foes within 3 m for x1.0 and speeds swings +20% for 6 seconds. |
| Bloodletter | Short Blade + Axe | Each kill restores 5% health. Gutting Lunge dashes 5 m for x1.2; foes under 25% health take a second blow. |
| Cutthroat | Short Blade + Blunt Weapon | +25% damage against foes that have not noticed you. Blackjack is a single x1.4 blow with +30 to hit; an unaware foe takes it twice. |
| Assassin | Short Blade + Archery | First landed blow on each foe deals +30%. Vanishing Shot is a bow hit for x1.6 or Short Blade dash for x1.3; a landed strike grants Chameleon for 4 rounds. |
| Shadowdancer | Short Blade + Hand-to-Hand | +10 Agility and +15 Dodging. Phantom Strike dashes behind a foe for x1.2; for 6 seconds, one foe in 3 misses. |
| Juggernaut | Axe + Blunt Weapon | A hit crossing 30% of your health heals 20%; 3-minute recovery. Earthsplitter strikes all within 3.5 m for x1.0 and makes foes deal 25% less for 10 seconds. |
| Woodsman | Axe + Archery | Each kill restores 15% fatigue. Felling Strike is an Axe leap for x1.3 or bow volley of 5 arrows at x0.6 each; a foe it kills restores 10% health. |
| Berserker | Axe + Hand-to-Hand | Below half health, +20% damage and +10% swing speed. Savage Whirl hits all within 3 m for x1.2; for 8 seconds, 10% of landed damage heals you. |
| Crusader | Blunt Weapon + Archery | +20% damage against undead and Daedra. Hallowed Strike is a bow shot through 3 foes for x1.2 or mace hit for x1.5 with +25 to hit; affected undead and Daedra take +50%. |
| Brawler | Blunt Weapon + Hand-to-Hand | Each 5-second game round restores 1% health and 2% fatigue. Knockout is one x1.6 hit with +30 to hit; for 8 seconds its target deals 30% less to you. |
| Windrunner (Strider) | Archery + Hand-to-Hand | +10 Speed, +15 Running and +15 Jumping. Windstrike is a bow volley (6 arrows, x0.5 each) or a flying kick up to 7 m (x1.2); it restores fatigue for up to 3 foes struck. |

The five paths containing Hand-to-Hand are Bladedancer, Shadowdancer, Berserker, Brawler and Windrunner. Of those, **Brawler** is the clean fit for Tiger Fist: Knockout is a heavy single-target hit at **x1.6**, and Grit restores **1% health and 2% fatigue each 5-second game round**. Shadowdancer’s Light Step gives **+10 Agility and +15 Dodging**, so choose it if defense is worth training Short Blade. Berserker is a low-health damage path; Bladedancer is an area-hit path; Windrunner emphasizes movement and Archery.

### How Tiger Fist opens Brawler

1. Reach 100 in Hand-to-Hand and master it. This spends one primary mastery.
2. Pay **100,000 gold** to swap an unmastered class skill for a miscellaneous skill in the same group. For Brawler, swap the major **Medical** for **Blunt Weapon**. The skills’ current values do not move. A primary can only be swapped for another primary, a major for a major and a minor for a minor. A mastered skill cannot be swapped out.
3. Raise Blunt Weapon to 100 and master it as a major. Use the other major mastery on Running if following the recommended build. (For a different path, the replacement weapon can be Short Blade, Axe, Long Blade or Archery instead.)
4. Choose Brawler once both Hand-to-Hand and Blunt Weapon are mastered. The 100,000-gold swap plus the 200,000-gold reset ceiling if you later change path is **300,000 gold** total; the reset is optional, not part of opening the path.

The swap does not move your level backward or grant free levels: a shortfall in the class skill sum must be earned back before the next level, and a sum above the stored level is anchored so it cannot pay levels twice. This is why it is safer to decide before paying and before mastering the skill you plan to replace.

*Sources: `src/systems/martialPaths.js` `PATH_ROWS`, `MARTIAL_NUMBERS`, `SIGNATURE_TECHNIQUES`, `martialChoices`, `chooseMartialPath`; `src/systems/martialPowers.js` path effects; `src/systems/skillSwap.js` `SKILL_SWAP_GOLD`, `skillSwapRefusal`, `swapSkill`; `src/systems/arcanePaths.js` `SPEC_RESET_GOLD`; `src/systems/specReset.js` reset behavior; `src/systems/masterSkills.js` `masterSkill`; `src/combat/technique/techniqueRoster.js` `TECHNIQUES`; local `docs/23-playing-online.md` “A plan for Tiger Fist”.*

## 5. Techniques for bare hands

Only **Gauntlets** (template 103) make a bare-hand technique family. You can still punch without them, but you cannot use the gauntlet techniques. Bare-hand techniques are not an equipped weapon: the material on the gauntlets does not set fist damage or satisfy a weapon-metal check. After BAL10, the physical combat and item modifier hooks also read fists, so fist-compatible bonuses work even though no weapon is held.

| Technique | Effect | Cost and cooldown |
|---|---|---|
| **Haymaker** | One target, x1.8 damage, +30 to hit. | 4 fatigue; 9 seconds |
| **Flying Kick** | Aim at a foe and leap up to 6 m; strike foes within 2 m of landing for x1.3, +20 to hit. Can launch from the air. | 4 fatigue; 10 seconds |

There are no other standard bare-hand techniques in the current roster. Technique affixes can roll on Magic, Rare or Legendary weapons and Gauntlets: **12%, 30% and 45%**, respectively. A line adds **+5–15%, +15–30% or +30–50%** to its technique multiplier for those tiers. Legendary “Open Hand”/Gauntlets of the Rose make a bare-hand blow strike again for half damage. Path signatures are separate from loot lines and do not require the loot-rarity system.

Bind **Weapon Technique** in Controls. The HUD chip shows the bound key (or tells you when none is bound), cooldown and technique. For aimed techniques, hold the key while choosing the target and release to commit; Haymaker can be fired directly. Technique damage still makes a normal hit roll and pays fatigue. You cannot start a technique if your remaining fatigue is not greater than its cost plus a normal swing’s cost.

*Sources: `src/combat/technique/techniqueRoster.js` `GAUNTLETS_TEMPLATE`, `TECHNIQUES`, `TECHNIQUE_PER_MILLE`, `TECHNIQUE_BANDS`; `src/combat/techniques.js` `techniqueInHand`, `techniquePress`, `techniqueRelease`, `techniqueFatigue`; `src/systems/loot/lootRarity.js` `LEGENDARY_POWERS` Open Hand; `src/systems/loot/lootPowers.js` `lootStrike` (`fists`); `src/systems/martialPaths.js` `SIGNATURE_TECHNIQUES`; `src/combat/pcaao.js` combat modifier hooks; `bible/05-Combat/Weapon-Techniques.md`; `bible/05-Combat/Balance-Arc.md` §16 (BAL10).*

## 6. Gear for a fist build

### Armour, gauntlets and fatigue

Wear the best **allowed-material** armour you can maintain. Tiger Fist forbids Steel, Elven and Dwarven equipment; the other metals remain usable. PCAAO makes armour reduce damage after a hit rather than lowering the chance to be hit. The struck body part and armour material determine the reduction. In the hit formula, the target’s Dodging skill is halved and subtracted from the attacker’s chance; the code does not apply an armour-weight penalty to Dodging. A normal swing that reaches its hit frame costs **8 fatigue** (11 base × 0.75 drain scale, truncated), whether it hits or misses; armour and gauntlet material do not change that. Swing time reads Speed, weapon heft and weapon handling. Bare fists have no weapon weight and their handling is **0.9**. Armour weight is not in the swing formula. Armour condition can affect armour performance when that module is enabled.

Gauntlets are useful for technique access and may carry compatible gear affixes, sigils and sockets as gloves. Their metal does not change the fist’s weapon damage, and a fist does not fail an enemy’s weapon-material threshold. Gauntlet affixes and enchantments can still improve the wearer: for example, Gauntlets of the Rose carry **+14 armor, +12 Strength and +25 Hand-to-Hand**, plus an armor enchantment, alongside Open Hand. BAL10 made the blow modifiers apply in both combat cores to unarmed hits. Put on any Gauntlets that improve the overall equipped build; do not pay a metal premium expecting stronger punches.

### Affixes, rarity and sockets

The rarity ladder is Common, Magic, Rare, Legendary, Aetheric and Artifact (Gilded is a special boss-loot tier). Magic and Rare items have rolled affixes; Legendary items are named records with fixed powers; Aetheric pieces belong to a set. Artifact items are fixed records. Rarity describes the item’s properties, not a guarantee that every line helps a fist build.

Prioritize:

- **Hand-to-Hand skill**, **Speed**, **Strength**, **Luck**, and **Agility** on wearable gear. Speed and Strength are the measured offensive priorities; Agility improves hit chance, and Luck supports Critical Strike.
- **Damage** where a line is compatible with the actual attack. The weapon damage affix and weapon damage gems apply to a weapon item; they do not turn Gauntlets into a fist weapon. Read the card’s comparison against the worn set before keeping it.
- **Armor** and resistance help survival. **Thorns** on armor can return some damage when you are hit. The regular **leech** affix is weapon-only, so it does not heal a bare-hand build; weapon damage, elemental damage and slayer lines are also weapon-only. Ignore focus, spell potency and cast speed on this no-magic build.
- The Legendary fist power **Open Hand**: the bare-handed hit is repeated for half its damage. This is a strong fit when it appears on Gauntlets of the Rose.

Sockets are physical wells. Armour and jewellery hold one each; weapons can hold one to three based on hand size. The original socket pass gives a socket to Rare items at **15%** and Legendary items at **30%**. A weapon with no socket gets one in its later pass at **12% Magic / 25% Rare / 40% Legendary**; further Rare and Legendary sockets roll at **30% / 45%** each, stopping on a miss. Socketing is free and can be done from the pack, including on worn gear; Reforge extracts a gem whole for **50 / 100 / 200 / 400 / 800 gold** by grade. A gem type contributes no more than one Rare-band line on a piece. On armour, Gauntlets and jewellery, gems do not add fist damage, Strength, Speed or Hand-to-Hand; those offensive gem lines are only on a held weapon. Instead, look for **Amber for Luck** (up to +6), **Malachite for Endurance** (up to +8), or a resistance gem: Ruby (fire), Sapphire (frost), Emerald (poison) or Diamond (magic), up to **20% resistance** at Perfect grade. A weapon-only damage or leech gem is for a weapon set, not bare hands.

### Sigil sets, Aetheric sets and Legendaries

The best offensive set theme is **Dagon's Brand**: its 2-piece tier adds **2-6 Strength and 4-12 Critical Strike**; later tiers say **4-12% more weapon damage** (doubled below half health) and **4-10% weapon damage per kill**, up to **3 stacks** for **12 seconds**. The stat tier suits fists. The latter tiers are worded for weapons, so do not count them as fist bonuses. For survival, **Malacath's Bulwark** gives **2-5 armor per part and 2-6 Endurance** at 2 pieces; at 6, a fatal hit leaves 1 health and halves damage for **4-8 seconds**, recovering in **300-150 seconds**. Aetheric **Ruhn's Regalia** adds **15-45 fire resistance and 2-6 fire damage per weapon hit** at 2 pieces, then a **25-60% melee cleave** to a second foe within **3 m**; its 6-piece Nova deals **10-40 damage** under **25% health** and grants **10-25% more weapon damage** for **10 seconds**, recovering in **180-90 seconds**. Regalia's fire resistance is useful to Tiger Fist; its weapon-only blow bonuses should not be assumed to affect fists. It is Daedric and allowed by Tiger Fist's forbidden-metal list, but is end-game gate loot. Sets wake online when the character's Renown is known, and sleep in duels.

Useful Legendary records include **Gauntlets of the Rose** for Open Hand and any armour or jewellery whose fixed power heals, reduces damage, or strengthens melee hits. Legendaries are fixed records: check the named effect rather than judging by tier or item name. Quests that offer a reward card show a weapon, armour and jewel option tailored to your armour and best weapon skill; compare the card’s stats, material and effects. Take armour or jewellery if no compatible fist Gauntlet is offered. [The Play Guide](23-playing-online.md) explains quest reward tiers and reward cards.

### Tempering and Reforge

Tempering is a **Smithing** job for weapons, plate, shields and chain, or an **Outfitting** job for leather and cloth. It raises a found Rare-or-lower piece one quality step, up to **Superior**; it cannot temper Masterwork, already-Superior, Legendary, Aetheric, Artifact, Gilded or Sigil pieces. It costs half the recipe’s main material input, rounded up, and the craft XP at the item’s recipe tier. A typical weapon or armour is a useful target if that step improves condition or weight; it does not reroll its affixes.

There are two Reforge actions in the current systems. **Loot Reforge** rerolls one affix on an identified, unequipped Magic or Rare piece. It costs **2 Welkynd Shards + 100 gold** for Magic or **4 shards + 400 gold** for Rare. An Exalted Legendary can reroll its extra line for **10 shards + 2,000 gold**. It awards no XP; only the original selected line can be rolled again. **Profession Reforge** is the Enchanting-50 craft service: it rerolls one property on a Magic or Rare piece for **2 or 5 Arcane Essence**, respectively, with no craft XP. The hone raises a line within its current band; first hone costs **1 shard + 50 gold for Magic, 2 + 150 for Rare, or 4 + 500 for Exalted Legendary**, then the price doubles for each hone already taken on that piece. The selected Reforge action and the item card state what it will accept. Legendary, Aetheric, Artifact, Gilded and Sigil pieces cannot be tempered or ordinarily reforged. Socket setting is free; Reforge extraction returns the gem whole at the grade prices above. Treat all of this as a late investment: first confirm the item is wearable and legal, and its lines apply to your fists. A fist has no weapon condition to repair, but worn armour can still benefit from maintenance. Crafted gear tops out at Masterwork; pursue higher-tier drops and set pieces for end-game power.

*Sources: `src/combat/pcaao.js` `pcaaoSkillsToHit`, `pcaaoArmorDamageReductionWithUnarmed`, `pcaaoPercentageReductionCalculationWithUnarmed`; `src/scenes/hostCombat.js` `SWING_WEAPON_FATIGUE_LOSS`, `SWING_FATIGUE_COST`; `src/systems/statMods.js` `FATIGUE_DRAIN_SCALE`; `src/characters/weaponStates.js` `swingFrameSeconds`, `SWING_HANDLING`; `src/systems/armorMaterials.js` `itemArmorValue`; `src/systems/loot/lootRarity.js` `RARITIES`, `AFFIX_KINDS`, `LEGENDARIES`, `LEGENDARY_POWERS`, `socketPass`, `SOCKET_PER_MILLE`, `weaponSocketPass`, `WEAPON_SOCKET_PER_MILLE`, `MORE_SOCKET_PER_MILLE`, `GEM_GRADE_LINES`, `socketCap`; `src/systems/loot/lootPowers.js` `THORNS_CAP`, `lootStrike` (`fists`); `src/systems/sigil/sigilSets.js` set definitions and values; `src/systems/sigil/sigilSetPowers.js` set power hooks; `src/systems/aetheric.js` Ruhn set records; `src/systems/reforge.js` `REFORGE_PRICE`, `HONE_PRICE`, `TEMPER_TOP`, `temperCost`, `temperRefusal`; `src/net/temperLaw.js` profession Reforge terms; `bible/06-Systems/Gem-Sockets.md`; `bible/11-Multiplayer/Sigil-Sets.md`; local `docs/23-playing-online.md` “Questlines” and “The professions”.*

## 7. Consumables and survival

With no useful magicka, carry brewed consumables rather than planning around spells. Potions can provide healing, fatigue recovery, poison and disease cures, levitation, and water breathing. Confirm the exact effect and duration on each potion card; recipes and potion strength determine what a batch actually makes. Cure Poison is especially helpful with Willpower 15. Carry levitation and water-breathing potions for routes that otherwise assume magic.

Climates & Calories adds food, water, temperature and fatigue pressures when its survival feature is enabled. It has **Off, Boons and Hard** modes; Boons is the default. Food banks against hunger, a cooked and fresh meal feeds better than raw or stale food, and spoiled or raw items risk illness depending on the mode. The survival feed, not generic inventory food text, shows current need. Carry rations and a full waterskin, and use cooked provisions before a long trip. The guide’s cooking recommendation remains Provisioning.

At Alchemy 50, **Brewer** makes **three potions per brew**; the alternative **Distiller** adds 10 percentage points to the chance of a Potent result. A Potent potion gets **+25% magnitude or duration** where that potion supports potency. At Alchemy 100, **Master Alchemist** raises that bonus to **+40%**; the alternative Transmuter supports material transmutation. These choices are useful for a no-magic fighter, but the craft limit means choose the two crafts you will take above Journeyman with care ([The Play Guide](23-playing-online.md)). Brew cures and travel utility first, then healing and fatigue support.

*Sources: `src/systems/potionRecipes.js` potion recipes; `src/systems/potions.js` potion effects; `src/net/alchemyLaw.js` `BREWER`, `DISTILLER`, `MASTER_ALCHEMIST`, `potentEffect`, `potentLasts`; `src/net/professionLaw.js` Alchemy rank specialisations; `src/systems/alchemyItems.js` potent result application; `src/systems/survival/food.js` feeding; `src/systems/survival/temperature.js` climate needs; `bible/06-Systems/Climates-Calories.md`; local `docs/23-playing-online.md` “The professions, in detail”.*

## 8. Build order from level 7 / Renown 5

1. **Now:** keep the melee kit legal; wear Gauntlets (ideally a pair with a technique line: [The Play Guide](23-playing-online.md), "Your gauntlet techniques"), check the Weapon Technique key (mouse back button by default), and carry healing, fatigue recovery, Cure Poison, levitation and water breathing. Spend level points Speed, then Strength. Use [The Play Guide](23-playing-online.md)’s staged places and quest plan; use [What's New Since 17 October](24-whats-new-2026-10.md) for current live events.
2. **Each session:** take the skills you want to raise into real use. Swing at appropriate foes, sneak on real approaches, run between destinations, and rest or travel after the six-game-hour skill check becomes due. Avoid standing still to train movement.
3. **On reaching 100:** master Hand-to-Hand first. Reserve one other primary slot for Critical Strike (or Dodging for the defensive route). Reserve a minor slot for Backstabbing. Do not master Medical if you expect to swap it for Blunt Weapon.
4. **Gear upgrades:** keep the strongest legal armor, useful Gauntlets, and attribute / skill / recovery affixes. Check loot cards and sockets. Save for compatible Legendary Gauntlets and, later, Aetheric sets. Don’t invest in weapon damage or spell affixes for a fist-only kit.
5. **Long term:** when ready to build Brawler, save 100,000 gold; swap Medical (major) for Blunt Weapon (major), raise both Blunt and Hand-to-Hand to 100, master them, then choose Brawler. Budget another 200,000 only if you later want to reset the path.
6. **After mastery:** train Hand-to-Hand past 100 only against challenging enemies; movement mastery needs real distance. Expect the 4x, 8x and 16x use costs and watch the tougher-dungeon scaling. Keep improving gear and survival supplies alongside skills.

*Sources: `src/systems/advancement.js` `raiseSkills`; `src/systems/masterSkills.js` `masterSkill`; `src/systems/skillSwap.js` `swapSkill`; `src/systems/martialPaths.js` `chooseMartialPath`; `src/systems/skillSoftcap.js` `SOFTCAP_TIERS`, `overcapTallyWeight`; local `docs/05-strongest-melee.md`, `docs/23-playing-online.md`, `docs/24-whats-new-2026-10.md`.*
