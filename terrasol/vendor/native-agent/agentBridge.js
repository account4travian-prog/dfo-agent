// @ts-check
// AGENT1 - THE AGENT MODE (?agent, offline only). A read of the game's state and a hand on its controls, for an AI
// player driven from outside the page (the DFO workspace's agent/ gateway; its design is the workspace's
// docs/07-ai-agent-design.md). Not a DFU member and not upstream: a fork's patch.
//
// IT ADDS NO POWER. Every press goes down the roads a person's hands use: a key is a synthetic KeyboardEvent on the
// document, exactly as the pad layer edges its buttons (ui/gamepadInput.js synth), resolved through the player's own
// bindings at press time; a look and a swing are the host's input hooks, the same object the finger and the pad are
// handed. Nothing here moves the body, spawns, heals or reads a foe beyond a short range - which is why the
// shot-mode hooks (`?shot`: __pose, __move) are not used: they teleport.
//
// OFFLINE ONLY. On an online page (systems/onlineLane.js isOnlinePage) the bridge refuses to stand. An agent online is
// a separate decision with the project's owner (docs/07 section 9).
import { bindings } from '../ui/input.js';
import { getBinding } from '../systems/inputActions.js';
import { registerPresenter } from '../systems/notify.js';
import { playerEntity, setDeathListener } from '../characters/playerEntity.js';
import { createJourneyJudge } from './agentJourney.js';
import { journeyFrame, journeyEvent } from './agentJourneyEvents.js';
import { maxFatigue, FATIGUE_MULTIPLIER } from '../systems/statMods.js';
import { enemyDisplayName } from '../characters/enemy/enemyBasics.js';
import { EYE_HEIGHT } from '../player/motor.js';
import { isLit, isDaylit, dungeonThings, exteriorThings, interiorThings, relative, VIEW_RANGE, OUTDOOR_NAME_RANGE } from './agentSenses.js';
import { cameraPicture, sceneTrace, createCameraScan } from './agentScan.js';
import { HudText } from '../ui/hud/hudText.js';
import { shownItemName } from '../systems/item/itemInfo.js';
import { createMapReader } from './agentMap.js';
import { createWindowDriver, renderedWindowObservation, activePanel, overworldPanel, visibleHud, visiblePlaque } from './agentWindows.js';
export { journeyFacts, journeyTown } from './agentJourney.js';
import { MidScreenText } from '../ui/midScreenText.js';
import { loadingHeld } from '../ui/loadingScreen.js';
import { readTownMap } from './agentTownMap.js';
import { readControlsMenu } from './agentMenus.js';
import { TUTORIALS, TUTORIAL_GROUPS, tutorialText } from '../systems/tutorials.js';
import { boundKeyName } from '../ui/tutorialPopup.js';
import { registerPlayerKillListener } from '../systems/playerKills.js';
import { skyMinutes } from '../systems/worldTick.js';
import { playerTorchLight } from '../systems/playerTorch.js';

const FOE_MIDDLE = 0.9;   // metres above a foe's feet the sight line aims at: half a standing body (motor.js CAPSULE_HEIGHT 1.8)

/** The fatigue ceiling as the sheet shows it, or null for an entity the reader cannot size (a test's fake). */
function fatigueMax(e) {
  try { const m = maxFatigue(e); return Number.isFinite(m) ? Math.trunc(m / FATIGUE_MULTIPLIER) : null; } catch { return null; }
}

export const AGENT_BRIDGE_VERSION = 1;
let bridgeIdentity = 0;
const LOG_MAX = 200;   // the read lines kept for a slow reader; older ones fall off and `dropped` says so
const FOE_RANGE = 40;  // metres: a foe further than this is not on the agent's sheet
const FRONT_RANGE = 3; // metres: how far ahead `front` looks for a wall
const round = (v, n = 2) => (Number.isFinite(v) ? Math.round(v * 10 ** n) / 10 ** n : null);

