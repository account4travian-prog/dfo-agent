import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceContext } from '../source-context.mjs';
import registry from '../../facts/registry.mjs';
import { prepareTables } from '../tables.mjs';

// Run with the supplied snapshot; a machine without DFO source can run all other tests.
test('online settings override stored offline PCAAO choices; facts agree with the online formulas', { skip: !process.env.DFO_SRC }, async () => {
  const dfo = sourceContext();
  const settings = await dfo('systems/modSettings.js');
  const pcaao = await dfo('combat/pcaao.js');
  const core = await dfo('combat/formulas.js');
  try {
    globalThis.location.search = '';
    settings.setModSetting('pcaao', 'Enabled', false);
    settings.setModSetting('pcaao', 'fixedStrengthDamageModifier', false);
    assert.equal(pcaao.pcaaoModules().enabled, false);
    assert.equal(core.damageModifier(100), 10);
    const strength = registry.find(f => f.id === 'pcaao.strengthDamageDivisor');
    await assert.rejects(strength.read(dfo), /disabled/);
    globalThis.location.search = '?online';
    assert.equal(pcaao.pcaaoModules().enabled, true);
    assert.equal(pcaao.pcaaoModules().fixedStrengthDamageModifier, true);
    assert.equal(pcaao.pcaaoDamageModifier(100), 5);
    const values = {};
    for (const fact of registry.filter(f => f.id.startsWith('pcaao.'))) values[fact.id] = await fact.read(dfo);
    assert.deepEqual(values, { 'pcaao.hitChanceMin': 3, 'pcaao.hitChanceMax': 97, 'pcaao.strengthDamageDivisor': 10, 'pcaao.adrenalineRushThresholdDivisor': 6, 'pcaao.adrenalineRushBonus': 8, 'pcaao.adrenalineRushImprovedBonus': 12 });
    for (const fact of registry) assert.ok(['forced', 'whole', 'base', 'player-setting'].includes(fact.appliesOnline));
  } finally {
    settings._resetModSettings();
    globalThis.location.search = '?online';
  }
});

test('source table snapshots cover all 18 classes and the full online ledger', async () => {
  const html = await prepareTables(['classes.skills', 'online.ruleset']);
  assert.equal((html.get('classes.skills').match(/<tr>/g) || []).length, 19);
  assert.match(html.get('classes.skills'), /Critical Strike/);
  assert.match(html.get('online.ruleset'), /Balance-locked at defaults/);
  assert.match(html.get('online.ruleset'), /AllowMagicRepairs = True/);
  assert.match(html.get('online.ruleset'), /fixedStrengthDamageModifier = true/);
  assert.match(html.get('online.ruleset'), /The player&#39;s own/);
});
