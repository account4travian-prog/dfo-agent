#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,ENGINE,DATA,DFO_ROOT} from '../src/config.mjs';
import {runSync,rollbackSync} from '../src/upstream/sync.mjs';

export async function main(args=process.argv.slice(2)){
 const flags=new Set(args);for(const arg of flags)if(!['--execute','--commit','--rollback'].includes(arg))throw Error(`Unknown option: ${arg}`);
 if(flags.has('--commit')&&!flags.has('--execute'))throw Error('--commit requires --execute');
 if(flags.has('--rollback')){const result=await rollbackSync({root:ROOT,engine:ENGINE,data:DATA});console.log(JSON.stringify({status:'rolled-back',...result}));return 0;}
 const result=await runSync({root:ROOT,engine:ENGINE,clone:path.resolve(DFO_ROOT,'upstream','daggerfall-js-source'),data:DATA,execute:flags.has('--execute'),commit:flags.has('--commit')});
 console.log(JSON.stringify(result.receipt,null,2));return result.exitCode;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().then(code=>{process.exitCode=code;}).catch(error=>{console.error(error.message);process.exitCode=1;});