/**
 * The bridge over a host's live objects. Pure of the DOM except through `dispatch`, so a node test can hand it fakes.
 * @param {object} ctx
 * @param {{ pos: number[], yaw: number, pitch: number }} ctx.cam            the shared camera (all modes)
 * @param {() => number[] | null} ctx.feet                                    the body's feet, or null when there is none
 * @param {() => number[]} [ctx.compensation]                                 accumulated scene-origin offset; zero in a standalone dungeon
 * @param {() => string} ctx.mode                                             'exterior' | 'interior' | 'dungeon'
 * @param {() => any[]} ctx.foes                                              the live foe pool for the current mode
 * @param {() => boolean} ctx.paused
 * @param {() => boolean} ctx.overlay                                         a window is up
 * @param {() => any} [ctx.topWindow]                                         the window on top, read for its words
 * @param {() => any} [ctx.renderer]                                          the renderer's selected world-space lights
 * @param {() => number} [ctx.skyMinute]                                      sky time in minutes (default: the game's sky clock)
 * @param {(x: number, z: number) => number} [ctx.heightAt]                   outdoor ground in scene space (declared metric assist)
 * @param {(x: number, z: number) => boolean | null} [ctx.outdoorWaterAt]      outdoor water at a scene point; null if unavailable
 * @param {() => any} [ctx.collider]                                          the mode's collider, for lines of sight
 * @param {() => any} [ctx.dungeon]                                           the dungeon's context: its lamps, doors, loot
 * @param {() => any} [ctx.exterior]                                          the street's world-frame doors, live seats, pixel NPCs and loot targets
 * @param {() => any} [ctx.interior]                                          the building's live context, already in world space
 * @param {() => number} [ctx.interiorBuildingType]                            the building type, for usable shelves
 * @param {() => boolean} [ctx.interiorRecords]                                this town has a usable Hall of Records
 * @param {() => boolean} [ctx.climbing]                                      the body is on a wall
 * @param {() => boolean} [ctx.loading]                                       the loading screen is up (default: ui/loadingScreen.js loadingHeld)
 * @param {() => any} [ctx.automap]                                           the live automap (default: systems/automap.js's)
 * @param {() => number[] | null} [ctx.townMapOrigin]                          the current town's location origin in the live world frame
 * @param {() => any} [ctx.bindings]                                          the live bindings (default: ui/input.js bindings)
 * @param {() => any} [ctx.weapon]                                            the weapon rig's PlayerWeapon (`sheathed`, `weapon`)
 * @param {() => any} [ctx.document]                                          the page (default: the global document)
 * @param {() => string | null} [ctx.ahead]                                   the tooltip's words (default: read off the page)
 * @param {{ look: Function, attack: Function }} ctx.hooks                    the host's input hooks
 * @param {any} [ctx.entity]                                                  the player entity (default: the live one)
 * @param {(action: string) => string | null} [ctx.codeFor]                   action -> bound code
 * @param {(type: string, code: string) => void} [ctx.dispatch]               a synthetic key edge
 * @param {() => number} [ctx.now]
 * @param {() => any} [ctx.judgeSource]                                       HARNESS ONLY: host's private facts
 */
