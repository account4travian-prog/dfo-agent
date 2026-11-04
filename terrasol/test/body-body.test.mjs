// The Body over a fake agent mode: what it accepts, what it presses, and what it notices.
//   node --test "agent/test/*.test.mjs"
import test from 'node:test';
import assert from 'node:assert';
import { createBody, validatePolicy, validateGoal, bearingTo, norm180, STARTER_POLICY } from '../vendor/legacy-agent/body/core.mjs';

function fakeAgent(state) {
  const calls = [];
  let customView=null, sampleId=0;
  return {
    get view() {return () => {
      const v=customView?.() ?? {yaw:state.yaw,rays:[],things:[{kind:'door',x:0,z:1,dist:1,bearing:0}]};
      return {...v,scan:{version:1,page:'p',frame:state.frame,id:state.scan.id,time:0,pose:{feet:state.pos,yaw:state.yaw*Math.PI/180},coverage:{patches:true},patches:[{ends:'ground',usable:true,bounds:[-50,-50,50,50],height:state.pos[1],clearance:3}],rays:v.rays,things:v.things,footing:[]}};
    };},
    set view(fn) {customView=fn;},
    calls,
    state: () => {state.scan.id=++sampleId; return structuredClone(state);},
    press: (a, ms) => calls.push(['press', a, ms ?? 0]),
    release: (a) => calls.push(['release', a]),
    look: (dx, dy = 0) => { calls.push(['look', dx]); state.pitch = (state.pitch ?? 0) - dy / 3.5; },   // +dy looks down, as the game's
    swing: (dx, dy, ms) => calls.push(['swing', ms]),
    releaseAll: () => calls.push(['releaseAll']),
  };
}

const base = (over = {}) => ({
  frame:0,scan:{page:'p',frame:0,id:1,fresh:true,time:0},ahead:'Thing',mode: 'dungeon', paused: false, overlay: false, window: null, pos: [0, 0, 0], yaw: 0,
  vitals: { health: 40, maxHealth: 40, fatigue: 100, maxFatigue: 100, magicka: 10, maxMagicka: 10 }, foes: [], ...over,
});

test('the starter table is an instinct and the goal: strike back up close, else do what the mind asked - no fleeing, healing or seeking fights', () => {
  assert.deepStrictEqual(STARTER_POLICY.rules.map((r) => [r.id, r.do.act]), [['defend', 'fight'], ['default', 'followGoal']]);
  assert.ok(STARTER_POLICY.rules[0].when.hostileWithin <= 3, 'only what is already at arm\'s length');
});

test('a policy in the vocabulary is accepted, with every setting filled in', () => {
  const r = validatePolicy({ rules: [{ id: 'swing', when: { hostileWithin: 3 }, do: { act: 'fight', target: 'nearestHostile' }, why: 'tried it' }], settings: { reach: 2.5 } });
  assert.ok(r.ok, r.errors.join('; '));
  assert.strictEqual(r.policy.settings.reach, 2.5);
  assert.strictEqual(r.policy.settings.swingCooldownMs, 700);
});

test('a new table that leaves a setting out keeps the value in force, not the starting one', () => {
  const b = createBody(fakeAgent(base()));
  b.setPolicy({ rules: [{ id: 'a', do: { act: 'stop' } }], settings: { reach: 3 } });
  b.setPolicy({ rules: [{ id: 'b', do: { act: 'stop' } }] });
  assert.strictEqual(b.getPolicy().settings.reach, 3);
});

test('anything outside the vocabulary is refused, with a reason a model can act on', () => {
  const bad = [
    { rules: [{ id: 'x', do: { act: 'teleport' } }] },
    { rules: [{ id: 'x', when: { hpBelowPct: 400 }, do: { act: 'stop' } }] },
    { rules: [{ id: 'x', when: { onFire: true }, do: { act: 'stop' } }] },
    { rules: [{ id: 'x', do: { act: 'stop', code: 'alert(1)' } }] },
    { rules: [{ id: 'x', do: { act: 'stop' } }], settings: { reach: 99 } },
    { rules: [{ id: 'x', do: { act: 'stop' } }, { id: 'x', do: { act: 'stop' } }] },
    { rules: [] },
  ];
  for (const t of bad) {
    const r = validatePolicy(t);
    assert.strictEqual(r.ok, false, JSON.stringify(t));
    assert.ok(r.errors.length > 0);
  }
});

test('inherited names are no vocabulary: "__proto__", "toString" and "constructor" are refused (Sol\'s review)', () => {
  for (const when of [JSON.parse('{"__proto__": 1}'), { toString: 1 }, { constructor: 1 }]) {
    assert.strictEqual(validatePolicy({ rules: [{ id: 'x', when, do: { act: 'stop' } }] }).ok, false, JSON.stringify(Object.keys(when)));
  }
  assert.strictEqual(validatePolicy({ rules: [{ id: 'x', do: { act: 'toString' } }] }).ok, false);
  assert.strictEqual(validateGoal({ kind: 'constructor' }).ok, false);
});

