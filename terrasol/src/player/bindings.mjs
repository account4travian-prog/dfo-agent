// Fallback only: inputActions.js is authoritative whenever the page can be read.
export const FALLBACK_BINDINGS=Object.freeze({MoveForwards:['KeyW'],MoveBackwards:['KeyS'],MoveLeft:['KeyA'],MoveRight:['KeyD'],Run:['ShiftLeft'],Jump:['Space'],Interact:['KeyE'],ReadyWeapon:['KeyZ'],SwingWeapon:['Mouse1'],Rest:['KeyR'],Inventory:['F6'],CharacterSheet:['F5'],AutoMap:['KeyM'],TravelMap:['KeyV'],LogBook:['KeyL'],QuickSave:['F9'],QuickLoad:['F11'],Escape:['Escape'],TurnLeft:['ArrowLeft'],TurnRight:['ArrowRight'],LookUp:['Insert'],LookDown:['Delete']});
export async function readLiveBindings(page){
 try{
  const value=await page.evaluate(async()=>{
   const [{ACTIONS,codesForAction},{bindings}]=await Promise.all([import('/src/systems/inputActions.js'),import('/src/ui/input.js')]);
   const {getInt}=await import('/src/systems/settings/settings.js');
   const store=bindings();
   return {source:'engine-live',bindings:Object.fromEntries(ACTIONS.map(action=>[action,codesForAction(store,action)])),weaponSwingMode:getInt('Controls','WeaponSwingMode',0,2)};
  });
  if(!value?.bindings||!Object.keys(value.bindings).length)throw Error('unavailable');
  return value;
 }catch{return {source:'fallback',reason:'Game binding registry unavailable',bindings:structuredClone(FALLBACK_BINDINGS)};}
}
export function bindingKey(live,action){
 const code=live?.bindings?.[action]?.find(c=>!c.startsWith('Joystick')&&!c.startsWith('Mouse'));
 if(!code)return null;
 if(/^Key[A-Z]$/.test(code))return code.slice(3).toLowerCase();
 if(/^Digit\d$/.test(code))return code.slice(5);
 return ({ShiftLeft:'Shift',ShiftRight:'Shift',ControlLeft:'Control',ControlRight:'Control',AltLeft:'Alt',AltRight:'Alt',Space:'Space',Backquote:'`'})[code]??code;
}