export function createAgentBridge(ctx) {
  const entity = ctx.entity ?? playerEntity;
  const codeFor = ctx.codeFor ?? ((action) => { const b = bindings(); return getBinding(b, action) ?? getBinding(b, action, false); });
  const dispatch = ctx.dispatch ?? ((type, code) => (globalThis.document ?? globalThis).dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true })));
  const now = ctx.now ?? (() => performance.now());
  const compensation = () => ctx.compensation?.() ?? [0, 0, 0];
  // FloatingOrigin adds the SAME offset to the player and compensation. Subtract it, in all three axes.
  // Keep sight/collision in scene space; only the agent boundary uses these continuous metres.
  const continuous = (p) => { const c = compensation(); return Array.from(p, (v, i) => v - c[i]); };
  const position = (p) => continuous(p).map((v) => round(v));
  const readMap = createMapReader(ctx.automap, compensation);
  const hands = createWindowDriver(ctx.document ?? (() => globalThis.document));
  const judge = createJourneyJudge(entity, ctx.mode, ctx.judgeSource);
  let observationSignature = null, observationId = 0;
  function readObservation() {
    if (!overlayUp()) { observationSignature = null; return null; }
    const doc = (ctx.document ?? (() => globalThis.document))();
    const content = renderedWindowObservation(doc) ?? classicWindowObservation(ctx.topWindow?.());
    if (!content) { observationSignature = null; return null; }
    // Include visible field/selection state even where it has no DOM text range. No control address is an identity.
    const signature = JSON.stringify([content, hands.observationState()]);
    if (signature !== observationSignature) { observationSignature = signature; observationId++; }
    return { id: `observation-${observationId}`, ...content };
  }
  const held = new Map();    // code -> the action that pressed it
  const timers = new Set();
  const log = [];            // { seq, t, kind, text }
  let seq = 0;
  let dropped = 0;

  function note(kind, text) {
    log.push({ seq: ++seq, t: Math.round(now()), kind, text: String(text ?? '') });
    while (log.length > LOG_MAX) { log.shift(); dropped++; }
  }

  let lampRenderer = null, lampStamp = null, lampData = null, lamps = [];
  /** AGENT7: renderer.js: "this._pointLights = data.subarray ? data.subarray(0, n * 4) : data;"
   *  and "this._pointColorGen++;". Cache the capped, world-space light set until its writer changes it;
   *  never rebuild the town's lantern pool in a 20 Hz state read. Zero-colour (faded out) lights do not illuminate.
   *  Street lamps are already clock-gated by world.js's "if (lightsOnAt(minute)) {". Windows only emit on
   *  their own surfaces (renderer.js: "setWindowEmission(rgb) {"), so no window-shaped light is invented here. */
  function renderedLamps(r) {
    if (r !== lampRenderer || r._pointColorGen !== lampStamp || r._pointLights !== lampData) {
      lampRenderer = r; lampStamp = r._pointColorGen; lampData = r._pointLights;
      lamps = [];
      const data = lampData ?? [];
      for (let i = 0; i < data.length; i += 4) {
        const colors = r._pointColors ?? r._pointColor;
        const c = r._pointColors ? i / 4 * 3 : 0;
        if (colors && !(colors[c] > 0 || colors[c + 1] > 0 || colors[c + 2] > 0)) continue;
        lamps.push({ x: data[i], y: data[i + 1], z: data[i + 2], range: data[i + 3] });
      }
    }
    return lamps;
  }

  /** The same local-light rule indoors and underground: worldModes.js:
   *  "renderer.setLighting(new Float32Array(isNight(skyMinutes() % 1440) ? INTERIOR_NIGHT_AMBIENT : INTERIOR_AMBIENT), 0);"
   *  interiorLights.js: "export const INTERIOR_AMBIENT = Object.freeze([0.18, 0.18, 0.18]);".
   *  Interiors are dim, not fully lit. Their selected lamps, and the carried light, reveal distant things. */
  function lighting() {
    const mode = ctx.mode();
    const r = ctx.renderer?.();
    const p = ctx.feet() ?? ctx.cam.pos;
    // playerTorch.js: "if (!st || !(st.range > 0) || !feet) return null;" - the renderer's own reach and hand offset.
    const torch = playerTorchLight(entity, p, ctx.cam.yaw);
    return {
      outdoorsOrIndoors: mode === 'exterior' && isDaylit((ctx.skyMinute ?? skyMinutes)()),
      lights: r ? renderedLamps(r) : (mode === 'dungeon' ? ctx.dungeon?.()?.lights : ctx.interior?.()?.lights) ?? [],
      torch: torch ? { at: [torch.x, torch.y, torch.z], range: torch.range } : null,
    };
  }

  const docOf = ctx.document ?? (() => globalThis.document);
  const overlayUp = () => !!ctx.overlay() || !!overworldPanel(docOf());
  const shownKind = () => {
    const panel = activePanel(docOf());
    return panel?.matches?.('#travel-view') ? windowKind({ constructor: { name: 'Overworld' } })
      : windowKind(ctx.topWindow?.());
  };

  /** The crosshair's one source is the rendered plaque, not a second activation/naming ladder. */
  function aheadText() {
    if (overlayUp() || (ctx.loading ?? loadingHeld)()) return null;
    return ctx.ahead ? ctx.ahead() : visiblePlaque(docOf());
  }

  /** AGENT9: THE FIGHT SCORER'S LEDGER - for the harness that judges a trial, NEVER a sense: no role is shown it. A
   *  foe's hostility as the agent first sensed it (before any blow of its own), and the game's own word that the
   *  player's blow killed a foe (systems/playerKills.js: "MY blow was the one that killed it"). A death notice or a
   *  foe gone from sight is not a kill: hidden, distant and killed-by-another all look the same. */
  const bridgeId = ++bridgeIdentity;
  let targetFrame = null, targetSerial = 0, targetIds = new WeakMap(), staticIds=new Map(), lastObservedPose=null;
  // Allocated only by a visible candidate's value callback, after the scan's sight test.
  function observedTargetId(actor,kind='foe',anchor=null) {
    const frame = journeyFrame();
    if (frame !== targetFrame) { targetFrame = frame; targetIds = new WeakMap(); staticIds=new Map(); targetSerial = 0; }
    const key=anchor?`${kind}:${continuous(anchor).map(x=>Math.round(x*1000)).join(',')}`:null;
    let id = key?staticIds.get(key):targetIds.get(actor);
    if (!id) { id = `${kind.replaceAll(' ','-')}-${bridgeId}-${frame}-${++targetSerial}`; if(key){staticIds.set(key,id);if(staticIds.size>4096)staticIds.delete(staticIds.keys().next().value);}else targetIds.set(actor,id); }
    return id;
  }
  const firstHostile = new WeakMap();   // a foe's entity -> its hostility when first sensed
  const kills = [];
  let killSeq = 0;
  registerPlayerKillListener('agent-scorer', (killed, { kind }) => {
    kills.push({ seq: ++killSeq, t: Math.round(now()), kind, sensed: firstHostile.has(killed), hostileWhenSensed: firstHostile.get(killed) ?? null });
  });
  function foeCandidates() {
    const p = ctx.feet() ?? ctx.cam.pos;
    const out = [];
    for (const f of ctx.foes() ?? []) {
      const at = f?.ai?.feet;
      if (!at || f.dead) continue;
      const { dist, bearing } = relative(p, ctx.cam.yaw, at);
      if (dist > FOE_RANGE) continue;
      out.push({ at: [at[0], at[1] + FOE_MIDDLE, at[2]], value: () => {
        const who = f.entity ?? f;
        if (typeof who === 'object' && !firstHostile.has(who)) firstHostile.set(who, f.ai?.isHostile === true);
        return { targetId: observedTargetId(f), type: Number.isFinite(f.mobileType) ? enemyDisplayName(f.mobileType) ?? 'something' : f.mobileType ?? 'something',
          hostile: f.ai?.isHostile ?? null, dist: round(dist, 1), bearing: Math.round(bearing),
          dy: round(at[1] - p[1], 1), h: round(f.ai?.height ?? FOE_MIDDLE * 2, 1) };
      } });
    }
    return out;
  }

  function walkingDirection() {
    const actions = [...held.values()];
    const forward = Number(actions.includes('MoveForwards')) - Number(actions.includes('MoveBackwards'));
    const side = Number(actions.includes('StrafeRight')) - Number(actions.includes('StrafeLeft'));
    return forward || side ? ctx.cam.yaw + Math.atan2(side, forward) : ctx.cam.yaw;
  }
  const scanSource = () => {
    const p=continuous(ctx.feet()??ctx.cam.pos),stamp=now();
    if(lastObservedPose&&stamp>=lastObservedPose.t){const moved=Math.hypot(...p.map((x,i)=>x-lastObservedPose.p[i]));if(moved>Math.max(3,30*(stamp-lastObservedPose.t)/1000+1))journeyEvent('frame');}
    lastObservedPose={p,t:stamp};
    const picture = cameraPicture(ctx.renderer?.());
    return { outdoors: ctx.mode() === 'exterior', cam: ctx.cam, feet: Array.from(ctx.feet() ?? ctx.cam.pos), compensation: compensation(), frame: journeyFrame(),
      picture, blocked: overlayUp() || !!(ctx.loading ?? loadingHeld)(), moving: held.size > 0, direction: walkingDirection(),
      prepare() {
        const mode = ctx.mode(), r = ctx.renderer?.();
        const things = mode === 'dungeon' ? dungeonThings(ctx.dungeon?.()) : mode === 'exterior' ? exteriorThings(ctx.exterior?.())
          : mode === 'interior' ? interiorThings(ctx.interior?.(), ctx.interiorBuildingType?.(), ctx.interiorRecords?.()) : [];
        // Fog is a conservative visibility boundary. No fogged-out shape earns a measurement.
        const fogLimit = r?._fogMode === 1 ? (r._fogRange[0] + r._fogRange[1]) / 2
          : r?._fogMode > 1 && r._fogDensity > 0 ? (r._fogMode === 3 ? Math.sqrt(Math.LN2) : Math.LN2) / r._fogDensity : picture?.far ?? 0;
        return { heightAt: ctx.heightAt, outdoorWaterAt: ctx.outdoorWaterAt, collider: ctx.collider?.(), light: lighting(), trace: picture ? sceneTrace(ctx, picture) : null, things:things.map(t=>({...t,observedId:()=>observedTargetId(t.source??t,t.kind,t.anchor)})), foes: foeCandidates(),
          waterSurfaceYAt: mode === 'dungeon' ? ctx.dungeon?.()?.waterSurfaceYAt : null,
          thingRange: mode === 'exterior' ? OUTDOOR_NAME_RANGE : VIEW_RANGE,
          range: mode === 'exterior' ? picture?.far ?? 0 : Math.min(VIEW_RANGE, picture?.far ?? 0), outdoors: mode === 'exterior', fogLimit };
      } };
  };
  const scan = createCameraScan({ now, source: scanSource });

  /** AGENT3: the weapon as a player sees it on screen: out or put away, and what it is (fists when nothing is held).
   *  combat/weaponRig.js: an attack while `sheathed` is refused without a word. */
  function weaponSheet() {
    // each place has its own rig: underground the hands are the dungeon's (dungeonContext.js: "weaponRig: () =>
    // weaponRig,   // AUDIT WORLD C1: the rig the player's hands are in underground"), and a building's sheath is its
    // own (worldModes.js "playerWeaponSheathed: () => !!interiorWeapon.playerWeapon.sheathed"). Reading the outdoor rig
    // underground said "put away" whatever the dagger did - the fight pilot's Body pressed ready for ever and never swung
    const mode = ctx.mode();
    const w = (mode === 'dungeon' ? ctx.dungeon?.()?.weaponRig?.()?.playerWeapon : null) ?? ctx.weapon?.();
    if (!w) return null;
    const inside = mode === 'interior' ? ctx.interior?.()?.playerWeaponSheathed?.() : undefined;
    const sheathed = typeof inside === 'boolean' ? inside : w.sheathed;
    return { out: !sheathed, name: w.weapon ? (shownItemName(w.weapon) ?? w.weapon.name ?? 'a weapon') : 'fists' };
  }

  /** The player's own light, and whether the spot they stand on is lit. */
  function lightSheet(l) {
    const p = ctx.feet() ?? ctx.cam.pos;
    return { carried: l.torch ? round(l.torch.range, 1) : null, here: isLit([p[0], p[1] + 1, p[2]], l) };
  }

  const bridge = {
    version: AGENT_BRIDGE_VERSION,

    /** What a player sees on the screen, as data. */
    state() {
      const e = entity;
      const light = lighting();
      const overlay = overlayUp();
      const sample = scan.read();
      if (!overlay) observationSignature = null;
      return {
        t: Math.round(now()),
        frame: journeyFrame(),             // AGENT11: opaque coordinate-frame revision, never a place identifier
        // the loading screen is up (the boot's, or a move between places): what the state says of the world is not
        // yet where the player will be - at the boot it read "exterior at 0, 0" before the cave stood
        loading: !!(ctx.loading ?? loadingHeld)(),
        mode: ctx.mode(),
        paused: !!ctx.paused(),
        overlay,
        // the page on screen NOW: a tour's box turns its pages in place, so the log's one line at its opening is not enough
        window: overlay ? windowText(ctx.topWindow?.(), docOf()) : null,
        windowKind: overlay ? shownKind() : null,   // AGENT8: a tag for its look, never its name
        pos: position(ctx.feet() ?? ctx.cam.pos),   // a motor's feet are a Float32Array
        yaw: round(ctx.cam.yaw * 180 / Math.PI, 1),
        pitch: round(ctx.cam.pitch * 180 / Math.PI, 1),
        level: e.level ?? null,
        vitals: {
          health: e.health ?? null, maxHealth: e.maxHealth ?? null,
          // fatigue is kept x64 (statMods.js FATIGUE_MULTIPLIER); shown as the sheet shows it
          fatigue: Number.isFinite(e.fatigue) ? Math.trunc(e.fatigue / FATIGUE_MULTIPLIER) : null,   // truncated, as enhancedCharSheet.js shows it
          maxFatigue: fatigueMax(e),
          magicka: e.magicka ?? null, maxMagicka: e.maxMagicka ?? null,
        },
        foes: sample.foes,
        scan: { page: sample.page, frame: sample.frame, id: sample.id, time: sample.time, fresh: scan.fresh(sample, journeyFrame()) },
        hud: visibleHud(docOf()),
        light: lightSheet(light),
        ahead: aheadText(),
        // Reuse the centre camera ray; front is no longer an extra invisible waist-height probe.
        front: sample.rays.find((r) => r.row === 0 && Math.abs(r.bearing) < 1 && r.ends === 'wall' && r.dist < FRONT_RANGE)?.dist ?? null,
        climbing: !!ctx.climbing?.(),           // on a wall, climbing or pulling up (worldModes camera()'s own test)
        weapon: weaponSheet(),                  // what the hands hold, and whether it is out: a sheathed swing does nothing
        held: [...held.values()],
        lastSeq: seq,
      };
    },

    /** AGENT14: every reader receives the same dated camera sample until its scan clock is due. */
    view() {
      const sample = scan.read();
      return { yaw: round(sample.pose.yaw * 180 / Math.PI, 1), pos: sample.pose.feet,
        rays: sample.rays, things: sample.things, scan: sample };
    },

    /** AGENT3: the game's own map of this dungeon or building, as far as the player has revealed it: the floor at
     *  the player's level, as grid cells. Null outdoors. */
    map() {
      const p = ctx.feet() ?? ctx.cam.pos;
      return readMap(p[1]);
    },

    /** AGENT6: M's open town map, including its permitted names and coloured footprints; null in other modes. */
    townMap() {
      if (ctx.mode() !== 'exterior') return null;
      const origin = ctx.townMapOrigin?.();
      return readTownMap(ctx.topWindow?.(), origin ? continuous(origin) : null, {
        pos: position(ctx.feet() ?? ctx.cam.pos), yaw: round(ctx.cam.yaw * 180 / Math.PI, 1),
      });
    },

    /** AGENT6: the game's Controls menu, independent of whether that pane is open. */
    controlsMenu() { return readControlsMenu((ctx.bindings ?? bindings)()); },

    /** AGENT9: the fight scorer's ledger (above), for the harness only: the player's kills since `after`. */
    fightLedger(after = 0) { return { kills: kills.filter((k) => k.seq > after), lastSeq: killSeq }; },

    /** AGENT12: HARNESS ONLY, as fightLedger(). Never forward to a model, sense, notebook or reflection. */
    judge() { return judge.read(); },
    _disposeJudge() { judge.dispose(); },
    windowText() {
      if (!overlayUp()) { observationSignature = null; return ''; }
      return windowText(ctx.topWindow?.(), (ctx.document ?? (() => globalThis.document))());
    },
    windowObservation() { return readObservation(); },
    scrollPanels() { return hands.scrollPanels(); },
    scroll(spec) { return hands.scroll(spec); },

    /** AGENT8: the game's Tutorials book (ui/tutorialsPane.js: "every page of systems/tutorialCatalogue.js, to read
     *  again whenever the player likes" - from the menu, even before a game starts), each page as the pane shows it,
     *  with this player's own keys in place of the action names. */
    tutorials() {
      const groups = new Map(TUTORIAL_GROUPS.map((g) => [/** @type {string} */ (g.id), g.title]));
      return TUTORIALS.map((t) => {
        const { title, body, points } = tutorialText(t, (a) => boundKeyName(a));
        return { id: t.id, group: groups.get(t.group) ?? t.group, title, text: [...body, ...points.map((p) => `- ${p}`)].join('\n') };
      });
    },

    /** AGENT2: the pack, as the inventory screen lists it to the player: each item's shown name, how many, whether
     *  it is worn or held, and the light source in use. */
    inventory() {
      const items = (entity.items ?? []).map((it) => ({
        name: shownItemName(it) ?? it?.name ?? '?',
        count: Number.isFinite(it?.stackCount) && it.stackCount > 1 ? it.stackCount : 1,
        equipped: it?.equipSlot != null,
      }));
      return { items, light: entity.lightSource ? (shownItemName(entity.lightSource) ?? 'a light') : null };
    },

    /** AGENT4: the controls a player could press in the windows on screen now, each by its words: [{ id, label, kind }]. */
    controls() { return hands.controls(); },

    /** AGENT4: press a control, named by its words ({ label }) or by its number and words together ({ id, label }). */
    choose(spec) { return hands.choose(spec); },

    /** AGENT4: type into a field (named by its words, or the only one on screen). */
    type(spec, text) { return hands.type(spec, text); },

    /** The lines the game showed since `after` (a seq from state() or an earlier read). */
    events(after = 0) {
      return { dropped, lines: log.filter((l) => l.seq > after) };
    },

    /** Press an ACTION (a binding's name, e.g. 'MoveForwards'): held until release(), or for `ms` milliseconds. */
    press(action, ms = 0) {
      const code = codeFor(action);
      if (!code) return { ok: false, why: `no key is bound to ${action}` };
      if (!held.has(code)) { held.set(code, action); if (/^(Move|Strafe)/.test(action)) scan.wake(); dispatch('keydown', code); }
      if (ms > 0) {
        const id = setTimeout(() => { timers.delete(id); bridge.release(action); }, ms);
        timers.add(id);
      }
      return { ok: true, code };
    },

    release(action) {
      const code = codeFor(action);
      if (!code || !held.has(code)) return { ok: false };
      held.delete(code);
      dispatch('keyup', code);
      return { ok: true };
    },

    /** Turn the view, in the input hooks' own units (the mouse's pixels). */
    look(dx, dy = 0) { scan.wake(); ctx.hooks.look(Number(dx) || 0, Number(dy) || 0); return { ok: true }; },

    /** A swing: the attack hook held for `ms`, with a drag of (dx, dy) as the mouse or a swipe gives. */
    swing(dx = 0, dy = 0, ms = 250) {
      ctx.hooks.attack(Number(dx) || 0, Number(dy) || 0, true);
      const id = setTimeout(() => { timers.delete(id); ctx.hooks.attack(0, 0, false); }, Math.max(16, ms));
      timers.add(id);
      return { ok: true };
    },

    /** Let go of everything: every held key up, every pending release run now. */
    releaseAll() {
      for (const id of timers) clearTimeout(id);
      timers.clear();
      ctx.hooks.attack(0, 0, false);
      for (const code of [...held.keys()]) { held.delete(code); dispatch('keyup', code); }
      return { ok: true };
    },

    _scan: ({ fresh = false } = {}) => { if (fresh) scan.wake(); return scan.read(); },
    _note: note,   // for the presenter below and for tests

    /** For the person building the agent, never its models: what the collider answers around the player - its
     *  bucket count and a ray every 45 degrees at three heights (knee, eye, head), out to `max` metres. */
    /** BUILDER-ONLY (like _probe): what the scan is working from, and one ray straight ahead - for diagnosing it. */
    _scanDebug() {
      const s = scanSource(), prep = s.picture ? s.prepare() : null, pic = s.picture, r = ctx.renderer?.();
      const ec = ctx.mode() === 'exterior' ? ctx.exterior?.() : null;
      let pixels = 0, visible = 0;
      for (const p of ec?.pixels ?? []) { pixels++; if (p._visible) visible++; }
      const budget = { queries: 10, cells: 8192, candidates: 32768 };
      const why = [];
      const hit = prep?.trace && pic ? prep.trace(pic.eye, pic.forward, prep.range, budget, why) : null;
      const raw = pic ? ctx.collider?.()?.raycastHit?.(pic.eye, pic.forward, 800) : null;
      const down = pic ? ctx.collider?.()?.raycastHit?.(pic.eye, [0, -1, 0], 50) : null;
      const firstPixel = (() => { for (const p of ec?.pixels ?? []) if (p._visible) return { samples: !!p.samples, batches: p.batches?.length ?? 0, place: (p.batches ?? []).map((b) => (b._place?.pts?.length ?? 0) / 3).slice(0, 6), deepHide: !!p.deepWaters?.hide, stride: p._stride ?? null }; return null; })();
      return { mode: ctx.mode(), blocked: s.blocked, picture: pic ? { far: pic.far, eye: pic.eye, p10: pic.projection[10], p14: pic.projection[14] } : null,
        fogMode: r?._fogMode ?? null, fogRange: r?._fogRange ? Array.from(r._fogRange) : null, fogDensity: r?._fogDensity ?? null,
        range: prep?.range ?? null, fogLimit: prep?.fogLimit ?? null, light: prep?.light ?? null, pixels, visible,
        heightAt: typeof ctx.heightAt === 'function', outdoorWaterAt: typeof ctx.outdoorWaterAt === 'function',
        raycastHit: typeof ctx.collider?.()?.raycastHit === 'function', hit, why: why.slice(0, 12), budgetAfter: budget,
        raw: raw ? { dist: raw.dist, key: String(raw.key) } : null, down: down ? { dist: down.dist, key: String(down.key) } : null, firstPixel,
        forward: pic?.forward ?? null };
    },
    _probe(max = 200) {
      const c = ctx.collider?.();
      const p = ctx.feet() ?? ctx.cam.pos;
      const rays = [];
      for (let deg = 0; deg < 360; deg += 45) {
        const a = ctx.cam.yaw + (deg * Math.PI) / 180;
        const dir = [Math.sin(a), 0, Math.cos(a)];
        rays.push({ deg, hits: [0.5, EYE_HEIGHT, 3].map((h) => { const d = c?.raycast?.([p[0], p[1] + h, p[2]], dir, max); return Number.isFinite(d) ? round(d, 1) : null; }) });
      }
      return { buckets: c?._buckets?.length ?? null, feet: Array.from(p, (v) => round(v)), rays };
    },
  };
  return bridge;
}