test('goals are checked the same way', () => {
  assert.ok(validateGoal({ kind: 'explore', heading: 90 }).ok);
  assert.ok(!validateGoal({ kind: 'explore', heading: 900 }).ok);
  assert.ok(!validateGoal({ kind: 'fly' }).ok);
  assert.ok(!validateGoal({ kind: 'idle', extra: 1 }).ok);
});

test('the bearing law matches the agent mode: yaw 0 faces +z, positive is to the right', () => {
  const s = { pos: [0, 0, 0], yaw: 0 };
  assert.strictEqual(Math.round(bearingTo(s, 0, 5).bearing), 0);
  assert.strictEqual(Math.round(bearingTo(s, 5, 0).bearing), 90);
  assert.strictEqual(Math.round(bearingTo({ ...s, yaw: 90 }, 5, 0).bearing), 0);
  assert.strictEqual(norm180(350), -10);
  assert.strictEqual(norm180(-190), 170);
});

test('disabled, the Body only watches: it presses nothing', () => {
  const a = fakeAgent(base({ foes: [{ type: 'rat', hostile: true, dist: 3, bearing: 0 }] }));
  const b = createBody(a);
  b.tick();
  assert.deepStrictEqual(a.calls, []);
  assert.ok(b.events().lines.some((l) => l.kind === 'foe'));
});

test('trial 2: a recognised tutorial under attack waits for grace, dismisses, then resumes the table', () => {
  for (const suffix of ['click or press any key', 'Click or press a key']) {
    let t = 0;
    const st = base({ foes: [{ hostile: true, dist: 1, bearing: 0, h: 3.4 }] }), a = fakeAgent(st);
    const b = createBody(a, { now: () => t }); b.enable(true); b.tick();
    st.overlay = true; st.window = `Fighting\n${suffix}`; st.foes = []; // real scans hide foes under overlays
    a.calls.length = 0; b.tick();
    t = 500; b.tick();
    assert.ok(!a.calls.some(([k]) => k === 'press'));
    t = 550; b.tick();
    assert.deepStrictEqual(a.calls.filter(([k]) => k === 'press'), [['press', 'ActivateCursor', 100]]);
    assert.ok(b.events().lines.some((e) => e.kind === 'window' && e.text.includes('Fighting')));
    st.overlay = false; st.window = null; st.foes = [{ hostile: true, dist: 1, bearing: 0, h: 3.4 }];
    t = 1300; a.calls.length = 0; b.tick();
    assert.ok(a.calls.some(([k]) => k === 'swing'), 'the table resumes, with no model call');
  }
});

test('trial 2: damage during a tutorial is remembered through its grace even when foes are obscured', () => {
  let t = 0;
  const st = base(), a = fakeAgent(st), b = createBody(a, { now: () => t }); b.enable(true); b.tick();
  st.overlay = true; st.window = 'Fighting\nclick or press any key'; b.tick();
  t = 200; st.vitals.health--; b.tick();
  t = 550; b.tick();
  assert.equal(a.calls.filter(([k]) => k === 'press').length, 1);
  assert.ok(b.events().lines.some((e) => e.kind === 'hurt'));
});

test('software tactician: safe cards dismiss at grace; ordinary windows, disabled/dead Body and renewed cards wait', () => {
  for (const mode of ['safe', 'ordinary', 'disabled', 'dead', 'renewed', 'expired']) {
    let t = 0;
    const st = base(), a = fakeAgent(st), b = createBody(a, { now: () => t });
    b.enable(true, mode === 'expired' ? 100 : 0); b.tick();
    st.overlay = true; st.window = mode === 'ordinary' ? 'Choose how many' : 'Fighting\nclick or press any key';
    st.foes = mode === 'safe' ? [] : [{ hostile: true, dist: 1, bearing: 0 }];
    if (mode === 'dead') st.vitals.health = 0;
    b.tick();
    if (mode === 'disabled') b.enable(false);
    t = 500;
    if (mode === 'renewed') st.window = 'Next card\nclick or press a key';
    b.tick(); t = 550; b.tick();
    assert.equal(a.calls.filter(([k]) => k === 'press').length, mode === 'safe' ? 1 : 0, mode);
  }
});

test('trial 2: look raises a camera left looking at the feet before it begins its circle', () => {
  let t = 0;
  const st = base({ pitch: -55 }), a = fakeAgent(st), b = createBody(a, { now: () => t });
  b.enable(true); b.setGoal({ kind: 'look' });
  for (let i = 0; i < 12; i++) { t += 50; b.tick(); }
  assert.ok(Math.abs(st.pitch) <= 5);
  assert.ok(a.calls.some(([k, dx]) => k === 'look' && dx > 0), 'the panorama starts after raising the view');
});

