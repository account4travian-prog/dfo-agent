import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOT,DATA} from '../src/config.mjs';
import {stageRepair} from '../src/repair/stage.mjs';
// Explicit local artifact inputs only. No game/service/model call and no shell interpretation.
export function main(args=process.argv.slice(2)) {
 if(args.length!==4||args[0]!=='--proposal'||args[2]!=='--patch')throw Error('Usage: node tools/repair-stage.mjs --proposal <json> --patch <diff>');
 const proposal=JSON.parse(fs.readFileSync(path.resolve(args[1]),'utf8')),patchBytes=fs.readFileSync(path.resolve(args[3]));
 const artifactRoot=path.join(DATA,'repairs','staging');fs.mkdirSync(artifactRoot,{recursive:true});
 const result=stageRepair({root:ROOT,proposal,patchBytes,artifactRoot});console.log(JSON.stringify({phase:result.receipt.phase,reason:result.receipt.reason,artifactDir:result.artifactDir}));if(result.receipt.phase==='failed')process.exitCode=1;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try{main();}catch(e){console.error(e.message);process.exitCode=1;}
