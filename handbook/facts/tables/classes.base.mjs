// Magery uses SetMagery's three-bit field, as decoded in specialAdvantages.js.
export function mageryMultiplier(ability) {
  if (!Number.isInteger(ability)) throw Error('Missing or invalid magery ability field');
  const multipliers = {
    0: 3, 4: 2, 8: 1.75, 12: 1.5, 16: 1, 20: 0.5
  };
  const bits = (ability & 0x1c00) >> 8;
  if (!(bits in multipliers)) throw Error(`Unknown magery bits: ${bits}`);
  return `${multipliers[bits]} × INT`;
}
export default {
  id: 'classes.base',
  title: 'Class base values',
  origin: 'game-data',
  source: 'Local CLASS*.CFG extract; src/formats/classFile.js; src/systems/specialAdvantages.js',
  columns: [
    'Class',
    'STR',
    'INT',
    'WIL',
    'AGI',
    'END',
    'PER',
    'SPD',
    'LUC',
    'HP / level',
    'Advancement',
    'Magery'
  ],
  async rows({
    gameData
  }) {
    const attributes = ['strength', 'intelligence', 'willpower', 'agility', 'endurance', 'personality', 'speed', 'luck'];
    if (!Array.isArray(gameData.classes)) throw Error('Local extract must contain classes');
    return gameData.classes.map(c => [
      c.name,
      ...attributes.map(key => c[key]),
      c.hitPointsPerLevel,
      c.advancementMultiplier,
      mageryMultiplier(c.abilityFlagsAndSpellPointsBitfield)
    ]);
  },
};
