(function(){
 const C=window.OIsymColor;
 let current=null,installed=false;
 const sources=new WeakMap();
 function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
 function refresh(root=document){
  for(const input of root.querySelectorAll('input[type="color"]')){
   if(input.disabled)continue;
   let trigger=input.nextElementSibling;
   if(!trigger?.classList.contains('mobile-color-trigger')){
    trigger=node('button','mobile-color-trigger');trigger.type='button';
    trigger.append(node('span','mobile-color-dot'),node('span','mobile-color-value'),node('span','mobile-color-edit','Elegir'));
    input.after(trigger);sources.set(trigger,input);input.classList.add('mobile-native-color');input.tabIndex=-1;input.setAttribute('aria-hidden','true');
   }
   trigger.querySelector('.mobile-color-dot').style.backgroundColor=input.value;
   trigger.querySelector('.mobile-color-value').textContent=input.value.toUpperCase();
   const label=input.closest('.appearance-color-control')?.querySelector('.field-label')?.textContent||input.closest('.field')?.querySelector('.field-label')?.textContent||'Color';
   trigger.setAttribute('aria-label','Elegir color: '+label);
  }
 }
 function choose({value='#27856b',label='Elegir color'}={}){
  if(current)return Promise.resolve(null);
  return new Promise(resolve=>{
   const original=C.normalize(value)||'#27856b';let state=C.hsv(original),selected=original;
   const prior=document.activeElement;
   const dialog=node('dialog','mobile-color-dialog');current=dialog;dialog.setAttribute('aria-label',label);
   const header=node('div','mobile-color-header');header.append(node('span','mobile-eyebrow','COLOR PERSONALIZADO'),node('h2','',label));
   const cancel=node('button','mobile-icon-button','×');cancel.type='button';cancel.setAttribute('aria-label','Cerrar selector de color');header.append(cancel);
   const square=node('div','mobile-color-square');square.setAttribute('aria-label','Área de tono, saturación y brillo');
   const point=node('span','mobile-color-point');square.append(point);
   const hueLabel=node('label','mobile-hue-label','Tono');
   const hue=node('input','mobile-hue');hue.type='range';hue.min='0';hue.max='359';hue.step='1';hue.setAttribute('aria-label','Tono del color');hueLabel.append(hue);
   const accessible=node('div','mobile-color-sv');
   const ranges={};
   for(const [key,labelText]of [['s','Saturación'],['v','Brillo']]){
    const labelNode=node('label','',labelText),range=node('input');range.type='range';range.min='0';range.max='100';range.setAttribute('aria-label',labelText);labelNode.append(range);accessible.append(labelNode);ranges[key]=range;
    range.addEventListener('input',()=>{state[key]=Number(range.value)/100;sync();});
   }
   const compare=node('div','mobile-color-compare');
   const before=node('button','mobile-color-before','Original');before.type='button';before.style.backgroundColor=original;
   const after=node('div','mobile-color-after','Nuevo');compare.append(before,after);
   const values=node('div','mobile-color-values');
   const hexLabel=node('label','','HEX'),hexInput=node('input');hexInput.type='text';hexInput.name='mobile-color-hex';hexInput.maxLength=7;hexInput.autocomplete='off';hexInput.spellcheck=false;hexInput.setAttribute('aria-label','Color hexadecimal');hexLabel.append(hexInput);values.append(hexLabel);
   const rgbInputs=[];
   ['R','G','B'].forEach((channel,i)=>{const wrap=node('label','',channel),input=node('input');input.type='number';input.min='0';input.max='255';input.step='1';input.inputMode='numeric';input.setAttribute('aria-label','Canal '+channel);wrap.append(input);values.append(wrap);rgbInputs.push(input);input.addEventListener('input',()=>{
    if(rgbInputs.some(el=>!/^\d{1,3}$/.test(el.value)||Number(el.value)>255))return;
    state=C.hsv(C.hex(rgbInputs.map(el=>Number(el.value))));sync({rgb:true});
   });});
   const error=node('p','mobile-color-error');error.setAttribute('role','alert');
   const actions=node('div','mobile-color-actions');
   const back=node('button','button secondary','Cancelar');back.type='button';
   const apply=node('button','button primary','Aplicar color');apply.type='button';actions.append(back,apply);
   dialog.append(header,square,hueLabel,accessible,compare,values,error,actions);
   function finish(result){dialog.close();dialog.remove();current=null;if(prior?.isConnected)prior.focus({preventScroll:true});resolve(result);}
   function sync(keep={}){
    selected=C.fromHsv(state.h,state.s,state.v);
    square.style.setProperty('--picker-hue','hsl('+state.h+' 100% 50%)');
    point.style.left=(state.s*100)+'%';point.style.top=((1-state.v)*100)+'%';
    hue.value=String(Math.round(state.h));ranges.s.value=String(Math.round(state.s*100));ranges.v.value=String(Math.round(state.v*100));
    if(!keep.hex)hexInput.value=selected.toUpperCase();
    if(!keep.rgb)C.rgb(selected).forEach((value,i)=>rgbInputs[i].value=String(value));
    after.style.backgroundColor=selected;after.style.color=window.OIsymAppearance?.contrast(selected,'#ffffff')>=window.OIsymAppearance?.contrast(selected,'#000000')?'#ffffff':'#000000';
    before.style.color=window.OIsymAppearance?.contrast(original,'#ffffff')>=window.OIsymAppearance?.contrast(original,'#000000')?'#ffffff':'#000000';
    error.textContent='';hexInput.removeAttribute('aria-invalid');
   }
   function pick(e){const rect=square.getBoundingClientRect();state.s=C.clamp((e.clientX-rect.left)/rect.width,0,1);state.v=1-C.clamp((e.clientY-rect.top)/rect.height,0,1);sync();}
   let pointer=null;
   square.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();pointer=e.pointerId;square.setPointerCapture(e.pointerId);pick(e);});
   square.addEventListener('pointermove',e=>{if(pointer===e.pointerId)pick(e);});
   const release=()=>{pointer=null;};square.addEventListener('pointerup',release);square.addEventListener('pointercancel',release);
   hue.addEventListener('input',()=>{state.h=Number(hue.value);sync();});
   hexInput.addEventListener('input',()=>{const hex=C.normalize(hexInput.value);if(hex){state=C.hsv(hex);sync({hex:true});}});
   before.addEventListener('click',()=>{state=C.hsv(original);sync();});
   cancel.addEventListener('click',()=>finish(null));back.addEventListener('click',()=>finish(null));
   dialog.addEventListener('keydown',e=>e.stopPropagation());
   dialog.addEventListener('cancel',e=>{e.preventDefault();finish(null);});
   apply.addEventListener('click',()=>{
    const hex=C.normalize(hexInput.value);
    if(!hex||rgbInputs.some(input=>!/^\d{1,3}$/.test(input.value)||Number(input.value)>255)){
     error.textContent='Escribe un HEX válido o valores RGB entre 0 y 255.';hexInput.setAttribute('aria-invalid','true');return;
    }
    finish(hex);
   });
   document.body.append(dialog);sync();dialog.showModal();
  });
 }
 function install(root){
  refresh(root);if(installed)return;installed=true;
  document.addEventListener('click',async e=>{
   const trigger=e.target.closest('.mobile-color-trigger');
   const native=e.target.matches?.('input[type="color"]')?e.target:null;
   const source=native||sources.get(trigger);
   if(!source||source.disabled)return;e.preventDefault();e.stopImmediatePropagation();
   const label=trigger?.getAttribute('aria-label')?.replace('Elegir color: ','')||'Elegir color';
   const result=await choose({value:source.value,label});
   if(result&&source.isConnected){source.value=result;source.dispatchEvent(new Event('input',{bubbles:true}));source.dispatchEvent(new Event('change',{bubbles:true}));refresh(root);}
  },true);
  root.addEventListener('input',()=>refresh(root));
  root.addEventListener('click',()=>setTimeout(()=>refresh(root),0));
 }
 window.OIsymColorPicker={install,refresh,choose};
})();
