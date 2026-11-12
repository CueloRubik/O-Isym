function setup(){
 const root=document.getElementById('app');
 if(!root)return;
 let mounted=null;
 function mount(){
  if(!document.documentElement.classList.contains('oisym-android'))return;
  const shell=root.querySelector('.workspace-shell');
  if(!shell||mounted===shell)return;mounted=shell;
  const nav=document.createElement('nav');nav.className='mobile-navigation';nav.setAttribute('aria-label','Navegación móvil');
  for(const [view,label]of [['today','Hoy'],['calendar','Agenda'],['focus','Focus'],['planner','Pizarrones'],['more','Más']]){
   const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',label);
   if(view==='more'){b.dataset.mobileMore='true';b.setAttribute('aria-expanded','false');}else{b.dataset.action='navigate';b.dataset.view=view;b.className='nav-item';}
   nav.append(b);
  }
  shell.append(nav);
  const mask=document.createElement('button');mask.className='mobile-menu-mask';mask.setAttribute('aria-label','Cerrar menú');mask.addEventListener('click',closeMenu);shell.append(mask);
  const android=document.createElement('button');android.type='button';android.className='mobile-android-status';android.textContent='Android · permisos';android.addEventListener('click',permissions);shell.querySelector('.sidebar-bottom')?.append(android);
 }
 function closeMenu(){document.body.classList.remove('mobile-menu-open');document.querySelector('[data-mobile-more]')?.setAttribute('aria-expanded','false');}
 function toggleMenu(){const open=document.body.classList.toggle('mobile-menu-open');document.querySelector('[data-mobile-more]')?.setAttribute('aria-expanded',String(open));}
 document.addEventListener('click',e=>{
  if(!document.documentElement.classList.contains('oisym-android'))return;
  if(e.target.closest('[data-mobile-more],#toggle-sidebar')){e.preventDefault();e.stopImmediatePropagation();toggleMenu();}
  else if(e.target.closest('[data-action="navigate"]'))closeMenu();
 },true);
 async function permissions(){
  closeMenu();document.querySelector('.android-permissions')?.remove();
  const dialog=document.createElement('dialog');dialog.className='android-permissions';
  const title=document.createElement('h2');title.textContent='Avisos y Focus en Android';dialog.append(title);
  const text=document.createElement('p');dialog.append(text);
  async function refresh(){try{const s=await window.oisym.notifications.getStatus();text.textContent='Notificaciones: '+(s.permission==='granted'?'activadas':'sin permiso')+'. Alarmas exactas: '+(s.exactAlarms?'activadas':'sin permiso; Android puede retrasar los avisos')+'.';}catch(e){text.textContent=e.message;}}
  for(const [label,fn]of [['Activar notificaciones',()=>window.oisym.notifications.request()],['Permitir alarmas exactas',()=>window.oisym.notifications.exact()],['Probar notificación',()=>window.oisym.notifications.sendTest()],['Cerrar',()=>{dialog.close();dialog.remove();}]]){
   const b=document.createElement('button');b.type='button';b.className='button secondary';b.textContent=label;b.addEventListener('click',async()=>{try{await fn();if(dialog.isConnected)await refresh();}catch(e){text.textContent=e.message;}});dialog.append(b);
  }
  document.body.append(dialog);dialog.showModal();await refresh();
 }
 window.addEventListener('oisym:android-warning',e=>{console.warn('Android:',e.detail);});
 new MutationObserver(mount).observe(root,{childList:true,subtree:true});mount();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
