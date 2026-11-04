import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {buildReport} from '../src/report.mjs';
import {renderDashboard} from '../src/dashboard.mjs';

test('direct reports expose mode and reject mixed or unlabelled session/epoch evidence',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'online2-report-'));
 const write=(file,rows)=>fs.writeFileSync(path.join(dir,file),rows.map(JSON.stringify).join('\n')+'\n');
 try{
  fs.mkdirSync(path.join(dir,'epoch-1'));
  write('trace.jsonl',[{kind:'session-start',mode:'online'}]);
  write('epoch-1/trace.jsonl',[{kind:'epoch-start',mode:'online'}]);
  assert.equal(buildReport(dir).mode,'online');
  for(const rows of [[{kind:'epoch-start',mode:'offline'}],[{kind:'epoch-start'}],[{kind:'observation',mode:'online'}],[{kind:'epoch-start',mode:'online'},{kind:'observation',mode:'offline'}]]){
   write('epoch-1/trace.jsonl',rows);assert.throws(()=>buildReport(dir),/mode/i);
  }
  write('epoch-1/trace.jsonl',[{kind:'epoch-start',mode:'online'}]);
  write('trace.jsonl',[{kind:'session-start'}]);assert.throws(()=>buildReport(dir),/mode/i);
  write('trace.jsonl',[{kind:'session-start',mode:'offline'}]);write('epoch-1/trace.jsonl',[{kind:'epoch-start',mode:'offline'}]);assert.equal(buildReport(dir).mode,'offline');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('dashboard renders the reported mode on refresh and clears stale mode when unavailable',async()=>{
 const html=renderDashboard(),elements=new Map();let mode='online';
 const element=id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id);};
 const context=vm.createContext({document:{getElementById:element,querySelectorAll:()=>[]},fetch:async url=>url.startsWith('/session')?{ok:true,json:async()=>({mode})}:{ok:false},setInterval:()=>{},URL,Date});
 vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace('refresh();setInterval','globalThis.ready=refresh();setInterval'),context);
 await context.ready;
 assert.equal(element('mode').textContent,'Experimental online trial');
 mode='offline';await vm.runInContext('refresh()',context);assert.equal(element('mode').textContent,'Experimental offline trial');
 mode=null;await vm.runInContext('refresh()',context);assert.equal(element('mode').textContent,'Experimental trial · mode unknown');
});
