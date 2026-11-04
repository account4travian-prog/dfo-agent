import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import {playSources} from './section-sources.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read=p=>readFileSync(resolve(root,p),'utf8').replace(/\r/g,'');
// The only article registry. Optional research articles appear on the next rebuild.
const catalog=[
 ['home','Home',null,'Start here'],
 ['questions','Questions a New Player Asks','32-questions.md','Start here'],
 ['play-guide','The Play Guide','23-playing-online.md','Start here'],
 ['tiger-fist','The Strongest Melee Build','05-strongest-melee.md','Your character'],
 ['building','Building Your Character','29-build-systems.md','Your character'],
 ['firmament','The Star Tree (Firmament)','28-firmament.md','Your character'],
 ['companions','Companions','31-companions.md','Your character'],
 ['fighting','Fighting Well','33-fighting.md','Playing'],
 ['money','Money and Loot','34-money-and-loot.md','Playing'],
 ['people','Other Players and Staying Out of Trouble','35-people-and-trouble.md','Playing'],
 ['travel','Getting Around','30-travel.md','Playing'],
 ['regions','The World, Region by Region','25-world-regions.md','The world'],
 ['map','The Map',null,'The world'],
 ['city-control','City Control and Guilds','26-city-control.md','The world'],
 ['caps','Caps, Timers and Catch-Up','27-caps-and-timers.md','Reference'],
 ['whats-new',"What's New Since 17 October",'24-whats-new-2026-10.md','Reference'],
 ['glossary','Glossary',null,'Reference']
].map(([id,title,file,group])=>({id,title,file,group,text:file&&existsSync(resolve(root,'docs',file))?read('docs/'+file).split('\n## Map appendix')[0]:''}));
export const ARTICLES=catalog.filter(a=>!a.file||existsSync(resolve(root,'docs',a.file)));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const plain=s=>s.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[*`_]/g,'');
const slug=s=>plain(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const fileMap=new Map(ARTICLES.filter(a=>a.file).map(a=>[a.file,a]));
for(const a of ARTICLES){
 const counts=new Map();a.headings=[];
 for(const m of a.text.matchAll(/^(#{2,6}) (.+)$/gm)){
  const base=slug(m[2]),n=counts.get(base)||0;counts.set(base,n+1);
  a.headings.push({level:m[1].length,title:plain(m[2]),anchor:base+(n?'-'+n:''),id:a.id+'-'+base+(n?'-'+n:'')});
 }
}
function reference(a,anchor=''){
 let h=a.headings.find(h=>h.anchor===anchor||h.id===anchor||h.anchor.replaceAll('-','')===slug(anchor).replaceAll('-',''));
 return {id:h?.id??a.id,article:a.id};
}
function link(a,text,anchor=''){
 if(!ARTICLES.includes(a))return text;
 const t=reference(a,anchor);return `<a href="#${t.id}" data-ref="${t.article}">${text}</a>`;
}
// Keep review paths in the source disclosures, out of reading text.
export function inline(s,context,sources=false){
 if(!sources)s=s.replace(/\s*\([^)]*`(?:src|bible|server-account|server|tools|planner)\/[^)]*\)/g,'').replace(/`(?:src|bible|server-account|server|tools|planner)\/[^`]+`/g,'');
 const saved=[],hold=t=>`\u0000${saved.push(t)-1}\u0000`;
 s=s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,url)=>{
  const [path,anchor='']=url.split('#');const a=path?fileMap.get(path.split('/').at(-1)):context;
  // Local files not carried by the wiki are deliberately plain text. No external assets or requests.
  return hold(a?link(a,inline(label,context,sources),anchor):inline(label,context,sources));
 }).replace(/`([^`]+)`/g,(_,t)=>hold('<code>'+esc(t)+'</code>'));
 s=esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
 // Older build notes used bare document numbers. Render a human title even for unavailable articles.
 s=s.replace(/\bdoc\s+(\d{2})\b/gi,(_,n)=>{const a=ARTICLES.find(a=>a.file?.startsWith(n+'-'));return a?hold(link(a,esc(a.title))):'the supporting build notes';});
 return s.replace(/\u0000(\d+)\u0000/g,(_,n)=>saved[n]);
}
function md(text,a,{skipTitle=true}={}){
 if(a.id==='play-guide'&&text===a.text)text=text.split(/(?=^## )/m).map(part=>{const title=part.match(/^## (.*)/)?.[1],entry=Object.entries(playSources).find(([prefix])=>title?.startsWith(prefix));return part+(entry?'\n\n*Sources: '+entry[1]+'*\n':'');}).join('\n');
 const lines=text.trim().split('\n'),out=[];let i=0,hi=0;
 const boundary=l=>/^\s*$|^#{1,6} |^\|.*\|\s*$|^\s*[-*] |^\s*\d+\. |^```|^>/.test(l);
 while(i<lines.length){
  const l=lines[i];if(!l.trim()){i++;continue;}
  if(/^```/.test(l)){const code=[];while(++i<lines.length&&!/^```/.test(lines[i]))code.push(lines[i]);i++;out.push('<pre><code>'+esc(code.join('\n'))+'</code></pre>');continue;}
  const h=l.match(/^(#{1,6}) (.*)$/);if(h){i++;if(h[1].length===1&&skipTitle)continue;const heading=a.headings[hi++];out.push(`<h${Math.min(6,h[1].length)} id="${heading?.id??a.id+'-'+slug(h[2])}">${inline(h[2],a)}</h${Math.min(6,h[1].length)}>`);continue;}
  if(/^\|.*\|\s*$/.test(l)){
   const rows=[];while(i<lines.length&&/^\|.*\|\s*$/.test(lines[i])){const cells=lines[i++].trim().slice(1,-1).split(/(?<!\\)\|/).map(s=>s.trim());if(!cells.every(s=>/^:?-+:?$/.test(s)))rows.push(cells);}
   out.push(`<div class="table-scroll" tabindex="0" role="region" aria-label="${esc(rows[0].map(plain).join(', ')||'Reference table')}"><table><thead><tr>${rows[0].map(c=>'<th scope="col">'+inline(c,a)+'</th>').join('')}</tr></thead><tbody>${rows.slice(1).map(r=>'<tr>'+r.map((c,j)=>j?'<td>'+inline(c,a)+'</td>':'<th scope="row">'+inline(c,a)+'</th>').join('')+'</tr>').join('')}</tbody></table></div>`);continue;
  }
  if(/^\s*[-*] |^\s*\d+\. /.test(l)){
   const tag=/^\s*\d+\. /.test(l)?'ol':'ul',items=[];
   while(i<lines.length&&/^\s*(?:[-*]|\d+\.) /.test(lines[i])){
    let p=lines[i++].replace(/^\s*(?:[-*]|\d+\.) /,'');while(i<lines.length&&/^\s+\S/.test(lines[i])&&!boundary(lines[i]))p+=' '+lines[i++].trim();items.push('<li>'+inline(p,a)+'</li>');
   }out.push(`<${tag}>${items.join('')}</${tag}>`);continue;
  }
  if(/^---+$/.test(l)){i++;out.push('<hr>');continue;}
  let p=lines[i++];while(i<lines.length&&!boundary(lines[i]))p+=' '+lines[i++].trim();
  if(/^>/.test(p)){out.push('<blockquote>'+inline(p.replace(/^>\s*/,''),a)+'</blockquote>');continue;}
  const source=/^\*?Sources?:/i.test(p),tiger=/^(?:\*\*)?(?:Tiger Fist:|For Tiger Fist\b)/i.test(p);
  out.push(source?`<details class="sources"><summary>Sources</summary><p><em>${inline(p.trim().replace(/^\*|\*$/g,''),a,true)}</em></p></details>`:`<p${tiger?' class="tiger-callout"':''}>${inline(p,a)}</p>`);
 }return out.join('\n');
}
const get=id=>catalog.find(a=>a.id===id);
function section(text,title){const start=text.indexOf('\n## '+title);if(start<0)return '';const rest=text.slice(start+1);return rest.split(/\n## /)[0].replace(/^## .*\n/,'');}
function subsection(text,prefix){const part=text.split(/^### /m).slice(1).find(p=>p.startsWith(prefix));return part?.slice(part.indexOf('\n')+1)??'';}
const play=get('play-guide'),build=get('tiger-fist'),preset=JSON.parse(read('planner/presets/tiger-fist.dfo-class.json'));
const catchup=section(play.text,'How to catch up with players who play ten hours a day');
const daily=subsection(catchup,'Your daily checklist'),dailyRows=daily.split('\n').filter(l=>l.startsWith('|')).slice(2).map(l=>l.slice(1,-1).split('|').map(s=>s.trim()));
const home=get('home');
const short=(text,a)=>md(text,{...a,headings:[]});
const sources=(a,anchor)=>`<p class="source-line"><em>Sources: ${link(a,esc(a.title),anchor)}</em></p>`;
const buildRows=section(build.text,'The answer: a Khajiit hand-to-hand fighter').split('\n').filter(l=>l.startsWith('|')).map(l=>l.slice(1,-1).split('|').map(s=>s.trim()));
const row=label=>buildRows.find(r=>r[0].startsWith(label))?.[1]??'';
const card=`<section class="character-card"><p class="eyebrow">Your character</p><h2>Tiger Fist</h2><p class="character-stats">Khajiit · Level 7 · Renown ~5</p><p>Hand-to-Hand. No magic. Willpower 15. Personality 10.</p><dl>${[['Primary skills',preset.skills.primary.join(', ')],['Major skills',preset.skills.major.join(', ')],['Minor skills',preset.skills.minor.join(', ')],['Advantages',row('Advantages')],['Disadvantages',row('Disadvantages')],['Attribute priorities',row('Stat priorities')]].map(([t,v])=>`<dt>${t}</dt><dd>${inline(v,home)}</dd>`).join('')}</dl><p class="fine">Current level and Renown are your supplied snapshot; this page does not read your account. The saved class base has Willpower 10.</p><p class="source-line"><em>Sources: ${link(build,esc(build.title),'the-answer-a-khajiit-hand-to-hand-fighter')}; planner/presets/tiger-fist.dfo-class.json (skills, advantages, disadvantages).</em></p></section>`;
home.html=`<div class="home-grid">${card}<section class="session-card"><h2>Today's checklist</h2><p>Resets 00:00 UTC unless noted. Ticks reset with the UTC date on your next visit.</p><ul class="daily-checks">${dailyRows.map(([task,cap],i)=>`<li><label><input type="checkbox" data-check="daily-${i}"><span>${inline(task,home)}<b>${inline(cap,home)}</b></span></label></li>`).join('')}</ul>${sources(play,'how-to-catch-up-with-players-who-play-ten-hours-a-day')}</section></div><section><h2>The event clock</h2><p id="guide-clock" class="now-clock" aria-live="off"></p><p id="festival-state"></p>${short(subsection(catchup,'The event clock'),home)}${sources(play,'the-event-clock-plan-a-session-around-it')}</section><section><h2>Your catch-up strategy</h2>${short(catchup.split(/^### /m)[0],home)}${sources(play,'how-to-catch-up-with-players-who-play-ten-hours-a-day')}</section><section><h2>Your next steps</h2><p>Start with the current-level column, then open the full staged plan when you are ready.</p>${short(section(play.text,'Building Tiger Fist: every system at a glance'),home)}<p>${link(play,'Read the staged plan','a-plan-for-tiger-fist')} · ${link(get('building'),'Explore Building Your Character')}</p>${sources(play,'building-tiger-fist-every-system-at-a-glance')}</section><section><h2>Explore your field guide</h2><div class="entry-grid">${ARTICLES.filter(a=>a.file||a.id==='map').map(a=>`<a href="#${a.id}" data-page="${a.id}"><b>${esc(a.title)}</b><span>${esc(a.group)}</span></a>`).join('')}</div></section>`;
for(const a of ARTICLES.filter(a=>a.file))a.html=md(a.text,a);
get('map').headings=[{id:'map-explore',title:'Explore the Bay',level:2}];
get('map').html=`<h2 id="map-explore">Explore the Bay</h2><p>Hover a place for its name and basic information. Search also works with the keyboard. Tap to keep its details open.</p><!-- WORLD-MAP --><p class="map-fallback">Build the map locally to explore the Bay.</p><p>${link(get('regions'),'Read The World, Region by Region')} · ${link(get('travel'),'Read Getting Around')} · ${link(play,'Read about danger by place','where-it-s-safe-danger-by-place')}</p>`;
// Exact sentences from the articles, selected by a distinctive literal fragment. No invented definitions.
const glossarySeeds=[
 ['Renown','play-guide',"Renown, online's own level"],['Marks / silver','money','Online market currency and account-held balance'],
 ['Firmament','firmament',"The Firmament is DFO's"],['instance','play-guide','Your instance is a copy'],['spawned dungeon','play-guide','every empty map square'],
 ['elite','fighting','Elites carry a gold halo'],['champion','fighting','Champions are named foes'],['revenant','fighting','Revenants are marked returning foes'],
 ['Unquiet','companions','carries the Unquiet mark'],['Open Zone','play-guide','open PvP'],['seat','city-control','A town’s seat'],
 ['Turning','city-control','Sunday 18:00 UTC begins the Muster'],['Edict','city-control','The Guildmaster or an Officer sets the Edict'],['march','city-control','three contested Marches'],
 ['signature ore','regions','Orsinium Area and the Wrothgarian Mountains share Orichalcum'],['Craft points','firmament','Craft points come from'],['mastery','building','mastery'],
 ['martial path','building','martial path'],['technique','play-guide',"Techniques are DFO's special moves"],
 ['Welkynd Shards','travel','The shards are the currency'],['Portal Stone','travel','The Portal Stone replaces'],['mentor mode','play-guide','Mentor mode is automatic.']
];
const glossary=[];
for(const [term,id,fragment]of glossarySeeds){
 const a=get(id);if(!a||!a.text)continue;
 const clean=s=>plain(s.replace(/\s*\([^)]*`(?:src|bible|server-account|server|tools|planner)\/[^)]*\)/g,'')).replace(/\s+/g,' ').trim();
 const paragraphs=a.text.split(/\n\s*\n/).filter(p=>!/^\s*(?:#|\*Sources)/.test(p)).flatMap(p=>p.startsWith('|')?p.split('\n').flatMap(l=>l.split('|')):p.split(/\n(?=[-*] |\d+\. )/)).map(raw=>({raw,text:clean(raw.replace(/^[-*]\s+|^\d+\.\s+/,''))}));
 const found=paragraphs.find(p=>p.text.toLowerCase().includes(fragment.toLowerCase()));if(!found)continue;
 const paragraph=found.text,sentences=paragraph.split(/(?<=[.!?])\s+(?=[A-Z“])/);
 let index=sentences.findIndex(s=>s.toLowerCase().includes((fragment||term).toLowerCase()));if(index<0)index=0;
 const quote=sentences.slice(index,index+(term==='elite'||term==='Firmament'||term==='Renown'||term==='Welkynd Shards'||term==='signature ore'||term==='Turning'?1:2)).join(' ').trim();
 const pos=a.text.indexOf(found.raw), preceding=a.text.slice(0,pos).match(/^#{2,6} (.+)$/gm)?.at(-1)?.replace(/^#+ /,'');
 const target=reference(a,slug(preceding||''));
 glossary.push({term,id:'term-'+slug(term),article:a.id,target:target.id,quote:plain(quote)});
}
get('glossary').html='<p>Definitions quoted from your articles. Follow an article link for the full context.</p>'+glossary.map(g=>`<section class="glossary-entry" id="${g.id}"><h2>${esc(g.term)}</h2><blockquote>${inline(g.quote,get(g.article))}</blockquote>${sources(get(g.article),g.target)}</section>`).join('');
get('glossary').headings=glossary.map(g=>({id:g.id,title:g.term,level:2}));
// Home has authored dashboard headings rather than markdown headings.
home.html=home.html.replace(/<h([23])>([^<]+)<\/h\1>/g,(_,level,title)=>{const id='home-'+slug(title);home.headings.push({id,title,level:+level});return `<h${level} id="${id}">${title}</h${level}>`;});
// Reuse the original palette, type and tokens; layout and interaction live beside this author script.
const original=read('planner/guide/first-edition.html'),baseStyle=original.match(/<style>([\s\S]*?)<\/style>/)[1];
const font=original.match(/<link[^>]+>/)[0];
const nav=[...new Set(ARTICLES.map(a=>a.group))].map(group=>`<div class="nav-group"><h2>${group}</h2>${ARTICLES.filter(a=>a.group===group).map(a=>`<a href="#${a.id}" data-page="${a.id}">${esc(a.title)}</a><div class="article-toc" data-toc="${a.id}" hidden>${a.headings.filter(h=>h.level<=3).map(h=>`<a href="#${h.id}" data-page="${a.id}" class="toc-level-${h.level}">${esc(h.title)}</a>`).join('')}</div>`).join('')}</div>`).join('');
const safe=o=>JSON.stringify(o).replaceAll('<','\\u003c');
const page=`<title>Tiger Fist's Field Guide</title><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="claude:viewport-fit-sides" content="cover">${font}<style>${baseStyle}\n${read('planner/guide/wiki.css')}</style>
<a class="skip-link" href="#home">Skip to article</a><div class="wiki-frame"><header class="wiki-header"><a href="#home" data-page="home" class="wordmark">Tiger Fist's <strong>Field Guide</strong></a><div class="header-actions"><button id="menu-toggle" aria-expanded="false" aria-controls="article-navigation">Articles</button><button id="guide-theme">Switch theme</button></div></header><div class="wiki-layout"><aside id="article-navigation" class="article-navigation"><label for="wiki-search">Search the field guide</label><div id="search-home"><input id="wiki-search" type="search" placeholder="A term, place or question…" autocomplete="off" aria-label="Search the field guide"></div><p class="fine">References open beside your article. Use Open as page to continue there.</p><nav aria-label="Articles">${nav}</nav></aside><main id="reading-view" tabindex="-1">${ARTICLES.map(a=>`<article id="${a.id}" class="wiki-article" data-article="${a.id}" ${a.id==='home'?'':'hidden'}><header class="article-header"><p class="eyebrow">${esc(a.group)}</p><h1>${esc(a.title)}</h1></header>${a.html}</article>`).join('')}</main></div><footer class="wiki-footer">For Tiger Fist · Online · Rules as recorded in your source articles. Open Sources in each section for provenance.</footer></div>
<section id="search-results" class="search-results" aria-label="Search results" hidden><div class="panel-bar"><h2>Search results</h2><button data-close-search>Close</button></div><div id="search-active-host"></div><p id="search-status" role="status"></p><div id="search-list"></div></section>
<aside id="peek-panel" class="peek-panel" role="dialog" aria-modal="false" aria-label="Article peek" hidden><div class="peek-controls"><div class="panel-bar"><button id="peek-back">Back</button><button id="peek-promote">Open as page</button><button id="peek-close">Close</button></div><nav id="peek-breadcrumb" aria-label="Peek history"></nav></div><div id="peek-body" tabindex="-1"></div></aside><div id="reference-preview" class="reference-preview" role="tooltip" hidden></div>
<script type="application/json" id="wiki-data">${safe({articles:ARTICLES.map(({id,title,group,headings,file})=>({id,title,group,headings,file})),glossary})}</script><script>${read('planner/guide/wiki-runtime.js')}</script>`;
writeFileSync(resolve(root,'docs/23-playing-online.html'),page);
console.log(`Template: ${Buffer.byteLength(page).toLocaleString()} bytes; ${ARTICLES.length} articles; ${glossary.length} glossary entries`);
