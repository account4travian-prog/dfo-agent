// The planner's fixed tables: skills, attributes, races and the special advantage / disadvantage
// catalogue. Every value here is restated from DFO Online's source (which restates Daggerfall
// Unity's C#, MIT, Interkarma and contributors). The path after each table is where it lives in
// upstream/daggerfall-js-source; test/parity.test.mjs imports those files and fails if a value here
// stops matching.

/** DFCareer.Stats order (src/systems/statMods.js STAT_KEYS_ORDER). */
export const STAT_KEYS = Object.freeze(['strength', 'intelligence', 'willpower', 'agility', 'endurance', 'personality', 'speed', 'luck']);
export const STAT_LABELS = Object.freeze({
  strength: 'Strength', intelligence: 'Intelligence', willpower: 'Willpower', agility: 'Agility',
  endurance: 'Endurance', personality: 'Personality', speed: 'Speed', luck: 'Luck',
});
export const STAT_SHORT = Object.freeze({
  strength: 'STR', intelligence: 'INT', willpower: 'WIL', agility: 'AGI',
  endurance: 'END', personality: 'PER', speed: 'SPD', luck: 'LUC',
});

/** The 35 skills, by id (src/systems/skills.js SKILLS). `stat` is the governing attribute
 *  (DaggerfallSkills.GetPrimaryStat - shown on the sheet; DFU's advancement does not read it).
 *  `mult` is the per-skill advancement multiplier (src/systems/advancement.js
 *  SKILL_ADVANCEMENT_MULTIPLIER): how many uses a raise costs relative to the cheapest skills. */
export const SKILLS = Object.freeze([
  { id: 0, key: 'Medical', name: 'Medical', stat: 'intelligence', mult: 12, group: 'misc' },
  { id: 1, key: 'Etiquette', name: 'Etiquette', stat: 'personality', mult: 1, group: 'misc' },
  { id: 2, key: 'Streetwise', name: 'Streetwise', stat: 'personality', mult: 1, group: 'misc' },
  { id: 3, key: 'Jumping', name: 'Jumping', stat: 'strength', mult: 5, group: 'body' },
  { id: 4, key: 'Orcish', name: 'Orcish', stat: 'intelligence', mult: 15, group: 'language' },
  { id: 5, key: 'Harpy', name: 'Harpy', stat: 'intelligence', mult: 15, group: 'language' },
  { id: 6, key: 'Giantish', name: 'Giantish', stat: 'intelligence', mult: 15, group: 'language' },
  { id: 7, key: 'Dragonish', name: 'Dragonish', stat: 'intelligence', mult: 15, group: 'language' },
  { id: 8, key: 'Nymph', name: 'Nymph', stat: 'intelligence', mult: 15, group: 'language' },
  { id: 9, key: 'Daedric', name: 'Daedric', stat: 'intelligence', mult: 15, group: 'language' },
  { id: 10, key: 'Spriggan', name: 'Spriggan', stat: 'intelligence', mult: 15, group: 'language' },
  { id: 11, key: 'Centaurian', name: 'Centaurian', stat: 'intelligence', mult: 15, group: 'language' },
  { id: 12, key: 'Impish', name: 'Impish', stat: 'intelligence', mult: 15, group: 'language' },
  { id: 13, key: 'Lockpicking', name: 'Lockpicking', stat: 'intelligence', mult: 2, group: 'stealth' },
  { id: 14, key: 'Mercantile', name: 'Mercantile', stat: 'personality', mult: 1, group: 'misc' },
  { id: 15, key: 'Pickpocket', name: 'Pickpocket', stat: 'agility', mult: 2, group: 'stealth' },
  { id: 16, key: 'Stealth', name: 'Stealth', stat: 'agility', mult: 2, group: 'stealth' },
  { id: 17, key: 'Swimming', name: 'Swimming', stat: 'endurance', mult: 1, group: 'body' },
  { id: 18, key: 'Climbing', name: 'Climbing', stat: 'strength', mult: 2, group: 'body' },
  { id: 19, key: 'Backstabbing', name: 'Backstabbing', stat: 'agility', mult: 1, group: 'stealth' },
  { id: 20, key: 'Dodging', name: 'Dodging', stat: 'speed', mult: 4, group: 'body' },
  { id: 21, key: 'Running', name: 'Running', stat: 'speed', mult: 50, group: 'body' },
  { id: 22, key: 'Destruction', name: 'Destruction', stat: 'willpower', mult: 1, group: 'magic' },
  { id: 23, key: 'Restoration', name: 'Restoration', stat: 'willpower', mult: 2, group: 'magic' },
  { id: 24, key: 'Illusion', name: 'Illusion', stat: 'willpower', mult: 1, group: 'magic' },
  { id: 25, key: 'Alteration', name: 'Alteration', stat: 'willpower', mult: 1, group: 'magic' },
  { id: 26, key: 'Thaumaturgy', name: 'Thaumaturgy', stat: 'willpower', mult: 2, group: 'magic' },
  { id: 27, key: 'Mysticism', name: 'Mysticism', stat: 'willpower', mult: 1, group: 'magic' },
  { id: 28, key: 'ShortBlade', name: 'Short Blade', stat: 'agility', mult: 2, group: 'combat' },
  { id: 29, key: 'LongBlade', name: 'Long Blade', stat: 'agility', mult: 2, group: 'combat' },
  { id: 30, key: 'HandToHand', name: 'Hand-to-Hand', stat: 'agility', mult: 2, group: 'combat' },
  { id: 31, key: 'Axe', name: 'Axe', stat: 'strength', mult: 2, group: 'combat' },
  { id: 32, key: 'BluntWeapon', name: 'Blunt Weapon', stat: 'strength', mult: 2, group: 'combat' },
  { id: 33, key: 'Archery', name: 'Archery', stat: 'agility', mult: 1, group: 'combat' },
  { id: 34, key: 'CriticalStrike', name: 'Critical Strike', stat: 'agility', mult: 8, group: 'combat' },
]);
export const SKILL_ID = Object.freeze(Object.fromEntries(SKILLS.map((s) => [s.key, s.id])));
export const MAGIC_SKILLS = Object.freeze([22, 23, 24, 25, 26, 27]);
export const WEAPON_SKILLS = Object.freeze([28, 29, 30, 31, 32, 33]);

