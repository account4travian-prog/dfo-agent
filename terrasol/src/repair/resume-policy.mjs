import {createBudget} from '../mind/budget.mjs';
export function mayResumeRepair({request,status,continuation,command,commandAt,run,effectiveRevision,deadline,now=Date.now()}){
 if(!request||!status||!continuation?.budget||continuation.repair?.proposalId!==request.proposalId||continuation.repair?.hold!==true||!['pagePreserved','characterPreserved','memoryPreserved','planPreserved','budgetPreserved'].every(k=>status.invariants?.[k]===true)||!effectiveRevision||status.afterRevision!==effectiveRevision||!Number.isFinite(deadline)||now>=deadline||status.phase!=='verified'||status.originalHold||status.run!==run||status.proposalId!==request.proposalId||status.holdCommandAt!==request.expectedHoldAt||command?.command!=='hold'||command.at!==request.expectedHoldAt||commandAt!==request.expectedHoldAt)return false;
 try{const budget=createBudget({limits:continuation.budget.limits??{},initialStatus:continuation.budget});return !budget.paused()&&budget.check('terra').ok;}catch{return false;}
}