test('exploring: it turns toward the heading, then walks', () => {
  const st = base({ yaw: 0 });
  const a = fakeAgent(st);
  const b = createBody(a);
  b.enable(true);
  b.setGoal({ kind: 'explore', heading: 90 });
  b.tick();
  assert.ok(a.calls.some(([k, dx]) => k === 'look' && dx > 0), 'turns right toward 90');
  assert.ok(!a.calls.some(([k, x]) => k === 'press' && x === 'MoveForwards'), 'does not walk while 90 deg off');
  st.yaw = 88;
  a.calls.length = 0;
  b.tick();
  assert.ok(a.calls.some(([k, x]) => k === 'press' && x === 'MoveForwards'));
});

test('a fight rule closes to near range, then swings no faster than its cooldown', () => {
  let t = 0;
  // a foe whose middle is at eye height (h 3.4): no aiming up or down, so this test is about the reach and the clock
  const st = base({ foes: [{ type: 'ogre', hostile: true, dist: 6, bearing: 0, h: 3.4 }] });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t });
  b.enable(true);
  b.setPolicy({ rules: [{ id: 'f', when: { hostileWithin: 10 }, do: { act: 'fight', target: 'nearestHostile' } }] });
  b.tick();
  assert.ok(a.calls.some(([k, x]) => k === 'press' && x === 'MoveForwards'));
  st.foes[0].dist = 1.2;
  a.calls.length = 0;
  b.tick(); t += 100; b.tick();
  assert.strictEqual(a.calls.filter(([k]) => k === 'swing').length, 1, 'one swing inside the cooldown');
  assert.ok(a.calls.some(([k, x]) => k === 'release' && x === 'MoveForwards'));
  t += 1000; b.tick();
  assert.strictEqual(a.calls.filter(([k]) => k === 'swing').length, 2);
});

test('under a window the Body lets go and acts no further', () => {
  const st = base();
  const a = fakeAgent(st);
  const b = createBody(a);
  b.enable(true);
  b.setGoal({ kind: 'explore', heading: 0 });
  b.tick();
  assert.ok(a.calls.some(([k, x]) => k === 'press' && x === 'MoveForwards'));
  st.overlay = true; st.paused = true; st.window = '[TutorialBox] hello';
  a.calls.length = 0;
  b.tick();
  assert.deepStrictEqual(a.calls, [['release', 'MoveForwards'], ['releaseAll']], 'a swing in progress is let go too');
  a.calls.length = 0;
  b.tick();
  assert.deepStrictEqual(a.calls, [], 'once, not every tick');
  assert.ok(b.events().lines.some((l) => l.kind === 'window' && l.text.includes('hello')));
});

test('a lease the mind stops renewing switches the Body off by itself, and it lets go', () => {
  let t = 0;
  const st = base();
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t });
  b.enable(true, 15000);
  b.setGoal({ kind: 'explore', heading: 0 });
  b.tick();
  t = 10000; b.enable(true, 15000); b.tick();        // renewed
  assert.ok(b.status().enabled);
  t = 26000; a.calls.length = 0; b.tick();           // not renewed for 16 s
  assert.strictEqual(b.status().enabled, false);
  assert.ok(a.calls.some(([k]) => k === 'releaseAll'));
  assert.ok(b.events().lines.some((l) => l.text.includes('lease')));
});

test('with no state to read (a reload, an error) the Body lets go of what it holds', () => {
  const st = base();
  const a = fakeAgent(st);
  const b = createBody(a);
  b.enable(true);
  b.setGoal({ kind: 'explore', heading: 0 });
  b.tick();
  a.state = () => ({ loading: true });
  a.calls.length = 0;
  b.tick();
  assert.deepStrictEqual(a.calls, [['release', 'MoveForwards'], ['releaseAll']]);
  a.state = () => { throw new Error('gone'); };
  a.calls.length = 0;
  b.tick();
  assert.deepStrictEqual(a.calls, [], 'nothing left to let go');
});

test('a swing is never started before the last one ends, whatever the cooldown says', () => {
  let t = 0;
  const st = base({ foes: [{ type: 'ogre', hostile: true, dist: 1, bearing: 0, h: 3.4 }] });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t });
  b.enable(true);
  b.setPolicy({ rules: [{ id: 'f', do: { act: 'fight', target: 'nearestHostile' } }], settings: { swingMs: 250, swingCooldownMs: 100 } });
  for (let i = 0; i < 6; i++) { b.tick(); t += 100; }
  assert.strictEqual(a.calls.filter(([k]) => k === 'swing').length, 2, 'at 0 and 300 ms, not every 100');
});

