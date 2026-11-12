(function(){
 const memory=new Map();let lastView=null,settingsOpen=false;
 const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 const icon=(path)=>window.OIsymIcons?.glyph(path,document,'mobile-glyph','')||node('span','','•');
 function action(label,fn,cls='button secondary'){const b=node('button',cls,label);b.type='button';b.addEventListener('click',fn);return b;}
 function panes(parent,items,key,initial){
  if(!items.length)return;
  const tabs=node('div','mobile-segments');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Vistas de '+key);
  const panels=[],buttons=[];
  function select(value,scroll=true){
   if(!items.some(item=>item.key===value))value=items[0].key;memory.set(key,value);
   items.forEach((item,i)=>{const active=item.key===value;panels[i].hidden=!active;buttons[i].setAttribute('aria-selected',String(active));buttons[i].tabIndex=active?0:-1;});
   if(scroll)document.querySelector('#main-content')?.scrollTo?.(0,0);
  }
  items.forEach((item,i)=>{
   const id='mobile-'+key+'-'+item.key;
   const panel=node('section','mobile-screen-panel');panel.id=id;panel.dataset.mobilePanel=item.key;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',id+'-tab');
   const button=action(item.label,()=>select(item.key),'mobile-segment');button.id=id+'-tab';button.dataset.mobileTab=item.key;button.setAttribute('role','tab');button.setAttribute('aria-controls',id);
   button.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;select(items[next].key);buttons[next].focus();});
   (item.nodes||[]).filter(Boolean).forEach(el=>panel.append(el));buttons.push(button);panels.push(panel);tabs.append(button);
  });
  parent.append(tabs,...panels);select(memory.get(key)||initial||items[0].key,false);
  return {select,tabs,panels};
 }
 function sheet(title,content,{guard=false}={}){
  const root=document.getElementById('app'),placeholder=document.createComment('mobile-sheet-return');
  content.before(placeholder);const dialog=node('dialog','mobile-sheet');dialog.setAttribute('aria-label',title);
  const head=node('div','mobile-sheet-header');head.append(node('h2','',title));
  let dirty=false;
  function close(){if(guard&&dirty&&!confirm('Hay cambios sin guardar. ¿Cerrar sin guardarlos?'))return;if(guard&&dirty)content.reset?.();dialog.close();}
  const button=action('Cerrar',close,'mobile-sheet-close');head.append(button);
  const body=node('div','mobile-sheet-body');body.append(content);dialog.append(head,body);
  dialog.addEventListener('keydown',e=>e.stopPropagation());
  dialog.addEventListener('input',()=>dirty=true);dialog.addEventListener('change',()=>dirty=true);
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  dialog.addEventListener('close',()=>{if(placeholder.isConnected)placeholder.replaceWith(content);dialog.remove();},{once:true});
  root.append(dialog);dialog.showModal();return dialog;
 }
 function taskMenus(root){
  root.querySelectorAll('.task-row').forEach(row=>{
   const actions=row.querySelector('.task-actions'),menu=actions?.querySelector('.task-action-menu'),choices=menu?.querySelector('.task-menu-choices');
   if(!choices||actions.dataset.mobileReady)return;actions.dataset.mobileReady='true';
   for(const button of [...actions.children])if(button!==menu)choices.prepend(button);
   const summary=menu.querySelector('summary');if(summary){summary.textContent='⋯';summary.setAttribute('aria-label','Acciones de '+(row.querySelector('.task-content strong')?.textContent||'tarea'));}
   actions.classList.add('mobile-context-actions');
  });
 }
 function today(main){
  const hero=main.querySelector('.welcome-card'),overview=main.querySelector('.today-overview'),grid=main.querySelector('.dashboard-grid');
  if(!hero||!grid)return;
  const summary=node('div','mobile-day-summary');summary.append(hero);if(overview)summary.append(overview);
  const preview=node('section','mobile-next-card');preview.append(node('span','mobile-eyebrow','EN TU DÍA'),node('h2','','Tus próximos pendientes'));
  const list=grid.querySelector('.today-task-card .task-list');
  const rows=list?[...list.querySelectorAll('.task-row')]:[];
  for(const row of rows.slice(0,3)){
   const b=action('',()=>{},'mobile-next-task');
   b.dataset.action='edit-task';b.dataset.id=row.querySelector('[data-id]')?.dataset.id||'';
   const mark=node('span','mobile-next-mark');mark.append(icon('navigation/tasks.png'));
   const copy=node('span','');copy.append(node('strong','',row.querySelector('.task-content strong')?.textContent||'Tarea'),node('small','',row.querySelector('.task-meta')?.textContent||'Pendiente'));
   b.append(mark,copy,node('span','mobile-chevron','›'));preview.append(b);
  }
  if(!rows.length)preview.append(node('p','muted','Tu día está despejado. Añade una tarea cuando la necesites.'));
  const link=action('Ver mi día',()=>tabs.select('day'),'mobile-inline-link');preview.append(link);summary.append(preview);
  const focus=grid.querySelector('.focus-card');if(focus)summary.append(focus);
  const daily=[grid.querySelector('.today-agenda-card'),grid.querySelector('.today-task-card'),grid.querySelector('.today-inbox-card'),grid.querySelector('.today-overdue-card')];
  const progress=[grid.querySelector('.today-completed-card'),grid.querySelector('.today-suggestions-card'),grid.querySelector('.today-week-card')];
  grid.remove();const tabs=panes(main,[{key:'summary',label:'Resumen',nodes:[summary]},{key:'day',label:'Mi día · '+rows.length,nodes:daily},{key:'progress',label:'Avance',nodes:progress}],'today','summary');
 }
 function focus(main){
  const panel=main.querySelector('.focus-panel');if(!panel)return;
  const music=panel.querySelector('.focus-music-settings'),alarm=panel.querySelector('.focus-alarm-settings');
  const task=panel.querySelector('#focus-task')?.closest('.field'),activity=panel.querySelector('#focus-activity')?.closest('.field'),hint=panel.querySelector('.focus-hint');
  const stats=main.querySelector('.focus-stats'),history=main.querySelector('.focus-history-card');
  const timer=node('div','mobile-focus-timer');
  const extras=panel.querySelector('.focus-settings-heading');if(extras)extras.remove();
  const link=node('div','mobile-focus-link-fields');[task,activity,hint].filter(Boolean).forEach(el=>link.append(el));
  const linkHome=node('div','mobile-focus-link-home');linkHome.hidden=true;linkHome.append(link);
  const chooseTask=action('Tarea y actividad',()=>sheet('Vincular la sesión',link),'mobile-focus-link-button');chooseTask.prepend(icon('navigation/tasks.png'));
  for(const child of [...panel.children])if(child!==music&&child!==alarm&&!child.classList.contains('focus-settings-heading'))timer.append(child);
  timer.append(chooseTask,linkHome);
  panel.replaceChildren();
  const sound=node('div','mobile-focus-sound');panes(sound,[{key:'music',label:'Música',nodes:[music]},{key:'alarm',label:'Alarma',nodes:[alarm]}],'focus-sound');
  panes(panel,[{key:'timer',label:'Reloj',nodes:[timer]},{key:'sound',label:'Sonido',nodes:[sound]},{key:'history',label:'Historial',nodes:[stats,history]}],'focus');
 }
 function calendar(main){
  const layout=main.querySelector('.planner-layout');if(!layout)return;
  const time=layout.querySelector('.day-timeline-card'),untimed=layout.querySelector('.day-untimed-card'),inbox=layout.querySelector('.day-inbox-card');
  const analysis=main.querySelector('.unified-planner-card'),templates=main.querySelector('.day-template-card'),create=main.querySelector('.day-template-form');
  const content=node('div','mobile-calendar-content');
  if(create){
   const holder=node('div','mobile-template-holder');holder.hidden=true;create.before(holder);holder.append(create);
   templates?.append(action('Nueva rutina',()=>sheet('Nueva rutina de día',create,{guard:true}),'button primary'));
  }
  const slots=time?.querySelector('.free-slot-list');
  if(slots){const details=node('details','mobile-availability'),summary=node('summary','','Ver huecos disponibles');details.append(summary);slots.before(details);const heading=details.previousElementSibling;if(heading?.tagName==='H3')heading.remove();details.append(slots);}
  layout.before(content);layout.remove();
  panes(content,[{key:'schedule',label:'Horario',nodes:[time]},{key:'pending',label:'Pendientes',nodes:[untimed,inbox]},{key:'planning',label:'Planificar',nodes:[analysis,templates]}],'calendar');
 }
 function appearance(panel){
  const form=panel.querySelector('.appearance-form');if(!form)return;
  const sections=[...form.children].filter(el=>el.classList.contains('appearance-section'));
  if(sections.length<6)return;
  const [mode,themes,colors,icons,layout,preview]=sections;
  themes.classList.add('mobile-theme-gallery');colors.classList.add('mobile-custom-colors');
  const choices=[...themes.querySelectorAll('.appearance-palette-button')];
  const featured=['forest','ocean','midnight','orchid','rose','graphite'];
  let expanded=false;
  function showThemes(){for(const button of choices)button.hidden=!expanded&&!featured.includes(button.dataset.palette)&&button.getAttribute('aria-pressed')!=='true';}
  const expand=action('Ver todos los temas',()=>{expanded=!expanded;expand.textContent=expanded?'Ver menos temas':'Ver todos los temas';showThemes();},'mobile-inline-link');themes.append(expand);showThemes();
  const desc=form.querySelector(':scope > p');if(desc)desc.textContent='Elige un tema o crea tus propios colores. Se guarda en este perfil.';
  const instructions=node('p','mobile-color-help','Toca un color para abrir el selector completo. Puedes escribir HEX o RGB.');
  colors.insertBefore(instructions,colors.children[1]);
  const rest=[...form.children].filter(el=>!sections.includes(el));
  form.replaceChildren();if(desc)form.append(desc);
  panes(form,[{key:'theme',label:'Tema',nodes:[mode,themes]},{key:'colors',label:'Mis colores',nodes:[colors]},{key:'style',label:'Detalles',nodes:[icons,layout,preview]}],'appearance');
  for(const el of rest)if(el!==desc)form.append(el);
 }
 function settings(main,changed){
  const nav=main.querySelector('.settings-navigation'),panel=main.querySelector('.settings-panel');if(!nav||!panel)return;
  if(changed)settingsOpen=false;
  const chosen=nav.querySelector('.active')?.dataset.section;
  const previous=memory.get('settings-section');
  if(previous&&previous!==chosen)settingsOpen=true;
  memory.set('settings-section',chosen);
  const back=action('Ajustes',()=>{settingsOpen=false;update();},'mobile-back-button');back.prepend(node('span','','‹'));
  panel.prepend(back);
  const iconPaths={profile:'actions/profiles.png',appearance:'interface/settings.png',planning:'navigation/calendar.png',notifications:'notifications/task-reminder.png',focus:'focus/timer.png',data:'actions/export.png',shortcuts:'interface/search.png',profiles:'actions/profiles.png'};
  nav.querySelectorAll('.settings-nav-item').forEach(button=>{
   button.prepend(icon(iconPaths[button.dataset.section]||'interface/settings.png'));
   button.append(node('span','mobile-chevron','›'));
   button.addEventListener('click',()=>{settingsOpen=true;});
  });
  function update(){nav.hidden=settingsOpen;panel.hidden=!settingsOpen;main.classList.toggle('mobile-settings-detail',settingsOpen);main.scrollTop=0;}
  appearance(panel);update();
  main.mobileSettingsBack=()=>{if(settingsOpen){settingsOpen=false;update();return true;}return false;};
 }
 function boards(main){
  const canvas=main.querySelector('.ideas-canvas-viewport');
  if(canvas){
   main.classList.add('mobile-board-workspace');canvas.dataset.mobileInteraction='board';
   if(canvas.dataset.mobileInitialFit==='true')requestAnimationFrame(()=>{if(canvas.isConnected&&canvas.clientWidth>0)main.querySelector('[data-action="ideas-canvas-fit"]')?.click();});
   const toolbar=main.querySelector('.ideas-canvas-toolbar'),header=main.querySelector('.ideas-canvas-header');
   const toolbarHome=node('div','mobile-board-tool-home');toolbarHome.hidden=true;if(toolbar){toolbar.before(toolbarHome);toolbarHome.append(toolbar);}
   const title=header?.querySelector('h1');if(title)title.title=title.textContent;
   const dock=node('div','mobile-board-dock');
   dock.append(action('Herramientas',()=>{if(!toolbar)return;const d=sheet('Herramientas del pizarrón',toolbar);toolbar.addEventListener('click',e=>{if(e.target.closest('[data-action="ideas-connect-arrow"],[data-action="ideas-connect-line"]'))d.close();},{once:true});},'mobile-board-tools-button'));
   for(const [label,original]of [['−','ideas-canvas-zoom-out'],['+','ideas-canvas-zoom-in'],['Centrar','ideas-canvas-fit']])dock.append(action(label,()=>main.querySelector('[data-action="'+original+'"]')?.click(),'mobile-board-control'));
   main.append(dock);canvas.setAttribute('aria-label','Pizarrón a pantalla completa. Arrastra el fondo y mueve las notas por su cabecera.');
   canvas.addEventListener('focusin',()=>{canvas.style.touchAction='pan-y';});
   canvas.addEventListener('focusout',()=>setTimeout(()=>{if(!canvas.contains(document.activeElement))canvas.style.touchAction='';},0));
   for(const card of main.querySelectorAll('.ideas-note-card,.ideas-activity-card')){
    const background=card.style.getPropertyValue('--note-color')||'#fff2bf';
    const contrast=window.OIsymAppearance.contrast;
    card.style.setProperty('--mobile-note-ink',contrast(background,'#ffffff')>=contrast(background,'#000000')?'#ffffff':'#000000');
    const palette=card.querySelector('.ideas-note-palette');if(!palette)continue;
    const custom=action('+',async()=>{
     const color=await window.OIsymColorPicker.choose({value:card.style.getPropertyValue('--note-color')||'#fff2bf',label:'Color del elemento'});
     if(!color||!card.isConnected)return;
     const swatch=palette.querySelector('[data-action]');if(swatch){swatch.dataset.color=color;swatch.click();}
    },'ideas-custom-color');
    custom.setAttribute('aria-label','Elegir color personalizado del elemento');palette.append(custom);
   }
  }else{
   main.querySelectorAll('.ideas-board-card').forEach(card=>{
    const actions=card.querySelector('.ideas-board-actions');if(!actions)return;
    const details=node('details','mobile-board-menu'),summary=node('summary','','⋯');summary.setAttribute('aria-label','Acciones de '+card.querySelector('h3')?.textContent);details.append(summary);actions.before(details);details.append(actions);
   });
  }
 }
 function generic(main,view){
  const leading=main.querySelector(':scope > .section-heading,:scope > .view-heading-row > .section-heading');
  if(leading)leading.classList.add('mobile-leading-heading');
  if(view==='profiles'){
   const container=main.querySelector('.profiles-layout');if(container){
    const list=container.querySelector('.profiles-list-panel'),detail=container.querySelector('.profile-detail-panel');
    panes(container,[{key:'list',label:'Mis perfiles',nodes:[list]},{key:'detail',label:'Detalle',nodes:[detail]}],'profiles');
    list?.addEventListener('click',e=>{if(e.target.closest('[data-action="select-profile"]'))memory.set('profiles','detail');});
   }
  }
 }
 function adapt(root){
  const main=root.querySelector('#main-content');if(!main||main.dataset.mobileDesigned==='true')return;
  root.querySelectorAll('dialog.mobile-sheet[open]').forEach(dialog=>dialog.close());
  const view=main.dataset.view,changed=lastView!==view;lastView=view;
  main.dataset.mobileDesigned='true';main.classList.remove('mobile-board-workspace','mobile-settings-detail');main.mobileSettingsBack=null;
  if(view==='today')today(main);
  if(view==='focus')focus(main);
  if(view==='calendar')calendar(main);
  if(view==='settings')settings(main,changed);
  if(view==='planner')boards(main);
  generic(main,view);taskMenus(main);window.OIsymColorPicker?.install(root);
 }
 window.OIsymMobileScreens={adapt,sheet,icon,reset(){memory.clear();lastView=null;settingsOpen=false;}};
})();
