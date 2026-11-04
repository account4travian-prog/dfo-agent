// Eight absolute bearings from earned observations only. Points do not fill gaps between rays.
const BEARINGS=['N','NE','E','SE','S','SW','W','NW'];
const sector=(x,z) => Math.round((Math.atan2(x,z)*180/Math.PI+360)/45)%8;
export function rememberedSurroundings(snap,state) {
  const [x,,z]=state.pos ?? [0,0,0], now=Math.max(state.t ?? 0,state.scan?.time ?? 0,snap.time ?? 0);
  const current=state.scan?.fresh===true && state.frame===state.scan.frame ? `${state.scan.page}:${state.scan.frame}:${state.scan.id}` : null;
  const stamp=(o) => o.ref && o.ref===current ? 'now' : Number.isFinite(o.time) ? `${Math.max(1,Math.ceil((now-o.time)/1000))}s` : 'old';
  const buckets=BEARINGS.map(() => []), pts=[];
  for (const s of snap.surfaces ?? []) {
    if (s.level!==snap.level || s.kind==='unknown') continue;
    const px=(s.ix+0.5)*0.5,pz=(s.iz+0.5)*0.5,d=Math.hypot(px-x,pz-z);
    buckets[sector(px-x,pz-z)].push({...s,d}); pts.push([px,pz]);
  }
  for (const [cx,cz] of snap.cells ?? []) pts.push([(cx+0.5)*snap.cell,(cz+0.5)*snap.cell]);
  for (const o of snap.openings ?? []) if (o.level===snap.level && Math.hypot(o.x-x,o.z-z)<1) {
    // After moving, an old clear sightline does not establish a new opening from today's position.
    const px=o.x+Math.sin(o.heading)*o.reach,pz=o.z+Math.cos(o.heading)*o.reach;
    pts.push([px,pz]);
    buckets[sector(px-x,pz-z)].push({...o,kind:'open',d:Math.hypot(px-x,pz-z)});
  }
  const dates=[];
  const bearingLines=buckets.map((list,i) => {
    list.sort((a,b)=>a.d-b.d);
    const edge=list.find((s)=>['wall','prop','tree','door','open'].includes(s.kind));
    const water=list.find((s)=>s.kind==='water'),ledge=list.find((s)=>s.kind==='ledge');
    const ground=list.filter((s)=>s.kind==='support').at(-1);
    const features=[edge,water,ledge,ground].filter(Boolean);
    if (!features.length) return `${BEARINGS[i]} ?`;
    const words=features.map((s)=>`${s.kind==='support'?'g':s.kind}${Math.round(s.d)}`);
    const ages=features.map(stamp);
    dates.push(...ages);
    return `${BEARINGS[i]} ${words.map((w,k)=>ages.every((a)=>a===ages[0])?w:`${w}@${ages[k]}`).join('/')}@${ages.every((a)=>a===ages[0])?ages[0]:''}`.replace(/@$/,'');
  });
  const things=(snap.things ?? []).filter((t)=>t.level===snap.level).map((t)=>({...t,d:Math.hypot(t.x-x,t.z-z)}))
    .sort((a,b)=>(['door','exit door','opening'].includes(a.kind)?0:1)-(['door','exit door','opening'].includes(b.kind)?0:1)||a.d-b.d);
  const labels=things.slice(0,3).map((t)=>`${t.kind==='exit door'?'exit':t.kind} ${BEARINGS[sector(t.x-x,t.z-z)]}${Math.round(t.d)}@${stamp(t)}`);
  dates.push(...things.slice(0,3).map(stamp));
  for (const t of things) pts.push([t.x,t.z]);
  let extent='';
  if (pts.length) {
    let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
    for (const [px,pz] of pts) {minX=Math.min(minX,px);maxX=Math.max(maxX,px);minZ=Math.min(minZ,pz);maxZ=Math.max(maxZ,pz);}
    extent=`; extent ${Math.ceil(maxX-minX+0.5)}x${Math.ceil(maxZ-minZ+0.5)}m`;
  }
  const counts=new Map();for (const d of dates) counts.set(d,(counts.get(d) ?? 0)+1);
  const common=[...counts].sort((a,b)=>b[1]-a[1])[0]?.[0];
  const ageText=common==='now'?'seen now':common==='old'?'remembered, age unknown':`remembered ${common} ago`;
  let details=`${bearingLines.join('; ')}${labels.length?`; ${labels.join('; ')}`:''}`;
  if (common) details=details.split(`@${common}`).join('');
  return `surroundings (m; g=ground points; gaps/beyond unknown; ${common?`unmarked=${ageText}; `:''}now=seen now): ${details}${things.length>3?`; +${things.length-3} things (map)`:''}${extent}`;
}