test('to fight with the weapon put away, the Body draws it first, once, and swings only when it is out', () => {
  let t = 0;
  const st = base({ foes: [{ type: 'ogre', hostile: true, dist: 1, bearing: 0, h: 3.4 }], weapon: { out: false, name: 'fists' } });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t });
  b.enable(true);
  for (let i = 0; i < 10; i++) { b.tick(); t += 100; }   // one second, the weapon not yet out
  assert.deepStrictEqual(a.calls.filter(([k, x]) => k === 'press' && x === 'ReadyWeapon').length, 1, 'asked once, not every tick');
  assert.strictEqual(a.calls.filter(([k]) => k === 'swing').length, 0, 'no swing at nothing');
  st.weapon.out = true;
  b.tick();
  assert.strictEqual(a.calls.filter(([k]) => k === 'swing').length, 1);
  assert.ok(b.events().lines.some((l) => l.kind === 'weapon'));
});

test('a rat is low: the Body looks down to its body before it swings, and up again to walk on', () => {
  let t = 0;
  const st = base({ pitch: 0, foes: [{ type: 'rat', hostile: true, dist: 1.2, bearing: 0, dy: 0, h: 0.4 }] });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t });
  b.enable(true);
  b.tick();
  assert.strictEqual(a.calls.filter(([k]) => k === 'swing').length, 0, 'not yet: the view is over its head');
  for (let i = 0; i < 20 && !a.calls.some(([k]) => k === 'swing'); i++) { b.tick(); t += 50; }
  assert.ok(a.calls.some(([k]) => k === 'swing'), 'it swings once it looks down');
  assert.ok(st.pitch < -30, `looking down at it: ${st.pitch}`);
  st.foes = [];
  b.setGoal({ kind: 'explore', heading: 0 });
  for (let i = 0; i < 20; i++) { b.tick(); t += 50; }
  assert.ok(Math.abs(st.pitch)<=5, 'GAZE-BRIEF: remembered support lets walking return to level gaze');
});

test('standing still in a fight is not time "stuck": exploring after it does not turn aside at once', () => {
  let t = 0;
  const st = base({ yaw: 0 });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t, random: () => 0.9 });
  b.enable(true);
  b.setPolicy({ rules: [{ id: 'f', when: { hostileWithin: 5 }, do: { act: 'fight', target: 'nearestHostile' } }, { id: 'g', do: { act: 'followGoal' } }] });
  b.setGoal({ kind: 'explore', heading: 0 });
  b.tick(); t += 50;                                  // walking
  st.foes = [{ type: 'rat', hostile: true, dist: 1, bearing: 0 }];
  for (let i = 0; i < 100; i++) { b.tick(); t += 50; }   // five seconds of fighting in place
  st.foes = [];
  st.pos = [0, 0, 0.5];
  b.tick(); t += 50;
  assert.ok(!b.events().lines.some((l) => l.kind === 'stuck'));
});

test('a look around turns a full circle, pausing each way, and says which ways lead on and what was seen', () => {
  let t = 0;
  const st = base({ yaw: 0 });
  const a = fakeAgent(st);
  // the fake turns the character the moment it is asked, and its eyes see a door only when facing 120-180
  a.look = (dx, dy = 0) => { st.yaw += dx / 3.5; st.pitch = (st.pitch ?? 0) - dy / 3.5; };
  a.view = () => ({
    yaw: st.yaw,
    rays: [{ bearing: 0, dist: (((st.yaw % 360) + 360) % 360) < 30 ? 12 : 2, ends: (((st.yaw % 360) + 360) % 360) < 30 ? 'open' : 'wall' }],
    things: (((st.yaw % 360) + 360) % 360) >= 110 && (((st.yaw % 360) + 360) % 360) <= 190 ? [{ kind: 'door', dist: 6, bearing: 0, x: 3, z: -5.2 }] : [],
  });
  const b = createBody(a, { now: () => t });
  b.enable(true);
  b.setGoal({ kind: 'look' });
  for (let i = 0; i < 400 && b.status().goal.kind === 'look'; i++) { b.tick(); t += 50; }
  assert.strictEqual(b.status().goal.kind, 'idle', 'it finishes');
  const said = b.events().lines.find((l) => l.kind === 'looked')?.text ?? '';
  assert.match(said, /0°: open 12m\+/);
  assert.match(said, /wall 2m/);
  assert.match(said, /door 6m at \d+° \(3, -5\.2\)/);
  assert.ok(!a.calls.some(([k, x]) => k === 'press' && x === 'MoveForwards'), 'it looks without walking');
});

test('R7: a jump in depth splits a look\'s stretch - a doorway in a wall is not "wall 2-10m"', () => {
  let t = 0;
  const st = base({ yaw: 0 });
  const a = fakeAgent(st);
  a.look = (dx, dy = 0) => { st.yaw += dx / 3.5; st.pitch = (st.pitch ?? 0) - dy / 3.5; };
  const deg = (v) => ((Math.round(v) % 360) + 360) % 360;
  // walls 2 m away all round, except a gap at 105-135 where the eye reaches a far wall 10 m off
  a.view = () => ({ yaw: st.yaw, rays: [-30, -15, 0, 15, 30].map((bearing) => ({ bearing, dist: deg(st.yaw + bearing) >= 105 && deg(st.yaw + bearing) <= 135 ? 10 : 2, ends: 'wall' })), things: [] });
  const b = createBody(a, { now: () => t });
  b.enable(true);
  b.setGoal({ kind: 'look' });
  for (let i = 0; i < 400 && b.status().goal.kind === 'look'; i++) { b.tick(); t += 50; }
  const said = b.events().lines.find((l) => l.kind === 'looked')?.text ?? '';
  assert.match(said, /1\d\d-1\d\d°: wall 10m/, 'the gap is its own stretch (its edges within a reading of 105-135)');
  assert.doesNotMatch(said, /wall 2-10m/);
});

