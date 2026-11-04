import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const luminance=hex=>{const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('light and dark theme text, control boundaries and focus tokens meet AA contrast',async()=>{
 const css=await readFile(new URL('../../theme/handbook.css',import.meta.url),'utf8');
 const tokens=block=>Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[a-f\d]{6})/gi)].map(m=>[m[1],m[2]]));
 const light=tokens(css.match(/:root\s*\{([^}]+)\}/)[1]),dark={...light,...tokens(css.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/)[1])};
 const automatic={...light,...tokens(css.match(/:root:not\(\[data-theme="light"\]\)\s*\{([^}]+)\}/)[1])};assert.deepEqual(dark,automatic);
 for(const [theme,t]of Object.entries({light,dark})){
  for(const [fg,backgrounds]of Object.entries({ink:['paper','surface','raised','nav-active','sea-soft','brass-soft','warning-soft'],muted:['paper','surface','raised','nav-active','sea-soft','brass-soft','warning-soft'],sea:['paper','surface','raised','nav-active','sea-soft','brass-soft','warning-soft'],warning:['warning-soft'],paper:['sea']}))for(const bg of backgrounds)assert.ok(ratio(t[fg],t[bg])>=4.5,`${theme}: ${fg} on ${bg} = ${ratio(t[fg],t[bg]).toFixed(2)}`);
  // The specified brass is ornament only; all running text now uses ink/muted/sea.
  for(const bg of ['paper','surface','brass-soft'])assert.ok(ratio(t.brass,t[bg])>=3,`${theme}: brass mark on ${bg} needs 3:1`);
  for(const fg of ['focus','control-line'])for(const bg of ['paper','surface','raised'])assert.ok(ratio(t[fg],t[bg])>=3,`${theme}: ${fg} on ${bg} needs 3:1`);
 }
 assert.deepEqual(['paper','ink','brass','sea'].map(key=>light[key].toUpperCase()),['#F4EEE1','#1F2328','#8C6D2F','#2D6575']);
 assert.deepEqual(['paper','ink','brass','sea'].map(key=>dark[key].toUpperCase()),['#14171B','#E9E1CF','#B8944A','#6FA9B6']);
 for(const selector of ['.eyebrow','.badge','.chip','.link-preview .eyebrow']){
  const rule=css.slice(css.indexOf(selector+' {')).split('}')[0];
  assert.doesNotMatch(rule,/color:\s*var\(--brass\)/,`${selector} must not use brass for copy`);
 }
 assert.match(css,/--text-base:\s*1\.125rem/);
 assert.match(css,/font: var\(--text-base\)\/1\.6 var\(--font-text\)/);
 assert.match(css,/h1,h2,h3,h4\s*\{[^}]*font-weight:\s*600;[^}]*letter-spacing:\s*-\.025em;/);
 assert.doesNotMatch(css,/\.prose\s*\{[^}]*font-size:\s*1rem;/);
 for(const face of ['Cormorant Garamond','Source Serif 4','Inter'])assert.ok(css.includes(face));
});