/**
 * Stand the bridge at window.__agent - unless the page is online. Returns the bridge, or null when refused.
 * @param {Parameters<typeof createAgentBridge>[0]} ctx
 */
export function installAgentBridge(ctx) {
  current?.releaseAll?.();
  current?._disposeJudge?.();
  current?._disposeScan?.();
  const bridge = createAgentBridge(ctx);
  const scanClock = setInterval(() => bridge._scan(), 50);
  /** @type {any} */ (scanClock).unref?.();   // A Node fake has no page lifetime to own the clock.
  bridge._disposeScan = () => clearInterval(scanClock);
  setDeathListener('agent-journey', () => journeyEvent('death'));
  // The message boxes, heard and passed on: asked first (the highest priority), answering false so the host's own
  // presenter still shows every one.
  registerPresenter({ priority: 1e9, mount(win) { bridge._note('window', windowText(win, null)); return false; } });
  // AGENT2: EVERY LINE A PLAYER READS. Each host keeps its own popup column (ui/hudText.js - the dungeon's, the
  // town's) and the middle of the screen has its own line (ui/midScreenText.js: "You are too far away"), and none of
  // them passes through notify. So the two writers are heard at their source: the words recorded, then shown exactly
  // as before. Once per page; the bridge of the moment is the one that hears.
  current = bridge;
  hearOnce(HudText.prototype, 'add', 'hud');
  hearOnce(MidScreenText.prototype, 'set', 'mid');  /** @type {any} */ (globalThis).__agent = bridge;
  console.log(`[agent] the agent mode stands (v${AGENT_BRIDGE_VERSION})`);
  return bridge;
}