test('using a thing: walk up to it, face it, press the use control once, then stand', () => {
  let t = 0;
  const st = base({ yaw: 0, pos: [0, 0, 0] });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t });
  b.enable(true);
  b.setGoal({ kind: 'use', x: 0, z: 5 });
  b.setNavigation(nav(b, [[0,5,0]]));
  a.look=(dx,dy=0)=>{a.calls.push(['look',dx]);st.yaw+=dx/3.5;st.pitch=(st.pitch??0)-dy/3.5;};
  for(let i=0;i<20;i++) b.tick();
  assert.ok(a.calls.some(([k, x]) => k === 'press' && x === 'MoveForwards'), 'walks to it first');
  st.pos = [0, 0, 4];
  a.calls.length = 0;
  b.tick(); t += 50; b.tick();
  assert.deepStrictEqual(a.calls.filter(([k, x]) => k === 'press' && x === 'ActivateCenterObject'), [['press', 'ActivateCenterObject', 120]]);
  // pressed, but nothing is claimed yet: the Body watches for what comes of it (Sol's R5)
  assert.strictEqual(b.status().goal.kind, 'use');
  assert.ok(!b.events().lines.some((l) => l.kind === 'used'));
  t += 100; b.tick();
  assert.strictEqual(a.calls.filter(([k, x]) => k === 'press' && x === 'ActivateCenterObject').length, 1, 'pressed once, not again while watching');
  st.overlay = true; st.window = '[TalkWindow] Greetings';
  b.tick();
  const used = b.events().lines.find((l) => l.kind === 'used');
  assert.strictEqual(used.data.outcome, 'window');
  assert.match(used.text, /a window: \[TalkWindow\] Greetings/);
  assert.strictEqual(b.status().goal.kind, 'idle');
});

/** Walk up to a thing at 0,1 (already in reach), press use, and return the Body, its fake and the clock. */
function usedThing(over = {}, agentOver = {}) {
  const clock = { t: 0 };
  const st = base({ yaw: 0, pos: [0, 0, 0], front: 0.9, lastSeq: 7, ...over });
  const a = { ...fakeAgent(st), ...agentOver };
  const b = createBody(a, { now: () => clock.t });
  b.enable(true);
  b.setGoal({ kind: 'use', x: 0, z: 1 });
  b.tick();
  return { st, a, b, clock };
}
const usedLine = (b) => b.events().lines.find((l) => l.kind === 'used' || l.kind === 'use-failed');

test('R5: a use that changes nothing is said as nothing, after a few seconds - not as success', () => {
  const { b, clock } = usedThing();
  clock.t = 2000; b.tick();
  assert.strictEqual(usedLine(b), undefined, 'still watching');
  clock.t = 2600; b.tick();
  const l = usedLine(b);
  assert.strictEqual(l.data.outcome, 'nothing');
  assert.match(l.text, /nothing seemed to happen/);
  assert.strictEqual(b.status().goal.kind, 'idle');
});

test('R5: a door that swings open is seen as what stood in front moving', () => {
  const { st, b, clock } = usedThing();
  clock.t = 600; st.front = 4.2; b.tick();
  assert.strictEqual(usedLine(b).data.outcome, 'moved');
  assert.match(usedLine(b).text, /0\.9 m -> 4\.2 m/);
});

test('R5: going through to another place, and words on the screen, are both outcomes', () => {
  const placed = usedThing();
  placed.clock.t = 300; placed.st.mode = 'exterior'; placed.b.tick();
  assert.strictEqual(usedLine(placed.b).data.outcome, 'place');
  const heard = usedThing({}, { events: (after) => ({ lines: after === 7 ? [{ seq: 8, kind: 'hud', text: 'This door is locked.' }] : [] }) });
  heard.clock.t = 300; heard.b.tick();
  assert.strictEqual(usedLine(heard.b).data.outcome, 'text');
  assert.match(usedLine(heard.b).text, /the game said: This door is locked\./);
});

test('R5: a use control the game refuses is a failed use at once', () => {
  const { b } = usedThing({}, { press: () => ({ ok: false, why: 'no key is bound to ActivateCenterObject' }) });
  const l = usedLine(b);
  assert.strictEqual(l.kind, 'use-failed');
  assert.match(l.text, /no key is bound/);
  assert.strictEqual(b.status().goal.kind, 'idle');
});

