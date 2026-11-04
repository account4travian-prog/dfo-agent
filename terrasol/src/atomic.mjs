import fs from 'node:fs';
const sleeper=new Int32Array(new SharedArrayBuffer(4));
// Windows readers can briefly deny replacement; retain the old complete file
// until rename succeeds. Never delete the destination to force a replacement.
export function renameWithRetry(from,to){
  for(let n=0;;n++){
    try{fs.renameSync(from,to);return;}catch(e){
      if(n>=25||!['EPERM','EBUSY','EACCES'].includes(e.code))throw e;
      Atomics.wait(sleeper,0,0,8);
    }
  }
}
