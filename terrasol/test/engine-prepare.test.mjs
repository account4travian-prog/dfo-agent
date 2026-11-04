import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {postinstallScript,prepareEngine} from '../src/engine-prepare.mjs';

function engine(postinstall,{script='scripts/gen.mjs',body="import fs from 'node:fs';fs.writeFileSync('generated.js','export default 1;\\n');"}={}) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rowan-engine-'));
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({scripts:postinstall===undefined?{}:{postinstall}}));
  if(script){fs.mkdirSync(path.dirname(path.join(dir,script)),{recursive:true});fs.writeFileSync(path.join(dir,script),body);}
  return dir;
}

test('the engine postinstall runs and generates its files',()=>{
  const dir=engine('node scripts/gen.mjs');
  assert.deepEqual(prepareEngine(dir),{ran:true,script:path.join('scripts','gen.mjs'),output:''});
  assert.equal(fs.readFileSync(path.join(dir,'generated.js'),'utf8'),'export default 1;\n');
});

test('an engine without a postinstall needs nothing',()=>{
  assert.deepEqual(prepareEngine(engine(undefined)),{ran:false});
});

test('only node running a script inside the engine is accepted',()=>{
  assert.throws(()=>postinstallScript(engine('node scripts/gen.mjs && curl example.invalid')),/Unsupported engine postinstall/);
  assert.throws(()=>postinstallScript(engine('node ../outside.mjs')),/Unsupported engine postinstall/);
  assert.throws(()=>postinstallScript(engine('husky install')),/Unsupported engine postinstall/);
  assert.throws(()=>postinstallScript(engine('node scripts/missing.mjs')),/Unsupported engine postinstall/);
});

test('a failing postinstall stops the start with its error',()=>{
  const dir=engine('node scripts/gen.mjs',{body:"console.error('pins exploded');process.exit(2);"});
  assert.throws(()=>prepareEngine(dir),/pins exploded/);
});