/** The bridge standing now, for the writers' listeners. */
let current = null;
const HEARD = Symbol('agent hears');

/** Wrap a text writer once: note its first argument's words, then write as it always did. */
function hearOnce(proto, method, kind) {
  const original = proto[method];
  if (typeof original !== 'function' || original[HEARD]) return;
  const heard = function (text, ...rest) {
    try { const t = String(text ?? '').trim(); if (t) current?._note(kind, t); } catch { /* hearing never breaks the writing */ }
    return original.call(this, text, ...rest);
  };
  heard[HEARD] = true;
  proto[method] = heard;
}

/** AGENT8: what kind of window this is, as its LOOK tells a player - a tutorial's box, a merchant's list - without
 *  the words for it: a short tag, the same for every window of a kind, that says nothing of what the kind is. The agent
 *  names the kinds itself as it learns them (the workspace's notebook). */
export function windowKind(win) {
  const name = String(win?.constructor?.name ?? 'window');
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619) >>> 0;
  return `w${(h % 46656).toString(36).padStart(3, '0')}`;
}

/** The strings in a row: a string, a token's `text`, or an array of either (one level of nesting per call). */
function rowText(r, depth = 0) {
  if (typeof r === 'string') return r;
  if (Array.isArray(r) && depth < 3) return r.map((x) => rowText(x, depth + 1)).join('');
  if (Array.isArray(r?.cells)) return r.cells.map((c) => rowText(c, depth + 1)).join('  ');
  return typeof r?.text === 'string' ? r.text : '';
}

