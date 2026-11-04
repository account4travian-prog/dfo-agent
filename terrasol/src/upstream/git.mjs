import {spawnSync} from 'node:child_process';
export function git(cwd,args,{timeout=120000}={}) {
 const r=spawnSync('git',args,{cwd,encoding:'utf8',timeout,maxBuffer:16*1024*1024,windowsHide:true,shell:false});
 if(r.error||r.status!==0)throw Error(`git ${args[0]} failed: ${(r.error?.message||r.stderr||`exit ${r.status}`).trim().slice(0,1200)}`);
 return r.stdout.trim();
}
export function tryGit(cwd,args,{timeout=120000}={}) {
 const r=spawnSync('git',args,{cwd,encoding:'utf8',timeout,maxBuffer:16*1024*1024,windowsHide:true,shell:false});
 return {ok:!r.error&&r.status===0,status:r.status,stdout:r.stdout?.trim()??'',stderr:r.stderr?.trim()??'',error:r.error?.message??null};
}