/** EffectFlags bits (DFCareer.cs:398-412; src/systems/spellcast.js EFFECT_FLAGS). */
export const EFFECT_FLAGS = Object.freeze({ Paralysis: 1, Magic: 2, Poison: 4, Fire: 8, Frost: 16, Shock: 32, Disease: 64 });
/** Classic spell elements (src/systems/spellcast.js ELEMENTS). */
export const ELEMENTS = Object.freeze({ Fire: 0, Frost: 1, DiseaseOrPoison: 2, Shock: 3, Magic: 4 });

/** The eight playable races (src/systems/races.js). Ids are DFU's. Only three carry tolerance flags,
 *  each exactly one (RaceTemplate.cs). `temp` is Climates & Calories' own warmth in degrees
 *  (src/systems/survival/temperature.js RACE_TEMP). The racial weapon bonuses are below. */
export const RACES = Object.freeze([
  { id: 1, key: 'Breton', name: 'Breton', resistanceFlags: EFFECT_FLAGS.Magic, immunityFlags: 0, lowToleranceFlags: 0, criticalWeaknessFlags: 0, temp: 5 },
  { id: 2, key: 'Redguard', name: 'Redguard', resistanceFlags: 0, immunityFlags: 0, lowToleranceFlags: 0, criticalWeaknessFlags: 0, temp: -5 },
  { id: 3, key: 'Nord', name: 'Nord', resistanceFlags: EFFECT_FLAGS.Frost, immunityFlags: 0, lowToleranceFlags: 0, criticalWeaknessFlags: 0, temp: 5 },
  { id: 4, key: 'DarkElf', name: 'Dark Elf', resistanceFlags: 0, immunityFlags: 0, lowToleranceFlags: 0, criticalWeaknessFlags: 0, temp: -5 },
  { id: 5, key: 'HighElf', name: 'High Elf', resistanceFlags: 0, immunityFlags: EFFECT_FLAGS.Paralysis, lowToleranceFlags: 0, criticalWeaknessFlags: 0, temp: 0 },
  { id: 6, key: 'WoodElf', name: 'Wood Elf', resistanceFlags: 0, immunityFlags: 0, lowToleranceFlags: 0, criticalWeaknessFlags: 0, temp: 0 },
  { id: 7, key: 'Khajiit', name: 'Khajiit', resistanceFlags: 0, immunityFlags: 0, lowToleranceFlags: 0, criticalWeaknessFlags: 0, temp: -5 },
  { id: 8, key: 'Argonian', name: 'Argonian', resistanceFlags: 0, immunityFlags: 0, lowToleranceFlags: 0, criticalWeaknessFlags: 0, temp: -10 },
]);
export const raceByKey = (key) => RACES.find((r) => r.key === key) ?? null;

