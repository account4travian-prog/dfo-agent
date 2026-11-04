// One observed grid for memory and feet. M-map marks remain a separate picture layer.
import { supportedGraph, traceRoute } from '../body/core.mjs';
// GAZE-BRIEF: snapshot surfaces now also include this level's revealed indoor automap floor.
export const walkable = (_playerMap, snapshot) => supportedGraph(snapshot);
export const findRoute = (graph, x0, z0, x1, z1, level = 0, options = {}) => traceRoute(graph, x0, z0, x1, z1, level, options);
export function navigationFor(state, snapshot, goal, revision = 0) {
  const graph = supportedGraph(snapshot), target = goal.target ?? goal;
  const ix=Math.floor(state.pos[0]/0.5),iz=Math.floor(state.pos[2]/0.5);
  const local=(x,z,l) => Math.abs(x-ix)<=64 && Math.abs(z-iz)<=64 && Math.abs(l-snapshot.level)<=1;
  graph.nodes=graph.nodes.filter((n) => local(n.ix,n.iz,n.level)).slice(0,20000);
  graph.blocked=graph.blocked.filter(([x,z,l]) => local(x,z,l)).slice(0,20000);
  return { page: state.scan?.page, frame: state.frame, visit: snapshot.key, revision: snapshot.revision,
    goalRevision: revision, level: snapshot.level, graph,
    route: findRoute(graph, state.pos[0], state.pos[2], target.x, target.z, snapshot.level) };
}
// Options beyond the first six frontiers in the order the nodes were stored (what the strategist is offered):
//   open    a neighbour that is a known obstacle (wall, water, ledge, shut door) is not unknown ground
//   nearest candidates are tried nearest to the feet first, so a limited number of tries still finds the near ones
//   tries   how many route searches are made (default: as many as there are candidates, up to 256)
//   skip    (x, z) => true leaves a candidate out (a frontier already visited)
//   routes  each answer carries its route's points, so a caller can tell a frontier on the way to a farther one
//   partial an edge of fully-seen floor cannot be stood on (the body's width reaches past it): its route ends short of it, and
//           the point where it ends, if within a metre, stands for it
export function frontiers(graph, x, z, _walls = null, { max = 6, level = 0, open = false, nearest = false, tries = 256, skip = null, routes = false, partial = false } = {}) {
  if (!graph?.nodes) return [];
  const keys = new Set(graph.nodes.map((n) => `${n.ix},${n.iz},${n.level}`));
  const known = open ? new Set((graph.blocked ?? []).map(([bx, bz, bl]) => `${bx},${bz},${bl}`)) : null;
  const unknown = (ix, iz) => !keys.has(`${ix},${iz},${level}`) && !known?.has(`${ix},${iz},${level}`);
  const at = (n) => [n.x ?? (n.ix + 0.5) * 0.5, n.z ?? (n.iz + 0.5) * 0.5];
  let candidates = graph.nodes.filter((n) => n.level === level && [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz]) => unknown(n.ix+dx, n.iz+dz)));
  if (nearest) candidates = candidates.filter((n) => !skip?.(...at(n))).map((n) => ({ n, d: Math.hypot(at(n)[0] - x, at(n)[1] - z) })).sort((a, b) => a.d - b.d).map((c) => c.n);
  else candidates = candidates.slice(0, 256).filter((n) => !skip?.(...at(n)));
  const out = [];
  let searched = 0;
  for (const n of candidates) {
    const [tx, tz] = at(n);
    if (out.some((e) => Math.hypot(e.x - tx, e.z - tz) < 2)) continue;
    if (searched++ >= tries) break;
    const r = findRoute(graph, x, z, tx, tz, level);
    const end = r.points.at(-1);
    const short = partial && r.status === 'partial' && end && Math.hypot(end[0] - tx, end[1] - tz) <= 1;
    if (r.status !== 'complete' && !short) continue;
    let walk = 0, prev = [x,z]; for (const p of r.points) { walk += Math.hypot(p[0]-prev[0],p[1]-prev[1]); prev=p; }
    if (short && (walk < 0.5 || skip?.(end[0], end[1]))) continue;
    out.push({ x: short ? end[0] : tx, z: short ? end[1] : tz, walk, size: 0.5, ...(routes ? { route: r.points } : {}) });
    if (out.length >= max) break;
  }
  return out.sort((a,b) => a.walk-b.walk);
}
