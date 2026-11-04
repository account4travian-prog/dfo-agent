// A status file outlives its session, so it only counts as busy while it is fresh: a playing/held session whose
// deadline is still ahead or whose heartbeat is recent, or a driver whose process is still alive. Open game,
// control and debugging ports are always busy.
const live=new Set(['playing','ending','held','running','starting']);
const FRESH_MS=30*60_000;
const millis=value=>Number.isFinite(value)?value:Date.parse(value??'');
export async function checkBusy({readStatus,isListening,isAlive=()=>false,now=Date.now(),ports=[5390,5391,5392]}) {
 const reasons=[];
 let session=null,browser=null;
 try{session=await readStatus('session');}catch{reasons.push('session:unreadable');}
 try{browser=await readStatus('browser');}catch{reasons.push('browser:unreadable');}
 if(session&&live.has(String(session.state).toLowerCase())) {
  const ahead=millis(session.deadline)>now,recent=now-millis(session.at)<FRESH_MS;
  if(ahead||recent)reasons.push(`session:${String(session.state).toLowerCase()}`);
 }
 if(Number.isSafeInteger(browser?.pid)&&browser.pid>0) {
  try{if(await isAlive(browser.pid))reasons.push('browser:alive');}catch{reasons.push('browser:pid-check-failed');}
 }
 for(const port of ports){try{if(await isListening(port))reasons.push(`port:${port}`);}catch{reasons.push(`port-check-failed:${port}`);}}
 return {busy:reasons.length>0,reasons:[...new Set(reasons)]};
}
