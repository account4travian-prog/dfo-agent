import {spawnSync} from 'node:child_process';
// Recorded and fake observations only; never starts a game, browser, GPU job, or model.
const files=['test/body-runtime.test.mjs','test/body-combat-guard.test.mjs','test/body-use-target.test.mjs','test/body-body.test.mjs','test/body-corridor-recovery.test.mjs','test/body-corridor-clearance.test.mjs','test/body-door-use.test.mjs','test/body-fight-focus.test.mjs','test/body-fight-close.test.mjs','test/body-start-footing.test.mjs','test/intent-executor.test.mjs','test/native-controller-http.test.mjs'];
const result=spawnSync(process.execPath,['--test',...files],{stdio:'inherit'});
if(result.error) throw result.error;
process.exitCode=result.status ?? 1;
