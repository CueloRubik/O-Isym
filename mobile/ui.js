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
 function syncView(){
  const view=root.querySelector('#main-content')?.dataset.view;
  if(document.body.classList.contains('mobile-menu-open'))closeMenu();
  if(view&&previousView&&view!==previousView){window.scrollTo(0,0);root.querySelector('#main-content')?.scrollTo?.(0,0);}
  if(view)previousView=view;
  const active=root.querySelector('.workspace-sidebar .nav-item.active')?.dataset.view;
  root.querySelectorAll('.mobile-navigation [data-view]').forEach(b=>{
   const selected=b.dataset.view===active;b.classList.toggle('active',selected);
   if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  const more=toggleButton();
  if(more){const selected=active&&!['today','calendar','focus','planner'].includes(active);more.classList.toggle('active',Boolean(selected));}
  window.OIsymMobileScreens?.adapt(root);syncMenu();syncLock();
 }
 function mount(){
  if(!document?.body)return;
  const shell=root.querySelector('.workspace-shell');
  if(!shell){closeMenu();mounted=null;return;}
  if(mounted===shell)return;mounted=shell;
  const nav=document.createElement('nav');nav.className='mobile-navigation';nav.setAttribute('aria-label','Navegación móvil');
  for(const [view,label]of [['today','Hoy'],['calendar','Agenda'],['focus','Focus'],['planner','Pizarrones'],['more','Espacio']]){
   const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);
   const path={today:'navigation/today.png',calendar:'navigation/calendar.png',focus:'focus/timer.png',planner:'navigation/dashboard.png',more:'interface/settings.png'}[view];
   const glyph=window.OIsymMobileScreens?.icon(path);if(glyph)b.append(glyph);
   const text=document.createElement('span');text.textContent=label;b.append(text);
   if(view==='more'){b.dataset.mobileMore='true';b.setAttribute('aria-controls','workspace-sidebar');b.setAttribute('aria-expanded','false');}
   else{b.dataset.action='navigate';b.dataset.view=view;b.className='nav-item';}
   nav.append(b);
  }
  shell.append(nav);
  const mask=document.createElement('button');mask.type='button';mask.className='mobile-menu-mask';mask.tabIndex=-1;mask.setAttribute('aria-label','Cerrar menú');mask.addEventListener('click',()=>closeMenu(true));shell.append(mask);
  const close=document.createElement('button');close.type='button';close.className='button secondary mobile-menu-close';close.textContent='Cerrar menú';close.addEventListener('click',()=>closeMenu(true));shell.querySelector('.workspace-sidebar')?.prepend(close);
  const android=document.createElement('button');android.type='button';android.className='mobile-android-status';android.textContent='Android · permisos';android.addEventListener('click',permissions);shell.querySelector('.sidebar-bottom')?.append(android);
  const brand=shell.querySelector('.brand-mark');if(brand){const img=document.createElement('img');img.src='assets/icons/app.png';img.alt='';brand.replaceChildren(img);}
  const create=shell.querySelector('.topbar-create');if(create){create.replaceChildren();const glyph=window.OIsymMobileScreens?.icon('actions/add.png');if(glyph)create.append(glyph);else create.textContent='+';create.setAttribute('aria-label','Nueva tarea');}
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
  if(root.querySelector('#main-content')?.mobileSettingsBack?.()){e.preventDefault();return;}
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
 new MutationObserver(()=>{mount();window.OIsymColorPicker?.refresh(root);}).observe(root,{childList:true});
 new MutationObserver(syncLock).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
 window.addEventListener('oisym:rendered',syncView);
 mount();resize();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
