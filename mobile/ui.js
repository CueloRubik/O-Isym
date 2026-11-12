function setup(){
 const root=document.getElementById('app');
 if(!root||!document.documentElement.classList.contains('oisym-android'))return;
 let mounted=null, previousView=null, locked=false, savedY=0, previousFocus=null;
 let viewportHeight=window.innerHeight;
 const isEditing=()=>/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
 const toggleButton=()=>document.querySelector('[data-mobile-more]');
 function syncMenu(){
  const open=document.body.classList.contains('mobile-menu-open');
  const sidebar=root.querySelector('.workspace-sidebar');
  if(sidebar){sidebar.inert=!open;sidebar.setAttribute('aria-hidden',String(!open));}
  toggleButton()?.setAttribute('aria-expanded',String(open));
  const toggle=document.getElementById('toggle-sidebar');
  if(toggle){toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');}
 }
 function syncLock(){
  if(!document?.body)return;
  const needsLock=document.body.classList.contains('mobile-menu-open')||Boolean(document.querySelector('[data-profile-modal],dialog[open]'));
  if(needsLock===locked)return;
  locked=needsLock;
  if(locked){savedY=window.scrollY;document.body.style.top=-savedY+'px';document.body.classList.add('mobile-scroll-locked');}
  else{document.body.classList.remove('mobile-scroll-locked');document.body.style.top='';window.scrollTo(0,savedY);}
 }
 function closeMenu(restoreFocus=false){
  document.body.classList.remove('mobile-menu-open');syncMenu();syncLock();
  if(restoreFocus&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
 }
 function toggleMenu(){
  if(document.body.classList.contains('mobile-menu-open')){closeMenu(true);return;}
  previousFocus=document.activeElement;
  document.body.classList.add('mobile-menu-open');syncMenu();syncLock();
  root.querySelector('.workspace-sidebar .nav-item.active')?.focus({preventScroll:true});
 }
 function boardControls(){
  const canvas=root.querySelector('.ideas-canvas-viewport');
  if(!canvas||canvas.dataset.mobileInteraction)return;
  canvas.dataset.mobileInteraction='page';
  const controls=document.createElement('div');controls.className='mobile-board-controls';
  controls.setAttribute('role','group');controls.setAttribute('aria-label','Gestos del pizarrón');
  for(const [mode,label]of [['page','Desplazar página'],['board','Mover pizarrón']]){
   const button=document.createElement('button');button.type='button';button.className='button secondary';button.textContent=label;button.dataset.mobileBoardMode=mode;
   button.setAttribute('aria-pressed',String(mode==='page'));
   button.addEventListener('click',()=>{
    canvas.dataset.mobileInteraction=mode;
    controls.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   });
   controls.append(button);
  }
  const hint=document.createElement('p');hint.className='small-note';
  hint.textContent='Desplaza la página con el dedo. Activa Mover pizarrón para arrastrar el fondo o las cabeceras de las notas; usa + y − para el zoom.';
  controls.append(hint);canvas.before(controls);
  canvas.setAttribute('aria-label','Pizarrón. Elige Desplazar página o Mover pizarrón en los controles anteriores.');
  const help=root.querySelector('.ideas-help-panel');if(help)help.textContent=hint.textContent;
  for(const [selector,label]of [['.ideas-tool-group[aria-label="Conexiones"]','Conexiones'],['.ideas-canvas-filter-tools','Buscar y filtrar']]){
   const group=root.querySelector(selector);if(!group)continue;
   const details=document.createElement('details');details.className='mobile-board-tools';
   const summary=document.createElement('summary');summary.textContent=label;details.append(summary);
   group.before(details);details.append(group);
  }
 }
 function syncView(){
  const view=root.querySelector('#main-content')?.dataset.view;
  if(document.body.classList.contains('mobile-menu-open'))closeMenu();
  if(view&&previousView&&view!==previousView)window.scrollTo(0,0);
  if(view)previousView=view;
  const active=root.querySelector('.workspace-sidebar .nav-item.active')?.dataset.view;
  root.querySelectorAll('.mobile-navigation [data-view]').forEach(b=>{
   const selected=b.dataset.view===active;b.classList.toggle('active',selected);
   if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  const more=toggleButton();
  if(more){const selected=active&&!['today','calendar','focus','planner'].includes(active);more.classList.toggle('active',Boolean(selected));}
  boardControls();syncMenu();syncLock();
 }
 function mount(){
  if(!document?.body)return;
  const shell=root.querySelector('.workspace-shell');
  if(!shell){closeMenu();mounted=null;return;}
  if(mounted===shell)return;mounted=shell;
  const nav=document.createElement('nav');nav.className='mobile-navigation';nav.setAttribute('aria-label','Navegación móvil');
  for(const [view,label]of [['today','Hoy'],['calendar','Agenda'],['focus','Focus'],['planner','Pizarrones'],['more','Más']]){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',label);
   if(view==='more'){b.dataset.mobileMore='true';b.setAttribute('aria-controls','workspace-sidebar');b.setAttribute('aria-expanded','false');}
   else{b.dataset.action='navigate';b.dataset.view=view;b.className='nav-item';}
   nav.append(b);
  }
  shell.append(nav);
  const mask=document.createElement('button');mask.type='button';mask.className='mobile-menu-mask';mask.tabIndex=-1;mask.setAttribute('aria-label','Cerrar menú');mask.addEventListener('click',()=>closeMenu(true));shell.append(mask);
  const close=document.createElement('button');close.type='button';close.className='button secondary mobile-menu-close';close.textContent='Cerrar menú';close.addEventListener('click',()=>closeMenu(true));shell.querySelector('.workspace-sidebar')?.prepend(close);
  const android=document.createElement('button');android.type='button';android.className='mobile-android-status';android.textContent='Android · permisos';android.addEventListener('click',permissions);shell.querySelector('.sidebar-bottom')?.append(android);
  syncView();
 }
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-mobile-more],#toggle-sidebar')){e.preventDefault();e.stopImmediatePropagation();toggleMenu();}
 },true);
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&document.body.classList.contains('mobile-menu-open')){e.preventDefault();e.stopImmediatePropagation();closeMenu(true);}
 },true);
 window.addEventListener('oisym:android-back',e=>{
  const dialog=document.querySelector('dialog[open]');
  if(dialog){e.preventDefault();if(dialog.dispatchEvent(new Event('cancel',{cancelable:true})))dialog.close();syncLock();return;}
  if(document.body.classList.contains('mobile-menu-open')){e.preventDefault();closeMenu(true);return;}
  if(document.querySelector('[data-profile-modal]')){e.preventDefault();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));syncLock();return;}
  const details=root.querySelector('details[open]');if(details){e.preventDefault();details.open=false;return;}
  const library=root.querySelector('[data-action="ideas-library"]');
  if(library){e.preventDefault();library.click();return;}
  if(root.querySelector('#main-content')?.dataset.view!=='today'){
   const home=root.querySelector('.mobile-navigation [data-view="today"]');
   if(home){e.preventDefault();home.click();}
  }
 });
 async function permissions(){
  closeMenu();document.querySelector('.android-permissions')?.remove();
  const dialog=document.createElement('dialog');dialog.className='android-permissions';
  dialog.setAttribute('aria-label','Avisos y Focus en Android');
  const title=document.createElement('h2');title.textContent='Avisos y Focus en Android';dialog.append(title);
  const text=document.createElement('p');text.setAttribute('role','status');dialog.append(text);
  async function refresh(){try{const s=await window.oisym.notifications.getStatus();text.textContent='Notificaciones: '+(s.permission==='granted'?'activadas':'sin permiso')+'. Alarmas exactas: '+(s.exactAlarms?'activadas':'sin permiso; Android puede retrasar los avisos')+'.';}catch(e){text.textContent=e.message;}}
  for(const [label,fn]of [['Activar notificaciones',()=>window.oisym.notifications.request()],['Permitir alarmas exactas',()=>window.oisym.notifications.exact()],['Probar notificación',()=>window.oisym.notifications.sendTest()],['Cerrar',()=>dialog.close()]]){
   const b=document.createElement('button');b.type='button';b.className='button secondary';b.textContent=label;b.addEventListener('click',async()=>{b.disabled=true;try{await fn();if(dialog.isConnected)await refresh();}catch(e){text.textContent=e.message;}finally{b.disabled=false;}});
   dialog.append(b);
  }
  const onResume=()=>{if(dialog.open)void refresh();};
  window.addEventListener('focus',onResume);
  dialog.addEventListener('close',()=>{window.removeEventListener('focus',onResume);dialog.remove();syncLock();},{once:true});
  document.body.append(dialog);dialog.showModal();syncLock();await refresh();
 }
 let warningTimer;
 window.addEventListener('oisym:android-warning',e=>{
  console.warn('Android:',e.detail);
  let warning=document.querySelector('.mobile-warning');
  if(!warning){warning=document.createElement('div');warning.className='mobile-warning';warning.setAttribute('role','alert');document.body.append(warning);}
  warning.textContent=String(e.detail||'No se pudo completar una acción de Android.');clearTimeout(warningTimer);warningTimer=setTimeout(()=>warning.remove(),7000);
 });
 function resize(){
  const height=window.visualViewport?.height||window.innerHeight;
  if(!isEditing())viewportHeight=height;else viewportHeight=Math.max(viewportHeight,height);
  document.documentElement.style.setProperty('--mobile-viewport-height',height+'px');
  document.body.classList.toggle('mobile-keyboard-open',isEditing()&&viewportHeight-height>150);
  if(isEditing())document.activeElement.scrollIntoView?.({block:'nearest',inline:'nearest'});
 }
 window.visualViewport?.addEventListener('resize',resize);window.addEventListener('resize',resize);
 document.addEventListener('focusout',()=>setTimeout(resize,100));
 new MutationObserver(mount).observe(root,{childList:true});
 new MutationObserver(syncLock).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
 window.addEventListener('oisym:rendered',syncView);
 mount();resize();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
