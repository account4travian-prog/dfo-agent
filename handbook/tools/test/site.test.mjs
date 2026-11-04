import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadSite, relativeUrl, isForwardLink, handbookRoot } from '../site.mjs';
import { build } from '../build.mjs';
import { diffFacts, extractFacts } from '../extract-facts.mjs';
const fixtures=fileURLToPath(new URL('./fixtures/',import.meta.url));
const options={contentDir:join(fixtures,'content'),stagesFile:join(fixtures,'stages.json'),dist:join(fixtures,'dist')};
test('relative URLs work at root, stage and nested article depth',()=>{assert.equal(relativeUrl('index.html','begin/one/index.html'),'begin/one/');assert.equal(relativeUrl('begin/index.html','theme/handbook.css'),'../theme/handbook.css');assert.equal(relativeUrl('begin/one/index.html','growth/two/index.html'),'../../growth/two/');assert.equal(relativeUrl('begin/one/index.html','begin/one/index.html'),'./');});
test('forward links follow stage order, always-available reference is exempt',()=>{const s=[{id:'begin'},{id:'growth'},{id:'reference'}];assert.equal(isForwardLink('begin','growth',s),true);assert.equal(isForwardLink('growth','begin',s),false);assert.equal(isForwardLink('begin','reference',s),false);assert.equal(isForwardLink('reference','growth',s),false);});
test('fixture validation and full static build',async()=>{
 const site=await loadSite(options);assert.deepEqual(site.errors,[]);assert.equal(site.pages.length,3);assert.ok(site.warnings.some(w=>w.includes('forward link')));assert.equal(site.glossary[0].term,'Compass');
 const result=await build(options);assert.equal(result.index.length,6);
 const article=await readFile(join(options.dist,'begin/first-steps/index.html'),'utf8');
 assert.match(article,/href="..\/..\/growth\/next-route\/#making-progress"/);assert.match(article,/<span class="chip">later<\/span>/);assert.equal((article.match(/class="glossary-term"/g)||[]).length,1);assert.match(article,/<details class="sources"/);assert.match(article,/STARS_PER_RENOWN/);assert.match(article,/src="..\/..\/theme\/handbook.js"/);assert.match(article,/Page verified/);
 for(const file of ['index.html','begin/index.html','404.html','search-index.json','theme/handbook.css','theme/handbook.js'])assert.ok((await readFile(join(options.dist,file))).length);
 assert.equal((await readFile(join(options.dist,'index.html'),'utf8')).match(/class="stage-tile"/g).length,3);
 assert.doesNotMatch(article,/(?:href|src)="\/(?!\/)/);
});
test('zero-content builds still publish all stage overviews',async()=>{const result=await build({contentDir:join(fixtures,'nonexistent'),dist:join(fixtures,'empty/dist')});assert.equal(result.site.pages.length,0);assert.match(await readFile(join(result.dist,'begin/index.html'),'utf8'),/being prepared/);});
test('validator aggregates metadata, links, anchors, images and fact failures',async()=>{
 const dir=join(fixtures,'validation-temp');await mkdir(join(dir,'begin'),{recursive:true});
 const base='---\ntitle: Sample\nsummary: Sample summary\nstage: begin\norder: 1\ngate: none\ntags: [test]\nverified: 0df2d87eb\n---\n';
 try{
 await writeFile(join(dir,'begin/invalid.md'),base+'## Body\n\n[Bad](missing.md) [Anchor](#absent)\n\n![](theme/art/missing.svg)');
 await writeFile(join(dir,'begin/fact.md'),base+'{{fact missing}}');
 const s=await loadSite({contentDir:dir});for(const text of ['missing ## Sources','broken internal link','broken anchor','missing alt','missing image','CREDITS','Unknown fact id'])assert.ok(s.errors.some(e=>e.includes(text)),`${text}: ${s.errors.join('\n')}`);
 await writeFile(join(dir,'begin/meta.md'),'---\nstage: nonexistent\norder: wrong\ntags: word\nverified: none\n---\n## Sources\n');
 const m=await loadSite({contentDir:dir});for(const text of ['missing/invalid title','unknown stage','order must','tags must','verified must'])assert.ok(m.errors.some(e=>e.includes(text)));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('fact diff reports added, changed and removed records',()=>{assert.deepEqual(diffFacts({a:{value:1},gone:{value:3}},{a:{value:2},new:{value:4}}),['changed a: 1 → 2','removed gone: 3','added new: 4']);});
test('failed extraction preserves previous facts and rejects nonnumeric values',async()=>{const output=join(fixtures,'extract-temp.json');await writeFile(output,'original');try{await assert.rejects(extractFacts({src:fixtures,commit:'0df2d87eb',output,definitions:[{id:'bad',source:'src/test.js',symbol:'BAD',read:async()=>undefined}]}),/Expected a finite number/);assert.equal(await readFile(output,'utf8'),'original');}finally{await rm(output,{force:true});}});
