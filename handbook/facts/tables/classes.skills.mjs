// Revised class skills are public DFO source, not CLASS*.CFG records.
export default {
  id: 'classes.skills',
  title: 'Revised class skills',
  origin: 'source',
  source: 'src/systems/stockClasses.js; src/systems/skills.js',
  columns: ['Class', 'Primary skills', 'Major skills', 'Minor skills'],
  async rows({
    dfo
  }) {
    const {
      STOCK_CLASS_REVISIONS
    } = await dfo('systems/stockClasses.js');
    const {
      SKILL_NAMES
    } = await dfo('systems/skills.js');
    return STOCK_CLASS_REVISIONS.map(c => [
      c.name,
      ...['primary', 'major', 'minor'].map(group => c[group].map(id => SKILL_NAMES[id]).join(', '))
    ]);
  },
};
