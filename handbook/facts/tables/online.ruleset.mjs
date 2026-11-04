// Describe each mod's effective keys, including whole-mod exclusions and room overrides.
function modRow(vendor, mod, lane, onlineModSetting) {
  const whole = Object.hasOwn(lane.ONLINE_WHOLE_MODS, vendor);
  const room = Object.hasOwn(lane.ONLINE_ROOM_MOD_KEYS, vendor);
  const status = whole ? 'Balance-locked at defaults': room ? 'Forced for the world': "The player's own";
  if (!whole && !room && !lane.ONLINE_PLAYERS_OWN_MODS.includes(vendor)) throw Error(`Unclassified online mod: ${vendor}`);
  const keys = Object.keys(mod.keys).flatMap(key => {
    const value = onlineModSetting(vendor, key);
    return value === undefined ? []: [`${key} = ${JSON.stringify(value)}`];
  });
  return [mod.title, 'Mod', status, keys.join('; ') || 'No forced keys'];
}
// Registry features name their controlling store; controls may include secondary keys.
function featureRow(feature, lane, onlineModSetting) {
  const controls = [feature.control, ...(feature.control?.also || [])].filter(Boolean);
  const keys = controls.flatMap(control => {
    const value = control.store === 'prefs' ? lane.ONLINE_FORCED_PREFS[control.key]: control.store === 'settings' ? lane.ONLINE_FORCED_SETTINGS[control.key.split('/')[0]]?.[control.key.split('/')[1]]: control.store === 'mods' ? onlineModSetting(control.vendor, control.key): undefined;
    return value === undefined ? []: [`${control.key} = ${JSON.stringify(value)}`];
  });
  return [
    feature.title,
    'Port feature',
    keys.length ? 'Forced for the world': "The player's own",
    keys.join('; ') || 'No forced keys'
  ];
}
export default {
  id: 'online.ruleset',
  title: 'The online ruleset',
  note: 'Only the listed keys are forced. Other keys remain your choice. Balance-locked mods use shipped defaults except where an explicit world rule overrides them.',
  origin: 'source',
  columns: ['Mod or feature', 'Kind', 'Online status', 'Forced keys'],
  source: 'src/systems/online/onlineLane.js; src/systems/modSettings.js; src/systems/features.js',
  async rows({
    dfo
  }) {
    const lane = await dfo('systems/online/onlineLane.js');
    const {
      MOD_SETTINGS, onlineModSetting
    } = await dfo('systems/modSettings.js');
    const {
      FEATURES
    } = await dfo('systems/features.js');
    const rows = Object.entries(MOD_SETTINGS).map(([vendor, mod]) => modRow(vendor, mod, lane, onlineModSetting));
    rows.push(...FEATURES.filter(feature => feature.control.store !== 'mods').map(feature => featureRow(feature, lane, onlineModSetting)));
    for (const [key, value] of Object.entries(lane.ONLINE_FORCED_PREFS)) rows.push([key, 'Port preference', 'Forced for the world', `${key} = ${JSON.stringify(value)}`]);
    for (const [section, settings] of Object.entries(lane.ONLINE_FORCED_SETTINGS)) {
      for (const [key, value] of Object.entries(settings)) rows.push([`${section}/${key}`, 'Port setting', 'Forced for the world', `${key} = ${value}`]);
    }
    return rows;
  },
};
