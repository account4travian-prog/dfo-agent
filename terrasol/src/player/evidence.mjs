import {randomUUID} from 'node:crypto';
function counts(inventory){
 if(!Array.isArray(inventory?.items)||inventory.items.length>1000)return null;
 const result=new Map();
 for(const item of inventory.items){if(typeof item?.name!=='string'||!item.name.trim()||item.name.length>200||!Number.isSafeInteger(item.count)||item.count<1||typeof item.equipped!=='boolean')return null;const row=result.get(item.name)??{count:0,equipped:0};row.count+=item.count;row.equipped+=item.equipped?item.count:0;result.set(item.name,row);}
 return result;
}
// Aggregated own-player inventory only. These describe change, not the cause of it.
export function inventoryEvidence(before,after,{requestId,authority,basis,observedAt=new Date().toISOString()}={}){
 const a=counts(before),b=counts(after);if(!a||!b)return [];
 const records=[];for(const name of new Set([...a.keys(),...b.keys()])){const old=a.get(name)??{count:0,equipped:0},next=b.get(name)??{count:0,equipped:0};
  for(const [field,eventType] of [['count','inventory-changed'],['equipped','item-equipped']])if(old[field]!==next[field])records.push({schemaVersion:'dfo-player-evidence.v1',evidenceId:randomUUID(),eventType,taskId:requestId,requestId,planId:authority?.planId??null,planVersion:authority?.planVersion??null,basis,observedAt,source:'player-state',status:'observed',before:{name,[field]:old[field]},after:{name,[field]:next[field]},reason:'Own inventory changed; the cause is not established.',artifactRefs:[]});
 }
 return records.slice(0,64);
}
export function vitalsEvidence(before,after,{requestId,authority,basis,observedAt=new Date().toISOString()}={}){
 const records=[];for(const field of ['health','magicka','fatigue']){const a=before?.[field],b=after?.[field];if(Number.isFinite(a)&&Number.isFinite(b)&&a!==b)records.push({schemaVersion:'dfo-player-evidence.v1',evidenceId:randomUUID(),eventType:`${field}-changed`,taskId:requestId,requestId,planId:authority?.planId??null,planVersion:authority?.planVersion??null,basis,observedAt,source:'player-state',status:'observed',before:{[field]:a},after:{[field]:b},reason:'Own vital changed; the cause is not established.',artifactRefs:[]});}return records;
}
