import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,DATA} from '../src/config.mjs';
import {consumeOne} from '../src/repair/queue-worker.mjs';
export async function main(args=process.argv.slice(2)){
 const value=k=>{const i=args.indexOf(k);return i<0?null:args[i+1]};const runArg=value('--run'),cap=Number(value('--max-calls')),max=Number(value('--max-proposals')??'1');
 if(!runArg||!Number.isSafeInteger(cap)||cap<1||cap>5||!Number.isSafeInteger(max)||max<1||max>5)throw Error('Usage: node tools/repair-worker.mjs --run <run> --max-calls <1..5> [--max-proposals <1..5>] [--execute] [--apply]');
 const run=fs.realpathSync(runArg),base=fs.realpathSync(path.join(DATA,'runs'))+path.sep;if(!run.startsWith(base))throw Error('Run is outside authorized session directory');
 if(!args.includes('--execute')){console.log(JSON.stringify({mode:'dry-run',run,maxCalls:cap,maxProposals:max}));return;}
 let stopped=false;const stop=()=>stopped=true;process.once('SIGINT',stop);process.once('SIGTERM',stop);let count=0;
 try{while(!stopped&&count<max){const result=await consumeOne({root:ROOT,data:DATA,run,maxCalls:cap,apply:args.includes('--apply')});if(result){count++;console.log(JSON.stringify(result));if(result.code==='USAGE_LIMIT'||result.code==='ENGINEERING_CAP'||['staged','applying'].includes(result.phase))break;}else await new Promise(r=>setTimeout(r,1000));}}finally{process.off('SIGINT',stop);process.off('SIGTERM',stop);}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