test('R5: a new goal while watching ends the watch without a word', () => {
  const { st, b, clock } = usedThing();
  b.setGoal({ kind: 'look' });
  clock.t = 300; st.front = 5; b.tick();
  assert.strictEqual(usedLine(b), undefined);
});

test('a wall right in front is never walked into: the Body stops short and counts itself blocked at once', () => {
  let t = 0;
  const st = base({ yaw: 0, front: 0.5 });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t, random: () => 0.9 });
  b.enable(true);
  b.setGoal({ kind: 'explore', heading: 0 });
  b.tick();
  assert.ok(!a.calls.some(([k, x]) => k === 'press' && x === 'MoveForwards'), 'no step into the wall');
  assert.ok(b.events().lines.some((l) => l.kind === 'stuck'), 'and it turns aside at once, not after pushing for seconds');
});

test('turning toward a way with a wall right in front, no step is taken into the wall (Sol\'s review)', () => {
  const st = base({ yaw: 0, front: 0.4 });
  const a = fakeAgent(st);
  const b = createBody(a);
  b.enable(true);
  b.setGoal({ kind: 'explore', heading: 45 });
  b.tick();
  assert.ok(!a.calls.some(([k, x]) => k === 'press' && x === 'MoveForwards'));
});

test('short strides do not hide being stuck: an immobile walker is found out (Sol\'s review)', () => {
  let t = 0;
  const st = base({ yaw: 0 });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t, random: () => 0.9 });
  b.enable(true);
  b.setPolicy({ rules: [{ id: 'g', do: { act: 'followGoal' } }], settings: { strideMs: 1000, stuckSeconds: 1.5 } });
  b.setGoal({ kind: 'explore', heading: 0 });
  for (let i = 0; i < 100; i++) { b.tick(); t += 50; }   // five seconds, never moving
  assert.ok(b.events().lines.some((l) => l.kind === 'stuck'));
});

test('forward is held in strides: let go briefly every few seconds, as a person\'s steps would', () => {
  let t = 0;
  const st = base({ yaw: 0 });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t });
  b.enable(true);
  b.setGoal({ kind: 'explore', heading: 0 });
  for (let i = 0; i < 80; i++) { st.pos = [0, 0, i * 0.1]; b.tick(); t += 50; }   // four seconds, moving all the while
  const edges = a.calls.filter(([, x]) => x === 'MoveForwards').map(([k]) => k);
  assert.deepStrictEqual(edges.slice(0, 3), ['press', 'release', 'press'], 'released once around three seconds, then walking again');
  assert.ok(!b.events().lines.some((l) => l.kind === 'stuck'), 'a stride\'s pause is not being stuck');
});

test('an accidental climb: let go of everything, step back, say so, and explore elsewhere', () => {
  let t = 0;
  const st = base({ yaw: 0 });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t, random: () => 0 });
  b.enable(true);
  b.setGoal({ kind: 'explore', heading: 0 });
  b.tick(); t += 50;
  st.climbing = true;
  a.calls.length = 0;
  b.tick(); t += 50; b.tick();
  assert.ok(a.calls.some(([k]) => k === 'releaseAll'));
  assert.deepStrictEqual(a.calls.filter(([k, x]) => k === 'press' && x === 'MoveBackwards'), [['press', 'MoveBackwards', 400]], 'one step back, not one per tick');
  assert.ok(b.events().lines.some((l) => l.kind === 'climb'));
  assert.strictEqual(b.status().goal.kind, 'idle', 'ask the mind instead of random exploration');
});

test('a look\'s event carries its readings as data, for the mind\'s memory of the place', () => {
  let t = 0;
  const st = base({ yaw: 0, pos: [4, 0, 7] });
  const a = fakeAgent(st);
  a.look = (dx, dy = 0) => { st.yaw += dx / 3.5; st.pitch = (st.pitch ?? 0) - dy / 3.5; };
  a.view = () => ({ yaw: st.yaw, rays: [{ bearing: 0, dist: 5, ends: 'dark' }], things: [] });
  const b = createBody(a, { now: () => t });
  b.enable(true);
  b.setGoal({ kind: 'look' });
  for (let i = 0; i < 400 && b.status().goal.kind === 'look'; i++) { b.tick(); t += 50; }
  const looked = b.events().lines.find((l) => l.kind === 'looked');
  assert.deepStrictEqual([looked.data.x, looked.data.z], [4, 7]);
  assert.ok(looked.data.rays.length >= 100, 'dated coverage throughout the smooth sweep');
});