// ---- Special advantages and disadvantages (src/systems/specialAdvantages.js) ----

export const ADVANTAGE_KEYS = Object.freeze([
  'acuteHearing', 'adrenalineRush', 'athleticism', 'bonusToHit', 'expertiseIn', 'immunity',
  'increasedMagery', 'rapidHealing', 'regenerateHealth', 'resistance', 'spellAbsorption',
]);
export const DISADVANTAGE_KEYS = Object.freeze([
  'criticalWeakness', 'damage', 'darknessPoweredMagery', 'forbiddenArmorType', 'forbiddenMaterial',
  'forbiddenShieldTypes', 'forbiddenWeaponry', 'inabilityToRegen', 'lightPoweredMagery', 'lowTolerance', 'phobia',
]);

const ENEMY_TYPES = ['animals', 'daedra', 'humanoid', 'undead'];
const WEAPON_TYPES = ['axe', 'bluntWeapon', 'handToHand', 'longBlade', 'missileWeapon', 'shortBlade'];
export const EFFECT_TYPES = Object.freeze(['toDisease', 'toFire', 'toFrost', 'toMagic', 'toParalysis', 'toPoison', 'toShock']);
const SECONDARY = Object.freeze({
  bonusToHit: ENEMY_TYPES, phobia: ENEMY_TYPES,
  expertiseIn: WEAPON_TYPES, forbiddenWeaponry: WEAPON_TYPES,
  immunity: EFFECT_TYPES, resistance: EFFECT_TYPES, criticalWeakness: EFFECT_TYPES, lowTolerance: EFFECT_TYPES,
  increasedMagery: ['intInSpellPoints15', 'intInSpellPoints175', 'intInSpellPoints2', 'intInSpellPoints3', 'intInSpellPoints'],
  rapidHealing: ['general', 'inDarkness', 'inLight'],
  spellAbsorption: ['general', 'inDarkness', 'inLight'],
  regenerateHealth: ['general', 'inDarkness', 'inLight', 'whileImmersed'],
  damage: ['fromHolyPlaces', 'fromSunlight'],
  darknessPoweredMagery: ['lowerMagicAbilityDaylight', 'unableToUseMagicInDaylight'],
  lightPoweredMagery: ['lowerMagicAbilityDarkness', 'unableToUseMagicInDarkness'],
  forbiddenArmorType: ['chain', 'leather', 'plate'],
  forbiddenMaterial: ['adamantium', 'daedric', 'dwarven', 'ebony', 'elven', 'iron', 'mithril', 'orcish', 'silver', 'steel'],
  forbiddenShieldTypes: ['buckler', 'kiteShield', 'roundShield', 'towerShield'],
});
/** The secondary list a primary opens, or null when it has none. */
export const secondaryListFor = (primary) => SECONDARY[primary] ?? null;

/** Only one of each per character (the window's own list - per window). */
export const ONLY_ONE_KEYS = Object.freeze(['increasedMagery', 'darknessPoweredMagery', 'lightPoweredMagery']);
/** At most seven entries in each window. */
export const MAX_ITEMS = 7;

