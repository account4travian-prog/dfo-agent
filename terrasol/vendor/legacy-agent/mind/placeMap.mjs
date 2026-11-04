// Observed geometry. Seen ground cells can plan a route; no space between hits is filled.
import { footingSupport, onFooting, SCAN_MAX_AGE_MS, scanFloorPoints, overheadHit, foeBodyHit, foeFootprints } from '../body/core.mjs';
export const CELL = 0.5;
export const levelOf = (y = 0) => Math.round(y / 3);
const kinds = new Set(['ground', 'support', 'wall', 'prop', 'tree', 'water', 'ledge', 'door', 'open', 'unknown']);
const finitePoint = (p) => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite);
export const sampleOrigin = (s) => s?.page != null && s?.frame != null ? `${s.page}:${s.frame}` : null;

export function createSessionMap() {
  const chunks = new Map(), seen = new Set(), strips = [], openings = [];
  let revision = 0, foeTrail=[];
  function put(x, z, level, observation) {
    const ix = Math.floor(x / CELL), iz = Math.floor(z / CELL);
    const ck = `${Math.floor(ix / 32)},${Math.floor(iz / 32)},${level}`;
    if (!chunks.has(ck)) chunks.set(ck, new Map());
    const chunk = chunks.get(ck), k = `${ix},${iz},${level}`;
    const old = chunk.get(k);
    if(observation.kind==='support'&&old?.faces)observation={...observation,faces:old.faces,unresolved:old.unresolved,unknownFaces:old.unknownFaces,badFaces:old.badFaces};
    // Trial 10: retain observed floor and all axis-aligned wall faces in a cell.
    if (observation.kind==='wall') {
      const a=observation.at,n=observation.normal;
      const valid=finitePoint(a)&&finitePoint(n)&&Math.abs(n[1])<0.001&&
        (Math.abs(n[0])>0.999&&Math.abs(n[2])<0.001 || Math.abs(n[2])>0.999&&Math.abs(n[0])<0.001);
      const faces=[];
      const samePlane=(f,g)=>f[2]===g[2]&&f[3]===g[3]&&Math.abs((f[0]-g[0])*g[2]+(f[1]-g[1])*g[3])<0.001;
      for(const f of [...(old?.faces ?? []),...(observation.faces ?? [])])if(!faces.some(g=>samePlane(f,g)))faces.push(f);
      if(valid) {
        const face=[a[0],a[2],Math.abs(n[0])>0.999?Math.sign(n[0]):0,Math.abs(n[2])>0.999?Math.sign(n[2]):0];
        if(!faces.some(f=>samePlane(f,face)))faces.push(face);
      }
      const unknown=[...(old?.unknownFaces ?? []),...(observation.unknownFaces ?? []),...(!n&&finitePoint(a)?[[a[0],a[2]]]:[])];
      const pending=unknown.filter(([x,z])=>!faces.some(([fx,fz,nx,nz])=>Math.abs((x-fx)*nx+(z-fz)*nz)<0.001));
      const badFaces=faces.length>8||pending.length>8||!!old?.badFaces||!!observation.badFaces||!!n&&!valid;
      observation={...observation,faces:faces.slice(0,8),unknownFaces:pending.slice(0,8),badFaces,unresolved:badFaces||pending.length>0,
        ground:old?.kind==='support'&&old.usable&&old.coverage==='full'?old.height:old?.ground ?? observation.ground};
    }
    // Out-of-order batches remain history; they cannot replace newer hazards.
    const history = [...(old?.history ?? []), observation].slice(-8);
    // A blank ray cannot erase remembered support or a seen hazard (GAZE-BRIEF).
    if (old && (observation.kind === 'unknown' && observation.coverage !== 'blocked' ||
        observation.kind === 'support' && !observation.usable && (old.usable || old.plannable && !observation.plannable || !['support','unknown'].includes(old.kind)))) {
      chunk.set(k, { ...old, history }); return;
    }
    chunk.set(k, old && old.time > observation.time ? { ...old, history } : { ix, iz, level, confidence:observation.usable?'verified':'point or uncertain', ...observation, history });
  }
  return {
    // Only another in-run observed map is merged; never a game layout or a disk object.
    merge(other) {
      if (other===this) return;
      const s = other.snapshot();
      for (const p of s.surfaces) put(p.ix * CELL, p.iz * CELL, p.level, p);
      strips.push(...s.strips); strips.sort((a,b) => b.time-a.time); strips.length = Math.min(strips.length,256);
      openings.push(...s.openings); openings.sort((a,b)=>b.time-a.time); openings.length=Math.min(openings.length,512);
      revision++;
    },
    rememberFloor(map, height) {
      if (!map || !Number.isFinite(height) || ![0.5,1].includes(map.cell) || !Array.isArray(map.cells)) return false;
      const heights = new Map((map.floors ?? []).map((p) => [`${p.ix},${p.iz}`,p.height]));
      let changed = false;
      for (const cell of map.cells.slice(0,20000)) {
        if (!Array.isArray(cell) || cell.length !== 2 || !cell.every(Number.isInteger)) continue;
        const [x,z] = cell, y = heights.get(`${x},${z}`) ?? height;
        if (!Number.isFinite(y) || Math.abs(y-height) > 1.6) continue;
        for (let dx=0; dx<map.cell/CELL; dx++) for (let dz=0; dz<map.cell/CELL; dz++) {
          const wx=x*map.cell+dx*CELL, wz=z*map.cell+dz*CELL, level=levelOf(y);
          const old=chunks.get(`${Math.floor(wx/CELL/32)},${Math.floor(wz/CELL/32)},${level}`)?.get(`${Math.floor(wx/CELL)},${Math.floor(wz/CELL)},${level}`);
          if (old && (old.kind !== 'support' || old.usable)) continue;
          put(wx,wz,level,{kind:'support',height:y,time:old?.time ?? 0,ref:'player automap',coverage:'full',usable:true,clearance:1.8});
          changed=true;
        }
      }
      if (changed) revision++;
      return changed;
    },
    ingest(s, context = {}) {
      if (s?.version !== 1 || !sampleOrigin(s) || !Number.isFinite(s.time) || !finitePoint(s.pose?.feet)) return false;
      const ref = `${sampleOrigin(s)}:${s.id}`;
      if (seen.has(ref)) return false;
      seen.add(ref); revision++;
      if (s.blocked) return true;
      const level = levelOf(s.pose.feet[1]);
      // Trial 8: a visible moving body must not paint a permanent prop wall into the shared route graph.
      const origin=sampleOrigin(s);
      foeTrail=[...foeTrail.filter((p) => p.origin===origin && s.time-p.time<=1000 && s.time>=p.time),
        ...foeFootprints(s).map((p) => ({...p,origin}))].slice(-128);
      if (foeTrail.length) for (const chunk of chunks.values()) for (const [key,p] of chunk) if (foeBodyHit({ends:p.kind,at:p.at},foeTrail)) chunk.delete(key);
      // Dense pictured floor is seen-supported memory, for both planning and the live guard. No interpolation.
      // Bind its admission to the same freshness rule as camera-ground planning hits.
      if ((context.frame ?? s.frame)===s.frame && (context.time ?? s.time)>=s.time &&
          (context.time ?? s.time)-s.time<=(context.maxAge ?? SCAN_MAX_AGE_MS)) {
        for (const p of scanFloorPoints(s)) put(p.at[0],p.at[2],levelOf(p.at[1]),{
          kind:p.ends==='ground'?'support':'water',height:p.at[1],time:s.time,ref,
          coverage:'full',usable:p.ends==='ground',clearance:p.ends==='ground'?1.8:undefined});
      }
      // A ray miss has no hit point in AGENT14. Remember its bearing/reach separately, never as floor.
      for (const r of s.rays ?? []) if (r.row===0 && r.ends==='open' && Number.isFinite(r.bearing) &&
          Number.isFinite(r.dist) && r.dist>0 && Number.isFinite(s.pose.yaw)) {
        const heading=(s.pose.yaw+r.bearing*Math.PI/180), reach=r.dist*Math.cos(s.pose.pitch ?? 0);
        const o={x:s.pose.feet[0],z:s.pose.feet[2],heading,reach,level,time:s.time,ref};
        const old=openings.findIndex((p)=>p.level===level && Math.hypot(p.x-o.x,p.z-o.z)<0.5 && Math.abs(p.heading-heading)<0.05);
        if (old<0) openings.push(o); else if (openings[old].time<=o.time) openings[old]=o;
      }
      openings.sort((a,b)=>b.time-a.time); openings.length=Math.min(openings.length,512);
      // AGENT14 camera rays already pass picture, occlusion, light and fog filters. Footing can
      // include off-screen remembered probes, so only camera hits earn seen-cell planning support.
      const hits = [...(s.rays ?? []).map((h) => ({...h, ends:h.ends==='tree/prop'?'prop':h.ends, camera:true})), ...(s.footing ?? [])].map((h) => ({...h, point:h.at ?? h.point})).filter((h) => !overheadHit(h,s.pose.feet[1]) && !foeBodyHit(h,foeTrail));
      for (const h of hits) {
        if (!finitePoint(h.point)) continue;
        const kind = kinds.has(h.ends) ? h.ends === 'ground' ? 'support' : h.ends : 'unknown';
        put(h.point[0], h.point[2], ['support','water'].includes(kind)?levelOf(h.point[1]):level, { kind, at:[...h.point], normal:h.normal, height: h.point[1], time: s.time, ref,
          coverage: 'point', usable: false, plannable:kind==='support' && h.camera===true &&
            h.lit!==false && h.visible!==false && h.inView!==false && h.pictured!==false &&
            (context.frame ?? s.frame)===s.frame && (context.time ?? s.time)>=s.time &&
            (context.time ?? s.time)-s.time<=(context.maxAge ?? SCAN_MAX_AGE_MS) });
      }
      // The amendment admits contiguous three-line footing. Keep its narrow footprint, not full grid cells.
      const derived = footingSupport(s, context);
      if (derived) {
        strips.unshift({...derived, time:s.time, ref}); strips.sort((a,b) => b.time-a.time); strips.length = Math.min(strips.length,256);
        // A door that moved can leave visible floor behind; water/ledge memory still wins (GAZE-BRIEF).
        for (const chunk of chunks.values()) for (const p of chunk.values()) if (p.kind==='door' && p.time<s.time &&
            p.level===level && onFooting(derived,(p.ix+0.5)*CELL,(p.iz+0.5)*CELL,0)) {
          put((p.ix+0.5)*CELL,(p.iz+0.5)*CELL,p.level,{kind:'support',height:p.height,time:s.time,ref,coverage:'strip',usable:true});
        }
      }
      // Explicit patches remain the optional, stronger source of full-cell support and headroom.
      for (const p of s.patches ?? []) {
        if (s.coverage?.patches !== true || p.usable !== true || p.ends !== 'ground' ||
            !Array.isArray(p.bounds) || p.bounds.length !== 4 || !p.bounds.every(Number.isFinite) ||
            !Number.isFinite(p.height) || !Number.isFinite(p.clearance) || !(p.clearance >= 1.8)) continue;
        const [x0, z0, x1, z1] = p.bounds;
        if (x1 < x0 || z1 < z0 || (x1 - x0) * (z1 - z0) > 256) continue;
        for (let ix = Math.ceil(x0 / CELL); (ix + 1) * CELL <= x1; ix++) {
          for (let iz = Math.ceil(z0 / CELL); (iz + 1) * CELL <= z1; iz++) {
            put(ix * CELL, iz * CELL, levelOf(p.height), { kind: 'support', height: p.height,
              clearance: p.clearance, time: s.time, ref, coverage: 'full', usable: true });
          }
        }
      }
      // Point hazards win over a patch in the same exposure.
      for (const h of hits) if (finitePoint(h.point) && ['water', 'ledge', 'wall', 'prop', 'tree', 'door'].includes(h.ends)) {
        put(h.point[0], h.point[2], h.ends==='water'?levelOf(h.point[1]):level, { kind: h.ends, at:[...h.point], normal:h.normal, height: h.point[1], time: s.time, ref, coverage: 'point', usable: false });
      }
      return true;
    },
    invalidate(x, z, level, time) { revision++; put(x, z, level, { kind: 'unknown', usable: false, coverage: 'blocked', time, ref: 'observed blockage' }); },
    snapshot() { return { revision, cell: CELL, chunks: [...chunks.keys()], surfaces: [...chunks.values()].flatMap((c) => [...c.values()]), strips, openings }; },
  };
}