test('a route is walked waypoint by waypoint, round the corner, and its end is announced', () => {
  let t = 0;
  const st = base({ yaw: 90, pos: [0, 0, 0] });
  const a = fakeAgent(st);
  a.look = (dx, dy = 0) => { st.yaw += dx / 3.5; st.pitch = (st.pitch ?? 0) - dy / 3.5; };
  const b = createBody(a, { now: () => t });
  b.enable(true);
  assert.ok(b.setGoal({ kind: 'route', points: [[10, 0], [10, 10]] }).ok);
  b.setNavigation(nav(b,[[10,0,0],[10,10,0]]));
  const visited = [];
  for (let i = 0; i < 2000 && b.status().goal.kind === 'route'; i++) {
    b.tick(); t += 50;
    // the fake walks 0.25 m a tick along the facing while forward is held
    if (a.calls.some(([k, x]) => k === 'press' && x === 'MoveForwards') && !a.calls.some(([k, x], j) => k === 'release' && x === 'MoveForwards' && j > a.calls.findLastIndex(([k2, x2]) => k2 === 'press' && x2 === 'MoveForwards'))) {
      const y = (st.yaw * Math.PI) / 180; st.pos = [st.pos[0] + Math.sin(y) * 0.25, 0, st.pos[2] + Math.cos(y) * 0.25];
    }
    visited.push([...st.pos]);
  }
  assert.strictEqual(b.status().goal.kind, 'idle');
  assert.ok(b.events().lines.some((l) => l.kind === 'arrived' && l.text.includes('complete supported route')));
  assert.ok(visited.some(([x, , z]) => x > 8.5 && z < 2), 'it went by the corner, not straight across');
});

test('the same "blocked" line is said once in a few seconds, not twenty times a second', () => {
  let t = 0;
  const st = base({ yaw: 0, front: 0.4 });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t });
  b.enable(true);
  b.setGoal({ kind: 'goto', x: 0, z: 20 });
  for (let i = 0; i < 40; i++) { b.tick(); t += 50; }   // two seconds facing a wall
  assert.strictEqual(b.events().lines.filter((l) => l.kind === 'stuck').length, 1);
});

test('route and via goals are checked: a list of [x, z] points', () => {
  assert.ok(validateGoal({ kind: 'route', points: [[1, 2], [3, 4]] }).ok);
  assert.ok(!validateGoal({ kind: 'route', points: [] }).ok);
  assert.ok(!validateGoal({ kind: 'route', points: [[1, 'x']] }).ok);
  assert.ok(validateGoal({ kind: 'use', x: 1, z: 2 }).ok, 'via is optional');
  assert.ok(validateGoal({ kind: 'use', x: 1, z: 2, via: [[0, 1]] }).ok);
});

test('walking without moving is "stuck": exploring turns aside by itself and says so', () => {
  let t = 0;
  const st = base({ yaw: 0 });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t, random: () => 0.9 });
  b.enable(true);
  b.setGoal({ kind: 'explore', heading: 0 });
  for (let i = 0; i < 40; i++) { b.tick(); t += 50; }
  assert.ok(b.events().lines.some((l) => l.kind === 'stuck'));
  assert.notStrictEqual(b.status().goal.heading, 0);
});

test('a new health ceiling is no wound: the start\'s stand-in pool replaced by the rolled one', () => {
  const st = base({ vitals: { health: 50, maxHealth: 50 } });
  const a = fakeAgent(st);
  const b = createBody(a);
  b.tick();
  st.vitals = { health: 37, maxHealth: 37 };
  b.tick();
  assert.ok(!b.events().lines.some((l) => l.kind === 'hurt'));
});

test('wounds and danger are noticed: hurt, below half, in sight, clear', () => {
  const st = base({ foes: [{ type: 'imp', hostile: true, dist: 8, bearing: 20 }] });
  const a = fakeAgent(st);
  const b = createBody(a);
  b.tick();
  st.vitals.health = 15; st.foes = [];
  b.tick();
  const kinds = b.events().lines.map((l) => l.kind);
  for (const k of ['foe', 'hurt', 'low', 'clear']) assert.ok(kinds.includes(k), `${k} in ${kinds.join(',')}`);
});

test('the fight pilot: a closed door stops the Body short of its middle - facing it, blocked right there, it uses it', () => {
  let t = 0;
  const st = base({ yaw: 0, pos: [0, 0, 0], front: 0.6 });   // the door's panel 0.6 m ahead; its middle 2.2 m off
  const a = fakeAgent(st);
  a.view = () => ({ things: [{ kind: 'door', dist: 1.5, bearing: 0, x: 0, z: 1.5 }] });   // the eyes see it just ahead (the classic skin: no plaque)
  const b = createBody(a, { now: () => t });
  b.enable(true);
  b.setGoal({ kind: 'use', x: 0, z: 1.5 });
  b.tick(); t += 50; b.tick();
  assert.ok(a.calls.some(([k, x]) => k === 'press' && x === 'ActivateCenterObject'), 'used from where it stands');
  const far = fakeAgent(base({ yaw: 0, pos: [0, 0, 0], front: 0.6 }));
  const b2 = createBody(far, { now: () => t });
  b2.enable(true);
  b2.setGoal({ kind: 'use', x: 0, z: 6 });   // a wall in front, the thing well beyond it: no use into the wall
  b2.tick(); b2.tick();
  assert.ok(!far.calls.some(([k, x]) => k === 'press' && x === 'ActivateCenterObject'));
  const wall = fakeAgent(base({ yaw: 0, pos: [0, 0, 0], front: 0.6, ahead: null }));   // a wall corner, nothing under the crosshair
  const b3 = createBody(wall, { now: () => t });
  b3.enable(true);
  b3.setGoal({ kind: 'use', x: 0, z: 2.2 });
  b3.tick(); b3.tick();
  assert.ok(!wall.calls.some(([k, x]) => k === 'press' && x === 'ActivateCenterObject'), 'no use pressed at a bare wall');
});

