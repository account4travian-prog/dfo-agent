import fs from 'node:fs';
import path from 'node:path';
import {DATA,CONTROL_URL} from './config.mjs';
const [command='status',...args]=process.argv.slice(2);
if(command==='observe')console.log(JSON.stringify(await(await fetch(`${CONTROL_URL}/observe`)).json(),null,2));
else if(command==='action'){
  const o=await(await fetch(`${CONTROL_URL}/observe`)).json();
  const action=JSON.parse(args.join(' '));
  console.log(await(await fetch(`${CONTROL_URL}/action`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({observationId:o.id,generation:o.generation,action})})).text());
}else if(command==='status'){
  const f=path.join(DATA,'session-status.json');console.log(fs.existsSync(f)?fs.readFileSync(f,'utf8'):'No session status');
  console.log(await(await fetch(`${CONTROL_URL}/health`)).text());
}else if(['hold','resume','stop'].includes(command)){
  fs.mkdirSync(DATA,{recursive:true});fs.writeFileSync(path.join(DATA,'command.json'),JSON.stringify({command,at:Date.now()}));
  if(command!=='resume')console.log(await(await fetch(`${CONTROL_URL}/stop`,{method:'POST'})).text());
  console.log(command);
}else throw Error('Use status, observe, action <JSON>, hold, resume or stop');
