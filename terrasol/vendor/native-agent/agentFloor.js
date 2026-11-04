// @ts-check
// VISIBLE-FLOOR: engine geometry is only a candidate source. Nothing is delivered before an eye test.
const CELL = 0.5, CACHE_MAX = 32768;
const round = (n) => Math.round(n * 1000) / 1000;

// Collider triangles already carry addMesh's placement matrix. Only the bucket's live rigid pose remains.
function placed(p, t, r) {
  return r ? [0, 1, 2].map((i) => t[i] + r[i]*p[0] + r[3+i]*p[1] + r[6+i]*p[2]) : p.map((v,i) => v+t[i]);
}

// Yield work as well as candidates, so even a huge mesh/triangle resumes within the existing sample budgets.
function* raster(states, bounds) {
  for (const {bucket, t, r} of states) for (const tri of bucket.tris) {
    yield { work: 'triangle' };
    const [a,b,c] = tri.map((p) => placed(p,t,r));
    const u=b.map((v,i) => v-a[i]), v=c.map((v,i) => v-a[i]);
    const nx=u[1]*v[2]-u[2]*v[1], ny=u[2]*v[0]-u[0]*v[2], nz=u[0]*v[1]-u[1]*v[0];
    if (!(ny/Math.hypot(nx,ny,nz) >= 0.7)) continue;
    const x0=Math.max(bounds[0],Math.floor(Math.min(a[0],b[0],c[0])/CELL));
    const x1=Math.min(bounds[1],Math.floor(Math.max(a[0],b[0],c[0])/CELL));
    const z0=Math.max(bounds[2],Math.floor(Math.min(a[2],b[2],c[2])/CELL));
    const z1=Math.min(bounds[3],Math.floor(Math.max(a[2],b[2],c[2])/CELL));
    const area=(b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]);
    for (let ix=x0;ix<=x1;ix++) for (let iz=z0;iz<=z1;iz++) {
      const x=(ix+0.5)*CELL, z=(iz+0.5)*CELL;
      const w0=((b[0]-x)*(c[2]-z)-(c[0]-x)*(b[2]-z))/area;
      const w1=((c[0]-x)*(a[2]-z)-(a[0]-x)*(c[2]-z))/area, w2=1-w0-w1;
      yield { work:'cell', cell:w0>=-1e-7 && w1>=-1e-7 && w2>=-1e-7
        ? {ix,iz,height:round(w0*a[1]+w1*b[1]+w2*c[1])} : null };
    }
  }
}

/** Per scan clock: cached candidate geometry, round-robin eye tests. No cached visibility decisions. */
export function createVisibleFloor() {
  let previous=[], region='', iterator=null, cells=[], keys=new Set(), cursor=0;
  return (s, budget, visible, rayLimit=200) => {
    const floor=[], water=[];
    if (s.outdoors || s.blocked || !s.picture || !s.collider?._buckets || !s.collider?.raycastHit) return {floor,water};
    const c=s.compensation ?? [0,0,0], range=Math.min(s.range ?? 30,s.fogLimit,s.picture.far);
    if (!(range>0)) return {floor,water};
    const x=Math.floor((s.feet[0]-c[0])/8)*8, z=Math.floor((s.feet[2]-c[2])/8)*8;
    const nextRegion=JSON.stringify([s.frame,x,z,range]);
    const states=[...s.collider._buckets.values()].map((bucket) => {
      const r=bucket.r?.();
      return {bucket, count:bucket.tris.length,t:Array.from(bucket.t(),(v,i) => v-c[i]),r:r ? Array.from(r) : null};
    });
    const same=nextRegion===region && states.length===previous.length && states.every((p,i) => {
      const q=previous[i]; return p.bucket===q.bucket && p.count===q.count && p.t.every((v,j) => v===q.t[j]) &&
        JSON.stringify(p.r)===JSON.stringify(q.r);
    });
    if (!same) {
      region=nextRegion; previous=states; cells=[]; keys=new Set(); cursor=0;
      iterator=raster(states,[Math.floor((x-range)/CELL),Math.ceil((x+8+range)/CELL),
        Math.floor((z-range)/CELL),Math.ceil((z+8+range)/CELL)]);
    }
    while (iterator && budget.candidates>0 && budget.cells>0 && cells.length<CACHE_MAX) {
      const next=iterator.next();
      if (next.done) { iterator=null; break; }
      if (next.value.work==='triangle') budget.candidates--; else budget.cells--;
      const p=next.value.cell;
      if (!p) continue;
      const key=`${p.ix},${p.iz},${p.height}`;
      if (!keys.has(key)) { keys.add(key); cells.push(p); }
    }
    // All cells are eventually tested, including the far ones; never thin a fixed spatial subset into holes.
    let rays=0;
    for (let tried=0; tried<cells.length && budget.candidates>0 && budget.queries>0 && rays<rayLimit; tried++) {
      budget.candidates--;
      const p=cells[cursor++ % cells.length], at=[(p.ix+0.5)*CELL+c[0],p.height+c[1]+0.2,(p.iz+0.5)*CELL+c[2]];
      if (Math.hypot(...at.map((v,i) => v-s.picture.eye[i]))>range) continue;
      // visible first applies picture/light/fog, then spends exactly one ray from the eye. Water is classified
      // using the engine block plane, rather than mistaking a submerged upward triangle for dry ground.
      if (!visible(at,() => rays++)) continue;
      const surface=s.waterSurfaceYAt?.(at[0],at[2]);
      (Number.isFinite(surface) && p.height+c[1]<surface ? water : floor).push({...p});
    }
    return {floor,water};
  };
}