function nav(b,points) {
  return {page:'p',frame:0,visit:'visit1',revision:1,goalRevision:b.status().goalRevision,level:0,graph:{cell:0.5,nodes:fixtureNodes(points),blocked:[]},route:{status:'complete',points,reason:'fixture route'}};
}

function fixtureNodes(points) {
 const nodes=new Map();let prev=[0,0];
 for(const p of points) {
  const n=Math.max(1,Math.ceil(Math.hypot(p[0]-prev[0],p[1]-prev[1])*4));
  for(let i=0;i<=n;i++) {const x=prev[0]+(p[0]-prev[0])*i/n,z=prev[1]+(p[1]-prev[1])*i/n;
   for(let ix=Math.floor((x-1)/0.5);ix<=Math.floor((x+1)/0.5);ix++)for(let iz=Math.floor((z-1)/0.5);iz<=Math.floor((z+1)/0.5);iz++)nodes.set(`${ix},${iz}`,{ix,iz,level:0,height:0});
  }prev=p;
 }return [...nodes.values()];
}

test('a look turns once at eye level and once tilted to the floor, describing only the level turn', () => {
  let t = 0;
  const st = base({ yaw: 0 });
  const a = fakeAgent(st);
  const pitches = [];
  a.look = (dx, dy = 0) => { st.yaw += dx / 3.5; st.pitch = (st.pitch ?? 0) - dy / 3.5; if (dx) pitches.push(Math.round(st.pitch)); };
  // level rays see a wall 4 m off; the tilted ones meet the floor 1 m off
  a.view = () => ({ yaw: st.yaw, rays: [{ bearing: 0, dist: (st.pitch ?? 0) < -20 ? 1 : 4, ends: 'wall' }], things: [] });
  const b = createBody(a, { now: () => t });
  b.enable(true);
  b.setGoal({ kind: 'look' });
  for (let i = 0; i < 600 && b.status().goal.kind === 'look'; i++) { b.tick(); t += 50; }
  assert.strictEqual(b.status().goal.kind, 'idle', 'it finishes');
  assert.ok(pitches.some((p) => Math.abs(p) <= 5) && pitches.some((p) => Math.abs(p + 55) <= 5), 'it turns at eye level and at the floor');
  const yawTurned = st.yaw;
  assert.ok(yawTurned >= 719, `two full turns (${yawTurned}°)`);
  const looked = b.events().lines.find((l) => l.kind === 'looked');
  assert.ok(looked.data.rays.every((r) => r.dist === 4), 'floor rays are not described as walls');
});

test('a new goto waits briefly for its route instead of failing before the route arrives', () => {
  // Live 2026-10-29: the mind sends setGoal, then setNavigation a round trip later; the Body failed the goal in between.
  let t = 0;
  const st = base({ yaw: 0, pos: [0, 0, 0] });
  const a = fakeAgent(st);
  const b = createBody(a, { now: () => t });
  b.enable(true);
  b.setGoal({ kind: 'goto', x: 0, z: 5 });
  for (let i = 0; i < 4; i++) { b.tick(); t += 50; }
  assert.ok(!b.events().lines.some((l) => l.kind === 'goal-failed'), 'no failure while the route is on its way');
  b.setNavigation(nav(b, [[0,5,0]]));
  a.look=(dx,dy=0)=>{a.calls.push(['look',dx]);st.yaw+=dx/3.5;st.pitch=(st.pitch??0)-dy/3.5;};
  for (let i = 0; i < 20; i++) b.tick();
  assert.strictEqual(b.status().goal.kind, 'goto');
  assert.ok(a.calls.some(([k, x]) => k === 'press' && x === 'MoveForwards'), 'it walks once the route is there');
  const late = createBody(fakeAgent(base({ yaw: 0, pos: [0, 0, 0] })), { now: () => t });
  late.enable(true);
  late.setGoal({ kind: 'goto', x: 0, z: 5 });
  for (let i = 0; i < 14; i++) { late.tick(); t += 50; }
  assert.ok(late.events().lines.some((l) => l.kind === 'goal-failed'), 'a route that never comes still fails the goal');
});
