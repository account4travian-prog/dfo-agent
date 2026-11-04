import test from 'node:test';
import assert from 'node:assert/strict';
import {checkBusy} from '../src/upstream/selection.mjs';

const now=Date.parse('2026-10-29T03:00:00Z');
const check=(files,{listening=()=>false,alive=()=>false}={})=>checkBusy({readStatus:async name=>files[name],isListening:async port=>listening(port),isAlive:async pid=>alive(pid),now});

test('a live session, live driver or open port is busy',async()=>{
 assert.deepEqual(await check({session:{state:'playing',at:'2026-10-29T02:59:00Z',deadline:'2026-10-29T04:00:00Z'}}),{busy:true,reasons:['session:playing']});
 assert.deepEqual(await check({session:{state:'held',at:'2026-10-29T01:00:00Z',deadline:'2026-10-29T03:30:00Z'}}),{busy:true,reasons:['session:held']});
 assert.deepEqual(await check({browser:{pid:4242}},{alive:pid=>pid===4242}),{busy:true,reasons:['browser:alive']});
 assert.deepEqual(await check({},{listening:port=>port===5391}),{busy:true,reasons:['port:5391']});
});

test('status files left by a finished session are not busy',async()=>{
 // The 2026-10-27 practice trial left exactly these behind: held, offline-practice, deadline long past, driver gone.
 const files={session:{state:'held',phase:'offline-practice',at:'2026-10-27T09:53:07Z',deadline:'2026-10-27T10:31:49Z'},browser:{pid:47844,port:5391}};
 assert.deepEqual(await check(files),{busy:false,reasons:[]});
 assert.deepEqual(await check({session:null,browser:null}),{busy:false,reasons:[]});
});

test('an unreadable status file fails closed',async()=>{
 const result=await checkBusy({readStatus:async name=>{if(name==='session')throw Error('torn');return null;},isListening:async()=>false,now});
 assert.deepEqual(result,{busy:true,reasons:['session:unreadable']});
});