export const LABELS = Object.freeze({
  acuteHearing: 'Acute Hearing', adrenalineRush: 'Adrenaline Rush', athleticism: 'Athleticism',
  bonusToHit: 'Bonus to hit', expertiseIn: 'Expertise in', immunity: 'Immunity',
  increasedMagery: 'Increased Magery', rapidHealing: 'Rapid Healing',
  regenerateHealth: 'Regenerate Health', resistance: 'Resistance', spellAbsorption: 'Spell Absorption',
  criticalWeakness: 'Critical Weakness', damage: 'Damage',
  darknessPoweredMagery: 'Darkness-Powered Magery', forbiddenArmorType: 'Forbidden Armor Type',
  forbiddenMaterial: 'Forbidden Material', forbiddenShieldTypes: 'Forbidden Shield Types',
  forbiddenWeaponry: 'Forbidden Weaponry', inabilityToRegen: 'Inability To Regen Spell Points',
  lightPoweredMagery: 'Light-Powered Magery', lowTolerance: 'Low Tolerance', phobia: 'Phobia',
  animals: 'Animals', daedra: 'Daedra', humanoid: 'Humanoid', undead: 'Undead',
  axe: 'Axe', bluntWeapon: 'Blunt Weapon', handToHand: 'Hand-to-Hand',
  longBlade: 'Long Blade', missileWeapon: 'Missile Weapon', shortBlade: 'Short Blade',
  toDisease: 'To Disease', toFire: 'To Fire', toFrost: 'To Frost', toMagic: 'To Magic',
  toParalysis: 'To Paralysis', toPoison: 'To Poison', toShock: 'To Shock',
  intInSpellPoints15: '1.5X INT In Spell Points', intInSpellPoints175: '1.75X INT In Spell Points',
  intInSpellPoints2: '2X INT In Spell Points', intInSpellPoints3: '3X INT In Spell Points',
  intInSpellPoints: 'INT In Spell Points',
  general: 'General', inDarkness: 'In Darkness', inLight: 'In Light', whileImmersed: 'While Immersed In Water',
  fromHolyPlaces: 'From Holy Places', fromSunlight: 'From Sunlight',
  lowerMagicAbilityDaylight: 'Lower Magic Ability In Daylight',
  unableToUseMagicInDaylight: 'Unable To Use Magic In Daylight',
  lowerMagicAbilityDarkness: 'Lower Magic Ability In Darkness',
  unableToUseMagicInDarkness: 'Unable To Use Magic In Darkness',
  chain: 'Chain', leather: 'Leather', plate: 'Plate',
  adamantium: 'Adamantium', daedric: 'Daedric', dwarven: 'Dwarven', ebony: 'Ebony', elven: 'Elven',
  iron: 'Iron', mithril: 'Mithril', orcish: 'Orcish', silver: 'Silver', steel: 'Steel',
  buckler: 'Buckler', kiteShield: 'Kite Shield', roundShield: 'Round Shield', towerShield: 'Tower Shield',
});
export const labelOf = (key) => LABELS[key] ?? key;
export const pickLabel = ({ primary, secondary }) => (secondary ? `${labelOf(primary)} ${labelOf(secondary)}` : labelOf(primary));

/** The difficulty table (InitializeAdjustmentDict): keyed primary+secondary, except the eight
 *  primaries whose secondary does not change the cost. */
export const DIFFICULTY = Object.freeze({
  acuteHearing: 1, adrenalineRush: 4, athleticism: 4,
  bonusToHitanimals: 6, bonusToHitdaedra: 3, bonusToHithumanoid: 6, bonusToHitundead: 6,
  expertiseIn: 2, immunity: 10,
  increasedMageryintInSpellPoints: 2, increasedMageryintInSpellPoints15: 4,
  increasedMageryintInSpellPoints175: 6, increasedMageryintInSpellPoints2: 8,
  increasedMageryintInSpellPoints3: 10,
  rapidHealinggeneral: 4, rapidHealinginDarkness: 3, rapidHealinginLight: 2,
  regenerateHealthgeneral: 14, regenerateHealthinDarkness: 10,
  regenerateHealthinLight: 6, regenerateHealthwhileImmersed: 2,
  resistance: 5,
  spellAbsorptiongeneral: 14, spellAbsorptioninDarkness: 12, spellAbsorptioninLight: 8,
  criticalWeakness: -14,
  damagefromHolyPlaces: -6, damagefromSunlight: -10,
  darknessPoweredMagerylowerMagicAbilityDaylight: -7,
  darknessPoweredMageryunableToUseMagicInDaylight: -10,
  forbiddenArmorTypechain: -2, forbiddenArmorTypeleather: -1, forbiddenArmorTypeplate: -5,
  forbiddenMaterialadamantium: -5, forbiddenMaterialdaedric: -2, forbiddenMaterialdwarven: -7,
  forbiddenMaterialebony: -5, forbiddenMaterialelven: -9, forbiddenMaterialiron: -1,
  forbiddenMaterialmithril: -6, forbiddenMaterialorcish: -3, forbiddenMaterialsilver: -6,
  forbiddenMaterialsteel: -10,
  forbiddenShieldTypes: -1, forbiddenWeaponry: -2, inabilityToRegen: -14,
  lightPoweredMagerylowerMagicAbilityDarkness: -10,
  lightPoweredMageryunableToUseMagicInDarkness: -14,
  lowTolerance: -5, phobia: -4,
});
const SECONDARY_BLIND = new Set(['expertiseIn', 'immunity', 'resistance', 'criticalWeakness',
  'forbiddenShieldTypes', 'forbiddenWeaponry', 'lowTolerance', 'phobia']);
