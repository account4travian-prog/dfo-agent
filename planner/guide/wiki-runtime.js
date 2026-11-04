(()=>{
 'use strict';
 const $=s=>document.querySelector(s), data=JSON.parse($('#wiki-data').textContent);
 const articles=new Map(data.articles.map(a=>[a.id,{...a,node:document.getElementById(a.id)}]));
 const owners=new Map();for(const a of articles.values()){owners.set(a.id,a.id);a.node.querySelectorAll('[id]').forEach(n=>owners.set(n.id,a.id));}
 const positions=new Map(),stack=[],peek=$('#peek-panel'),body=$('#peek-body'),preview=$('#reference-preview'),search=$('#wiki-search'),results=$('#search-results');
 let current='home',returnFocus=null,peekSequence=0,hoverTimer;
 const storage={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{}}};
 const targetId=hash=>{try{return decodeURIComponent(hash.replace(/^#/,''));}catch{return '';}};
 const showMenu=open=>{document.body.classList.toggle('menu-open',open);$('#menu-toggle').setAttribute('aria-expanded',String(open));};
 document.querySelectorAll('.wiki-article').forEach(a=>{const p=[...a.querySelectorAll(':scope p')].slice(0,3).find(p=>/\bcommit\s+[0-9a-f]{7,9}\b/.test(p.textContent));if(p)p.classList.add('about-article');});
 function hidePreview(){clearTimeout(hoverTimer);preview.hidden=true;document.querySelectorAll('[aria-describedby="reference-preview"]').forEach(n=>n.removeAttribute('aria-describedby'));}
 function mainOpen(id,target=id,{address=true,focus=true}={}){
  if(!articles.has(id))return;hidePreview();positions.set(current,window.scrollY);
  for(const a of articles.values())a.node.hidden=a.id!==id;
  const changed=current!==id;current=id;
  document.querySelectorAll('[data-page]').forEach(a=>{if(a.dataset.page===id&&a.hash==='#'+id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.querySelectorAll('[data-toc]').forEach(n=>n.hidden=n.dataset.toc!==id);
  if(address&&location.hash!=='#'+target)history.pushState(null,'','#'+target);
  document.title=articles.get(id).title+" · Tiger Fist's Field Guide";showMenu(false);closeSearch(false);
  if(focus)$('#reading-view').focus({preventScroll:true});
  if(target!==id){const node=document.getElementById(target);if(node){node.scrollIntoView({block:'start'});if(node.tagName==='DETAILS')node.open=true;}}
  else window.scrollTo(0,changed?(positions.get(id)||0):window.scrollY);
  // The embedded map was initially hidden. Its ResizeObserver also handles this, but this
  // event supports simple preview hosts without changing the current selection.
  if(id==='map')window.dispatchEvent(new Event('resize'));
 }
 function closePeeks(){peek.hidden=true;document.body.classList.remove('has-peek');stack.length=0;hidePreview();returnFocus?.focus({preventScroll:true});}
 function paintPeek(){
  const item=stack.at(-1);if(!item){closePeeks();return;}
  hidePreview();peek.hidden=false;document.body.classList.add('has-peek');body.replaceChildren();
  const a=articles.get(item.article),heading=document.createElement('h1');heading.textContent=a.title;body.append(heading);
  if(item.article==='map'){
   const p=document.createElement('p');p.textContent='Open The Map as a page to use its interactive controls.';body.append(p);
  }else{
   const clone=a.node.cloneNode(true);clone.removeAttribute('id');clone.hidden=false;clone.classList.remove('wiki-article');clone.querySelector('.article-header')?.remove();
   const nodes=[clone,...clone.querySelectorAll('[id]')],prefix='peek-'+(++peekSequence)+'-';
   for(const n of nodes){if(n.id){n.dataset.originalId=n.id;n.id=prefix+n.id;}}
   clone.querySelectorAll('script').forEach(n=>n.remove());body.append(clone);
  }
  const crumbs=$('#peek-breadcrumb');crumbs.replaceChildren();stack.forEach((s,i)=>{const b=document.createElement('button');b.textContent=articles.get(s.article).title;b.setAttribute('aria-label','Back to '+b.textContent);if(i===stack.length-1)b.setAttribute('aria-current','page');b.addEventListener('click',()=>{stack.length=i+1;paintPeek();});crumbs.append(b);});
  $('#peek-back').disabled=stack.length<2;body.focus({preventScroll:true});
  if(item.scroll!=null)body.scrollTop=item.scroll;
  else if(item.target!==item.article){const node=[...body.querySelectorAll('[data-original-id]')].find(n=>n.dataset.originalId===item.target);if(node){body.scrollTop=node.getBoundingClientRect().top-body.getBoundingClientRect().top+body.scrollTop-16;if(node.tagName==='DETAILS')node.open=true;}}
  else body.scrollTop=0;
 }
 function openPeek(article,target=article,source=null){
  if(!articles.has(article))return;if(!stack.length)returnFocus=source||document.activeElement;else stack.at(-1).scroll=body.scrollTop;
  stack.push({article,target});paintPeek();
 }
 $('#peek-close').addEventListener('click',closePeeks);
 $('#peek-back').addEventListener('click',()=>{stack.pop();paintPeek();});
 $('#peek-promote').addEventListener('click',()=>{const item=stack.at(-1);if(!item)return;closePeeks();mainOpen(item.article,item.target);});
 $('#menu-toggle').addEventListener('click',()=>showMenu(!document.body.classList.contains('menu-open')));
 $('#guide-theme').addEventListener('click',()=>{const r=document.documentElement,dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches;r.dataset.theme=dark?'light':'dark';storage.set('tiger-guide-theme',r.dataset.theme);});
 const theme=storage.get('tiger-guide-theme');if(['light','dark'].includes(theme))document.documentElement.dataset.theme=theme;
 // Index only the original article DOM. Peeks never duplicate search results.
 const index=[];for(const a of articles.values()){
  let section=a.title,target=a.id;
  for(const n of a.node.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,td,th,blockquote')){
   if(n.closest('.sources,.source-line,.article-header'))continue;
   if(/^H[1-6]$/.test(n.tagName)){section=n.textContent;target=n.id||target;}
   const text=n.textContent.replace(/\s+/g,' ').trim();if(text)index.push({article:a.id,title:a.title,section,target,text,fold:(a.title+' '+section+' '+text).toLowerCase()});
  }
 }
 function closeSearch(focus=true){const wasFocused=document.activeElement===search;results.hidden=true;const host=$('#search-home');if(search.parentElement!==host)host.append(search);if(focus||wasFocused)search.focus({preventScroll:true});}
 $('[data-close-search]').addEventListener('click',()=>closeSearch());
 function searchAll(){
  const query=search.value.trim().toLowerCase(),out=$('#search-list');out.replaceChildren();if(!query){closeSearch(false);return;}
  const terms=query.split(/\s+/),seen=new Set(),hits=index.filter(x=>terms.every(t=>x.fold.includes(t))).filter(x=>{const key=x.article+'|'+x.text;if(seen.has(key))return false;seen.add(key);return true;});
  results.hidden=false;const host=$('#search-active-host');if(search.parentElement!==host){host.append(search);search.focus({preventScroll:true});}$('#search-status').textContent=hits.length+' matches'+(hits.length>60?' · first 60 shown':'')+'.';
  for(const hit of hits.slice(0,60)){
   const div=document.createElement('div');div.className='search-hit';const open=document.createElement('button');open.className='hit-open';
   const title=document.createElement('b');title.textContent=hit.title;const sec=document.createElement('span');sec.textContent=hit.section;open.append(title,sec);
   const p=document.createElement('p'),at=Math.max(0,hit.text.toLowerCase().indexOf(terms[0])-80);p.textContent=(at?'…':'')+hit.text.slice(at,at+300)+(hit.text.length>at+300?'…':'');
   open.addEventListener('click',e=>{if(e.shiftKey||e.ctrlKey||e.metaKey){closeSearch(false);openPeek(hit.article,hit.target,search);}else mainOpen(hit.article,hit.target);});
   const secondary=document.createElement('button');secondary.className='hit-peek';secondary.textContent='Peek';secondary.setAttribute('aria-label','Peek: '+hit.title+' · '+hit.section);secondary.addEventListener('click',()=>{closeSearch(false);openPeek(hit.article,hit.target,search);});div.append(open,p,secondary);out.append(div);
  }
 }
 search.addEventListener('input',searchAll);search.addEventListener('click',()=>{if(results.hidden&&search.value.trim())searchAll();});
 search.addEventListener('keydown',e=>{if(e.key==='Enter'){if(results.hidden)searchAll();else results.querySelector('.hit-open')?.click();e.preventDefault();}});
 // Glossary annotations are generated from exact doc quotes, never within links, citations or code.
 const terms=[...data.glossary].sort((a,b)=>b.term.length-a.term.length),termById=new Map(terms.map(g=>[g.id,g]));
 const aliases=g=>g.term==='Marks / silver'?['Marks','silver']:g.term==='march'?['march','Marches']:g.term==='mastery'?['mastery','masteries']:g.term==='Craft points'?['Craft points','Craft point']:g.term==='Welkynd Shards'?['Welkynd Shards','Welkynd Shard']:['instance','spawned dungeon','elite','champion','revenant','seat','Edict','martial path','technique','Portal Stone'].includes(g.term)?[g.term,g.term+'s']:[g.term];
 const lookup=new Map(terms.flatMap(g=>aliases(g).map(t=>[t.toLowerCase(),g])));
 const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const pattern=new RegExp('\\b('+([...lookup.keys()].sort((a,b)=>b.length-a.length).map(escapeRE).join('|')||'(?!)')+')\\b','gi');
 for(const a of articles.values()){
  if(['map','glossary'].includes(a.id))continue;
  const walker=document.createTreeWalker(a.node,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){if(node.parentElement.closest('a,button,code,pre,h1,h2,h3,h4,h5,h6,label,.sources,.source-line,script,style,.fine'))continue;
   pattern.lastIndex=0;if(!pattern.test(node.textContent))continue;pattern.lastIndex=0;const fragment=document.createDocumentFragment();let offset=0;
   for(const m of node.textContent.matchAll(pattern)){fragment.append(document.createTextNode(node.textContent.slice(offset,m.index)));const b=document.createElement('button');b.type='button';b.className='glossary-term';b.dataset.term=lookup.get(m[0].toLowerCase()).id;b.textContent=m[0];b.setAttribute('aria-label',m[0]+': definition');fragment.append(b);offset=m.index+m[0].length;}
   fragment.append(document.createTextNode(node.textContent.slice(offset)));node.replaceWith(fragment);
  }
 }
 // An article's "Studied at ... commit" note says where its facts come from; a preview quotes what the article says.
 const isMeta=(el)=>el.matches('.sources,.source-line,.about-article')||/^\s*(?:(?:Studied|Checked|Source snapshot|For DFO Online, studied)\b|Sources?:)/.test(el.textContent)||/\bcommit\s+[0-9a-f]{7,9}\b/.test(el.textContent);
 function quoteFor(id){
  const a=articles.get(owners.get(id)||id);if(!a)return null;const node=document.getElementById(id)||a.node;
  let text='';if(node===a.node)text=[...a.node.querySelectorAll('p:not(.eyebrow):not(.fine)')].find(p=>!isMeta(p)&&p.textContent.trim())?.textContent.trim()||'';
  else{let next=node.nextElementSibling;while(next&&!/^H[1-6]$/.test(next.tagName)){if(!isMeta(next)){text=next.textContent.trim();if(text)break;}next=next.nextElementSibling;}}
  return {title:node===a.node?a.title:a.title+' · '+node.textContent,quote:text.slice(0,400)+(text.length>400?'…':'')};
 }
 function positionPreview(x,y){const rect=preview.getBoundingClientRect();preview.style.left=Math.max(16,Math.min(x+14,innerWidth-rect.width-16))+'px';preview.style.top=Math.max(16,Math.min(y+16,innerHeight-rect.height-16))+'px';}
 function displayPreview(el,x,y){
  let info;if(el.dataset.term){const g=termById.get(el.dataset.term);info={title:g.term,quote:g.quote,source:articles.get(g.article).title};}
  else info=quoteFor(targetId(el.hash));if(!info)return;
  preview.replaceChildren();const b=document.createElement('b'),p=document.createElement('p');b.textContent=info.title;p.textContent='“'+info.quote+'”';preview.append(b,p);if(info.source){const s=document.createElement('small');s.textContent='Source: '+info.source;preview.append(s);}preview.hidden=false;positionPreview(x,y);el.setAttribute('aria-describedby','reference-preview');
 }
 document.addEventListener('pointerover',e=>{const el=e.target.closest('[data-ref],.glossary-term');if(!el||e.pointerType==='touch')return;hidePreview();hoverTimer=setTimeout(()=>displayPreview(el,e.clientX,e.clientY),220);});
 document.addEventListener('pointerout',e=>{if(e.target.closest('[data-ref],.glossary-term')&&!e.target.closest('[data-ref],.glossary-term').contains(e.relatedTarget))hidePreview();});
 document.addEventListener('focusin',e=>{const el=e.target.closest('[data-ref],.glossary-term');if(!el)return;hidePreview();const r=el.getBoundingClientRect();displayPreview(el,r.left,r.bottom);});
 document.addEventListener('focusout',hidePreview);window.addEventListener('scroll',hidePreview,{passive:true});
 document.addEventListener('click',e=>{
  const term=e.target.closest('.glossary-term');if(term){e.preventDefault();const g=termById.get(term.dataset.term);openPeek('glossary',g.id,term);return;}
  const a=e.target.closest('a[href^="#"]');if(!a)return;const target=targetId(a.hash),owner=owners.get(target);if(!owner)return;e.preventDefault();
  if(a.dataset.ref||a.closest('#peek-body'))openPeek(owner,target,a);else{if(!peek.hidden)closePeeks();mainOpen(owner,target);}
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){hidePreview();if(!results.hidden){closeSearch();return;}if(!peek.hidden){closePeeks();return;}showMenu(false);}
  if(e.key==='Tab'&&!peek.hidden&&matchMedia('(max-width:800px)').matches){const focusable=[...peek.querySelectorAll('a[href],button:not(:disabled),input,[tabindex="0"]')].filter(n=>n.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===body)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
 });
 const fromAddress=()=>{const target=targetId(location.hash),owner=owners.get(target);if(owner){if(!peek.hidden)closePeeks();mainOpen(owner,target,{address:false,focus:false});}else mainOpen('home','home',{address:true,focus:false});};
 window.addEventListener('popstate',fromAddress);window.addEventListener('hashchange',fromAddress);
 const today=()=>new Date().toISOString().slice(0,10);let checkDay=today();
 function restoreChecks(){document.querySelectorAll('[data-check]').forEach(n=>n.checked=storage.get('tiger-guide-'+checkDay+'-'+n.dataset.check)==='1');}
 restoreChecks();document.querySelectorAll('[data-check]').forEach(n=>n.addEventListener('change',()=>storage.set('tiger-guide-'+checkDay+'-'+n.dataset.check,n.checked?'1':'0')));
 function tick(){const now=new Date(),seconds=now.getUTCMinutes()*60+now.getUTCSeconds(),festival=now>=new Date('2026-10-20T00:00:00Z')&&now<new Date('2026-11-08T00:00:00Z');
  const left=[2700,3150,3600].find(s=>s>seconds)-seconds;
  $('#guide-clock').textContent=now.toISOString().slice(11,19)+' UTC · Daily reset 00:00 UTC · Weekly influence reset Sunday 18:00 UTC'+(festival?' · Next festival star in '+Math.floor(left/60)+'m '+String(left%60).padStart(2,'0')+'s':'');
  $('#festival-state').textContent=festival?'The festival calendar window is open. The schedules below come from The Play Guide; this page does not read live encounters.':'Starfall is seasonal. Its recorded festival window is 20 October through 7 November 2026, UTC. The schedule below is reference, not a live event report.';
  if(today()!==checkDay){checkDay=today();restoreChecks();}
 }tick();setInterval(tick,1000);
 // Highlight the nearest section as the reader scrolls, without changing the bookmark.
 let queued=false;window.addEventListener('scroll',()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;const headings=[...articles.get(current).node.querySelectorAll('h2[id],h3[id]')];let nearest=headings[0];for(const h of headings)if(h.getBoundingClientRect().top<150)nearest=h;document.querySelectorAll('.article-toc a').forEach(a=>{if(a.hash==='#'+nearest?.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});});},{passive:true});
 fromAddress();
})();
