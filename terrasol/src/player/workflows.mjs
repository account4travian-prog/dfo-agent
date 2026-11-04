import {rowanAction} from './online.mjs';
const onlineWorkflow=(id,description,properties={},required=[],allowedPhases=['frontdoor'])=>({id,version:1,description,parameterSchema:{type:'object',additionalProperties:false,properties:{uiObservationId:{type:'string',minLength:1,maxLength:128},...properties},required:['uiObservationId',...required]},allowedPhases,successEvidence:'Executor checks the named observed result; dispatch alone remains unknown.',maxMs:15000});
const ONLINE_WORKFLOWS=[
 onlineWorkflow('startup.sign-in','Open existing-account sign-in, then repeat with fresh UI to submit runtime-only credentials. Skip when signed in.'),
 onlineWorkflow('startup.select-rowan','Play the unique existing online Rowan, or open visible creation only if absent.',{allowCreate:{type:'boolean'}}),
 onlineWorkflow('online.respawn','Use the visible online Rise control when available and observe the same living Rowan.',{},[],['death']),
 onlineWorkflow('online.rest','Use the live Rest binding, wait for the online rest channel and observe an own-vital gain.',{},[],['world','modal'])
];
// A bounded generic visible-control workflow. It does not infer a gameplay result.
export const ACTIVATE_WORKFLOW=Object.freeze({
 id:'ui.activate-observed',version:1,
 description:'Activate one uniquely labeled visible control once; optionally observe newly visible exact text.',
 parameterSchema:{type:'object',additionalProperties:false,required:['controlLabel','uiObservationId'],properties:{controlLabel:{type:'string',minLength:1,maxLength:200},uiObservationId:{type:'string',minLength:1,maxLength:128},expectedText:{type:'string',minLength:1,maxLength:200}}},
 allowedPhases:['frontdoor','loading','world','modal','death','unknown'],successEvidence:'A newly visible exact text line is observed, or the effect is unknown.',maxMs:4000,
 prerequisites:'A fresh UI observation with exactly one enabled control matching controlLabel.',abortConditions:['stale observation','ambiguous or missing control','stop','deadline','scene change']
});
const baseProperties={controlLabel:{type:'string',minLength:1,maxLength:200},uiObservationId:{type:'string',minLength:1,maxLength:128}};
const makeWorkflow=(id,description,properties,required,successEvidence)=>({id,version:1,description,parameterSchema:{type:'object',additionalProperties:false,properties:{...baseProperties,...properties},required:['controlLabel','uiObservationId',...required]},allowedPhases:['world','modal'],successEvidence,maxMs:4000,prerequisites:'Fresh visible uniquely labeled control and observable player state.',abortConditions:['stale observation','ambiguous control','stop','deadline','scene change']});
export const WORKFLOWS=Object.freeze([ACTIVATE_WORKFLOW,...ONLINE_WORKFLOWS,
 makeWorkflow('inventory.change','Activate a selected control and observe an exact own-item count change.',{itemName:{type:'string',minLength:1,maxLength:200},countDelta:{type:'integer',minimum:-1000,maximum:1000}},['itemName','countDelta'],'Exact own-inventory count delta observed; cause is not inferred.'),
 makeWorkflow('inventory.equip','Activate a selected control and observe one item becoming equipped.',{itemName:{type:'string',minLength:1,maxLength:200}},['itemName'],'Own equipped count increases by one; cause is not inferred.'),
 makeWorkflow('vitals.change','Activate a selected control and observe an exact own-vital change.',{vital:{type:'string',enum:['health','magicka','fatigue']},delta:{type:'number'}},['vital','delta'],'Exact own-vital delta observed; cause is not inferred.'),
 makeWorkflow('ui.type-field','Fill one uniquely labeled visible non-password field and observe its value.',{text:{type:'string',maxLength:500}},['text'],'The intended field value is observed; no message was sent.'),
 makeWorkflow('chat.send','Send the explicitly specified draft once and observe a new own chat line.',{text:{type:'string',minLength:1,maxLength:500}},['text'],'A new own visible chat line matches the draft; online delivery remains unverified.'),
 {id:'startup.select-mode',version:1,description:'Choose an explicitly authorized Offline or Online title-screen mode and observe the next visible screen.',parameterSchema:{type:'object',additionalProperties:false,required:['uiObservationId','mode','expectedText'],properties:{uiObservationId:baseProperties.uiObservationId,mode:{type:'string',enum:['Offline','Online']},expectedText:{type:'string',minLength:1,maxLength:200}}},allowedPhases:['frontdoor'],successEvidence:'Newly visible title-screen text only; character selection remains open.',maxMs:4000,prerequisites:'Fresh title screen with unique requested mode control.',abortConditions:['stale control','deadline','stop']},
 {...makeWorkflow('ui.scene-transition','Activate a selected control and wait for an authorized phase and stable character.',{expectedPhase:{type:'string',enum:['frontdoor','world','modal','death']}},['expectedPhase'],'Stable observed scene and phase with same character and page.'),maxMs:30000,allowedPhases:['frontdoor','world','modal','death']},
 {id:'vitals.key-change',version:1,description:'Press an explicitly authorized key once and observe an exact own-vital change.',parameterSchema:{type:'object',additionalProperties:false,required:['uiObservationId','key','vital','delta'],properties:{uiObservationId:baseProperties.uiObservationId,key:{type:'string',minLength:1,maxLength:32},vital:{type:'string',enum:['health','magicka','fatigue']},delta:{type:'number'}}},allowedPhases:['world','modal'],successEvidence:'Exact own-vital delta observed; cause is not inferred.',maxMs:4000,prerequisites:'Fresh UI and available own vital.',abortConditions:['stale observation','stop','deadline','scene change']}
]);
export const modeWord=text=>String(text??'').split('\n').map(line=>line.replace(/◆/g,'').trim()).find(Boolean)?.toLowerCase();
export function resolveActivation(payload,ui,native=null) {
 const def=WORKFLOWS.find(w=>w.id===payload?.workflowId&&w.version===payload.version);if(!def)throw Object.assign(Error('Unsupported workflow'),{status:400,code:'UNSUPPORTED_WORKFLOW'});
 if(ONLINE_WORKFLOWS.includes(def))return resolveOnline(payload,ui,native);
 const args=payload.args,allowed=Object.keys(def.parameterSchema.properties);
 if(!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).some(k=>!allowed.includes(k))||def.parameterSchema.required.some(k=>!(k in args))||(!['vitals.key-change','startup.select-mode'].includes(def.id)&&(typeof args.controlLabel!=='string'||!args.controlLabel.trim()||args.controlLabel.length>200))||typeof args.uiObservationId!=='string'||!args.uiObservationId||args.uiObservationId.length>128||('expectedText' in args&&(typeof args.expectedText!=='string'||!args.expectedText.trim()||args.expectedText.length>200))||!Number.isFinite(payload.maxMs)||payload.maxMs<1||payload.maxMs>def.maxMs)throw Object.assign(Error('Invalid workflow arguments'),{status:400,code:'INVALID_WORKFLOW_ARGS'});
 if(String(ui?.observationId)!==args.uiObservationId)throw Object.assign(Error('Stale UI control'),{status:409,code:'STALE_CONTROL'});
 if(def.id==='startup.select-mode'&&!['Offline','Online'].includes(args.mode))throw Object.assign(Error('Unsupported title mode'),{status:400,code:'INVALID_WORKFLOW_ARGS'});
 const label=def.id==='startup.select-mode'?args.mode:args.controlLabel;
 // A title-screen mode button reads as its first visible word (engine 10e43fd0: "◆\nOFFLINE\nYour own game, kept on this device\n◆").
 const named=c=>def.id==='startup.select-mode'?modeWord(c.text)===label.toLowerCase():c.text===label;
 const matches=def.id==='vitals.key-change'?[]:(ui.controls??[]).filter(c=>!c.disabled&&named(c)&&Number.isSafeInteger(c.id));
 if(def.id!=='vitals.key-change'&&matches.length!==1)throw Object.assign(Error('Control label is absent or ambiguous'),{status:409,code:'STALE_CONTROL'});
 let expected=null,transition=null,action=def.id==='vitals.key-change'?{kind:'key',keys:[args.key]}:{kind:'click',controlId:matches[0].id};
 if(def.id==='vitals.key-change'&&(typeof args.key!=='string'||!args.key.trim()||args.key.length>32))throw Object.assign(Error('Invalid key'),{status:400,code:'INVALID_WORKFLOW_ARGS'});
 if(def.id==='ui.scene-transition'){if(!['frontdoor','world','modal','death'].includes(args.expectedPhase))throw Object.assign(Error('Invalid target phase'),{status:400,code:'INVALID_WORKFLOW_ARGS'});transition=args.expectedPhase;}
 if(def.id==='ui.type-field'){
  if(!['input','textarea'].includes(matches[0].tag)||matches[0].type==='password'||typeof args.text!=='string'||args.text.length>500)throw Object.assign(Error('A visible non-password field and bounded text are required'),{status:400,code:'WORKFLOW_PREREQUISITE'});
  action={kind:'type',controlId:matches[0].id,text:args.text};expected={eventType:'field-value-observed',fieldLabel:args.controlLabel,text:args.text};
 }
 if(def.id==='chat.send'){
  const fields=(ui.controls??[]).filter(c=>c.context==='chat-input'&&!c.disabled);
  if(matches[0].context!=='chat-send'||fields.length!==1||typeof args.text!=='string'||!args.text.trim()||args.text.length>500||fields[0].value!==args.text||!Array.isArray(ui.chatLines))throw Object.assign(Error('Visible chat draft and Send control are required'),{status:409,code:'WORKFLOW_PREREQUISITE'});
  expected={eventType:'chat-line-observed',text:args.text};
 }
 if(def.id.startsWith('inventory.')){
  if(typeof args.itemName!=='string'||!args.itemName.trim()||args.itemName.length>200||!Array.isArray(native?.inventory?.items))throw Object.assign(Error('Own inventory or item name unavailable'),{status:409,code:'WORKFLOW_PREREQUISITE'});
  if(def.id==='inventory.change'&&(!Number.isSafeInteger(args.countDelta)||args.countDelta===0||Math.abs(args.countDelta)>1000))throw Object.assign(Error('Invalid item count delta'),{status:400,code:'INVALID_WORKFLOW_ARGS'});
  expected={eventType:def.id==='inventory.equip'?'item-equipped':'inventory-changed',name:args.itemName,field:def.id==='inventory.equip'?'equipped':'count',delta:def.id==='inventory.equip'?1:args.countDelta};
 }
 if(def.id==='vitals.change'||def.id==='vitals.key-change'){
  if(!['health','magicka','fatigue'].includes(args.vital)||!Number.isFinite(args.delta)||args.delta===0||Math.abs(args.delta)>100000||!Number.isFinite(native?.state?.vitals?.[args.vital]))throw Object.assign(Error('Invalid or unavailable vital'),{status:409,code:'WORKFLOW_PREREQUISITE'});
  expected={eventType:`${args.vital}-changed`,field:args.vital,delta:args.delta};
 }
 return {action,expectedText:args.expectedText??null,expected,transition,safeStartup:def.id==='startup.select-mode'};
}
function resolveOnline(payload,ui,native){
 const def=ONLINE_WORKFLOWS.find(w=>w.id===payload.workflowId),args=payload.args;
 if(!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).some(k=>!(k in def.parameterSchema.properties))||typeof args.uiObservationId!=='string'||!args.uiObservationId||args.uiObservationId.length>128||!Number.isFinite(payload.maxMs)||payload.maxMs<1||payload.maxMs>def.maxMs||('allowCreate' in args&&typeof args.allowCreate!=='boolean'))throw Object.assign(Error('Invalid workflow arguments'),{code:'INVALID_WORKFLOW_ARGS',status:400});
 if(String(ui?.observationId)!==args.uiObservationId)throw Object.assign(Error('Stale UI control'),{code:'STALE_CONTROL',status:409});
 if((native?.sessionMode??ui.sessionMode)!=='online'&&def.id.startsWith('online.'))throw Object.assign(Error('Online workflow requires online mode'),{code:'MODE_MISMATCH',status:409});
 if(def.id==='startup.sign-in')return {action:{kind:'account-sign-in'},safeStartup:true};
 if(def.id==='startup.select-rowan'){rowanAction(ui,{allowCreate:args.allowCreate===true});return {action:{kind:'rowan-start',allowCreate:args.allowCreate===true},safeStartup:true};}
 if(def.id==='online.rest')return {action:{kind:'online-rest'},expected:{eventType:'online-rest'}};
 return {action:{kind:'online-respawn'},transition:'world'};
}
export function matchesExpected(records,expected){
 if(expected?.eventType==='online-rest')return records.find(r=>['health-changed','magicka-changed','fatigue-changed'].includes(r.eventType)&&['health','magicka','fatigue'].some(k=>Number.isFinite(r.before?.[k])&&r.after?.[k]>r.before[k]))??null;
 return expected?records.find(r=>r.eventType===expected.eventType&&(!expected.name||r.after?.name===expected.name)&&r.after?.[expected.field]-r.before?.[expected.field]===expected.delta)??null:null;
}
export function visibleLine(ui,line){return !!line&&String(ui?.text??'').split(/\r?\n/).some(s=>s.trim()===line);}

const SAFE_LABELS=new Set(['close','cancel','back','inventory','map','journal','spellbook']);
export function navigationOnly(action,ui){
 if(action?.kind==='key')return Array.isArray(action.keys)&&action.keys.length===1&&['Escape','Tab'].includes(action.keys[0]);
 if(action?.kind==='click'&&Number.isSafeInteger(action.controlId)){
  const c=(ui?.controls??[]).find(x=>x.id===action.controlId);return !!c&&!c.disabled&&SAFE_LABELS.has(String(c.text??'').trim().toLowerCase());
 }
 return false;
}
export function visibleSignature(ui){return JSON.stringify({text:ui?.text??'',controls:(ui?.controls??[]).map(c=>({text:c.text,tag:c.tag,disabled:!!c.disabled}))});}