export const advDisAdjustment = (primary, secondary = '') =>
  DIFFICULTY[SECONDARY_BLIND.has(primary) ? primary : primary + secondary] ?? 0;

/** Pairs that may not share a secondary (IsMatchingAdvPair), checked across BOTH windows. */
export const EXCLUSIVE_PAIRS = Object.freeze([
  ['bonusToHit', 'phobia'],
  ['expertiseIn', 'forbiddenWeaponry'],
  ['immunity', 'resistance'], ['immunity', 'criticalWeakness'], ['immunity', 'lowTolerance'],
  ['resistance', 'lowTolerance'], ['resistance', 'criticalWeakness'],
  ['lowTolerance', 'criticalWeakness'],
]);

// ---- The career bit layouts (DFCareer; the port's CLASS.CFG shape) ----
export const EFFECT_BITS = Object.freeze({ toParalysis: 1, toMagic: 2, toPoison: 4, toFire: 8, toFrost: 16, toShock: 32, toDisease: 64 });
export const PROFICIENCY_BITS = Object.freeze({ shortBlade: 1, longBlade: 2, handToHand: 4, axe: 8, bluntWeapon: 16, missileWeapon: 32 });
export const ARMOR_BITS = Object.freeze({ leather: 1, chain: 2, plate: 4 });
export const SHIELD_BITS = Object.freeze({ buckler: 1, roundShield: 2, kiteShield: 4, towerShield: 8 });
export const MATERIAL_BITS = Object.freeze({ iron: 1, steel: 2, silver: 4, elven: 8, dwarven: 16, mithril: 32, adamantium: 64, ebony: 128, orcish: 256, daedric: 512 });
export const SPECIAL_ABILITY_BITS = Object.freeze({ acuteHearing: 1, athleticism: 2, adrenalineRush: 4, noRegenSpellPoints: 8, sunDamage: 16, holyDamage: 32 });
export const ABSORPTION_FLAGS = Object.freeze({ general: 4, inDarkness: 2, inLight: 1 });
export const REGENERATION_FLAGS = Object.freeze({ general: 8, inDarkness: 2, inLight: 1, whileImmersed: 4 });
export const RAPID_HEALING_FLAGS = Object.freeze({ general: 4, inDarkness: 2, inLight: 1 });
export const ATTACK_BITS = Object.freeze({ undead: [0x01, 0x10], daedra: [0x02, 0x20], humanoid: [0x04, 0x40], animals: [0x08, 0x80] });
/** SpellPointMultipliers at (bitfield & 0x1C00) >> 8. */
export const MAGERY_MULT_BITS = Object.freeze({ intInSpellPoints: 16, intInSpellPoints15: 12, intInSpellPoints175: 8, intInSpellPoints2: 4, intInSpellPoints3: 0 });
export const SPELL_POINT_MULTIPLIERS = Object.freeze({ 0: 3.0, 4: 2.0, 8: 1.75, 12: 1.5, 16: 1.0, 20: 0.5 });
export const DEFAULT_MAGERY_BITS = 20;   // x0.50, what a custom class starts with

/** Weapon skill <-> the proficiency name the career bits use. */
export const WEAPON_SKILL_PROFICIENCY = Object.freeze({ 28: 'shortBlade', 29: 'longBlade', 30: 'handToHand', 31: 'axe', 32: 'bluntWeapon', 33: 'missileWeapon' });

/** The 18 classes, in CLASS00..17.CFG order (src/systems/chargen.js CLASS_CAREERS). */
export const CLASS_NAMES = Object.freeze(['Mage', 'Spellsword', 'Battlemage', 'Sorcerer', 'Healer',
  'Nightblade', 'Bard', 'Burglar', 'Rogue', 'Acrobat', 'Thief', 'Assassin', 'Monk', 'Archer', 'Ranger',
  'Barbarian', 'Warrior', 'Knight']);

/** Social groups the reputation sliders and biography `rN` lines address (sGroupReputations order:
 *  commoners, merchants, scholars, nobility, underworld). */
export const SOCIAL_GROUPS = Object.freeze(['Commoners', 'Merchants', 'Scholars', 'Nobility', 'Underworld']);