/** AGENT7: read the current face, never a constructor name or a queued page.
 *  actionText.js: "if (this._next.length) { this.lines = this._next.shift(); return; }";
 *  tutorials.js: "rows.push({ text: pages > 1 ? `${title}  (${page} of ${pages})` : title, center: true, cls: 'tut-title' });"
 *  so the tour's shown title/count already belong to its current lines. daedraSummonedWindow.js:
 *  "this.chunk.forEach((text, i) => {" draws only the current chunk, not all of `lines`.
 *  guildServiceWindows.js: "if (t.field) { this._box = null; noticeRelease(this); this._input?.draw(renderer, canvas, font); return; }"
 *  and "this._picker?.draw(renderer, canvas, font);" replace the rows completely. */
export function windowText(win, doc = globalThis.document) {
  return (renderedWindowObservation(doc) ?? classicWindowObservation(win))?.text ?? '';
}

/** Classic fallback shares precisely the current-page reader with windowText; no queued/hidden rows. */
function classicWindowObservation(win) {
  if (!win || win.done) return null;
  const box = win.top && typeof win.top === 'object' ? win.top : null;
  const field = box?.field ? win._input ?? { lines: box.rows, label: box.field.label, value: win.value ?? box.field.initial } : null;
  const picker = box?.picker ? win._picker ?? { items: box.picker } : null;
  // listPicker.js: "this.items.slice(this.scrollIndex, this.scrollIndex + this.rowsDisplayed).forEach((label, r) => {"
  const list = picker ?? (Array.isArray(win.items) && Number.isFinite(win.rowsDisplayed) ? win : null);
  let rows;
  if (field) rows = field.lines;
  else if (list) rows = list.items.slice(list.scrollIndex ?? 0, (list.scrollIndex ?? 0) + (list.rowsDisplayed ?? list.items.length));
  else if (Array.isArray(win.chunk)) rows = win.chunk;
  // playerHistory.js: "const MAX_PAGE_LINES = 21;" and "for (let i = this.pageStartLine; i < lines.length; i++) {"
  else if (Number.isFinite(win.pageStartLine) && Array.isArray(win.lines)) rows = win.lines.slice(win.pageStartLine, win.pageStartLine + 21);
  else rows = box ? box.rows : win.lines ?? win.rows ?? win.text;
  const title = typeof win.title === 'string' ? win.title.trim() : '';
  const parts = [];
  if (title) parts.push(title);
  parts.push(Array.isArray(rows) ? rows.map((r) => rowText(r)).join('\n').trim() : typeof rows === 'string' ? rows.trim() : '');
  if (field || (typeof win.label === 'string' && typeof win.value === 'string')) {
    // inputMessageBox.js draws the label and current value together; the blinking caret is not a text change.
    const f = field ?? win;
    parts.push(`${f.label ?? ''}${f.value ?? ''}`);
  }
  if (box?.buttons === 'YesNo') parts.push('[Yes / No]');
  // yesNoBox.js: "owner.okOnly ? OK_LABEL : YES_NO_LABELS.yes"; the screen says OK, Yes and No.
  if (typeof win.okOnly === 'boolean') parts.push(win.okOnly ? '[OK]' : '[Yes / No]');
  if (Array.isArray(win.options)) parts.push(...win.options.map((o) => o.label ?? ''));
  const text = parts.filter((p) => p !== '').join('\n').trim();
  // The tutorial/quest notice painters put their shown title in a row, not a separate window property.
  const titleRow = Array.isArray(rows) ? rows.find((r) => /(?:^|[\s-])title(?:$|[\s-])/.test(r?.cls ?? '')) : null;
  const shownTitle = title || (titleRow ? rowText(titleRow).trim() : '') || null;
  const titleStart = shownTitle ? text.indexOf(shownTitle) : -1;
  const body = titleStart >= 0 ? (text.slice(0, titleStart) + text.slice(titleStart + shownTitle.length))
    .replace(/^\n|\n$/g, '').replace(/\n\n/g, '\n') : text;
  const visibleRows = Array.isArray(rows) ? rows.filter((r) => r !== titleRow).map((r) => rowText(r)).filter((r) => r.trim()) : [];
  let cursor = title ? title.length : 0;
  const observedRows = visibleRows.map((r) => {
    const label = r.trim(), start = text.indexOf(label, cursor);
    if (start < 0) return { text: label, span: null };
    cursor = start + label.length;
    return { text: label, span: [start, cursor] };
  });
  return { title: shownTitle, body, text, rows: observedRows };
}
