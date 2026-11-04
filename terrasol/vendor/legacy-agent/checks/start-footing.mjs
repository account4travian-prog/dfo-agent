// Builder-only diagnosis. Counterfactual graphs never reach the gateway or playing roles.
import fs from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {supportedGraph,traceRoute} from '../body/core.mjs';

export function diagnoseStart(capture) {
  const [x,y,z]=capture.state.pos,level=Math.round(y/3),radius=.35;
  const graph=supportedGraph(capture.snapshot);
  const route=traceRoute(graph,x,z,x,z,level);
  const surfaces=new Map(capture.snapshot.surfaces.map(p=>[`${p.ix},${p.iz},${p.level}`,p]));
  const overlaps=(graph.blocked ?? []).filter(([ix,iz,l])=>l===level&&
    Math.hypot(Math.max(ix*.5-x,0,x-(ix+1)*.5),Math.max(iz*.5-z,0,z-(iz+1)*.5))<radius);
  const cells=overlaps.map(([ix,iz,l])=>{
    const p=surfaces.get(`${ix},${iz},${l}`);
    const gap=Math.hypot(Math.max(ix*.5-x,0,x-(ix+1)*.5),Math.max(iz*.5-z,0,z-(iz+1)*.5));
    return {ix,iz,level:l,kind:p.kind,gapM:gap,rasterOverlapM:radius-gap,
      ground:p.ground??null,unresolved:!!p.unresolved,badFaces:!!p.badFaces,
      unknownFaces:p.unknownFaces??[],faces:(p.faces??[]).map(([fx,fz,nx,nz])=>
        ({at:[fx,fz],normal:[nx,nz],clearanceM:(x-fx)*nx+(z-fz)*nz})),
      exitOnly:graph.wallClearance.find(q=>q.ix===ix&&q.iz===iz&&q.level===l)?.exitOnly===true,
      clearanceTransferred:graph.wallClearance.some(q=>q.ix===ix&&q.iz===iz&&q.level===l)};
  });
  // Causal ablation only: remove unresolved wall raster constraints where floor was
  // already delivered. This is NOT a certificate that their geometry is harmless.
  const unresolved=cells.filter(p=>p.kind==='wall'&&p.unresolved&&Number.isFinite(p.ground));
  const keys=new Set(unresolved.map(p=>`${p.ix},${p.iz},${p.level}`));
  const hypothetical=structuredClone(graph);
  hypothetical.blocked=hypothetical.blocked.filter(p=>!keys.has(p.join(',')));
  hypothetical.walls=hypothetical.walls.filter(p=>!keys.has(p.join(',')));
  for(const p of unresolved)if(!hypothetical.nodes.some(n=>n.ix===p.ix&&n.iz===p.iz&&n.level===p.level))
    hypothetical.nodes.push({ix:p.ix,iz:p.iz,level:p.level,height:p.ground});
  return {builderOnly:true,pos:[x,y,z],radiusM:radius,startNode:graph.nodes.find(n=>n.ix===Math.floor(x/.5)&&n.iz===Math.floor(z/.5)&&n.level===level)??null,
    route,cells,counterfactualOnly:{warning:'Diagnosis only; unresolved barriers remain in the real graph. No movement is authorized by this result.',
      cells:unresolved.map(p=>[p.ix,p.iz,p.level]),route:traceRoute(hypothetical,x,z,x,z,level)}};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(!process.argv[2])throw new Error('usage: node agent/checks/start-footing.mjs <capture.json>');
  console.log(JSON.stringify(diagnoseStart(JSON.parse(fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,''))),null,2));
}
