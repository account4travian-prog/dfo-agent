import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,DATA} from '../src/config.mjs';
import {engineerProposal} from '../src/repair/engineer.mjs';
import {runRepair} from './repair-apply.mjs';
// No invocation without --execute and an explicit cumulative engineering cap.
export async function main(args=process.argv.slice(2)){
 const value=k=>{const i=args.indexOf(k);return i<0?null:args[i+1]};const file=value('--proposal'),cap=Number(value('--max-calls'));
 if(!file||!Number.isSafeInteger(cap)||cap<1||cap>5||!args.includes('--execute'))throw Error('Usage: node tools/repair-engineer.mjs --proposal <queued-json> --max-calls <1..5> --execute [--apply]');
 const queueRoot=fs.realpathSync(path.join(DATA,'runs'))+path.sep,absolute=fs.realpathSync(file);if(!absolute.startsWith(queueRoot)||path.basename(path.dirname(absolute))!=='repair-proposals')throw Error('Proposal must be from a session repair queue');
 const proposal=JSON.parse(fs.readFileSync(absolute,'utf8')),artifactRoot=path.join(DATA,'repairs','staging');fs.mkdirSync(artifactRoot,{recursive:true});
 const staged=await engineerProposal({root:ROOT,proposal,run:path.dirname(path.dirname(absolute)),artifactRoot,usageFile:path.join(path.dirname(path.dirname(absolute)),'engineering-usage.jsonl'),maxCalls:cap});
 let applied=null;if(args.includes('--apply')&&staged.receipt.phase==='staged')applied=runRepair({stageDir:staged.artifactDir,execute:true});
 console.log(JSON.stringify({stage:staged.receipt.phase,artifactDir:staged.artifactDir,apply:applied?.phase??null}));return {staged,applied};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
