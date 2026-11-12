const {
  createProfile, normalizeProfile, createActivity, updateActivity, createTask, updateTask, createIdeaBoard, createIdeaNode, updateIdeaNode, makeId, normalizeIdeaBoards, validateIdeaBoard, createIdeaBoardExport, prepareIdeaBoardImport,
  createGoal, updateGoal, localDate, shiftDate, getRecommendations, analyzeSchedule,
  validateSnapshot, validateImportedProfile, clampNumber, getSuggestedFocusMinutes, getFocusElapsedSeconds, getFocusRemainingSeconds, createFocusSession, getAgeBand, getDefaultThemeForAge, FOCUS_ALARM_TONES
 } = window.OIsymDomain;
const Appearance = window.OIsymAppearance;
const prefersDark = () => Boolean(window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
const applyProfileAppearance = () => Appearance.apply(root,document.documentElement,state.profile?.preferences || {},prefersDark());
const appearanceColorFields = [
  ['accent','Acento','Botones, enlaces y selección','--accent'],
  ['page','Fondo','Fondo general de la aplicación','--page'],
  ['surface','Tarjetas','Paneles, ventanas y tarjetas','--surface'],
  ['sidebar','Menú lateral','Fondo de la navegación','--ui-sidebar'],
  ['field','Campos','Buscadores y campos de texto','--ui-field'],
  ['text','Texto','Títulos y contenido principal','--text'],
  ['border','Bordes','Contornos de las superficies','--line'],
  ['muted','Texto secundario','Descripción y etiquetas','--muted']
];
const appearanceScheme = mode => mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode === 'dark' ? 'dark' : 'light';
const appearanceDefaults = profile => {
  const palette=profile.preferences.theme === 'sky' ? 'ocean' : profile.preferences.theme === 'warm' ? 'sand' :
    profile.preferences.theme === 'playful' ? 'aurora' : 'forest';
  const empty=() => Object.fromEntries(appearanceColorFields.map(([key])=>[key,'']));
  return {
    appearanceMode:'light', appearancePalette:palette, appearanceColors:empty(),
    appearancePalettes:{light:palette,dark:palette},
    appearanceColorsByMode:{light:empty(),dark:empty()},
    appearanceDensity:'comfortable', appearanceRadius:'soft',
    appearanceIconMode:'vector', appearanceIconVariant:'outline',
    appearanceIconTone:'automatic', appearanceIconBackground:'none',
    appearanceIconColorsByMode:{light:'',dark:''},
    appearanceIconBackgroundColorsByMode:{light:'',dark:''},
    appearanceCardStyle:'elevated'
  };
};
const appearanceDraft = form => {
  const saved=state.profile.preferences;
  const mode=form.querySelector('[name="appearanceMode"]:checked')?.value || 'light';
  const scheme=form.querySelector('[name="appearanceEditScheme"]')?.value || appearanceScheme(mode);
  const palettes={...(saved.appearancePalettes || {light:saved.appearancePalette,dark:saved.appearancePalette})};
  const colorsByMode=JSON.parse(JSON.stringify(saved.appearanceColorsByMode || {light:saved.appearanceColors,dark:saved.appearanceColors}));
  const colors={};
  appearanceColorFields.forEach(([key])=>{
    colors[key]=form.querySelector('[name="custom-'+key+'"]')?.checked ?
      form.querySelector('[name="appearance-'+key+'"]')?.value || '' : '';
  });
  palettes[scheme]=form.querySelector('[name="appearancePalette"]')?.value || palettes[scheme] || 'forest';
  colorsByMode[scheme]=colors;
  const actualScheme=appearanceScheme(mode);
  const iconTone=form.querySelector('[name="appearanceIconTone"]')?.value || 'automatic';
  const iconColors={...(saved.appearanceIconColorsByMode || {light:'',dark:''})};
  const iconBackgrounds={...(saved.appearanceIconBackgroundColorsByMode || {light:'',dark:''})};
  if (iconTone==='custom') iconColors[scheme]=form.querySelector('[name="appearanceIconColor"]')?.value || '';
  iconBackgrounds[scheme]=form.querySelector('[name="appearanceIconBackgroundCustom"]')?.checked
    ? (form.querySelector('[name="appearanceIconBackgroundColor"]')?.value || '') : '';
  return {
    appearanceMode:mode, appearancePalette:palettes[actualScheme],
    appearanceColors:{...colorsByMode[actualScheme]},
    appearancePalettes:palettes, appearanceColorsByMode:colorsByMode,
    appearanceDensity:form.querySelector('[name="appearanceDensity"]')?.value || 'comfortable',
    appearanceRadius:form.querySelector('[name="appearanceRadius"]')?.value || 'soft',
    appearanceIconMode:form.querySelector('[name="appearanceIconMode"]')?.value || 'vector',
    appearanceIconVariant:form.querySelector('[name="appearanceIconVariant"]')?.value || 'outline',
    appearanceIconTone:iconTone,
    appearanceIconBackground:form.querySelector('[name="appearanceIconBackground"]')?.value || 'none',
    appearanceIconColorsByMode:iconColors,
    appearanceIconBackgroundColorsByMode:iconBackgrounds,
    appearanceCardStyle:form.querySelector('[name="appearanceCardStyle"]')?.value || 'elevated'
  };
};
function refreshAppearanceEditor(form, scheme) {
  if (!form) return;
  const selected=scheme === 'dark' ? 'dark' : 'light';
  form.querySelector('[name="appearanceEditScheme"]').value=selected;
  form.querySelectorAll('.appearance-edit-option').forEach(node=>{
    node.setAttribute('aria-pressed',String(node.dataset.scheme===selected));
  });
  const prefs=state.profile.preferences;
  const fallback=appearanceDefaults(state.profile);
  form.querySelector('[name="appearancePalette"]').value=prefs.appearancePalettes?.[selected] || prefs.appearancePalette || fallback.appearancePalette;
  const colors=prefs.appearanceColorsByMode?.[selected] || prefs.appearanceColors || fallback.appearanceColors;
  const tokens=Appearance.makeTokens({...prefs,appearanceMode:selected},prefersDark()).vars;
  for (const [key,,,token] of appearanceColorFields) {
    form.querySelector('[name="custom-'+key+'"]').checked=Boolean(colors[key]);
    form.querySelector('[name="appearance-'+key+'"]').value=colors[key] || tokens[token];
  }
  const iconColor=prefs.appearanceIconColorsByMode?.[selected] || '';
  const iconBackground=prefs.appearanceIconBackgroundColorsByMode?.[selected] || '';
  form.querySelector('[name="appearanceIconColor"]').value=iconColor || tokens['--ui-icon-color'];
  form.querySelector('[name="appearanceIconBackgroundColor"]').value=iconBackground || tokens['--ui-icon-tile'];
  form.querySelector('[name="appearanceIconBackgroundCustom"]').checked=Boolean(iconBackground);
  updateAppearancePreview(form);
}
function updateAppearancePreview(form) {
  if (!form || form.dataset.form !== 'profile-appearance-settings') return;
  const draft=appearanceDraft(form);
  const editScheme=form.querySelector('[name="appearanceEditScheme"]').value;
  const result=Appearance.makeTokens({...draft,appearanceMode:editScheme},prefersDark());
  const tokens=result.vars;
  const preview=form.querySelector('.appearance-preview');
  if (preview) {
    const properties={
      '--preview-icon-color':tokens['--ui-icon-color'],
      '--preview-icon-tile':tokens['--ui-icon-tile'],
      '--preview-page':tokens['--page'],'--preview-surface':tokens['--surface'],
      '--preview-text':tokens['--text'],'--preview-muted':tokens['--muted'],
      '--preview-line':tokens['--line'],'--preview-accent':tokens['--accent'],
      '--preview-accent-text':tokens['--ui-accent-text'],
      '--preview-sidebar':tokens['--ui-sidebar'],'--preview-sidebar-text':tokens['--ui-sidebar-text'],
      '--preview-field':tokens['--ui-field'],'--preview-field-text':tokens['--ui-field-text']
    };
    Object.entries(properties).forEach(([key,value])=>preview.style.setProperty(key,value));
  }
  form.querySelectorAll('.appearance-palette-button').forEach(item=>{
    item.setAttribute('aria-pressed',String(item.dataset.palette===draft.appearancePalettes[editScheme]));
    const option=Appearance.makeTokens({appearanceMode:editScheme,appearancePalette:item.dataset.palette},prefersDark()).vars;
    const values={
      '--palette-page':option['--page'],'--palette-surface':option['--surface'],
      '--palette-ink':option['--text'],'--palette-muted':option['--muted'],
      '--palette-accent':option['--accent'],'--palette-accent-text':option['--ui-accent-text'],
      '--palette-line':option['--line']
    };
    Object.entries(values).forEach(([key,value])=>item.style.setProperty(key,value));
  });
  const warning=form.querySelector('.appearance-contrast-note');
  if (warning) {
    warning.classList.toggle('warning',result.contrastAdjusted);
    const other=editScheme===appearanceScheme(draft.appearanceMode);
    warning.textContent=result.contrastAdjusted ?
      'El color de texto elegido se ajusta para que pueda leerse.' :
      other ? 'Los cambios se ven inmediatamente y se guardan automáticamente.' :
      'Estás personalizando el otro modo. Su apariencia se aplicará cuando lo actives.';
  }
}
function renderAppearanceSettings(panel) {
  const saved=state.profile.preferences;
  const form=element('form','form-card settings-form appearance-form');
  form.dataset.form='profile-appearance-settings';
  form.append(element('p','muted','Personaliza cada modo por separado. Todos los cambios se guardan automáticamente en este perfil.'));
  const modeSection=element('section','appearance-section');
  modeSection.append(element('h3','','Apariencia de O-Isym'));
  const modes=element('div','appearance-mode-options');
  [['light','Claro'],['dark','Oscuro'],['system','Automático']].forEach(([value,label])=>{
    const wrap=element('label','appearance-mode-option');
    const radio=element('input');radio.type='radio';radio.name='appearanceMode';radio.value=value;
    radio.checked=(saved.appearanceMode||'light')===value;
    wrap.append(radio,document.createTextNode(label));modes.append(wrap);
  });
  modeSection.append(modes,element('p','small-note','Automático sigue el tema del sistema. Puedes tener una paleta distinta en cada modo.'));
  form.append(modeSection);
  const section=element('section','appearance-section');
  section.append(element('h3','','Personalizar el modo'));
  const schemeButtons=element('div','appearance-edit-modes');
  [['light','Claro'],['dark','Oscuro']].forEach(([value,label])=>{
    const control=button(label,'appearance-edit-scheme','appearance-edit-option',{scheme:value});
    control.setAttribute('aria-pressed','false');schemeButtons.append(control);
  });
  const editInput=input('appearanceEditScheme','','hidden',appearanceScheme(saved.appearanceMode));
  section.append(schemeButtons,editInput,element('h3','','Paletas preparadas'),
    element('p','small-note','Cada miniatura muestra cómo quedarán las superficies del modo seleccionado.'));
  section.append(input('appearancePalette','','hidden',saved.appearancePalette||'forest'));
  const paletteGrid=element('div','appearance-palette-grid');
  Appearance.PALETTES.forEach(palette=>{
    const choice=button('','appearance-palette','appearance-palette-button',{palette:palette.id});
    choice.setAttribute('aria-label','Paleta '+palette.name);
    choice.setAttribute('aria-pressed','false');
    const miniature=element('span','appearance-palette-scene');
    const miniSidebar=element('span','appearance-palette-scene-nav');
    miniSidebar.append(element('span','','O'),element('span','is-current',''),element('span','',''));
    const miniContent=element('span','appearance-palette-scene-content');
    miniContent.append(element('span','appearance-palette-scene-line',''),
      element('span','appearance-palette-scene-card',''),
      element('span','appearance-palette-scene-action',''));
    miniature.append(miniSidebar,miniContent);
    choice.append(miniature,element('span','appearance-palette-name',palette.name));paletteGrid.append(choice);
  });
  section.append(paletteGrid);form.append(section);
  const custom=element('section','appearance-section');
  custom.append(element('h3','','Colores personalizados'),
    element('p','small-note','Controla acentos, fondos, ventanas, menú, campos, texto y bordes. Cada cambio afecta únicamente al modo que estás editando.'));
  const grid=element('div','appearance-custom-grid');
  appearanceColorFields.forEach(([key,label,detail])=>{
    const tile=element('div','appearance-color-control');
    const paint=input('appearance-'+key,'','color','#ffffff');
    const title=element('label','',label);title.append(paint);
    const toggle=element('label','appearance-custom-toggle');
    const check=element('input');check.type='checkbox';check.name='custom-'+key;
    toggle.append(check,document.createTextNode('Usar mi color'));
    tile.append(element('span','field-label',label),title,element('p','small-note',detail),toggle);
    grid.append(tile);
  });
  custom.append(grid);form.append(custom);
  const iconSection=element('section','appearance-section appearance-icons-settings');
  iconSection.append(element('h3','','Iconos e imágenes'),
    element('p','small-note','Elige las imágenes PNG originales, los iconos vectoriales o una interfaz sin iconos. No se eliminan archivos.'));
  const iconGrid=element('div','appearance-custom-grid');
  iconGrid.append(
    field('Tipo de iconos',select('appearanceIconMode',[
      {value:'vector',label:'Vectoriales de O-Isym'},
      {value:'image',label:'Imágenes PNG originales'},
      {value:'none',label:'Sin iconos'}
    ],saved.appearanceIconMode || 'vector')),
    field('Estilo de los vectoriales',select('appearanceIconVariant',[
      {value:'outline',label:'Línea fina'},
      {value:'bold',label:'Línea gruesa'},
      {value:'duotone',label:'Bicolor suave'},
      {value:'filled',label:'Con relleno'}
    ],saved.appearanceIconVariant || 'outline')),
    field('Color del icono',select('appearanceIconTone',[
      {value:'automatic',label:'Automático, según el texto'},
      {value:'accent',label:'Color de acento'},
      {value:'custom',label:'Color personalizado'}
    ],saved.appearanceIconTone || 'automatic')),
    field('Fondo de cada icono',select('appearanceIconBackground',[
      {value:'none',label:'Sin fondo'},
      {value:'soft',label:'Relleno suave'},
      {value:'filled',label:'Relleno intenso'}
    ],saved.appearanceIconBackground || 'none'))
  );
  const iconColorTile=element('div','appearance-color-control');
  iconColorTile.append(element('span','field-label','Color personalizado de iconos'));
  iconColorTile.append(input('appearanceIconColor','','color','#27856b'),
    element('p','small-note','Este color se configura de forma independiente en Claro y Oscuro.'));
  const iconBackgroundTile=element('div','appearance-color-control');
  iconBackgroundTile.append(element('span','field-label','Color de relleno'));
  iconBackgroundTile.append(input('appearanceIconBackgroundColor','','color','#d5e8e1'));
  const customBg=element('label','appearance-custom-toggle');
  const customBgCheck=element('input');customBgCheck.type='checkbox';customBgCheck.name='appearanceIconBackgroundCustom';
  customBg.append(customBgCheck,document.createTextNode('Personalizar relleno de este modo'));
  iconBackgroundTile.append(customBg);
  iconGrid.append(iconColorTile,iconBackgroundTile);iconSection.append(iconGrid);
  const examples=element('div','appearance-icon-examples');
  [['navigation/today.png','Hoy'],['navigation/calendar.png','Calendario'],['navigation/tasks.png','Tareas'],
    ['focus/timer.png','Focus'],['interface/search.png','Buscar'],['actions/edit.png','Editar']].forEach(([path,label])=>{
    const item=element('span','appearance-icon-example');
    item.append(iconImage(path,'','appearance-icon-sample'),element('span','',label));
    examples.append(item);
  });
  iconSection.append(element('span','field-label','Vista previa de iconos'),examples);
  form.append(iconSection);
  const layoutSection=element('section','appearance-section');
  layoutSection.append(element('h3','','Distribución y esquinas'));
  const layoutGrid=element('div','appearance-custom-grid');
  layoutGrid.append(
    field('Espaciado',select('appearanceDensity',[
      {value:'comfortable',label:'Cómodo'},{value:'compact',label:'Compacto'}
    ],saved.appearanceDensity||'comfortable')),
    field('Esquinas',select('appearanceRadius',[
      {value:'soft',label:'Suaves'},{value:'rounded',label:'Redondeadas'},{value:'square',label:'Rectas'}
    ],saved.appearanceRadius||'soft')),
    field('Estilo de tarjetas',select('appearanceCardStyle',[
      {value:'elevated',label:'Con profundidad y sombra'},
      {value:'soft',label:'Suaves y ligeramente coloreadas'},
      {value:'outlined',label:'Contornos definidos'}
    ],saved.appearanceCardStyle||'elevated'))
  );
  layoutSection.append(layoutGrid);form.append(layoutSection);
  const display=element('section','appearance-section');
  display.append(element('h3','','Vista previa del modo seleccionado'),
    element('p','small-note','Incluye el menú, una tarjeta, un botón y un buscador.'));
  const preview=element('div','appearance-preview');
  preview.setAttribute('role','img');preview.setAttribute('aria-label','Ejemplo del modo claro u oscuro seleccionado');
  const layout=element('div','appearance-preview-layout');
  const sidebar=element('div','appearance-preview-nav');
  sidebar.append(element('span','appearance-preview-brand','O-Isym'),
    element('span','appearance-preview-item is-selected','Hoy'),
    element('span','appearance-preview-item','Calendario'),element('span','appearance-preview-item','Tareas'));
  const exampleMain=element('div','appearance-preview-main');
  exampleMain.append(element('strong','appearance-preview-title','Tu espacio'));
  const card=element('div','appearance-preview-card');
  card.append(element('strong','','Organizar el día'),element('span','','Tu agenda en un solo lugar'),
    element('span','appearance-preview-button','Nueva tarea'));
  const search=element('div','appearance-preview-search','Buscar pizarrones');
  exampleMain.append(card,search);layout.append(sidebar,exampleMain);preview.append(layout);
  display.append(preview);const note=element('p','appearance-contrast-note');
  note.setAttribute('role','status');display.append(note);form.append(display);
  const actions=element('div','appearance-actions');
  actions.append(button('Restablecer colores de este modo','appearance-reset','button secondary'));
  const status=element('p','appearance-save-status','Todo guardado');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  actions.append(status);form.append(actions);panel.append(form);
  refreshAppearanceEditor(form,appearanceScheme(saved.appearanceMode));
}
const { getItemsForDay, getCalendarRange, getUnscheduledTasks, detectScheduleConflicts,
  getFreeTimeSlots, getTimelineLayout, taskMutation, createDayTemplate, previewDayTemplate,
  applyDayTemplate, templateAppliesOn } = window.OIsymPlanning;

// Electron does not implement window.prompt. Keep text entry inside the app.
function requestText(message, initialValue = '') {
  if (document.querySelector('[data-text-dialog]')) return Promise.resolve(null);
  return new Promise(resolve => {
    const previousFocus = document.activeElement;
    const dialog = element('dialog', 'profile-modal text-dialog');
    dialog.dataset.textDialog = 'true';
    const form = element('form', 'profile-modal-form');
    const label = element('label', '', message);
    const input = element('input');
    input.type = 'text';
    input.value = initialValue;
    label.append(input);
    const actions = element('div', 'form-actions');
    const cancel = element('button', 'button secondary', 'Cancelar');
    cancel.type = 'button';
    const accept = element('button', 'button primary', 'Aceptar');
    accept.type = 'submit';
    actions.append(cancel, accept);
    form.append(label, actions);
    dialog.append(form);
    dialog.setAttribute('aria-label', message);
    const finish = value => {
      dialog.close();
      dialog.remove();
      if (previousFocus?.isConnected) previousFocus.focus();
      resolve(value);
    };
    cancel.addEventListener('click', () => finish(null));
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish(null); });
    // Do not let Enter reach the app's delegated form handler or global shortcuts.
    form.addEventListener('submit', event => {
      event.preventDefault(); event.stopPropagation(); finish(input.value);
    });
    dialog.addEventListener('keydown', event => event.stopPropagation());
    document.body.append(dialog);
    dialog.showModal();
    input.focus(); input.select();
  });
}

const root = document.getElementById('app');
const FOCUS_MUSIC_CATALOG = [
  { id: 'focus1', name: 'Circuito de calma', category: 'Electrónica', description: 'Sintetizadores suaves y un pulso constante para entrar en ritmo.' },
  { id: 'focus2', name: 'Niebla eléctrica', category: 'Electrónica relajada', description: 'Texturas cálidas y melodías ligeras para concentrarte sin prisa.' },
  { id: 'focus3', name: 'Neón en movimiento', category: 'Electrónica dinámica', description: 'Un ritmo electrónico más activo para tareas que necesitan energía.' },
  { id: 'focus4', name: 'Café a medianoche', category: 'Jazz', description: 'Un ambiente de jazz tranquilo, ideal para leer o trabajar con calma.' },
  { id: 'focus5', name: 'Sendero celta', category: 'Céltica medieval', description: 'Melodías de inspiración celta para una sesión envolvente.' },
  { id: 'focus6', name: 'Isla de verano', category: 'Tropical', description: 'Un ambiente alegre y relajado con sensación de vacaciones.' },
  { id: 'focus7', name: 'Pasarela pop', category: 'Pop electrónico', description: 'Un pulso pop brillante para mantener el ánimo despierto.' },
  { id: 'focus8', name: 'Órbita tranquila', category: 'Electrónica', description: 'Capas electrónicas y un ambiente espacial discreto.' },
  { id: 'focus9', name: 'Respirar despacio', category: 'Meditación', description: 'Sonido sereno para bajar el ritmo y despejar la mente.' },
  { id: 'focus10', name: 'Agua quieta', category: 'Meditación', description: 'Una atmósfera pausada para sesiones tranquilas.' },
  { id: 'focus11', name: 'Silencio interior', category: 'Meditación', description: 'Un paisaje sonoro suave para desconectar del ruido.' },
  { id: 'focus12', name: 'Luz de sintetizador', category: 'Electrónica', description: 'Melodías sintéticas limpias y un ritmo moderado.' },
  { id: 'focus13', name: 'Piano de lluvia', category: 'Piano relajante', description: 'Piano relajante para leer, escribir o estudiar.' },
  { id: 'focus14', name: 'Azul de madrugada', category: 'Electrónica relajada', description: 'Una mezcla electrónica tranquila con un toque melódico.' }
];
const FOCUS_ALARM_CATALOG = [
  { id: 'clock', name: 'Reloj de torre', file: 'clock.mp3' },
  { id: 'digital', name: 'Pulso digital', file: 'digital.mp3' },
  { id: 'funny', name: 'Tililí', file: 'funny.mp3' },
  { id: 'ringtone1', name: 'Carrillón clásico', file: 'ringtone1.mp3' },
  { id: 'ringtone2', name: 'Xilófono claro', file: 'ringtone2.mp3' },
  { id: 'ringtone3', name: 'Campanas de cristal', file: 'ringtone3.mp3' },
  { id: 'ringtone4', name: 'Llamada luminosa', file: 'ringtone4.mp3' },
  { id: 'ringtone5', name: 'Tono de bolsillo', file: 'ringtone5.mp3' },
  { id: 'ringtone6', name: 'Carrillón alegre', file: 'ringtone6.mp3' },
  { id: 'tititi', name: 'Doble timbre', file: 'tititi.mp3' }
];
const musicTrackById = id => FOCUS_MUSIC_CATALOG.find(track => track.id === id) || null;
const alarmSoundById = id => FOCUS_ALARM_CATALOG.find(sound => sound.id === id) || null;
const alarmToneOptions = FOCUS_ALARM_CATALOG.map(sound => ({ value: sound.id, label: sound.name }));
const state = {
  snapshot: null,
  profile: null,
  view: 'today',
  selectedDate: localDate(),
  calendarDate: new Date(),
  calendarMode: window.oisym?.platform==='android' ? 'day' : 'month',
  sidebarCollapsed: false,
  taskEditorFocusField: 'title',
  taskFilter: 'active',
  focusTick: null,
  focusFinishing: false,
  focusSaveFailures: new Map(),
  toastTimer: null,
  editingTaskId: null,
  editingActivityId: null,
  editingGoalId: null,
  plannerAnalysis: null,
  selectedProfileId: null,
  settingsSection: 'profile',
  showTaskForm: false,
  taskFormDefaults: {},
  selectedTemplateId: '',
  editingTemplateId: null,
  templatePreview: null,
  showActivityForm: false,
  showGoalForm: false,
  launchPromptShown: false,
  pendingTaskReminder: null,
  plannerSection: 'library',
  selectedIdeaBoardId: null,
  ideaBoardSearch: '',
  ideaBoardSort: 'modified',
  ideaViewportSaveTimer: null,
  ideaBoardHistories: {},
  ideaHistoryRestoring: false,
  ideaSelections: {},
  ideaSaveFailed: false
};

const $ = (selector, parent = root) => parent.querySelector(selector);
const $$ = (selector, parent = root) => Array.from(parent.querySelectorAll(selector));
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
};
const iconFallbackLabel = path => {
  const name = String(path).split('/').pop().replace(/\.png$/i,'');
  const known = {
    today:'H', calendar:'C', tasks:'T', activities:'A', dashboard:'P',
    goals:'O', insights:'E', settings:'⚙', profiles:'P', timer:'F',
    add:'+', save:'✓', edit:'✎', delete:'×', back:'‹',
    'zoom-in':'+', 'zoom-out':'−', undo:'↶', redo:'↷'
  };
  return known[name] || name.charAt(0).toUpperCase() || '•';
};
const iconImage = (path, alt = '', className = 'ui-icon') => {
  const mode = state.profile?.preferences?.appearanceIconMode || 'vector';
  const vector = () => window.OIsymIcons?.glyph(path,document,className,alt) || null;
  let icon;
  if (mode === 'none') {
    icon=element('span',className+' icon-disabled');
    icon.setAttribute('aria-hidden','true');
  } else if (mode === 'vector' && vector()) {
    icon=vector();
  } else {
    const image=element('img',className+' icon-bitmap');
    image.src='assets/icons/'+path;
    image.alt=alt;
    image.draggable=false;
    image.decoding='async';
    image.loading='eager';
    if (!alt) image.setAttribute('aria-hidden','true');
    image.onerror=()=>{
      if (!image.isConnected) return;
      const fallback=vector() || element('span',className+' icon-fallback',iconFallbackLabel(path));
      if (fallback.tagName.toLowerCase() === 'span') fallback.setAttribute('aria-hidden','true');
      fallback.dataset.iconSource=path;
      fallback.dataset.iconAlt=alt;
      fallback.dataset.iconClass=className;
      image.replaceWith(fallback);
    };
    icon=image;
  }
  icon.dataset.iconSource=path;
  icon.dataset.iconAlt=alt;
  icon.dataset.iconClass=className;
  return icon;
};
// Changing icon sources must not recreate input fields, reset cursor positions or
// destroy an open task editor; only the icon nodes are replaced in place.
function refreshRenderedIcons() {
  document.querySelectorAll('[data-icon-source]').forEach(node=>{
    const {iconSource,iconAlt,iconClass}=node.dataset;
    node.replaceWith(iconImage(iconSource,iconAlt,iconClass));
  });
}

const IDEA_ACTION_ICONS = {
  'ideas-create': 'ideas/board-add.png', 'ideas-import-trigger': 'actions/import.png',
  'ideas-edit': 'actions/edit.png', 'ideas-rename': 'actions/edit.png', 'ideas-export': 'actions/export.png',
  'ideas-duplicate': 'actions/duplicate.png', 'ideas-delete': 'actions/delete.png', 'ideas-library': 'actions/back.png',
  'ideas-note-create': 'ideas/note-add.png', 'ideas-activity-create': 'ideas/activity-add.png',
  'ideas-note-duplicate': 'actions/duplicate.png', 'ideas-activity-duplicate': 'actions/duplicate.png',
  'ideas-note-delete': 'actions/delete.png', 'ideas-activity-delete': 'actions/delete.png',
  'ideas-connect-arrow': 'ideas/connect-arrow.png', 'ideas-connect-line': 'ideas/connect-line.png',
  'ideas-connection-edit': 'ideas/connection-label.png', 'ideas-connection-delete': 'actions/delete.png',
  'ideas-group-create': 'ideas/group.png', 'ideas-group-remove': 'ideas/ungroup.png',
  'ideas-history-undo': 'actions/undo.png', 'ideas-history-redo': 'actions/redo.png',
  'ideas-canvas-zoom-in': 'ideas/zoom-in.png', 'ideas-canvas-zoom-out': 'ideas/zoom-out.png',
  'ideas-canvas-center': 'ideas/center.png', 'ideas-canvas-fit': 'ideas/fit-view.png',
  'ideas-node-filters-clear': 'tasks/filter.png', 'ideas-help': 'interface/help.png'
};
const button = (label, action, className = 'button secondary', data = {}) => {
  const node = element('button', className, label);
  node.type = 'button';
  node.dataset.action = action;
  if (IDEA_ACTION_ICONS[action]) {
    const compact = className.includes('ideas-note-icon-button') || action.includes('canvas-zoom-');
    const cleanLabel = label.replace(/^[+＋×↶↷↗—←−]+\s*/, '') || label;
    node.replaceChildren(iconImage(IDEA_ACTION_ICONS[action], '', 'button-icon'));
    const caption = element('span', 'button-label' + (compact ? ' sr-only' : ''), cleanLabel);
    node.append(caption); node.title = cleanLabel; node.setAttribute('aria-label', cleanLabel);
  }
  Object.entries(data).forEach(([key, value]) => node.dataset[key] = String(value));
  return node;
};
const actionIconButton = (label, action, icon, className = 'button secondary', data = {}) => {
  const node = button('', action, className + ' button-with-icon', data);
  node.append(iconImage('actions/' + icon, '', 'action-button-icon'), element('span', '', label));
  return node;
};
const field = (labelText, control) => {
  const wrap = element('label', 'field');
  wrap.append(element('span', 'field-label', labelText), control);
  return wrap;
};
const input = (name, placeholder, type = 'text', value = '') => {
  const node = element('input', 'input');
  node.name = name;
  node.type = type;
  node.placeholder = placeholder || '';
  node.value = value == null ? '' : String(value);
  if (type === 'number') node.min = '0';
  return node;
};
const select = (name, options, value) => {
  const node = element('select', 'input');
  node.name = name;
  options.forEach(option => {
    const item = element('option', '', option.label);
    item.value = option.value;
    node.append(item);
  });
  if (value !== undefined) node.value = value;
  return node;
};
const textarea = (name, placeholder, value = '') => {
  const node = element('textarea', 'input textarea');
  node.name = name;
  node.placeholder = placeholder || '';
  node.value = value;
  node.rows = 3;
  return node;
};
const card = (className = 'card') => element('section', className);
const heading = (title, subtitle, iconPath = '') => {
  const wrap = element('div', 'section-heading');
  const titleRow = element('div', 'section-heading-title');
  if (iconPath) titleRow.append(iconImage(iconPath, '', 'section-heading-icon'));
  titleRow.append(element('h2', '', title));
  wrap.append(titleRow);
  if (subtitle) wrap.append(element('p', 'muted', subtitle));
  return wrap;
};
const empty = (title, detail) => {
  const wrap = element('div', 'empty-state');
  wrap.append(element('div', 'empty-symbol', '○'), element('h3', '', title), element('p', 'muted', detail));
  return wrap;
};
const dateLabel = (key, options = { weekday: 'long', day: 'numeric', month: 'long' }) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', options);
};
const timeNow = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
const allPending = () => state.profile.tasks.filter(task => task.status === 'pending' && task.scheduledDate === state.selectedDate);
const syncLaunchAtLogin = () => {
  const request = window.oisym?.notifications?.setLaunchAtLogin?.(state.profile?.preferences?.launchAtLogin === true);
  if (request && typeof request.catch === 'function') request.catch(() => {});
};
const cloneActiveProfile = () => JSON.parse(JSON.stringify(state.profile));
const restoreActiveProfile = profile => {
  state.profile = profile;
  state.snapshot.profiles = state.snapshot.profiles.map(item => item.id === profile.id ? profile : item);
  state.snapshot.activeProfileId = profile.id;
};
const cloneIdeaBoard = board => JSON.parse(JSON.stringify(board));
const ideaContent = board => {
  const copy = cloneIdeaBoard(board);
  delete copy.viewport; delete copy.modifiedAt;
  copy.nodes.forEach(node => { delete node.modifiedAt; });
  return JSON.stringify(copy);
};
const getIdeaBoardHistory = board => {
  if (!board) return null;
  if (!state.ideaBoardHistories[board.id]) state.ideaBoardHistories[board.id] = { past: [], future: [], last: cloneIdeaBoard(board) };
  return state.ideaBoardHistories[board.id];
};
const syncIdeaHistoryButtons = () => {
  const board = state.profile?.ideaBoards?.find(item => item.id === state.selectedIdeaBoardId);
  const history = board && getIdeaBoardHistory(board);
  const undo = root.querySelector('[data-action="ideas-history-undo"]');
  const redo = root.querySelector('[data-action="ideas-history-redo"]');
  if (undo) undo.disabled = !history?.past.length || state.ideaHistoryRestoring;
  if (redo) redo.disabled = !history?.future.length || state.ideaHistoryRestoring;
};
const recordIdeaBoardChange = board => {
  if (!board || state.ideaHistoryRestoring) return;
  const history = getIdeaBoardHistory(board);
  if (ideaContent(board) === ideaContent(history.last)) return;
  history.past.push(history.last);
  if (history.past.length > 50) history.past.shift();
  history.last = cloneIdeaBoard(board);
  history.future = [];
  syncIdeaHistoryButtons();
};
let saveQueue = Promise.resolve(true);
let saveRevision = 0;
const save = () => {
  if (!state.profile) return Promise.resolve(false);
  const revision = ++saveRevision;
  state.profile.updatedAt = new Date().toISOString();
  state.snapshot.profiles = state.snapshot.profiles.map(profile => profile.id === state.profile.id ? state.profile : profile);
  state.snapshot.activeProfileId = state.profile.id;
  state.snapshot.updatedAt = new Date().toISOString();
  // Capture now; late IPC replies must never replace newer in-memory edits.
  const snapshot = JSON.parse(JSON.stringify(state.snapshot));
  const board = snapshot.profiles.find(p => p.id === snapshot.activeProfileId)?.ideaBoards?.find(b => b.id === state.selectedIdeaBoardId);
  saveQueue = saveQueue.then(async () => {
    try {
      await window.oisym.storage.save(snapshot);
      recordIdeaBoardChange(board);
      if (revision === saveRevision) state.ideaSaveFailed = false;
      return true;
    } catch (error) {
      state.ideaSaveFailed = true;
      showToast('No se pudo guardar. Conservamos los cambios abiertos: ' + error.message, 'error');
      return false;
    }
  });
  return saveQueue;
};
// Appearance changes are painted immediately, then coalesced into one queued write.
// The rollback only restores appearance fields; tasks, Focus and board data are untouched.
const appearanceValues = profile => {
  const p=profile.preferences;
  return {
    appearanceMode:p.appearanceMode,appearancePalette:p.appearancePalette,
    appearanceColors:{...p.appearanceColors},
    appearancePalettes:{...p.appearancePalettes},
    appearanceColorsByMode:JSON.parse(JSON.stringify(p.appearanceColorsByMode)),
    appearanceDensity:p.appearanceDensity,appearanceRadius:p.appearanceRadius,
    appearanceIconMode:p.appearanceIconMode,appearanceIconVariant:p.appearanceIconVariant,
    appearanceIconTone:p.appearanceIconTone,appearanceIconBackground:p.appearanceIconBackground,
    appearanceIconColorsByMode:{...p.appearanceIconColorsByMode},
    appearanceIconBackgroundColorsByMode:{...p.appearanceIconBackgroundColorsByMode},
    appearanceCardStyle:p.appearanceCardStyle
  };
};
let appearancePending = null;
let appearanceTimer = null;
let appearanceSaving = null;
let appearanceChangeSerial = 0;
const appearanceStatus = (message, isError = false) => {
  const target = $('.appearance-save-status');
  if (!target) return;
  target.textContent = message;
  target.classList.toggle('is-error', isError);
};
function applyAppearanceSelection(form) {
  if (!form || !state.profile) return;
  const next = appearanceDraft(form);
  if (!['light','dark','system'].includes(next.appearanceMode) ||
      !Appearance.PALETTES.some(p=>p.id===next.appearancePalette) ||
      Object.values(next.appearanceColorsByMode).some(colors =>
        Object.values(colors).some(color=>color!=='' && !Appearance.validHex(color))) ||
      !['comfortable','compact'].includes(next.appearanceDensity) ||
      !['soft','rounded','square'].includes(next.appearanceRadius) ||
      !['vector','image','none'].includes(next.appearanceIconMode) ||
      !['outline','bold','duotone','filled'].includes(next.appearanceIconVariant) ||
      !['automatic','accent','custom'].includes(next.appearanceIconTone) ||
      !['none','soft','filled'].includes(next.appearanceIconBackground) ||
      !['elevated','soft','outlined'].includes(next.appearanceCardStyle) ||
      ['appearanceIconColorsByMode','appearanceIconBackgroundColorsByMode'].some(key=>
        Object.values(next[key]).some(color=>color!=='' && !Appearance.validHex(color)))) {
    appearanceStatus('Revisa los colores seleccionados', true);
    return;
  }
  const profileId = state.profile.id;
  if (!appearancePending || appearancePending.profileId !== profileId) {
    appearancePending = { profileId, persisted: appearanceValues(state.profile) };
  }
  const oldIconMode=state.profile.preferences.appearanceIconMode || 'vector';
  Object.assign(state.profile.preferences,next);
  applyProfileAppearance();
  if (oldIconMode !== next.appearanceIconMode) refreshRenderedIcons();
  updateAppearancePreview(form);
  appearanceStatus('Guardando automáticamente…');
  appearanceChangeSerial++;
  clearTimeout(appearanceTimer);
  appearanceTimer = setTimeout(() => { void flushAppearanceChanges(); }, 360);
}
async function flushAppearanceChanges() {
  clearTimeout(appearanceTimer);
  appearanceTimer = null;
  if (appearanceSaving) {
    const result = await appearanceSaving;
    if (appearancePending) return flushAppearanceChanges();
    return result;
  }
  const pending = appearancePending;
  if (!pending) return true;
  if (!state.profile || state.profile.id !== pending.profileId) return false;
  const revision = appearanceChangeSerial;
  const captured = appearanceValues(state.profile);
  const operation = (async () => {
    const ok = await save();
    if (appearancePending !== pending) return ok;
    if (ok) {
      pending.persisted = captured;
      if (revision === appearanceChangeSerial) {
        appearancePending = null;
        appearanceStatus('Cambios guardados');
      }
    } else if (revision === appearanceChangeSerial) {
      // Do not revert an entire profile: other functions could have edited its tasks.
      const oldIconMode=state.profile.preferences.appearanceIconMode;
      Object.assign(state.profile.preferences,pending.persisted);
      appearancePending = null;
      applyProfileAppearance();
      if (oldIconMode!==state.profile.preferences.appearanceIconMode) refreshRenderedIcons();
      updateShell();
      appearanceStatus('No se pudo guardar. Recuperamos la última apariencia.', true);
    }
    return ok;
  })();
  appearanceSaving = operation;
  const succeeded = await operation;
  if (appearanceSaving === operation) appearanceSaving = null;
  return succeeded;
}

const flushIdeaChanges = async () => {
  if (!state.profile) return true;
  while (true) {
    clearTimeout(state.ideaViewportSaveTimer);
    state.ideaViewportSaveTimer = null;
    const pending = save();
    const captured = JSON.stringify(state.snapshot);
    if (!await pending) return false;
    if (JSON.stringify(state.snapshot) === captured) return true;
  }
};
const restoreIdeaBoardHistory = async direction => {
  if (state.ideaHistoryRestoring) return false;
  if (!await flushIdeaChanges()) return false;
  if (state.ideaHistoryRestoring) return false;
  const boardIndex = state.profile?.ideaBoards?.findIndex(item => item.id === state.selectedIdeaBoardId) ?? -1;
  if (boardIndex < 0) return false;
  const board = state.profile.ideaBoards[boardIndex];
  const history = getIdeaBoardHistory(board);
  const source = direction === 'undo' ? history.past : history.future;
  const destination = direction === 'undo' ? history.future : history.past;
  if (!source.length) return false;
  const current = cloneIdeaBoard(board);
  const target = source.pop();
  destination.push(current);
  const restored = cloneIdeaBoard(target);
  restored.viewport = { ...board.viewport };
  restored.modifiedAt = new Date().toISOString();
  state.profile.ideaBoards[boardIndex] = restored;
  state.ideaHistoryRestoring = true;
  syncIdeaHistoryButtons();
  const saved = await save();
  state.ideaHistoryRestoring = false;
  if (!saved) {
    source.push(target); destination.pop();
    state.profile.ideaBoards[boardIndex] = current;
    syncIdeaHistoryButtons();
    return false;
  }
  history.last = cloneIdeaBoard(restored);
  updateShell();
  root.querySelector('.ideas-canvas-viewport')?.focus({ preventScroll: true });
  return true;
};
const showToast = (message, type = 'success') => {
  const existing = $('.toast');
  if (existing) existing.remove();
  const toast = element('div', 'toast ' + type, message);
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  toast.setAttribute('aria-atomic', 'true');
  root.append(toast);
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.remove(), 3600);
};
const formData = form => Object.fromEntries(new FormData(form).entries());
const taskById = id => state.profile.tasks.find(task => task.id === id);
const activityById = id => state.profile.activities.find(activity => activity.id === id);
const goalById = id => state.profile.goals.find(goal => goal.id === id);
const priorityLabel = value => ({ high: 'Alta', medium: 'Media', low: 'Baja' }[value] || 'Media');
const priorityClass = value => 'priority-' + (value || 'medium');
const avatarMark = profile => ({ leaf: '❧', book: '▤', compass: '⌖', spark: '✳', wave: '≈' }[profile.avatarId] || String(profile.name || 'O').trim().charAt(0).toUpperCase() || 'O');
const isImageAvatar = id => /^profile-(?:[1-9]|1[0-8])$/.test(String(id || ''));
const makeAvatarImage = id => {
  const image=element('img','avatar-image');
  image.src='assets/avatars/profile-'+String(id).replace('profile-','')+'.png';
  image.alt='';image.draggable=false;
  image.onerror=()=>{
    const fallback=element('span','avatar-image avatar-fallback','P');
    fallback.setAttribute('aria-hidden','true');
    image.replaceWith(fallback);
  };
  return image;
};
const updateProfilePreview = form => {
  const avatarId=$('input[name="avatarId"]',form)?.value||'profile-1';
  $$('.avatar-choice',form).forEach(choice=>{const selected=choice.dataset.avatar===avatarId;choice.classList.toggle('selected',selected);choice.setAttribute('aria-pressed',String(selected));});
  const preview=$('.profile-avatar-preview',form); if(!preview)return; preview.replaceChildren();
  if(isImageAvatar(avatarId))preview.append(makeAvatarImage(avatarId)); else preview.textContent=avatarMark({avatarId,name:$('input[name="name"]',form)?.value||'O'});
  const color=$('input[name="color"]',form)?.value; if(/^#[0-9a-f]{6}$/i.test(color||'')){preview.style.backgroundColor=color;preview.style.color='#fff';}
};
const buildAvatarPicker = (parent, selectedId='profile-1') => {
  const hidden=input('avatarId','','hidden',selectedId);hidden.value=selectedId;parent.append(hidden);
  const grid=element('div','avatar-picker');grid.setAttribute('role','group');grid.setAttribute('aria-label','Elige una foto de perfil');
  for(let index=1;index<=18;index++){const id='profile-'+index;const choice=button('','choose-profile-avatar','avatar-choice'+(id===selectedId?' selected':''),{avatar:id});choice.setAttribute('aria-label','Avatar '+index);choice.setAttribute('aria-pressed',String(id===selectedId));choice.append(makeAvatarImage(id));grid.append(choice);}
  parent.append(grid);return grid;
};

function buildShell() {
  root.replaceChildren();
  const skipLink = element('a', 'skip-link', 'Saltar al contenido');
  skipLink.href = '#main-content';
  const shell = element('div', 'shell workspace-shell');
  const sidebar = element('aside', 'sidebar workspace-sidebar');
  sidebar.id = 'workspace-sidebar';
  sidebar.setAttribute('aria-label', 'Menú de O-Isym');

  const brand = element('div', 'brand workspace-brand');
  brand.append(element('div', 'brand-mark', 'O'));
  const brandCopy = element('div', 'brand-copy');
  brandCopy.append(element('strong', '', 'O-Isym'), element('span', '', 'Tu espacio de organización'));
  brand.append(brandCopy);
  sidebar.append(brand);

  const profileBox = element('div', 'profile-switcher');
  const profileSelect = select('profile', []);
  profileSelect.id = 'profile-select';
  profileSelect.setAttribute('aria-label', 'Cambiar perfil activo');
  profileBox.append(element('span', 'eyebrow', 'PERFIL ACTIVO'), profileSelect,
    button('+ Nuevo perfil', 'new-profile', 'profile-add'));
  sidebar.append(profileBox);

  const nav = element('nav', 'navigation workspace-navigation');
  nav.setAttribute('aria-label', 'Secciones');
  const addGroup = (label, items) => {
    const group = element('div', 'navigation-group');
    group.append(element('div', 'navigation-group-label', label));
    const list = element('div', 'navigation-group-items');
    items.forEach(([id, name, icon]) => {
      const item = button('', 'navigate', 'nav-item', { view: id });
      item.setAttribute('aria-label', name);
      item.title = name;
      item.append(iconImage(icon, '', 'nav-icon-image'), element('span', 'nav-label', name));
      list.append(item);
    });
    group.append(list); nav.append(group);
  };
  addGroup('PLANIFICAR', [
    ['today', 'Hoy', 'navigation/today.png'],
    ['calendar', 'Calendario', 'navigation/calendar.png'],
    ['tasks', 'Tareas', 'navigation/tasks.png'],
    ['activities', 'Actividades', 'navigation/activities.png'],
    ['goals', 'Objetivos', 'navigation/goals.png']
  ]);
  addGroup('EXPLORAR Y CREAR', [
    ['planner', 'Pizarrones', 'navigation/dashboard.png'],
    ['focus', 'Focus', 'focus/timer.png'],
    ['insights', 'Estadísticas', 'navigation/insights.png']
  ]);
  addGroup('TU ESPACIO', [
    ['profiles', 'Perfiles', 'actions/profiles.png'],
    ['settings', 'Ajustes', 'interface/settings.png']
  ]);
  sidebar.append(nav);
  const sidebarBottom = element('div', 'sidebar-bottom');
  sidebarBottom.append(element('p', 'sidebar-note', 'Tus datos se guardan en este dispositivo.'));
  sidebar.append(sidebarBottom);

  const workspace = element('div', 'workspace');
  const topbar = element('header', 'topbar workspace-topbar');
  const topLeft = element('div', 'topbar-context');
  const toggle = button('☰', 'toggle-sidebar', 'sidebar-toggle');
  toggle.id = 'toggle-sidebar';
  toggle.setAttribute('aria-label', 'Contraer menú');
  toggle.setAttribute('aria-controls', 'workspace-sidebar');
  toggle.setAttribute('aria-expanded', 'true');
  const location = element('div', 'topbar-location');
  location.append(element('span', 'topbar-eyebrow', 'ESPACIO DE TRABAJO'));
  const viewName = element('strong', 'topbar-view-name');
  viewName.id = 'topbar-view-name';
  location.append(viewName);
  const date = element('span', 'topbar-date');
  date.id = 'topbar-date';
  topLeft.append(toggle, location, date);

  const topRight = element('div', 'topbar-actions');
  const inbox = element('span', 'topbar-inbox');
  inbox.id = 'topbar-inbox';
  inbox.setAttribute('aria-live', 'polite');
  topRight.append(inbox, button('Hoy', 'topbar-today', 'button secondary topbar-today'),
    button('Calendario', 'topbar-calendar', 'button secondary topbar-calendar'));
  const quickTask = button('+ Nueva tarea', 'quick-task', 'button primary topbar-create');
  quickTask.prepend(iconImage('interface/add.png', '', 'button-icon'));
  topRight.append(quickTask);
  topbar.append(topLeft, topRight);

  const main = element('main', 'main-content workspace-main');
  main.id = 'main-content';
  main.tabIndex = -1;
  workspace.append(topbar, main);
  shell.append(sidebar, workspace);
  root.append(skipLink, shell);
}

function updateShell() {
  const profileSelect = $('#profile-select');
  if (!profileSelect) return;
  profileSelect.replaceChildren();
  state.snapshot.profiles.forEach(profile => {
    const option = element('option', '', profile.name);
    option.value = profile.id;
    profileSelect.append(option);
  });
  profileSelect.value = state.profile.id;
  const profileBox = $('.profile-switcher');
  let avatar = $('.profile-avatar', profileBox);
  if (!avatar) { avatar = element('div', 'profile-avatar'); profileBox.insertBefore(avatar, profileSelect); }
  avatar.replaceChildren();
  if (isImageAvatar(state.profile.avatarId)) avatar.append(makeAvatarImage(state.profile.avatarId));
  else avatar.textContent = avatarMark(state.profile);
  avatar.setAttribute('aria-label', 'Avatar del perfil ' + state.profile.name);
  root.dataset.audience = getAgeBand(state.profile.age);
  root.dataset.theme = state.profile.preferences.theme || 'classic';
  applyProfileAppearance();
  root.classList.toggle('reduce-motion', state.profile.preferences.motionEnabled === false);
  $('#topbar-date').textContent = dateLabel(localDate(), { weekday: 'short', day: 'numeric', month: 'long' });
  const viewNames = { today: 'Hoy', calendar: 'Calendario', tasks: 'Tareas',
    activities: 'Actividades', goals: 'Objetivos', planner: 'Pizarrones',
    focus: 'Focus', insights: 'Estadísticas', profiles: 'Perfiles', settings: 'Ajustes' };
  $('#topbar-view-name').textContent = viewNames[state.view] || 'Hoy';
  $('#topbar-inbox').textContent = getUnscheduledTasks(state.profile).length + ' sin programar';
  const shell = $('.workspace-shell');
  shell.classList.toggle('is-sidebar-collapsed', state.sidebarCollapsed);
  const menuToggle = $('#toggle-sidebar');
  menuToggle.setAttribute('aria-expanded', String(!state.sidebarCollapsed));
  menuToggle.setAttribute('aria-label', state.sidebarCollapsed ? 'Expandir menú' : 'Contraer menú');
  menuToggle.title = state.sidebarCollapsed ? 'Expandir menú' : 'Contraer menú';
  $$('.nav-item').forEach(item => {
    const active = item.dataset.view === state.view;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  const main = $('#main-content');
  main.replaceChildren();
  const renderers = {
    today: renderToday, tasks: renderTasks, activities: renderActivities,
    calendar: renderCalendar, planner: renderPlanner, focus: renderFocus,
    goals: renderGoals, insights: renderInsights, settings: renderSettings, profiles: renderProfiles
  };
  (renderers[state.view] || renderToday)(main);
  if (state.showTaskForm || state.editingTaskId) renderSharedTaskDialog(main);
  main.dataset.view = state.view;
  if (window.oisym?.platform === 'android') window.dispatchEvent(new CustomEvent('oisym:rendered', { detail: { view: state.view } }));
}

function addTaskForm(parent, defaults = {}) {
  const editing = Boolean(state.editingTaskId);
  const form = element('form', 'form-card task-form task-editor-form');
  form.dataset.form = editing ? 'task-edit' : 'task';
  form.append(element('h3', 'task-editor-title', editing ? 'Editar tarea' : 'Nueva tarea'),
    element('p', 'task-editor-description muted',
      'El mismo registro se verá en Hoy, Calendario y Tareas. No se crearán copias.'));

  const basic = element('section', 'task-editor-section');
  basic.append(element('h4', '', 'Detalles'));
  basic.append(field('Nombre de la tarea', input('title', 'Ej. Practicar violín', 'text', defaults.title || '')));
  basic.append(field('Notas (opcional)', textarea('description', 'Qué necesitas recordar…', defaults.description || '')));
  const basicRow = element('div', 'form-grid');
  basicRow.append(field('Prioridad', select('priority', [
    { value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' }, { value: 'high', label: 'Alta' }
  ], defaults.priority || 'medium')),
    field('Duración estimada (min)', input('estimatedMinutes', '30', 'number', defaults.estimatedMinutes || 30)));
  basic.append(basicRow);
  form.append(basic);

  const scheduling = element('section', 'task-editor-section task-editor-scheduling');
  scheduling.append(element('h4', '', 'Planificación'),
    element('p', 'small-note', 'Puedes dejar una tarea sin fecha y programarla más tarde.'));
  const dateRow = element('div', 'form-grid');
  dateRow.append(field('Programar para (opcional)', input('scheduledDate', '', 'date', defaults.scheduledDate || '')),
    field('Fecha límite (opcional)', input('dueDate', '', 'date', defaults.dueDate || '')));
  scheduling.append(dateRow);
  const hours = element('div', 'form-grid');
  hours.append(field('Hora de inicio', input('startTime', '', 'time', defaults.startTime || '')),
    field('Hora de fin', input('endTime', '', 'time', defaults.endTime || '')));
  scheduling.append(hours);
  scheduling.append(element('p', 'small-note', 'Las horas son opcionales, pero deben tener inicio y fin.'));
  form.append(scheduling);

  const options = element('section', 'task-editor-section');
  options.append(element('h4', '', 'Opciones'));
  options.append(field('Actividad del catálogo', activitySelect('activityId', defaults.activityId || '')));
  options.append(field('Avisos de esta tarea', select('reminderEnabled', [
    { value: 'true', label: 'Avisarme al llegar la hora' },
    { value: 'false', label: 'No avisarme' }
  ], String(defaults.reminderEnabled !== false))));
  options.append(field('Bloque de tiempo', select('locked', [
    { value: 'false', label: 'Flexible, se puede mover' },
    { value: 'true', label: 'Bloqueado, requiere confirmación para mover' }
  ], String(Boolean(defaults.locked)))));
  form.append(options);
  const actions = element('div', 'form-actions task-editor-actions');
  actions.append(button('Cancelar', editing ? 'cancel-edit-task' : 'close-task-form', 'button secondary'),
    editing ? actionIconButton('Guardar cambios', 'submit-form', 'save.png', 'button primary') :
      button('Crear tarea', 'submit-form', 'button primary'));
  form.append(actions);
  parent.append(form);
  return form;
}

function activitySelect(name, selected) {
  const node = select(name, [{ value: '', label: 'Sin actividad' }, ...state.profile.activities.filter(item => !item.archived).map(item => ({ value: item.id, label: item.name }))], selected);
  return node;
}

function renderTaskList(parent, tasks, options = {}) {
  if (!tasks.length) {
    parent.append(empty(options.emptyTitle || 'No hay tareas aquí', options.emptyDetail || 'Cuando agregues tareas, aparecerán en este espacio.'));
    return;
  }
  const list = element('div', 'task-list');
  tasks.forEach(task => {
    const row = element('article', 'task-row');
    const check = element('button', 'task-check' + (task.status === 'done' ? ' checked' : ''), task.status === 'done' ? '✓' : '');
    check.dataset.action = 'toggle-task';
    check.dataset.id = task.id;
    check.setAttribute('aria-label', task.status === 'done' ? 'Reabrir tarea' : 'Completar tarea');
    const content = element('div', 'task-content');
    content.append(element('strong', task.status === 'done' ? 'completed' : '', task.title));
    const meta = element('div', 'task-meta');
    const activity = activityById(task.activityId);
    if (task.scheduledDate) meta.append(element('span', 'meta-chip schedule-date-chip', 'Programada · ' + dateLabel(task.scheduledDate, { weekday: 'short', day: 'numeric', month: 'short' })));
    if (task.dueDate) meta.append(element('span', 'meta-chip due-date-chip', 'Vence · ' + dateLabel(task.dueDate, { day: 'numeric', month: 'short' })));
    if (task.startTime) meta.append(element('span', 'meta-chip schedule-time-chip', 'Hora · ' + task.startTime + (task.endTime ? '–' + task.endTime : '')));
    if (task.status === 'pending' && task.scheduledDate && task.startTime) {
      const reminderPreferences = state.profile.preferences || {};
      const scope = reminderPreferences.taskNotificationScope || 'all';
      const inScope = scope === 'all' || (scope === 'activity' && activity && !activity.archived) || (scope === 'high' && task.priority === 'high');
      if (task.reminderEnabled === false) meta.append(element('span', 'meta-chip task-reminder-muted', 'Aviso desactivado'));
      else if (reminderPreferences.taskNotificationsEnabled === false) meta.append(element('span', 'meta-chip task-reminder-muted', 'Avisos globales desactivados'));
      else if (!inScope) meta.append(element('span', 'meta-chip task-reminder-muted', 'Fuera del filtro'));
      else meta.append(iconImage('notifications/task-reminder.png', '', 'task-reminder-icon'), element('span', 'meta-chip task-reminder-chip', 'Aviso activado'));
    }
    meta.append(iconImage('tasks/priority.png', '', 'meta-icon'), element('span', 'meta-chip ' + priorityClass(task.priority), priorityLabel(task.priority)));
    if (task.locked) meta.append(element('span', 'meta-chip locked-chip', 'Bloqueada'));
    if (activity) meta.append(element('span', 'meta-chip', activity.name));
    if (task.description) meta.append(element('span', 'task-description', task.description));
    content.append(meta);
    const actions = element('div', 'task-actions');
    if (task.status === 'pending') actions.append(button(task.scheduledDate ? 'Mover' : 'Programar',
      'plan-task', 'button secondary small task-plan-action', { id: task.id }));
    actions.append(actionIconButton('Editar', 'edit-task', 'edit.png', 'button secondary small', { id: task.id }));
    const menu = element('details', 'task-action-menu');
    const trigger = element('summary', 'task-menu-trigger', 'Opciones');
    trigger.setAttribute('aria-label', 'Opciones de ' + task.title);
    const choices = element('div', 'task-menu-choices');
    choices.append(button(task.locked ? 'Desbloquear' : 'Bloquear',
      'task-action-lock', 'task-menu-choice', { id: task.id }));
    if (task.status === 'pending') choices.append(button('Mover al día siguiente',
      'task-action-postpone', 'task-menu-choice', { id: task.id }));
    choices.append(button('Eliminar tarea', 'task-action-delete', 'task-menu-choice danger', { id: task.id }));
    menu.append(trigger, choices);
    actions.append(menu);
    row.append(check, content, actions);
    list.append(row);
  });
  parent.append(list);
}

function renderToday(main) {
  const date = localDate();
  const overdue = state.profile.tasks.filter(task => task.status === 'pending' && task.dueDate && task.dueDate < date);
  const tasks = getItemsForDay(state.profile, date).filter(item => item.task.status === 'pending').map(item => item.task);
  const done = state.profile.tasks.filter(task => task.status === 'done' && task.completedAt && task.completedAt.slice(0, 10) === date);
  const hero = card('welcome-card');
  const greeting = new Date().getHours() < 12 ? 'Buenos días' : (new Date().getHours() < 19 ? 'Buenas tardes' : 'Buenas noches');
  const childMode=getAgeBand(state.profile.age)==='child';
  const heroTitle = element('div', 'today-title');
  heroTitle.append(iconImage('navigation/today.png', '', 'view-title-icon'), element('h1', '', childMode ? '¡Hola, ' + state.profile.name + '!' : greeting + ', ' + state.profile.name));
  hero.append(element('div','eyebrow',dateLabel(date,{weekday:'long',day:'numeric',month:'long'})), heroTitle, element('p','',childMode?'Este es tu espacio para organizar tus ideas, juegos y actividades.':'Organiza lo importante. Deja espacio para lo inesperado.'));
  const progress = element('div', 'progress-wrap');
  const progressTop = element('div', 'progress-label');
  const totalToday = done.length + tasks.length;
  const progressPercent = totalToday ? Math.round(done.length / totalToday * 100) : 0;
  progressTop.append(element('span', '', 'Tu día'), element('strong', '', totalToday ? done.length + ' de ' + totalToday + ' tareas' : 'Sin tareas para hoy'));
  const bar = element('div', 'progress-track');
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'Progreso de tareas de hoy');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  bar.setAttribute('aria-valuenow', String(progressPercent));
  const fill = element('div', 'progress-fill');
  fill.style.width = progressPercent + '%';
  bar.append(fill);
  progress.append(progressTop, bar);
  hero.append(progress);
  const heroActions = element('div', 'today-hero-actions');
  heroActions.append(button('Organizar el día', 'navigate-date', 'button primary', { date }),
    button('+ Capturar tarea', 'quick-task', 'button secondary'));
  hero.append(heroActions);
  main.append(hero);

  const overview = element('div', 'today-overview');
  const scheduledCount = getItemsForDay(state.profile, date)
    .filter(item => item.timed && item.task.status === 'pending').length;
  const counters = [
    { title: 'En tu día', value: tasks.length, detail: 'tareas pendientes' },
    { title: 'Con horario', value: scheduledCount, detail: 'bloques planificados' },
    { title: 'Sin programar', value: getUnscheduledTasks(state.profile).length, detail: 'en la bandeja' },
    { title: 'Vencidas', value: overdue.length, detail: 'para revisar' }
  ];
  counters.forEach(info => {
    const metric = element('div', 'today-metric');
    metric.append(element('span', 'today-metric-label', info.title),
      element('strong', 'today-metric-value', info.value),
      element('span', 'today-metric-detail', info.detail));
    overview.append(metric);
  });
  main.append(overview);

  const grid = element('div', 'dashboard-grid');
  const primary = element('div', 'dashboard-main');
  const taskCard = card();
  taskCard.append(heading(childMode?'Mis tareas de hoy':'Lo que tienes hoy',childMode?'¡Puedes ir haciendo una cosa a la vez!':'Una lista clara, sin presión.'));
  renderTaskList(taskCard, tasks, { emptyTitle: 'Tu agenda está despejada', emptyDetail: 'Puedes agregar una tarea o reservar tiempo para algo importante.' });
  taskCard.append(button('+ Añadir tarea', 'quick-task', 'button primary'));
  const timedToday = getItemsForDay(state.profile, date).filter(item => item.timed && item.task.status === 'pending');
  const timelineCard = card('today-agenda-card');
  timelineCard.append(heading('Horarios de hoy', 'El mismo plan que puedes editar desde Calendario.'));
  if (!timedToday.length) timelineCard.append(element('p', 'muted', 'Todavía no hay tareas con horas asignadas.'));
  timedToday.forEach(item => {
    const row = element('div', 'inbox-row');
    row.append(element('span', 'planner-time', item.task.startTime + '–' + item.task.endTime),
      element('strong', '', item.task.title));
    row.append(button('Editar', 'edit-task', 'button secondary small', { id: item.id }));
    timelineCard.append(row);
  });
  timelineCard.append(button('Organizar el día en Calendario', 'navigate-date', 'button primary', { date }));
  primary.append(timelineCard);
  primary.append(taskCard);
  const inboxCount = getUnscheduledTasks(state.profile).length;
  if (inboxCount) {
    const inboxCard = card();
    inboxCard.append(heading('Por organizar', inboxCount + ' tareas en la bandeja de entrada.'));
    inboxCard.append(button('Abrir bandeja de entrada', 'open-inbox', 'button secondary'));
    primary.append(inboxCard);
  }
  if (done.length) {
    const doneCard = card('today-completed-card');
    doneCard.append(heading('Completadas hoy', done.length === 1 ? 'Ya terminaste una tarea.' : 'Ya terminaste ' + done.length + ' tareas.', 'navigation/tasks.png'));
    renderTaskList(doneCard, done.slice().reverse(), { emptyTitle: 'Todavía no hay tareas completadas', emptyDetail: 'Las tareas que marques como terminadas aparecerán aquí.' });
    primary.append(doneCard);
  }
  if (overdue.length) {
    const overdueCard = card();
    overdueCard.append(heading('Pendientes anteriores', 'Decide qué hacer con ellos; nada se mueve por su cuenta.'));
    renderTaskList(overdueCard, overdue.slice(0, 4));
    primary.append(overdueCard);
  }
  const side = element('div', 'dashboard-side');
  const focusCard = card('focus-card');
  const focusTitle=element('div','focus-teaser-heading');
  focusTitle.append(iconImage('focus/timer.png','','focus-teaser-icon'),element('h3','','Un momento a la vez'));
  focusCard.append(element('div', 'eyebrow', 'ESPACIO DE CONCENTRACIÓN'),
    focusTitle, element('p', 'muted', 'Reserva unos minutos para concentrarte en una sola cosa.'));
  focusCard.append(button('Abrir Focus', 'navigate', 'button primary', { view: 'focus' }));
  side.append(focusCard);
  const suggestions = getRecommendations(state.profile, date);
  if (suggestions.length) {
    const suggestCard = card();
    suggestCard.append(heading('Sugerencias', 'Propuestas que puedes aceptar o ignorar.'));
    suggestions.forEach(suggestion => {
      const item = element('div', 'suggestion');
      item.append(element('strong', '', suggestion.title), element('p', 'muted', suggestion.detail));
      item.append(button('Programar hoy', 'apply-recommendation', 'text-button', { id: suggestion.taskId, date: suggestion.date }));
      suggestCard.append(item);
    });
    side.append(suggestCard);
  }
  const weekCard = card();
  weekCard.append(heading('Esta semana', 'Una pequeña vista de tu avance.'));
  const weekStart = shiftDate(date, -((new Date().getDay() + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const day = shiftDate(weekStart, i);
    const total = state.profile.tasks.filter(task => task.status === 'done' && task.completedAt && task.completedAt.slice(0, 10) === day).length;
    const line = element('div', 'week-line');
    line.append(element('span', '', dateLabel(day, { weekday: 'short', day: 'numeric' })), element('strong', '', String(total)));
    weekCard.append(line);
  }
  side.append(weekCard);
  grid.append(primary, side);
  main.append(grid);
}

function renderTasks(main) {
  const header=element('div','view-heading-row');
  header.append(heading('Tareas','Todo lo que quieres hacer, en un solo lugar.','navigation/tasks.png'));
  const create=button('+ Nueva tarea','new-task','button primary');create.id='task-create-button';
  header.append(create);main.append(header);
  const toolbar = element('div', 'toolbar task-toolbar');
  const filter = select('task-filter', [
    { value: 'inbox', label: 'Bandeja de entrada' }, { value: 'active', label: 'Pendientes' }, { value: 'all', label: 'Todas' }, { value: 'done', label: 'Completadas' }
  ], state.taskFilter);
  filter.id = 'task-filter';
  filter.setAttribute('aria-label', 'Filtrar tareas por estado');
  const search = input('task-search', 'Buscar por nombre o notas…');
  search.id = 'task-search';
  search.setAttribute('aria-label', 'Buscar tareas por nombre o notas');
  const searchWrap = element('label', 'search-field');
  searchWrap.append(iconImage('interface/search.png', '', 'search-icon'), search);
  toolbar.append(iconImage('tasks/filter.png', '', 'filter-icon'), filter, searchWrap);
  main.append(toolbar);
  const list = card('tasks-results-card');
  list.id = 'tasks-results';
  const render = () => {
    list.replaceChildren();
    const mode = filter.value;
    const query = search.value.trim().toLocaleLowerCase('es');
    const tasks = state.profile.tasks.filter(task => {
      const statusMatches = mode === 'all' || (mode === 'inbox' ? task.status === 'pending' && !task.scheduledDate : (mode === 'done' ? task.status === 'done' : task.status === 'pending'));
      const textMatches = !query || (task.title + ' ' + task.description).toLocaleLowerCase('es').includes(query);
      return statusMatches && textMatches;
    });
    renderTaskList(list, tasks, { emptyTitle: query ? 'No hay coincidencias' : 'Todavía no hay tareas', emptyDetail: query ? 'Prueba con otras palabras.' : 'Crea tu primera tarea y aparecerá aquí.' });
  };
  filter.addEventListener('change', () => { state.taskFilter = filter.value; render(); });
  search.addEventListener('input', render);
  render();
  main.append(list);

}

function renderSharedTaskDialog(main) {
  const editing = state.editingTaskId ? taskById(state.editingTaskId) : null;
  if (state.editingTaskId && !editing) { state.editingTaskId = null; state.showTaskForm = false; return; }
  const overlay = element('div', 'profile-modal-backdrop task-editor-backdrop');
  overlay.dataset.profileModal = 'true';
  overlay.dataset.returnFocus = 'task-create-button';
  const dialog = element('section', 'profile-modal task-editor-panel');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'task-modal-title');
  dialog.setAttribute('aria-describedby', 'task-modal-description');
  const panelHeader = element('div', 'task-editor-panel-header');
  panelHeader.append(element('span', 'eyebrow', 'ORGANIZACIÓN UNIFICADA'));
  const close = button('Cerrar', 'close-task-form', 'button secondary small task-editor-close');
  close.setAttribute('aria-label', 'Cerrar editor de tareas');
  panelHeader.append(close);
  dialog.append(panelHeader);
  const form = addTaskForm(dialog, editing || state.taskFormDefaults || {});
  form.classList.add('profile-modal-form');
  form.querySelector('.task-editor-title').id = 'task-modal-title';
  form.querySelector('.task-editor-description').id = 'task-modal-description';
  overlay.append(dialog);
  main.append(overlay);
  const field = state.taskEditorFocusField || 'title';
  ($('.task-form [name="' + field + '"]', overlay) || $('.task-form input[name="title"]', overlay))?.focus();
  state.taskEditorFocusField = 'title';
}

function closeTaskEditor() {
  const modal = $('.task-editor-backdrop');
  if (modal?.dataset.dirty === 'true' &&
      !confirm('Hay cambios sin guardar. ¿Cerrar el editor y descartarlos?')) return false;
  state.showTaskForm = false;
  state.editingTaskId = null;
  state.taskEditorFocusField = 'title';
  updateShell();
  ($('#task-create-button') || $('.topbar-create') || $('#main-content'))?.focus();
  return true;
}

function renderActivities(main) {
  const band=getAgeBand(state.profile.age);
  const ideas=band==='child'?[['Leer un cuento','Lectura','Leer o escuchar un cuento',15],['Dibujar','Creatividad','Dibujar, colorear o inventar personajes',20],['Jugar al aire libre','Movimiento','Un rato de juego y movimiento',30],['Ordenar mis cosas','Hogar','Guardar juguetes, libros o materiales',10],['Practicar música','Música','Tocar o escuchar música',15]]:band==='teen'?[['Estudiar una materia','Estudio','Repasar un tema o preparar una tarea',30],['Practicar una habilidad','Creatividad','Practicar música, dibujo o una habilidad',25],['Leer','Lectura','Leer por gusto o para clase',20],['Moverme un rato','Bienestar','Caminar, bailar o una actividad recreativa',20]]:[['Lectura','Personal','Tiempo para leer',25],['Aprendizaje','Estudio','Aprender o practicar una habilidad',30],['Movimiento','Bienestar','Actividad recreativa o paseo',30]];
  const header=element('div','view-heading-row');
  header.append(heading(band==='child'?'Mis actividades':'Actividades',band==='child'?'Ideas sencillas para llenar tu espacio con cosas que te gustan.':'Crea plantillas reutilizables para las cosas que haces.','navigation/activities.png'));
  const create=button('+ Nueva actividad','new-activity','button primary');create.id='activity-create-button';
  header.append(create);main.append(header);
  const list=card('activity-catalog-card');
  list.append(heading('Tu catálogo',state.profile.activities.length+' actividades'));
  const active=state.profile.activities.filter(item=>!item.archived);
  if(!active.length)list.append(empty('Tu catálogo empieza aquí','Guarda actividades para convertirlas después en tareas.'));
  active.forEach(activity=>{
    const rowItem=element('div','activity-row');
    const detail=element('div','');
    detail.append(element('strong','',''+activity.name),element('p','muted',activity.category+' · '+activity.durationMinutes+' min · '+activity.frequency));
    if(activity.description)detail.append(element('p','muted',activity.description));
    rowItem.append(detail,actionIconButton('Editar','edit-activity','edit.png','button secondary small',{id:activity.id}),button('Crear tarea','task-from-activity','button secondary small',{id:activity.id}),actionIconButton('Archivar','archive-activity','archivate.png','text-button',{id:activity.id}));
    list.append(rowItem);
  });
  main.append(list);
  const editing=state.editingActivityId?activityById(state.editingActivityId):null;
  if(state.showActivityForm||editing){
    const overlay=element('div','profile-modal-backdrop entity-editor-backdrop');overlay.dataset.profileModal='true';overlay.dataset.returnFocus='activity-create-button';
    const dialog=element('section','profile-modal entity-editor-panel');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','activity-modal-title');
    const form=element('form','form-card profile-modal-form activity-modal-form');form.dataset.form=editing?'activity-edit':'activity';
    const title=element('h2','',editing?'Editar actividad':'Nueva actividad');title.id='activity-modal-title';form.append(title);
    const grid=element('div','form-grid');
    grid.append(field('Nombre',input('name','Ej. Lectura','text',editing?.name||'')),field('Categoría',input('category','Personal, estudio, salud…','text',editing?.category||'')));
    form.append(grid,field('Descripción',textarea('description','¿En qué consiste?',editing?.description||'')));
    const row=element('div','form-grid');
    row.append(field('Duración orientativa (min)',input('durationMinutes','30','number',editing?.durationMinutes||30)),field('Frecuencia',input('frequency','Ej. Tres veces por semana','text',editing?.frequency||'')));
    form.append(row);
    if(!editing){
      const ideasCard=element('div','activity-ideas');ideasCard.append(element('strong','','Ideas para empezar'));
      const ideaList=element('div','activity-idea-list');
      ideas.forEach(([name,category,description,minutes])=>ideaList.append(button(name,'use-activity-idea','activity-idea',{name,category,description,minutes})));
      ideasCard.append(ideaList,element('p','small-note','Son sugerencias opcionales: puedes cambiarlas o crear las tuyas.'));form.append(ideasCard);
    }
    const actions=element('div','form-actions');
    actions.append(editing?actionIconButton('Guardar cambios','submit-form','save.png','button primary'):button('Crear actividad','submit-form','button primary'),button('Cancelar',editing?'cancel-edit-activity':'close-activity-form','button secondary'));
    form.append(actions);dialog.append(form);overlay.append(dialog);main.append(overlay);
    $('input[name="name"]',overlay)?.focus();
  }
}
function renderCalendar(main) {
  const selected = state.selectedDate;
  const selectedDate = new Date(selected + 'T12:00:00');
  const layout = element('div', 'calendar-layout');
  if (state.calendarMode === 'day' || state.calendarMode === 'agenda') layout.classList.add('calendar-full-width');
  const primary = element('div', 'calendar-primary');
  const header = element('div', 'calendar-heading');
  const title = element('div', 'view-title-with-icon');
  const controls = element('div', 'button-group calendar-controls');
  const modeControls = element('div', 'button-group calendar-mode');
  [['month','Mes'], ['week','Semana'], ['day','Día'], ['agenda','Agenda']].forEach(([mode,label]) => {
    const control = button(label, 'calendar-mode-' + mode, 'button ' + (state.calendarMode === mode ? 'primary' : 'secondary'));
    control.setAttribute('aria-pressed', String(state.calendarMode === mode));
    modeControls.append(control);
  });
  controls.append(modeControls);
  let previousAction = 'calendar-day-prev', nextAction = 'calendar-day-next';
  let periodTitle = dateLabel(selected, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (state.calendarMode === 'month') {
    previousAction = 'calendar-prev'; nextAction = 'calendar-next';
    periodTitle = state.calendarDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  } else if (state.calendarMode === 'week') {
    previousAction = 'calendar-week-prev'; nextAction = 'calendar-week-next';
    const start = shiftDate(selected, -((selectedDate.getDay() + 6) % 7));
    periodTitle = dateLabel(start, { day: 'numeric', month: 'long' }) + ' – ' +
      dateLabel(shiftDate(start, 6), { day: 'numeric', month: 'long', year: 'numeric' });
  }
  title.append(iconImage('navigation/calendar.png', '', 'view-title-icon'), element('h1', '', 'Calendario · ' + periodTitle));
  header.append(title);
  controls.append(button('‹', previousAction, 'button secondary'), button('Hoy', 'calendar-today', 'button secondary'),
    button('›', nextAction, 'button secondary'));
  header.append(controls);
  primary.append(header);
  if (state.calendarMode === 'month') {
    const year = state.calendarDate.getFullYear(), month = state.calendarDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const calendar = card('calendar-card');
    const grid = element('div', 'calendar-grid');
    ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(label => grid.append(element('div','calendar-weekday',label)));
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) grid.append(element('div', 'calendar-blank'));
    const firstKey = year + '-' + String(month + 1).padStart(2, '0') + '-01';
    const index = new Map(getCalendarRange(state.profile, firstKey,
      year + '-' + String(month + 1).padStart(2, '0') + '-' + String(days).padStart(2, '0'))
      .map(day => [day.date, day.items]));
    for (let day = 1; day <= days; day++) {
      const key = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      const items = (index.get(key) || []).filter(item => item.task.status === 'pending');
      const cell = button('', 'select-date', 'calendar-day' + (key === localDate() ? ' is-today' : '') +
        (key === selected ? ' is-selected' : ''), { date: key });
      cell.setAttribute('aria-pressed', String(key === selected));
      cell.setAttribute('aria-label', dateLabel(key) + ', ' + items.length + ' tareas');
      cell.append(element('span', 'calendar-number', day));
      if (items.some(item => item.timed)) cell.append(element('span', 'calendar-count', 'Con horario'));
      if (items.some(item => item.deadline && !item.scheduled)) cell.append(element('span', 'meta-chip due-date-chip', 'Vencimientos'));
      if (items.length) cell.append(element('span', 'calendar-count', items.length + (items.length === 1 ? ' tarea' : ' tareas')));
      grid.append(cell);
    }
    calendar.append(grid); primary.append(calendar);
  } else if (state.calendarMode === 'week') {
    const first = shiftDate(selected, -((selectedDate.getDay() + 6) % 7));
    const week = card('week-calendar');
    getCalendarRange(state.profile, first, shiftDate(first, 6)).forEach(day => {
      const tasks = day.items.filter(item => item.task.status === 'pending');
      const cell = button('', 'select-date', 'week-day' + (day.date === localDate() ? ' is-today' : '') +
        (day.date === selected ? ' is-selected' : ''), { date: day.date });
      cell.setAttribute('aria-label', dateLabel(day.date) + ', ' + tasks.length + ' tareas');
      cell.setAttribute('aria-pressed', String(day.date === selected));
      const top = element('div', 'week-day-top');
      top.append(element('strong', '', dateLabel(day.date, { weekday: 'short' })), element('span', '', day.date.slice(-2)));
      cell.append(top, element('span', 'week-day-count', tasks.length + ' pendientes'));
      tasks.slice(0, 3).forEach(item => cell.append(element('span', 'week-day-task',
        (item.timed ? item.task.startTime + ' · ' : item.deadline && !item.scheduled ? 'Vence · ' : '') + item.task.title)));
      week.append(cell);
    });
    primary.append(week);
  } else {
    renderPlannerAgenda(primary, state.calendarMode === 'agenda');
  }
  layout.append(primary);
  if (state.calendarMode === 'month' || state.calendarMode === 'week') {
    const detail = card('calendar-detail-card');
    const dayItems = getItemsForDay(state.profile, selected);
    detail.append(heading(dateLabel(selected), dayItems.length + ' tareas asociadas a este día'));
    renderTaskList(detail, dayItems.map(item => item.task), { emptyTitle: 'Día despejado',
      emptyDetail: 'Puedes dejarlo libre o programar una tarea.' });
    detail.append(button('Añadir tarea', 'calendar-add-task', 'button primary'),
      button('Organizar este día', 'navigate-date', 'button secondary', { date: selected }));
    layout.append(detail);
  }
  main.append(layout);
}
function renderPlanner(main) {
  if (state.plannerSection === 'library') {
    renderIdeaBoardLibrary(main);
    return;
  }
  if (state.plannerSection === 'board') {
    const board = state.profile.ideaBoards.find(item => item.id === state.selectedIdeaBoardId);
    if (!board) { state.plannerSection = 'library'; renderIdeaBoardLibrary(main); return; }
    renderIdeaBoardCanvas(main, board);
    return;
  }
  state.view = 'calendar'; state.calendarMode = 'day';
  renderCalendar(main);
}

function renderIdeaBoardCanvas(main, board) {
  const header = element('div', 'ideas-canvas-header');
  const titleArea = element('div', 'ideas-canvas-title');
  titleArea.append(element('h1', '', board.title));
  titleArea.append(element('p', 'muted', board.description || 'Organiza tus ideas en un espacio visual.'));
  const boardActions = element('div', 'ideas-library-header-actions');
  boardActions.append(button('Renombrar', 'ideas-rename', 'button secondary', { id: board.id }), button('Exportar', 'ideas-export', 'button secondary', { id: board.id }), button('Mis pizarrones', 'ideas-library', 'button secondary'));
  header.append(titleArea, boardActions);
  main.append(header);

  getIdeaBoardHistory(board);
  const toolbar = element('div', 'ideas-canvas-toolbar');
  const zoomOut = button('−', 'ideas-canvas-zoom-out', 'button secondary ideas-canvas-zoom-button');
  zoomOut.setAttribute('aria-label', 'Alejar');
  const zoomValue = element('span', 'ideas-canvas-zoom-value', '100%');
  zoomValue.setAttribute('aria-live', 'polite');
  const zoomIn = button('+', 'ideas-canvas-zoom-in', 'button secondary ideas-canvas-zoom-button');
  zoomIn.setAttribute('aria-label', 'Acercar');
  const center = button('Centrar', 'ideas-canvas-center', 'button secondary');
  const fit = button('Ajustar todo', 'ideas-canvas-fit', 'button secondary');
  const nodeSearch = input('ideas-node-search', 'Buscar en este pizarrón…', 'search', '');
  nodeSearch.classList.add('ideas-node-search'); nodeSearch.setAttribute('aria-label', 'Buscar notas y actividades en este pizarrón');
  const nodeTypeFilter = select('ideas-node-type-filter', [{ value: 'all', label: 'Todos los elementos' }, { value: 'note', label: 'Notas' }, { value: 'activity', label: 'Actividades' }], 'all');
  nodeTypeFilter.classList.add('ideas-node-filter');
  const activityStatusFilter = select('ideas-activity-status-filter', [{ value: 'all', label: 'Cualquier estado' }, { value: 'pending', label: 'Pendientes' }, { value: 'in-progress', label: 'En curso' }, { value: 'done', label: 'Completadas' }], 'all');
  activityStatusFilter.classList.add('ideas-node-filter');
  const activityPriorityFilter = select('ideas-activity-priority-filter', [{ value: 'all', label: 'Cualquier prioridad' }, { value: 'high', label: 'Prioridad alta' }, { value: 'medium', label: 'Prioridad media' }, { value: 'low', label: 'Prioridad baja' }], 'all');
  activityPriorityFilter.classList.add('ideas-node-filter');
  const clearNodeFilters = button('Limpiar filtros', 'ideas-node-filters-clear', 'button secondary small');
  const filterSummary = element('span', 'ideas-filter-summary', 'Todos los elementos'); filterSummary.setAttribute('aria-live', 'polite');
  const undoButton = button('↶ Deshacer', 'ideas-history-undo', 'button secondary');
  const redoButton = button('↷ Rehacer', 'ideas-history-redo', 'button secondary');
  const addNote = button('+ Nueva nota', 'ideas-note-create', 'button primary');
  const addActivity = button('+ Actividad', 'ideas-activity-create', 'button secondary');
  const groupSelection = button('Agrupar selección', 'ideas-group-create', 'button secondary');
  groupSelection.disabled = true;
  const connectArrow = button('↗ Conectar con flecha', 'ideas-connect-arrow', 'button secondary');
  const connectLine = button('— Conectar sin flecha', 'ideas-connect-line', 'button secondary');
  const editConnection = button('Editar etiqueta', 'ideas-connection-edit', 'button secondary');
  editConnection.disabled = true;
  const deleteConnection = button('Eliminar conexión', 'ideas-connection-delete', 'button secondary');
  deleteConnection.disabled = true;
  const filterTools = element('div', 'ideas-canvas-filter-tools');
  const searchLabel = element('label', 'ideas-search-field');
  searchLabel.append(iconImage('interface/search.png', '', 'button-icon'), nodeSearch);
  filterTools.append(searchLabel, nodeTypeFilter, activityStatusFilter, activityPriorityFilter, clearNodeFilters, filterSummary);
  const editingTools = element('div', 'ideas-tool-group');
  editingTools.setAttribute('aria-label', 'Edición');
  editingTools.append(undoButton, redoButton, addNote, addActivity, groupSelection);
  const connectionTools = element('div', 'ideas-tool-group');
  connectionTools.setAttribute('aria-label', 'Conexiones');
  connectionTools.append(connectArrow, connectLine, editConnection, deleteConnection);
  const navigationTools = element('div', 'ideas-tool-group');
  navigationTools.setAttribute('aria-label', 'Vista');
  const help = button('Ayuda', 'ideas-help');
  navigationTools.append(zoomOut, zoomValue, zoomIn, center, fit, help);
  const helpText = element('p', 'ideas-help-panel', 'Arrastra el fondo para seleccionar. Shift conserva la selección y añade elementos. Option/Alt selecciona una tarjeta dentro de un grupo. Arrastra el encabezado para mover la selección. Mueve el lienzo con la rueda pulsada o dos dedos; pellizca o usa Ctrl + rueda para zoom. Cmd/Ctrl + Z deshace; Cmd/Ctrl + Shift + Z o Ctrl + Y rehace. La cámara no cambia al deshacer.');
  helpText.hidden = true;
  help.addEventListener('click', () => { helpText.hidden = !helpText.hidden; help.setAttribute('aria-expanded', String(!helpText.hidden)); });
  help.setAttribute('aria-expanded', 'false');
  toolbar.append(editingTools, connectionTools, navigationTools, filterTools, helpText);
  main.append(toolbar);

  const syncHistoryControls = () => {
    const history = getIdeaBoardHistory(currentBoard());
    undoButton.disabled = !history?.past.length;
    redoButton.disabled = !history?.future.length;
    undoButton.title = 'Deshacer (⌘/Ctrl + Z)';
    redoButton.title = 'Rehacer (⇧ + ⌘/Ctrl + Z)';
  };
  undoButton.addEventListener('click', () => restoreIdeaBoardHistory('undo'));
  redoButton.addEventListener('click', () => restoreIdeaBoardHistory('redo'));
  const viewport = element('div', 'ideas-canvas-viewport');
  viewport.setAttribute('role', 'application');
  viewport.setAttribute('aria-label', 'Lienzo del pizarrón. Arrastra para seleccionar, Shift añade a la selección, rueda pulsada o dos dedos para mover y pellizco para zoom.');
  viewport.tabIndex = 0;
  const world = element('div', 'ideas-canvas-world');
  const emptyState = element('div', 'ideas-canvas-empty');
  emptyState.append(element('span', 'ideas-canvas-empty-mark', 'O'), element('strong', '', 'Tu lienzo está vacío'), element('p', 'muted', 'Crea una nota o una actividad para comenzar a organizar tus ideas.'));
  viewport.append(world, emptyState);
  

  const camera = {
    x: Number(board.viewport?.x) || 0,
    y: Number(board.viewport?.y) || 0,
    zoom: Math.max(0.1, Math.min(4, Number(board.viewport?.zoom) || 1))
  };
  let pointer = null;
  let moved = false;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const currentBoard = () => state.profile?.ideaBoards?.find(item => item.id === board.id);
  const selectedNodeIds = state.ideaSelections[board.id] || (state.ideaSelections[board.id] = new Set());
  for (const id of selectedNodeIds) if (!board.nodes.some(node => node.id === id)) selectedNodeIds.delete(id);
  const applyNodeFilters = () => {
    const activeBoard = currentBoard(); if (!activeBoard) return;
    const query = nodeSearch.value.trim().toLocaleLowerCase('es');
    const type = nodeTypeFilter.value, status = activityStatusFilter.value, priority = activityPriorityFilter.value;
    const matches = new Set();
    activeBoard.nodes.forEach(node => {
      if (node.type === 'group') return;
      const text = [node.title, node.body, node.category].join(' ').toLocaleLowerCase('es');
      const visible = (!query || text.includes(query)) && (type === 'all' || node.type === type) && (node.type !== 'activity' || (status === 'all' || node.status === status) && (priority === 'all' || node.priority === priority));
      const card = world.querySelector('[data-node-id="' + node.id + '"]');
      if (card) card.classList.toggle('is-filtered-out', !visible);
      if (!visible) selectedNodeIds.delete(node.id);
      if (visible) matches.add(node.id);
    });
    world.querySelectorAll('.ideas-group-frame').forEach(frame => {
      const group = activeBoard.nodes.find(node => node.id === frame.dataset.groupId);
      frame.classList.toggle('is-filtered-out', !group || !group.childrenIds.some(id => matches.has(id)));
    });
    const visibleActivities = activeBoard.nodes.filter(node => node.type === 'activity' && matches.has(node.id)).length;
    filterSummary.textContent = matches.size + ' de ' + activeBoard.nodes.filter(node => node.type !== 'group').length + ' elementos · ' + visibleActivities + ' actividades';
    syncSelection();
    drawConnections();
  };
  clearNodeFilters.addEventListener('click', () => { nodeSearch.value = ''; nodeTypeFilter.value = 'all'; activityStatusFilter.value = 'all'; activityPriorityFilter.value = 'all'; applyNodeFilters(); });
  [nodeSearch, nodeTypeFilter, activityStatusFilter, activityPriorityFilter].forEach(control => control.addEventListener('input', applyNodeFilters));
  [nodeTypeFilter, activityStatusFilter, activityPriorityFilter].forEach(control => control.addEventListener('change', applyNodeFilters));
  const selectionIds = (id, individual = false) => {
    const nodes = currentBoard()?.nodes || [];
    const node = nodes.find(n => n.id === id);
    if (!node) return [];
    if (node.type === 'group') return [id, ...node.childrenIds];
    const group = !individual && nodes.find(n => n.type === 'group' && n.childrenIds.includes(id));
    return group ? [group.id, ...group.childrenIds] : [id];
  };
  const syncSelection = () => {
    world.querySelectorAll('[data-node-id]').forEach(card => card.classList.toggle('is-selected', selectedNodeIds.has(card.dataset.nodeId)));
    world.querySelectorAll('[data-group-id]').forEach(frame => frame.classList.toggle('is-selected', selectedNodeIds.has(frame.dataset.groupId)));
    const count = (currentBoard()?.nodes || []).filter(n => n.type !== 'group' && selectedNodeIds.has(n.id)).length;
    groupSelection.disabled = count < 2;
    const label = groupSelection.querySelector('.button-label');
    if (label) label.textContent = count > 1 ? 'Agrupar (' + count + ')' : 'Agrupar selección';
  };
  const selectNode = (id, additive = false, individual = false) => {
    if (!additive) selectedNodeIds.clear();
    selectionIds(id, individual).forEach(id => selectedNodeIds.add(id));
    syncSelection();
  };
  const paint = () => {
    world.style.transform = 'translate(calc(-50% + ' + camera.x + 'px), calc(-50% + ' + camera.y + 'px)) scale(' + camera.zoom + ')';
    emptyState.hidden = Boolean(currentBoard()?.nodes?.length);
    viewport.style.setProperty('--ideas-grid-size', (28 * camera.zoom) + 'px');
    viewport.style.setProperty('--ideas-camera-x', camera.x + 'px');
    viewport.style.setProperty('--ideas-camera-y', camera.y + 'px');
    zoomValue.textContent = Math.round(camera.zoom * 100) + '%';
    zoomOut.disabled = camera.zoom <= 0.1;
    zoomIn.disabled = camera.zoom >= 4;
  };
  const updateViewport = () => {
    const activeBoard = currentBoard();
    if (!activeBoard) return;
    camera.x = clamp(camera.x, -1000000, 1000000); camera.y = clamp(camera.y, -1000000, 1000000);
    activeBoard.viewport = { x: camera.x, y: camera.y, zoom: camera.zoom };
    activeBoard.modifiedAt = new Date().toISOString();
    clearTimeout(state.ideaViewportSaveTimer);
    state.ideaViewportSaveTimer = setTimeout(async () => {
      state.ideaViewportSaveTimer = null;
      await save();
    }, 350);
  };
  const zoomAt = (nextZoom, clientX, clientY) => {
    const rect = viewport.getBoundingClientRect();
    const pointX = clientX === undefined ? rect.left + rect.width / 2 : clientX;
    const pointY = clientY === undefined ? rect.top + rect.height / 2 : clientY;
    const localX = pointX - rect.left - rect.width / 2;
    const localY = pointY - rect.top - rect.height / 2;
    const worldX = (localX - camera.x) / camera.zoom;
    const worldY = (localY - camera.y) / camera.zoom;
    camera.zoom = clamp(nextZoom, 0.1, 4);
    camera.x = localX - worldX * camera.zoom;
    camera.y = localY - worldY * camera.zoom;
    paint();
    updateViewport();
  };
  const centerContent = fitAll => {
    const nodes = currentBoard()?.nodes || [];
    if (!nodes.length) {
      camera.x = 0;
      camera.y = 0;
      camera.zoom = 1;
    } else {
      const minX = Math.min(...nodes.map(node => node.x));
      const minY = Math.min(...nodes.map(node => node.y));
      const maxX = Math.max(...nodes.map(node => node.x + node.width));
      const maxY = Math.max(...nodes.map(node => node.y + node.height));
      const middleX = (minX + maxX) / 2;
      const middleY = (minY + maxY) / 2;
      if (fitAll) {
        const rect = viewport.getBoundingClientRect();
        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);
        camera.zoom = clamp(Math.min((rect.width - 100) / width, (rect.height - 100) / height, 1.5), 0.1, 4);
      }
      camera.x = -middleX * camera.zoom;
      camera.y = -middleY * camera.zoom;
    }
    paint();
    updateViewport();
  };

  zoomOut.addEventListener('click', () => zoomAt(camera.zoom / 1.2));
  zoomIn.addEventListener('click', () => zoomAt(camera.zoom * 1.2));
  center.addEventListener('click', () => centerContent(false));
  fit.addEventListener('click', () => centerContent(true));
  viewport.addEventListener('wheel', event => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) zoomAt(camera.zoom * Math.exp(-event.deltaY * 0.01), event.clientX, event.clientY);
    else {
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
      camera.x -= event.deltaX * unit; camera.y -= event.deltaY * unit;
      paint(); updateViewport();
    }
  }, { passive: false });
  const marquee = element('div', 'ideas-selection-box');
  marquee.hidden = true; viewport.append(marquee);
  let rectangle = null;
  const worldPoint = event => {
    const rect = viewport.getBoundingClientRect();
    return { x: (event.clientX - rect.left - rect.width / 2 - camera.x) / camera.zoom,
      y: (event.clientY - rect.top - rect.height / 2 - camera.y) / camera.zoom };
  };
  const mobileTouch = event => event.pointerType === 'touch' && window.oisym?.platform === 'android';
  const pageTouch = event => mobileTouch(event) && viewport.dataset.mobileInteraction !== 'board';
  viewport.addEventListener('pointerdown', event => {
    if (pageTouch(event)) return;
    if (event.button === 1 || (mobileTouch(event) && !event.target.closest('.ideas-note-card, .ideas-activity-card, .ideas-group-header, .ideas-connection-hit, button, input, textarea, select, a'))) {
      event.preventDefault(); event.stopPropagation();
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, cameraX: camera.x, cameraY: camera.y };
      moved = false; viewport.setPointerCapture(event.pointerId); viewport.classList.add('is-panning'); return;
    }
    if (event.button !== 0 || event.target.closest('.ideas-note-card, .ideas-activity-card, .ideas-group-header, .ideas-connection-hit, button, input, textarea, select, a')) return;
    event.preventDefault(); viewport.focus({ preventScroll: true });
    rectangle = { id: event.pointerId, start: worldPoint(event), clientX: event.clientX, clientY: event.clientY,
      base: new Set(event.shiftKey ? selectedNodeIds : []), individual: event.altKey, hits: new Set() };
    if (!event.shiftKey) selectedNodeIds.clear();
    syncSelection(); viewport.setPointerCapture(event.pointerId);
  }, true);
  viewport.addEventListener('pointermove', event => {
    if (pointer && event.pointerId === pointer.id) {
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      moved = moved || Math.abs(dx) + Math.abs(dy) > 2;
      camera.x = pointer.cameraX + dx; camera.y = pointer.cameraY + dy; paint(); return;
    }
    if (!rectangle || event.pointerId !== rectangle.id) return;
    const point = worldPoint(event), rect = viewport.getBoundingClientRect();
    const area = { left: Math.min(point.x, rectangle.start.x), right: Math.max(point.x, rectangle.start.x), top: Math.min(point.y, rectangle.start.y), bottom: Math.max(point.y, rectangle.start.y) };
    marquee.hidden = false;
    Object.assign(marquee.style, { left: Math.min(event.clientX, rectangle.clientX) - rect.left + 'px', top: Math.min(event.clientY, rectangle.clientY) - rect.top + 'px', width: Math.abs(event.clientX - rectangle.clientX) + 'px', height: Math.abs(event.clientY - rectangle.clientY) + 'px' });
    rectangle.hits.clear();
    for (const node of currentBoard()?.nodes || []) {
      if (node.type === 'group') continue;
      const card = world.querySelector('[data-node-id="' + node.id + '"]');
      if (card?.classList.contains('is-filtered-out')) continue;
      if (node.x < area.right && node.x + (card?.offsetWidth || node.width) > area.left && node.y < area.bottom && node.y + (card?.offsetHeight || node.height) > area.top)
        selectionIds(node.id, rectangle.individual).forEach(id => rectangle.hits.add(id));
    }
    world.querySelectorAll('[data-node-id], [data-group-id]').forEach(card => card.classList.toggle('is-selection-preview', rectangle.hits.has(card.dataset.nodeId || card.dataset.groupId)));
  });
  const finishPointer = event => {
    if (pointer && event.pointerId === pointer.id) { if (moved) updateViewport(); pointer = null; viewport.classList.remove('is-panning'); }
    if (rectangle && event.pointerId === rectangle.id) {
      selectedNodeIds.clear();
      for (const id of rectangle.base) selectedNodeIds.add(id);
      if (event.type !== 'pointercancel') for (const id of rectangle.hits) selectedNodeIds.add(id);
      rectangle = null; marquee.hidden = true;
      world.querySelectorAll('.is-selection-preview').forEach(card => card.classList.remove('is-selection-preview'));
      syncSelection();
    }
  };
  viewport.addEventListener('pointerup', finishPointer);
  viewport.addEventListener('pointercancel', finishPointer);
  viewport.addEventListener('lostpointercapture', finishPointer);
  viewport.addEventListener('auxclick', event => { if (event.button === 1) event.preventDefault(); });
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport) return;
    const step = event.shiftKey ? 120 : 48;
    if (event.key === 'ArrowLeft') camera.x += step;
    else if (event.key === 'ArrowRight') camera.x -= step;
    else if (event.key === 'ArrowUp') camera.y += step;
    else if (event.key === 'ArrowDown') camera.y -= step;
    else if (event.key === '+' || event.key === '=') { zoomAt(camera.zoom * 1.2); event.preventDefault(); return; }
    else if (event.key === '-') { zoomAt(camera.zoom / 1.2); event.preventDefault(); return; }
    else return;
    event.preventDefault();
    event.stopPropagation();
    paint();
    updateViewport();
  });
  const svgNS = 'http://www.w3.org/2000/svg';
  const connectionLayer = document.createElementNS(svgNS, 'svg');
  connectionLayer.classList.add('ideas-connections-layer');
  connectionLayer.setAttribute('aria-hidden', 'true');
  connectionLayer.style.overflow = 'visible';
  const connectionHint = element('p', 'ideas-canvas-hint', 'Arrastra para seleccionar · Shift añade · Option/Alt selecciona una nota del grupo · Rueda pulsada o dos dedos para mover · Pellizco o Ctrl + rueda para zoom');
  main.append(viewport, connectionHint);
  let connectMode = null;
  let connectionStartId = null;
  let selectedConnectionId = null;
  const updateConnectionControls = () => {
    connectArrow.classList.toggle('active', connectMode === 'directed');
    connectLine.classList.toggle('active', connectMode === 'undirected');
    connectArrow.setAttribute('aria-pressed', String(connectMode === 'directed'));
    connectLine.setAttribute('aria-pressed', String(connectMode === 'undirected'));
    editConnection.disabled = !selectedConnectionId;
    deleteConnection.disabled = !selectedConnectionId;
    connectionHint.textContent = connectMode
      ? (connectionStartId ? 'Ahora selecciona el segundo elemento · Esc para cancelar' : 'Selecciona el primer elemento · Esc para cancelar')
      : 'Arrastra para seleccionar · Shift añade · Option/Alt selecciona una nota del grupo · Rueda pulsada o dos dedos para mover · Pellizco o Ctrl + rueda para zoom';
  };
  const drawConnections = () => {
    connectionLayer.replaceChildren();
    const activeNodes = currentBoard()?.nodes || [];
    const cardElements = new Map([...world.querySelectorAll('.ideas-note-card, .ideas-activity-card')].map(card => [card.dataset.nodeId, card]));
    const nodeWidth = node => cardElements.get(node.id)?.offsetWidth || Math.max(node.width, node.type === 'activity' ? 260 : 120);
    const nodeHeight = node => cardElements.get(node.id)?.offsetHeight || Math.max(node.height, node.type === 'activity' ? 230 : 80);
    if (activeNodes.length) {
      const minX = Math.min(...activeNodes.map(node => node.x)) - 100;
      const minY = Math.min(...activeNodes.map(node => node.y)) - 100;
      const maxX = Math.max(...activeNodes.map(node => node.x + nodeWidth(node))) + 100;
      const maxY = Math.max(...activeNodes.map(node => node.y + nodeHeight(node))) + 100;
      const width = Math.max(1, maxX - minX), height = Math.max(1, maxY - minY);
      connectionLayer.style.left = minX + 'px';
      connectionLayer.style.top = minY + 'px';
      connectionLayer.style.width = width + 'px';
      connectionLayer.style.height = height + 'px';
      connectionLayer.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    } else {
      connectionLayer.style.left = '0px';
      connectionLayer.style.top = '0px';
      connectionLayer.style.width = '1px';
      connectionLayer.style.height = '1px';
      connectionLayer.setAttribute('viewBox', '0 0 1 1');
    }
    const boundsLeft = parseFloat(connectionLayer.style.left) || 0;
    const boundsTop = parseFloat(connectionLayer.style.top) || 0;
    const defs = document.createElementNS(svgNS, 'defs');
    const marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', 'ideas-connection-arrow-' + board.id.replace(/[^a-zA-Z0-9_-]/g, ''));
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '7');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('orient', 'auto-start-reverse');
    const arrowHead = document.createElementNS(svgNS, 'path');
    arrowHead.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    arrowHead.setAttribute('fill', '#638b74');
    marker.append(arrowHead);
    defs.append(marker);
    connectionLayer.append(defs);
    const activeBoard = currentBoard();
    const nodes = activeBoard?.nodes || [];
    const byId = new Map(nodes.map(node => [node.id, node]));
    (activeBoard?.connections || []).forEach(connection => {
      const from = byId.get(connection.from), to = byId.get(connection.to);
      if (!from || !to || cardElements.get(from.id)?.classList.contains('is-filtered-out') || cardElements.get(to.id)?.classList.contains('is-filtered-out')) return;
      const fromWidth = nodeWidth(from);
      const fromHeight = nodeHeight(from);
      const toWidth = nodeWidth(to);
      const toHeight = nodeHeight(to);
      const fromCenter = { x: from.x + fromWidth / 2, y: from.y + fromHeight / 2 };
      const toCenter = { x: to.x + toWidth / 2, y: to.y + toHeight / 2 };
      let vectorX = toCenter.x - fromCenter.x, vectorY = toCenter.y - fromCenter.y;
      if (!vectorX && !vectorY) vectorX = 1;
      const edgeFactor = (width, height) => Math.min(vectorX ? width / 2 / Math.abs(vectorX) : Infinity, vectorY ? height / 2 / Math.abs(vectorY) : Infinity);
      const startFactor = edgeFactor(fromWidth, fromHeight), endFactor = edgeFactor(toWidth, toHeight);
      const x1 = fromCenter.x + vectorX * startFactor - boundsLeft, y1 = fromCenter.y + vectorY * startFactor - boundsTop;
      const x2 = toCenter.x - vectorX * endFactor - boundsLeft, y2 = toCenter.y - vectorY * endFactor - boundsTop;
      const dx = x2 - x1, dy = y2 - y1;
      const controlX = (x1 + x2) / 2;
      const controlY = (y1 + y2) / 2 - Math.min(70, Math.abs(dx + dy) * 0.12);
      const pathData = connection.style === 'curved'
        ? 'M ' + x1 + ' ' + y1 + ' Q ' + controlX + ' ' + controlY + ' ' + x2 + ' ' + y2
        : 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2;
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('class', 'ideas-connection-line' + (selectedConnectionId === connection.id ? ' is-selected' : ''));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#638b74');
      path.setAttribute('stroke-width', selectedConnectionId === connection.id ? '3.5' : '2.5');
      if (connection.directed) path.setAttribute('marker-end', 'url(#ideas-connection-arrow-' + board.id.replace(/[^a-zA-Z0-9_-]/g, '') + ')');
      connectionLayer.append(path);
      const hit = document.createElementNS(svgNS, 'path');
      hit.setAttribute('d', pathData);
      hit.setAttribute('class', 'ideas-connection-hit');
      hit.setAttribute('fill', 'none');
      hit.setAttribute('stroke', 'transparent');
      hit.setAttribute('stroke-width', '16');
      hit.addEventListener('click', event => {
        event.stopPropagation();
        selectedConnectionId = connection.id;
        drawConnections();
        updateConnectionControls();
      });
      connectionLayer.append(hit);
      if (connection.label) {
        const label = document.createElementNS(svgNS, 'text');
        label.setAttribute('x', String(controlX));
        label.setAttribute('y', String((connection.style === 'curved' ? controlY : (y1 + y2) / 2) - 8));
        label.setAttribute('class', 'ideas-connection-label');
        label.textContent = connection.label;
        connectionLayer.append(label);
      }
    });
    world.querySelectorAll('.ideas-group-frame').forEach(frame => {
      const active = currentBoard();
      const group = active?.nodes.find(node => node.id === frame.dataset.groupId && node.type === 'group');
      if (!group) return;
      const children = active.nodes.filter(node => group.childrenIds.includes(node.id));
      if (!children.length) return;
      const left = Math.min(...children.map(node => node.x)) - 14;
      const top = Math.min(...children.map(node => node.y)) - 48;
      const right = Math.max(...children.map(node => node.x + node.width)) + 14;
      const bottom = Math.max(...children.map(node => node.y + node.height)) + 14;

      frame.style.left = left + 'px'; frame.style.top = top + 'px';
      frame.style.width = Math.max(160, right - left) + 'px'; frame.style.height = Math.max(100, bottom - top) + 'px';
    });
  };
  const saveConnection = async (from, to, directed) => {
    const activeBoard = currentBoard();
    if (!activeBoard || activeBoard.connections.length >= window.OIsymDomain.IDEA_BOARD_LIMITS.connections) {
      showToast('Has alcanzado el máximo de conexiones del pizarrón.', 'error');
      return;
    }
    const label = await requestText('Etiqueta de la conexión (opcional):', '');
    if (label === null) return;
    const connection = { id: makeId('connection'), from, to, label: label.trim().slice(0, 100), style: 'straight', directed };
    activeBoard.connections.push(connection);
    activeBoard.modifiedAt = new Date().toISOString();
    try {
      validateIdeaBoard(activeBoard);
      if (!await save()) { activeBoard.connections = activeBoard.connections.filter(item => item.id !== connection.id); return; }
      selectedConnectionId = connection.id;
      drawConnections();
      updateConnectionControls();
      showToast('Conexión creada.');
    } catch (error) {
      activeBoard.connections = activeBoard.connections.filter(item => item.id !== connection.id);
      showToast(error.message, 'error');
    }
  };
  connectArrow.addEventListener('click', () => {
    connectMode = connectMode === 'directed' ? null : 'directed';
    connectionStartId = null;
    world.querySelectorAll('.is-connection-source').forEach(item => item.classList.remove('is-connection-source'));
    selectedConnectionId = null;
    drawConnections();
    updateConnectionControls();
  });
  connectLine.addEventListener('click', () => {
    connectMode = connectMode === 'undirected' ? null : 'undirected';
    connectionStartId = null;
    world.querySelectorAll('.is-connection-source').forEach(item => item.classList.remove('is-connection-source'));
    selectedConnectionId = null;
    drawConnections();
    updateConnectionControls();
  });
  editConnection.addEventListener('click', async () => {
    const activeBoard = currentBoard();
    const connection = activeBoard?.connections.find(item => item.id === selectedConnectionId);
    if (!connection) return;
    const label = await requestText('Editar etiqueta de la conexión:', connection.label);
    if (label === null) return;
    const previous = connection.label;
    connection.label = label.trim().slice(0, 100);
    activeBoard.modifiedAt = new Date().toISOString();
    try {
      validateIdeaBoard(activeBoard);
      if (!await save()) { connection.label = previous; return; }
      drawConnections();
      showToast('Etiqueta actualizada.');
    } catch (error) {
      connection.label = previous;
      showToast(error.message, 'error');
    }
  });
  deleteConnection.addEventListener('click', async () => {
    const activeBoard = currentBoard();
    if (!activeBoard || !selectedConnectionId) return;
    const previous = activeBoard.connections;
    activeBoard.connections = previous.filter(item => item.id !== selectedConnectionId);
    selectedConnectionId = null;
    activeBoard.modifiedAt = new Date().toISOString();
    if (!await save()) { activeBoard.connections = previous; drawConnections(); return; }
    drawConnections();
    updateConnectionControls();
    showToast('Conexión eliminada.');
  });
  world.addEventListener('click', async event => {
    if (!connectMode) return;
    const card = event.target.closest('.ideas-note-card, .ideas-activity-card');
    if (!card) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const nodeId = card.dataset.nodeId;
    if (!connectionStartId) {
      connectionStartId = nodeId;
      selectedConnectionId = null;
      card.classList.add('is-connection-source');
      updateConnectionControls();
      return;
    }
    if (connectionStartId === nodeId) {
      connectionStartId = null;
      world.querySelectorAll('.is-connection-source').forEach(item => item.classList.remove('is-connection-source'));
      updateConnectionControls();
      return;
    }
    const from = connectionStartId;
    connectionStartId = null;
    world.querySelectorAll('.is-connection-source').forEach(item => item.classList.remove('is-connection-source'));
    await saveConnection(from, nodeId, connectMode === 'directed');
    connectMode = null;
    updateConnectionControls();
  }, true);
  viewport.addEventListener('keydown', event => {
    if (event.key === 'Escape' && connectMode) {
      connectMode = null;
      connectionStartId = null;
      world.querySelectorAll('.is-connection-source').forEach(item => item.classList.remove('is-connection-source'));
      updateConnectionControls();
    }
  });
  const scheduleBoardSave = () => {
    const activeBoard = currentBoard();
    if (!activeBoard) return;
    activeBoard.modifiedAt = new Date().toISOString();
    clearTimeout(state.ideaViewportSaveTimer);
    state.ideaViewportSaveTimer = setTimeout(async () => {
      state.ideaViewportSaveTimer = null;
      await save();
    }, 550);
  };
  const bindNodeDrag = (handle, id) => {
    handle.addEventListener('pointerdown', event => {
      if (pageTouch(event)) return;
      if (event.button !== 0 || connectMode || event.target.closest('input, button, textarea, select')) return;
      event.preventDefault(); event.stopPropagation();
      viewport.focus({ preventScroll: true });
      if (event.altKey || !selectedNodeIds.has(id)) selectNode(id, event.shiftKey, event.altKey);
      const starts = new Map((currentBoard()?.nodes || []).filter(n => n.type !== 'group' && selectedNodeIds.has(n.id)).map(n => [n.id, { x: n.x, y: n.y }]));
      const startX = event.clientX, startY = event.clientY;
      let changed = false;
      handle.setPointerCapture(event.pointerId);
      const move = e => {
        if (e.pointerId !== event.pointerId) return;
        const dx = (e.clientX - startX) / camera.zoom, dy = (e.clientY - startY) / camera.zoom;
        if (!changed && Math.abs(dx) + Math.abs(dy) < 2) return;
        changed = true;
        const active = currentBoard();
        active.nodes = active.nodes.map(n => starts.has(n.id) ? updateIdeaNode(n, { x: clamp(starts.get(n.id).x + dx, -1000000, 1000000), y: clamp(starts.get(n.id).y + dy, -1000000, 1000000) }) : n);
        active.nodes.forEach(n => { const card = world.querySelector('[data-node-id="' + n.id + '"]'); if (card) { card.style.left = n.x + 'px'; card.style.top = n.y + 'px'; } });
        drawConnections();
      };
      const finish = e => {
        if (e.pointerId !== event.pointerId) return;
        handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', finish); handle.removeEventListener('pointercancel', finish);
        if (changed) { currentBoard().modifiedAt = new Date().toISOString(); flushIdeaChanges(); }
      };
      handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', finish); handle.addEventListener('pointercancel', finish);
    });
  };
  const renderNote = node => {
    const note = element('article', 'ideas-note-card');
    note.dataset.nodeId = node.id;
    note.style.left = node.x + 'px';
    note.style.top = node.y + 'px';
    note.style.width = node.width + 'px';
    note.style.height = node.height + 'px';
    note.style.setProperty('--note-color', node.color);
    const noteHeader = element('div', 'ideas-note-header');
    const titleInput = input('note-title', 'Título de la nota', 'text', node.title);
    titleInput.maxLength = 160;
    titleInput.classList.add('ideas-note-title');
    titleInput.setAttribute('aria-label', 'Título de la nota');
    const actions = element('div', 'ideas-note-actions');
    const duplicate = button('＋', 'ideas-note-duplicate', 'ideas-note-icon-button', { id: node.id });
    duplicate.title = 'Duplicar nota';
    duplicate.setAttribute('aria-label', 'Duplicar nota');
    const remove = button('×', 'ideas-note-delete', 'ideas-note-icon-button', { id: node.id });
    remove.title = 'Eliminar nota';
    remove.setAttribute('aria-label', 'Eliminar nota');
    actions.append(duplicate, remove);
    noteHeader.append(titleInput, actions);
    const body = textarea('note-body', 'Escribe tus ideas aquí…', node.body);
    body.maxLength = 10000;
    body.classList.add('ideas-note-editor');
    body.setAttribute('aria-label', 'Contenido de la nota');
    const footer = element('div', 'ideas-note-footer');
    const colors = [
      { value: '#fff2bf', label: 'Amarillo' },
      { value: '#dff1e4', label: 'Verde' },
      { value: '#dcecff', label: 'Azul' },
      { value: '#f9dfdf', label: 'Rosa' },
      { value: '#eee3ff', label: 'Lila' },
      { value: '#f2e6d8', label: 'Arena' }
    ];
    const palette = element('div', 'ideas-note-palette');
    colors.forEach(color => {
      const swatch = button('', 'ideas-note-color', 'ideas-note-swatch' + (node.color === color.value ? ' active' : ''), { id: node.id, color: color.value });
      swatch.style.backgroundColor = color.value;
      swatch.title = color.label;
      swatch.setAttribute('aria-label', 'Color ' + color.label);
      swatch.setAttribute('aria-pressed', String(node.color === color.value));
      palette.append(swatch);
    });
    footer.append(palette, element('span', 'ideas-note-label', 'Nota'));
    const resize = element('div', 'ideas-note-resize');
    resize.setAttribute('role', 'separator');
    resize.setAttribute('aria-label', 'Cambiar tamaño de nota');
    resize.tabIndex = 0;
    note.append(noteHeader, body, footer, resize);

    note.addEventListener('pointerdown', event => {
      if (event.button !== 0 || connectMode || event.target.closest('button, .ideas-note-resize')) return;
      if (!selectedNodeIds.has(node.id) || event.altKey) selectNode(node.id, event.shiftKey, event.altKey);
    }, true);
    const updateText = (patch, inputElement) => {
      try {
        const activeBoard = currentBoard();
        const current = activeBoard?.nodes.find(item => item.id === node.id);
        if (!current) return;
        if (patch.title !== undefined && !patch.title.trim()) return;
        const updated = updateIdeaNode(current, patch);
        activeBoard.nodes = activeBoard.nodes.map(item => item.id === node.id ? updated : item);
        node = updated;
        scheduleBoardSave();
      } catch (error) {
        showToast(error.message, 'error');
        if (inputElement && patch.title !== undefined) inputElement.value = node.title;
      }
    };
    titleInput.addEventListener('input', () => updateText({ title: titleInput.value }, titleInput));
    titleInput.addEventListener('blur', () => {
      if (!titleInput.value.trim()) titleInput.value = node.title;
    });
    body.addEventListener('input', () => updateText({ body: body.value }, body));

    bindNodeDrag(noteHeader, node.id);
    resize.addEventListener('pointerdown', event => {
      if (pageTouch(event)) return;
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      resize.setPointerCapture(event.pointerId);
      const startX = event.clientX, startY = event.clientY, startWidth = node.width, startHeight = node.height;
      const move = moveEvent => {
        if (moveEvent.pointerId !== event.pointerId) return;
        const width = Math.max(120, Math.min(2000, startWidth + (moveEvent.clientX - startX) / camera.zoom));
        const height = Math.max(120, Math.min(2000, startHeight + (moveEvent.clientY - startY) / camera.zoom));
        note.style.width = width + 'px';
        note.style.height = height + 'px';
        const activeBoard = currentBoard();
        const current = activeBoard?.nodes.find(item => item.id === node.id);
        if (current) {
          try {
            const updated = updateIdeaNode(current, { width, height });
            activeBoard.nodes = activeBoard.nodes.map(item => item.id === node.id ? updated : item);
            node = updated;
            drawConnections();
          } catch {}
        }
      };
      const finish = finishEvent => {
        if (finishEvent.pointerId !== event.pointerId) return;
        resize.removeEventListener('pointermove', move);
        resize.removeEventListener('pointerup', finish);
        resize.removeEventListener('pointercancel', finish);
        scheduleBoardSave();
      };
      resize.addEventListener('pointermove', move);
      resize.addEventListener('pointerup', finish);
      resize.addEventListener('pointercancel', finish);
    });
    resize.addEventListener('keydown', event => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const width = Math.max(120, Math.min(2000, node.width + (event.key === 'ArrowRight' ? 20 : event.key === 'ArrowLeft' ? -20 : 0)));
      const height = Math.max(120, Math.min(2000, node.height + (event.key === 'ArrowDown' ? 20 : event.key === 'ArrowUp' ? -20 : 0)));
      const activeBoard = currentBoard();
      const current = activeBoard?.nodes.find(item => item.id === node.id);
      if (!current) return;
      const updated = updateIdeaNode(current, { width, height });
      activeBoard.nodes = activeBoard.nodes.map(item => item.id === node.id ? updated : item);
      node = updated;
      note.style.width = width + 'px';
      note.style.height = height + 'px';
      drawConnections();
      scheduleBoardSave();
    });
    world.append(note);
  };
  const renderActivity = node => {
    const activity = element('article', 'ideas-activity-card');
    activity.dataset.nodeId = node.id;
    activity.style.left = node.x + 'px';
    activity.style.top = node.y + 'px';
    activity.style.width = Math.max(260, node.width) + 'px';
    activity.style.minHeight = Math.max(230, node.height) + 'px';
    activity.style.setProperty('--activity-color', node.color);
    const header = element('div', 'ideas-activity-header');
    const titleInput = input('activity-title', 'Nombre de la actividad', 'text', node.title);
    titleInput.maxLength = 160;
    titleInput.classList.add('ideas-activity-title');
    titleInput.setAttribute('aria-label', 'Nombre de la actividad');
    const actions = element('div', 'ideas-activity-actions');
    const duplicate = button('＋', 'ideas-activity-duplicate', 'ideas-note-icon-button', { id: node.id });
    duplicate.title = 'Duplicar actividad';
    duplicate.setAttribute('aria-label', 'Duplicar actividad');
    const remove = button('×', 'ideas-activity-delete', 'ideas-note-icon-button', { id: node.id });
    remove.title = 'Eliminar actividad';
    remove.setAttribute('aria-label', 'Eliminar actividad');
    actions.append(duplicate, remove);
    header.append(titleInput, actions);
    const description = textarea('activity-body', 'Descripción o detalles…', node.body);
    description.maxLength = 10000;
    description.classList.add('ideas-activity-description');
    description.setAttribute('aria-label', 'Descripción de la actividad');
    const fields = element('div', 'ideas-activity-fields');
    const startDate = input('startDate', '', 'date', node.startDate || '');
    const dueDate = input('dueDate', '', 'date', node.dueDate || '');
    const status = select('status', [
      { value: 'pending', label: 'Pendiente' },
      { value: 'in-progress', label: 'En curso' },
      { value: 'done', label: 'Completada' }
    ], node.status);
    const priority = select('priority', [
      { value: 'low', label: 'Baja' },
      { value: 'medium', label: 'Media' },
      { value: 'high', label: 'Alta' }
    ], node.priority);
    const category = input('category', 'Categoría', 'text', node.category || '');
    category.maxLength = 50;
    const duration = input('estimatedMinutes', 'Minutos', 'number', node.estimatedMinutes || 0);
    duration.min = '0';
    duration.max = '1440';
    duration.step = '5';
    fields.append(
      field('Inicio', startDate), field('Fecha límite', dueDate),
      field('Estado', status), field('Prioridad', priority),
      field('Categoría', category), field('Duración (min)', duration)
    );
    const palette = element('div', 'ideas-activity-palette');
    [
      { value: '#e2f0e5', label: 'Verde' }, { value: '#e1edfb', label: 'Azul' },
      { value: '#fff0c9', label: 'Amarillo' }, { value: '#f8e2e2', label: 'Rosa' }
    ].forEach(color => {
      const swatch = button('', 'ideas-activity-color', 'ideas-note-swatch' + (node.color === color.value ? ' active' : ''), { id: node.id, color: color.value });
      swatch.style.backgroundColor = color.value;
      swatch.title = color.label;
      swatch.setAttribute('aria-label', 'Color ' + color.label);
      swatch.setAttribute('aria-pressed', String(node.color === color.value));
      palette.append(swatch);
    });
    activity.append(header, description, fields, palette);
    const update = (patch, control) => {
      const activeBoard = currentBoard();
      const current = activeBoard?.nodes.find(item => item.id === node.id);
      if (!current) return;
      try {
        if (patch.title !== undefined && !patch.title.trim()) return;
        if (patch.estimatedMinutes !== undefined) {
          const minutes = Number(patch.estimatedMinutes);
          if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) throw new Error('La duración debe estar entre 0 y 1440 minutos.');
          patch.estimatedMinutes = minutes;
        }
        const next = updateIdeaNode(current, patch);
        activeBoard.nodes = activeBoard.nodes.map(item => item.id === node.id ? next : item);
        node = next;
        scheduleBoardSave();
      } catch (error) {
        showToast(error.message, 'error');
        if (control) { const key = Object.keys(patch)[0]; control.value = node[key] == null ? '' : String(node[key]); }
      }
    };
    titleInput.addEventListener('input', () => update({ title: titleInput.value }, titleInput));
    titleInput.addEventListener('blur', () => { if (!titleInput.value.trim()) titleInput.value = node.title; });
    description.addEventListener('input', () => update({ body: description.value }));
    category.addEventListener('input', () => update({ category: category.value }));
    startDate.addEventListener('change', () => update({ startDate: startDate.value }, startDate));
    dueDate.addEventListener('change', () => update({ dueDate: dueDate.value }, dueDate));
    status.addEventListener('change', () => update({ status: status.value }));
    priority.addEventListener('change', () => update({ priority: priority.value }));
    duration.addEventListener('input', () => update({ estimatedMinutes: duration.value }, duration));
    activity.addEventListener('pointerdown', event => {
      if (event.button !== 0 || connectMode || event.target.closest('button, .ideas-note-resize')) return;
      if (!selectedNodeIds.has(node.id) || event.altKey) selectNode(node.id, event.shiftKey, event.altKey);
    }, true);
    bindNodeDrag(header, node.id);
    world.append(activity);
  };
  const renderGroup = group => {
    const frame = element('section', 'ideas-group-frame'); frame.dataset.groupId = group.id;
    const children = (currentBoard()?.nodes || []).filter(node => group.childrenIds.includes(node.id));
    const bounds = children.length ? { left: Math.min(...children.map(node => node.x))-14, top: Math.min(...children.map(node => node.y))-48, right: Math.max(...children.map(node => node.x+node.width))+14, bottom: Math.max(...children.map(node => node.y+node.height))+14 } : { left: group.x, top: group.y, right: group.x+group.width, bottom: group.y+group.height };
    frame.style.left=bounds.left+'px'; frame.style.top=bounds.top+'px'; frame.style.width=Math.max(160,bounds.right-bounds.left)+'px'; frame.style.height=Math.max(100,bounds.bottom-bounds.top)+'px';
    const bar=element('div','ideas-group-header');
    const handle=element('span','ideas-group-drag-handle','Mover');
    const title=input('group-title','Nombre del grupo','text',group.title); title.maxLength=160; title.classList.add('ideas-group-title'); title.setAttribute('aria-label','Nombre del grupo');
    title.addEventListener('change',()=>{ if(!title.value.trim()){title.value=group.title;return;} const activeBoard=currentBoard(); const current=activeBoard?.nodes.find(item=>item.id===group.id); if(!current)return; try{const updated=updateIdeaNode(current,{title:title.value});activeBoard.nodes=activeBoard.nodes.map(item=>item.id===group.id?updated:item);group.title=updated.title;scheduleBoardSave();}catch(error){showToast(error.message,'error');title.value=group.title;}});
    const ungroup=button('Desagrupar','ideas-group-remove','ideas-group-small-action',{id:group.id}); ungroup.title='Quitar el grupo sin eliminar sus elementos'; bar.append(handle,title,ungroup); frame.append(bar);
    bindNodeDrag(bar, group.id);
    world.append(frame);
  };
  const renderNotes = () => {
    world.replaceChildren(connectionLayer);
    (currentBoard()?.nodes||[]).filter(node=>node.type==='group').forEach(renderGroup);
    (currentBoard()?.nodes||[]).forEach(node=>{if(node.type==='note')renderNote(node);else if(node.type==='activity')renderActivity(node);});
    drawConnections(); syncSelection(); applyNodeFilters();
  };
  groupSelection.addEventListener('click', async () => {
    const activeBoard=currentBoard(); const ids=[...selectedNodeIds].filter(id=>activeBoard?.nodes.some(node=>node.id===id&&(node.type==='note'||node.type==='activity')));
    if(!activeBoard||ids.length<2)return; const title=await requestText('Nombre del grupo:','Nuevo grupo'); if(title===null)return; if(!title.trim())return showToast('El grupo necesita un nombre.','error');
    const children=activeBoard.nodes.filter(node=>ids.includes(node.id)); const left=Math.min(...children.map(node=>node.x)),top=Math.min(...children.map(node=>node.y)),right=Math.max(...children.map(node=>node.x+node.width)),bottom=Math.max(...children.map(node=>node.y+node.height));
    const previous = cloneIdeaBoard(activeBoard);
    const group=createIdeaNode('group',{title,x:left-14,y:top-48,width:Math.min(2000,Math.max(160,right-left+28)),height:Math.min(2000,Math.max(100,bottom-top+62)),childrenIds:ids,color:'#e4efe7'});
    // Transfer membership instead of creating overlapping combinations of groups.
    activeBoard.nodes = activeBoard.nodes.map(n => n.type === 'group' ? { ...n, childrenIds: n.childrenIds.filter(id => !ids.includes(id)) } : n)
      .filter(n => n.type !== 'group' || n.childrenIds.length > 0);
    const remaining = new Set(activeBoard.nodes.map(n => n.id));
    activeBoard.connections = activeBoard.connections.filter(c => remaining.has(c.from) && remaining.has(c.to));
    activeBoard.nodes.push(group); activeBoard.modifiedAt=new Date().toISOString();
    try {
      validateIdeaBoard(activeBoard);
      if (!await flushIdeaChanges()) { Object.assign(activeBoard, previous); renderNotes(); return; }
      selectNode(group.id); renderNotes(); showToast('Grupo creado.');
    } catch(error) { Object.assign(activeBoard, previous); showToast(error.message,'error'); }
  });
  world.addEventListener('click', async event => {
    const target=event.target.closest('[data-action="ideas-group-remove"]'); if(!target)return;
    const activeBoard=currentBoard(); const group=activeBoard?.nodes.find(n=>n.id===target.dataset.id&&n.type==='group'); if(!group)return;
    const previous=cloneIdeaBoard(activeBoard);
    activeBoard.nodes=activeBoard.nodes.filter(n=>n.id!==group.id);
    activeBoard.connections=activeBoard.connections.filter(c=>c.from!==group.id&&c.to!==group.id);
    activeBoard.modifiedAt=new Date().toISOString();
    if(!await flushIdeaChanges()) { Object.assign(activeBoard,previous); renderNotes(); return; }
    selectedNodeIds.delete(group.id); renderNotes(); showToast('Grupo eliminado; sus elementos se conservaron.');
  });
  updateConnectionControls();
  renderNotes();
  paint();
  requestAnimationFrame(() => { if (viewport.isConnected) drawConnections(); });
  syncHistoryControls();
}

function renderIdeaBoardLibrary(main) {
  const header = element('div', 'view-heading-row');
  header.append(heading('Pizarrones', 'Un espacio para reunir ideas, proyectos y conexiones.', 'navigation/dashboard.png'));
  const headerActions = element('div', 'ideas-library-header-actions');
  headerActions.append(button('Importar .oisym', 'ideas-import-trigger', 'button secondary'));
  headerActions.append(button('+ Nuevo pizarrón', 'ideas-create', 'button primary'));
  header.append(headerActions);
  const importInput = element('input');
  importInput.type = 'file';
  importInput.id = 'ideas-import-file';
  importInput.accept = '.oisym,application/json';
  importInput.multiple = true;
  importInput.hidden = true;
  main.append(header, importInput);
  const toolbar = element('div', 'ideas-library-toolbar');
  const search = input('idea-board-search', 'Buscar pizarrones…', 'search', state.ideaBoardSearch);
  search.id = 'idea-board-search';
  search.setAttribute('aria-label', 'Buscar pizarrones');
  const searchWrap = element('label', 'search-field');
  searchWrap.append(iconImage('interface/search.png', '', 'search-icon'), search);
  const sort = select('idea-board-sort', [
    { value: 'modified', label: 'Modificados recientemente' },
    { value: 'created', label: 'Creados recientemente' },
    { value: 'elements', label: 'Más elementos' },
    { value: 'name', label: 'Nombre' }
  ], state.ideaBoardSort);
  sort.id = 'idea-board-sort';
  sort.setAttribute('aria-label', 'Ordenar pizarrones');
  toolbar.append(searchWrap, sort);
  main.append(toolbar);
  const query = state.ideaBoardSearch.trim().toLocaleLowerCase('es');
  const boards = state.profile.ideaBoards.filter(board => {
    if (!query) return true;
    const content = board.nodes.map(node => [node.title, node.body, node.category].join(' ')).join(' ');
    return (board.title + ' ' + board.description + ' ' + content).toLocaleLowerCase('es').includes(query);
  });
  boards.sort((a,b) => state.ideaBoardSort === 'name' ? a.title.localeCompare(b.title, 'es') :
    state.ideaBoardSort === 'created' ? b.createdAt.localeCompare(a.createdAt) : state.ideaBoardSort === 'elements' ? b.nodes.length - a.nodes.length : b.modifiedAt.localeCompare(a.modifiedAt));
  if (!boards.length) {
    main.append(empty(query ? 'No hay resultados' : 'Tu biblioteca está vacía', query ? 'Prueba con otro término de búsqueda.' : 'Crea tu primer pizarrón para empezar a organizar ideas visualmente.'));
    return;
  }
  const grid = element('div', 'ideas-board-grid');
  boards.forEach(board => {
    const item = card('ideas-board-card');
    const open = button('', 'ideas-open', 'ideas-board-open', { id: board.id });
    open.setAttribute('aria-label', 'Abrir pizarrón ' + board.title);
    open.append(iconImage('navigation/dashboard.png', '', 'ideas-board-preview-icon'), element('span', 'ideas-board-open-label', 'Abrir pizarrón'));
    const title = element('div', 'ideas-board-card-title');
    title.append(element('h3', '', board.title), element('span', 'muted', board.nodes.length + ' elementos'));
    item.append(open, title);
    if (board.description) item.append(element('p', 'muted ideas-board-description', board.description));
    const footer = element('div', 'ideas-board-card-footer');
    footer.append(element('span', 'small-note', 'Modificado ' + new Date(board.modifiedAt).toLocaleDateString('es-MX')));
    const actions = element('div', 'ideas-board-actions');
    actions.append(button('Editar', 'ideas-edit', 'button secondary small', { id: board.id }));
    actions.append(button('Exportar', 'ideas-export', 'button secondary small', { id: board.id }));
    actions.append(button('Duplicar', 'ideas-duplicate', 'button secondary small', { id: board.id }));
    actions.append(button('Eliminar', 'ideas-delete', 'button secondary small', { id: board.id }));
    footer.append(actions);
    item.append(footer);
    grid.append(item);
  });
  main.append(grid);
}

function renderPlannerAgenda(main, listMode = false) {
  const date = state.selectedDate;
  const items = getItemsForDay(state.profile, date);
  const scheduled = items.filter(item => item.scheduled);
  const timed = scheduled.filter(item => item.timed && item.task.status === 'pending');
  const untimed = items.filter(item => !item.timed);
  const free = getFreeTimeSlots(state.profile, date);
  const titleBar = element('div', 'day-date-bar');
  const datePicker = input('selectedDate', '', 'date', date);
  datePicker.id = 'planner-date';
  datePicker.setAttribute('aria-label', 'Fecha de la agenda');
  titleBar.append(element('p', 'muted', 'Plan del ' + dateLabel(date) + ' · Las fechas límite no crean bloques de tiempo.'), datePicker);
  main.append(titleBar);
  const dayLayout = element('div', 'planner-layout');
  const mainColumn = element('div', 'planner-main-column');
  const side = element('div', 'planner-side-column');
  const timeCard = card('day-timeline-card');
  timeCard.append(heading(listMode ? 'Agenda del día' : 'Línea temporal',
    timed.length + ' bloques con horario · ' + free.availableMinutes + ' min libres dentro de la jornada'));
  timeCard.append(element('p', 'small-note',
    'Horario habitual: ' + free.startTime + '–' + free.endTime + '. Se configura en tu perfil.'));
  const timeline = element('div', 'day-timeline');
  if (!timed.length) timeline.append(empty('Sin bloques horarios',
    'Puedes asignar horas a las tareas existentes o aceptar una propuesta.'));
  const makeTimeBlock = (item) => {
    const row = element('div', 'day-time-block' + (item.task.locked ? ' is-locked' : ''));
    row.dataset.taskId = item.id;
    const when = element('div', 'day-block-time', item.task.startTime + '–' + item.task.endTime);
    const detail = element('div', 'day-block-details');
    detail.append(element('strong', '', item.task.title), element('span', 'small-note',
      (item.task.locked ? 'Bloqueado · ' : 'Flexible · ') + priorityLabel(item.task.priority)));
    const edit = button('Editar', 'edit-task', 'button secondary small', { id: item.id });
    edit.setAttribute('aria-label', 'Editar horario de ' + item.task.title);
    row.append(when, detail, edit);
    return row;
  };
  if (listMode) {
    timeline.classList.add('day-agenda-list');
    timed.forEach(item => timeline.append(makeTimeBlock(item)));
  } else if (timed.length) {
    const layout = getTimelineLayout(state.profile, date);
    const minutePixels = 1.3;
    const board = element('div', 'day-visual-timeline');
    board.setAttribute('aria-label', 'Horario visual del día; cada bloque tiene un botón Editar');
    const ruler = element('div', 'day-time-ruler');
    const stage = element('div', 'day-time-stage');
    const height = (layout.endMinute - layout.startMinute) * minutePixels;
    ruler.style.height = height + 'px';
    stage.style.height = height + 'px';
    layout.hours.forEach(hour => {
      const offset = (hour.minute - layout.startMinute) * minutePixels;
      const label = element('span', 'day-ruler-label', hour.label);
      label.style.top = offset + 'px';
      ruler.append(label);
      const line = element('div', 'day-hour-guide');
      line.style.top = offset + 'px';
      stage.append(line);
    });
    layout.blocks.forEach(block => {
      const item = { id: block.id, task: block.task };
      const entry = makeTimeBlock(item);
      entry.classList.add('day-positioned-block');
      entry.style.top = ((block.startMinute - layout.startMinute) * minutePixels + 3) + 'px';
      entry.style.height = Math.max(24, (block.endMinute - block.startMinute) * minutePixels - 7) + 'px';
      entry.style.left = 'calc(' + (block.column * 100 / block.columns) + '% + 4px)';
      entry.style.width = 'calc(' + (100 / block.columns) + '% - 8px)';
      entry.title = block.task.startTime + '–' + block.task.endTime + ' · ' + block.task.title;
      stage.append(entry);
    });
    board.append(ruler, stage); timeline.append(board);
    timeline.append(element('p', 'small-note day-timeline-caption',
      'Bloques colocados según la hora real. Los superpuestos aparecen lado a lado. Usa Editar para moverlos.'));
  }
  timeCard.append(timeline);
  if (free.conflicts.length) {
    const warnings = element('div', 'schedule-conflicts');
    warnings.setAttribute('role', 'status');
    warnings.append(element('strong', '', free.conflicts.length + ' superposiciones detectadas'));
    free.conflicts.forEach(conflict => warnings.append(element('p', 'small-note',
      conflict.startTime + '–' + conflict.endTime + ' · ' + conflict.firstTitle + ' / ' + conflict.secondTitle +
      (conflict.locked ? ' · Incluye un compromiso bloqueado' : ''))));
    timeCard.append(warnings);
  }
  const freeTitle = element('h3', '', 'Tiempo disponible');
  timeCard.append(freeTitle);
  if (!free.free.length) timeCard.append(element('p', 'muted', 'No quedan intervalos libres dentro del horario habitual.'));
  const slots = element('div', 'free-slot-list');
  free.free.forEach(slot => {
    const row = element('div', 'free-slot');
    row.append(element('span', '', slot.startTime + '–' + slot.endTime),
      element('span', 'small-note', slot.minutes + ' min'));
    slots.append(row);
  });
  timeCard.append(slots);
  timeCard.append(button('Añadir tarea con horario', 'calendar-add-task', 'button primary'));
  mainColumn.append(timeCard);
  const pendingCard = card();
  pendingCard.append(heading('Sin horario para este día',
    'Tareas programadas sin horas y fechas límite que vencen hoy.'));
  renderTaskList(pendingCard, untimed.map(item => item.task), { emptyTitle: 'Sin pendientes sin hora',
    emptyDetail: 'Las tareas con horario están en la línea temporal.' });
  mainColumn.append(pendingCard);
  const inbox = card();
  const waiting = getUnscheduledTasks(state.profile);
  inbox.append(heading('Bandeja de entrada', waiting.length + ' tareas pendientes sin fecha programada'));
  if (waiting.length) {
    waiting.slice(0, 20).forEach(task => {
      const row = element('div', 'inbox-row');
      row.append(element('span', '', task.title));
      row.append(button('Asignar al día', 'schedule-inbox-task', 'button secondary small', { id: task.id, date }));
      inbox.append(row);
    });
  } else inbox.append(empty('Bandeja despejada', 'No hay tareas pendientes sin fecha.'));
  side.append(inbox);
  dayLayout.append(mainColumn, side);
  main.append(dayLayout);

  const analysisCard = card('unified-planner-card');
  analysisCard.append(heading('Planificación asistida',
    'O-Isym propone intervalos libres. Nada se mueve sin aprobación.'));
  analysisCard.append(button('Analizar y proponer horarios', 'generate-plan', 'button secondary'));
  const analysis = state.plannerAnalysis;
  if (analysis && analysis.date === date) {
    analysisCard.append(element('p', 'small-note',
      analysis.proposals.length + ' propuestas · ' + analysis.availableMinutes + ' min libres al analizar.'));
    if (analysis.proposals.length) {
      const list = element('div', 'planner-proposals');
      analysis.proposals.forEach(proposal => {
        const item = element('article', 'planner-proposal');
        item.append(element('strong', '', proposal.title),
          element('span', 'planner-time', proposal.startTime + '–' + proposal.endTime),
          element('p', 'small-note', proposal.reason));
        list.append(item);
      });
      analysisCard.append(list);
      analysisCard.append(button('Aplicar estas propuestas', 'apply-plan', 'button primary'),
        button('Descartar', 'discard-plan', 'button secondary'));
    }
    if (analysis.skipped.length) {
      const skipped = element('div', 'planner-skipped');
      skipped.append(element('strong', '', 'No incluidas'));
      analysis.skipped.forEach(item => skipped.append(element('p', 'small-note', item.title + ': ' + item.reason)));
      analysisCard.append(skipped);
    }
    if (!analysis.proposals.length) analysisCard.append(element('p', 'muted', 'No hay propuestas que encajen en la jornada.'));
  }
  main.append(analysisCard);

  const templatesCard = card('day-template-card');
  templatesCard.append(heading('Plantillas y rutinas',
    'Opcionales. Cada aplicación crea tareas reales una sola vez; las instancias se editan por separado.'));
  const templates = state.profile.dayTemplates || [];
  if (!templates.length) templatesCard.append(element('p', 'muted', 'Todavía no tienes plantillas de día.'));
  templates.forEach(template => {
    const row = element('div', 'template-row');
    const applies = templateAppliesOn(template, date);
    const info = element('div', '');
    info.append(element('strong', '', template.name),
      element('p', 'small-note', template.entries.length + ' bloques · ' +
        (applies ? 'Aplicable a esta fecha' : 'Fuera de los días configurados')));
    const exception = (template.recurrence.exceptions || []).includes(date);
    const exceptionButton = button(exception ? 'Quitar excepción' : 'Excluir este día',
      'template-exception', 'button secondary small', { id: template.id });
    exceptionButton.disabled = !exception && !applies;
    row.append(info,
      button('Previsualizar', 'template-preview', 'button secondary small', { id: template.id }),
      button('Editar regla', 'template-edit', 'button secondary small', { id: template.id }),
      exceptionButton,
      button('Eliminar', 'template-delete', 'button secondary small', { id: template.id }));
    templatesCard.append(row);
    if (state.editingTemplateId === template.id) {
      const edit = element('form', 'form-card template-edit-form');
      edit.dataset.form = 'day-template-edit';
      const hiddenId = input('templateId', '', 'hidden', template.id);
      edit.append(hiddenId, element('h3', '', 'Editar plantilla · ' + template.name));
      edit.append(field('Nombre', input('name', '', 'text', template.name)));
      const days = element('fieldset', 'weekday-picker');
      days.append(element('legend', '', 'Días de repetición'));
      [['1','Lun'],['2','Mar'],['3','Mié'],['4','Jue'],['5','Vie'],['6','Sáb'],['0','Dom']].forEach(([value,label]) => {
        const wrap = element('label', 'weekday-option');
        const check = element('input'); check.type = 'checkbox'; check.name = 'weekday'; check.value = value;
        check.checked = template.recurrence.weekdays.includes(Number(value));
        wrap.append(check, document.createTextNode(label));
        days.append(wrap);
      });
      edit.append(days);
      const validity = element('div', 'form-grid');
      validity.append(field('Desde', input('startDate','','date', template.recurrence.startDate || '')),
        field('Hasta', input('endDate','','date', template.recurrence.endDate || '')));
      edit.append(validity, element('h4', '', 'Bloques de la plantilla'));
      template.entries.forEach(entry => {
        const item = element('div', 'inbox-row');
        item.append(element('span', '', entry.startTime + '–' + entry.endTime + ' · ' + entry.title));
        const remove = button('Quitar bloque', 'template-entry-remove', 'button secondary small', { id: template.id, entry: entry.id });
        remove.disabled = template.entries.length <= 1;
        item.append(remove); edit.append(item);
      });
      const actions = element('div','form-actions');
      actions.append(button('Guardar cambios','submit-form','button primary'),
        button('Cancelar','template-edit-cancel','button secondary'));
      edit.append(actions);
      templatesCard.append(edit);
    }
  });
  const preview = state.templatePreview;
  if (preview && preview.date === date && templates.some(item => item.id === preview.id)) {
    const data = previewDayTemplate(state.profile, preview.id, date);
    const summary = element('section', 'template-preview');
    summary.append(element('h3', '', 'Vista previa · ' + data.template.name),
      element('p', 'small-note', data.proposals.length + ' bloques nuevos · ' + data.skipped.length + ' omitidos'));
    data.proposals.forEach(entry => summary.append(element('p', 'small-note',
      entry.startTime + '–' + entry.endTime + ' · ' + entry.title +
      (entry.conflicts.length ? ' · Conflicto: ' + entry.conflicts.join(', ') : ''))));
    data.skipped.forEach(item => summary.append(element('p', 'small-note', item.title ? item.title + ': ' + item.reason : item.reason)));
    if (data.proposals.length) summary.append(button('Aplicar plantilla al día', 'template-apply', 'button primary', { id: preview.id }));
    summary.append(button('Cerrar vista previa', 'template-preview-close', 'button secondary'));
    templatesCard.append(summary);
  }
  const create = element('form', 'form-card day-template-form');
  create.dataset.form = 'day-template-create';
  create.append(element('h3', '', 'Nueva plantilla de día'));
  create.append(field('Nombre de la plantilla', input('name', 'Ej. Mañana de estudio')));
  create.append(field('Bloque o actividad', input('title', 'Ej. Lectura')));
  create.append(field('Actividad del catálogo (opcional)', activitySelect('activityId', '')));
  const times = element('div', 'form-grid');
  times.append(field('Inicio', input('startTime', '', 'time', '09:00')),
    field('Fin', input('endTime', '', 'time', '09:30')));
  create.append(times);
  const weekdays = element('fieldset', 'weekday-picker');
  weekdays.append(element('legend', '', 'Días de repetición'));
  [['1','Lun'],['2','Mar'],['3','Mié'],['4','Jue'],['5','Vie'],['6','Sáb'],['0','Dom']].forEach(([value,label]) => {
    const wrap = element('label','weekday-option');
    const check = element('input'); check.type = 'checkbox'; check.name = 'weekday'; check.value = value;
    check.checked = ['1','2','3','4','5'].includes(value);
    wrap.append(check, document.createTextNode(label)); weekdays.append(wrap);
  });
  create.append(weekdays);
  const validity = element('div','form-grid');
  validity.append(field('Desde (opcional)', input('startDate', '', 'date')),
    field('Hasta (opcional)', input('endDate', '', 'date')));
  create.append(validity, button('Guardar plantilla', 'submit-form', 'button primary'));
  templatesCard.append(create);
  if (templates.length) {
    const add = element('form','form-card template-entry-form');
    add.dataset.form = 'day-template-entry';
    add.append(element('h3', '', 'Añadir bloque a una plantilla'));
    add.append(field('Plantilla', select('templateId', templates.map(item => ({ value: item.id, label: item.name })), templates[0].id)));
    add.append(field('Nombre del bloque', input('title', 'Ej. Descanso')));
    const pair = element('div','form-grid');
    pair.append(field('Inicio', input('startTime','','time','10:00')), field('Fin', input('endTime','','time','10:30')));
    add.append(pair, button('Añadir bloque', 'submit-form', 'button secondary'));
    templatesCard.append(add);
  }
  main.append(templatesCard);
}
function maybeShowMacLaunchPrompt() {
  if (state.launchPromptShown || state.profile?.preferences?.launchAtLogin === true) return;
  try { if (localStorage.getItem('oisym-mac-launch-prompt-dismissed') === 'true') return; } catch {}
  state.launchPromptShown = true;
  window.oisym?.notifications?.getStatus?.().then(status => {
    if (state.view !== 'planner') { state.launchPromptShown = false; return; }
    if (status.platform !== 'darwin' || status.launchAtLogin || state.profile?.preferences?.launchAtLogin === true) return;
    const overlay = element('div', 'profile-modal-backdrop launch-prompt-backdrop');
    overlay.dataset.launchPrompt = 'true';
    const dialog = element('section', 'profile-modal profile-modal-form launch-prompt-card');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'launch-prompt-title');
    dialog.append(
      element('h2', '', '¿Añadimos O-Isym a tu Mac?'),
      element('p', 'muted', 'O-Isym puede quedarse en la barra de menús y abrirse automáticamente cuando inicies sesión. Así seguirá pendiente de tus horarios aunque cierres la ventana.'),
      element('p', 'small-note', 'La app debe seguir ejecutándose en segundo plano. Si eliges salir de O-Isym, los recordatorios se pausan hasta que vuelvas a abrirla.' )
    );
    dialog.querySelector('h2').id = 'launch-prompt-title';
    const actions = element('div', 'form-actions launch-prompt-actions');
    actions.append(button('Ahora no', 'dismiss-launch-at-login', 'button secondary'));
    actions.append(button('Añadir O-Isym al Mac', 'enable-launch-at-login', 'button primary'));
    dialog.append(actions);
    overlay.append(dialog);
    root.append(overlay);
    $('[data-action="enable-launch-at-login"]', dialog)?.focus();
  }).catch(() => { state.launchPromptShown = false; });
}

function renderFocus(main) {
  main.append(heading('Focus', 'Prepara tu sesión y después olvídate del reloj.', 'focus/timer.png'));
  const focus = state.profile.activeFocus;
  const saveBlocked = isFocusSaveBlocked();
  const focusCard = card('focus-panel');
  const selectedTask = focus ? taskById(focus.taskId) : null;
  const activity = activityById(focus ? focus.activityId : (selectedTask?.activityId || ''));
  const selectedActivityId = focus ? (focus.activityId || '') : (selectedTask?.activityId || '');
  const suggestedMinutes = focus ? Math.round(focus.durationSeconds / 60) : getSuggestedFocusMinutes(state.profile, $('#focus-task')?.value || null, $('#focus-activity')?.value || null);
  const duration = focus ? Math.round(focus.durationSeconds / 60) : suggestedMinutes;
  const remaining = focus ? getFocusRemainingSeconds(focus) : duration * 60;
  const display = element('div', 'focus-clock', String(Math.floor(remaining / 60)).padStart(2, '0') + ':' + String(remaining % 60).padStart(2, '0'));
  display.id = 'focus-clock';
  const focusStatus = element('div', 'focus-status');
  const focusIconPath = !focus ? 'focus/zen.png' : (focus.isBreak ? 'focus/break.png' : (focus.pausedAt ? 'focus/pause.png' : 'focus/timer.png'));
  focusStatus.append(iconImage(focusIconPath, '', 'focus-status-icon'), element('div', 'eyebrow', focus ? (focus.isBreak ? (focus.pausedAt ? 'DESCANSO EN PAUSA' : 'DESCANSO EN CURSO') : (focus.pausedAt ? 'SESIÓN EN PAUSA' : 'SESIÓN EN CURSO')) : 'LISTO PARA CONCENTRARTE'));
  focusCard.append(focusStatus, display);
  const taskSelect = select('taskId', [{ value: '', label: 'Sesión libre' }, ...state.profile.tasks.filter(task => task.status === 'pending').map(task => ({ value: task.id, label: task.title }))], focus ? focus.taskId || '' : '');
  taskSelect.id = 'focus-task';
  taskSelect.disabled = Boolean(focus);
  focusCard.append(field('Tarea (opcional)', taskSelect));
  const activitySelectControl = select('activityId', [{ value: '', label: 'Sin actividad específica' }, ...state.profile.activities.filter(item => !item.archived).map(item => ({ value: item.id, label: item.name }))], selectedActivityId);
  activitySelectControl.id = 'focus-activity';
  activitySelectControl.disabled = Boolean(focus);
  focusCard.append(field('Actividad', activitySelectControl));
  const durationInput = input('durationMinutes', 'Minutos', 'number', duration);
  durationInput.id = 'focus-duration';
  durationInput.min = '5'; durationInput.max = '180'; durationInput.step = '5';
  durationInput.disabled = Boolean(focus);
  focusCard.append(field(focus?.isBreak ? 'Duración del descanso' : 'Duración de esta sesión (5–180 min)', durationInput));
  const durationHint = activity ? 'Sugerencia de la actividad «' + activity.name + '»: ' + activity.durationMinutes + ' min. Puedes ajustarla para esta sesión.' : 'Se usa tu duración habitual como sugerencia. Puedes cambiarla sin modificar tus preferencias.';
  focusCard.append(element('p', 'muted focus-hint', durationHint));
  const actions = element('div', 'button-group center');
  if (!focus) {
    actions.append(button('Comenzar a concentrarme', 'focus-start', 'button primary large'));
    actions.append(button('Tomar descanso · ' + state.profile.preferences.breakMinutes + ' min', 'focus-break', 'button secondary'));
  }
  else if (saveBlocked) {
    focusCard.append(element('p', 'small-note', 'El tiempo terminó, pero falta guardar la sesión. Tus datos siguen abiertos. Revisa el almacenamiento y vuelve a intentar.'));
    actions.append(button('Reintentar guardar sesión', 'focus-retry-save', 'button primary large'));
  } else {
    actions.append(button(focus.pausedAt ? 'Reanudar' : 'Pausar', 'focus-toggle', 'button primary large'));
    actions.append(button('Terminar sesión', 'focus-stop', 'button secondary'));
  }
  if (focus && !saveBlocked) actions.append(button('Reiniciar', 'focus-reset', 'button ghost'));
  if (state.focusFinishing) actions.querySelectorAll('button').forEach(control => { control.disabled = true; });
  focusCard.append(actions);
  if (focus) {
    const elapsed = getFocusElapsedSeconds(focus);
    focusCard.append(element('p', 'muted center-text', (focus.isBreak ? 'Tiempo de descanso: ' : 'Tiempo concentrado: ') + Math.floor(elapsed / 60) + ' min · Al terminar recibirás un aviso.'));
  } else {
    focusCard.append(element('p', 'muted center-text', 'Al comenzar, puedes dejar esta pantalla y dedicarte a tu actividad. O-Isym te avisará al terminar.'));
  }

  focusCard.append(element('h3','focus-settings-heading','Sonido y avisos'));
  const musicOptions = element('div', 'focus-music-settings');
  musicOptions.append(element('h3', '', 'Música para concentrarte'));
  musicOptions.append(element('p', 'muted small-note', 'Elige un ambiente para acompañar Focus. La pista se repite en bucle durante la sesión y el descanso, hasta que pauses o termines. Puedes escuchar una vista previa antes de elegir.'));
  const musicSelect = select('focusMusicTrack', [
    { value: '', label: 'Sin música' },
    ...FOCUS_MUSIC_CATALOG.map(track => ({ value: track.id, label: track.category + ' · ' + track.name }))
  ], state.profile.preferences.focusMusicTrack || '');
  musicSelect.disabled = Boolean(focus);
  musicOptions.append(field('Ambiente musical', musicSelect));
  const selectedMusic = musicTrackById(state.profile.preferences.focusMusicTrack);
  musicOptions.append(element('p', 'small-note music-description', selectedMusic ? selectedMusic.description : 'No se reproducirá música durante la sesión.'));
  const musicControls = element('div', 'focus-music-controls');
  const musicPreviewButton = button('Escuchar vista previa', 'preview-focus-music', 'button secondary small');
  musicPreviewButton.id = 'focus-music-preview';
  musicPreviewButton.disabled = Boolean(focus) || !selectedMusic;
  const musicPreviewStopButton = button('Detener vista previa', 'stop-focus-music-preview', 'button ghost small');
  musicPreviewStopButton.id = 'focus-music-preview-stop';
  musicPreviewStopButton.disabled = !focusAudioController.isPreviewPlaying();
  musicControls.append(musicPreviewButton, musicPreviewStopButton);
  const musicVolume = input('focusMusicVolume', '', 'range', state.profile.preferences.focusMusicVolume ?? 35);
  musicVolume.min = '0'; musicVolume.max = '100'; musicVolume.step = '5'; musicVolume.disabled = Boolean(focus);
  const musicVolumeField = field('Volumen de la música', musicVolume);
  const musicVolumeValue = element('span', 'focus-volume-value music-volume-value', String(musicVolume.value) + '%');
  musicVolumeField.append(musicVolumeValue);
  musicControls.append(musicVolumeField);
  musicOptions.append(musicControls);
  focusCard.append(musicOptions);

  const alarmOptions=element('div','focus-alarm-settings');
  alarmOptions.append(element('h3','','Al terminar Focus'));
  alarmOptions.append(element('p','muted small-note','La música se detiene primero. Después suena esta única alarma; no hay sonidos al iniciar ni al terminar descansos.'));
  const enabledLabel=element('label','focus-option'),enabled=input('focusEndAlarmEnabled','','checkbox');enabled.checked=state.profile.preferences.focusEndAlarmEnabled!==false;enabled.disabled=Boolean(focus);
  enabledLabel.append(enabled,element('span','','Reproducir alarma al terminar Focus'));alarmOptions.append(enabledLabel);
  const disabled=Boolean(focus)||!enabled.checked,tone=select('focusEndTone',alarmToneOptions,state.profile.preferences.focusEndTone||'clock');tone.disabled=disabled;alarmOptions.append(field('Sonido',tone));
  const repeats=select('focusAlarmRepeats',Array.from({length:10},(_,i)=>({value:String(i+1),label:(i+1)+(i?' veces':' vez')})),String(state.profile.preferences.focusAlarmRepeats||3));
  const interval=select('focusAlarmIntervalSeconds',Array.from({length:15},(_,i)=>({value:String(i+1),label:(i+1)+' segundos'})),String(state.profile.preferences.focusAlarmIntervalSeconds||2));
  const max=select('focusAlarmMaxSeconds',[5,10,15,20,30,45,60,90,120].map(n=>({value:String(n),label:n+' segundos'})),String(state.profile.preferences.focusAlarmMaxSeconds||30));
  [repeats,interval,max].forEach(x=>x.disabled=disabled);
  const pattern=element('div','focus-alarm-pattern');pattern.append(field('Número de repeticiones',repeats),field('Pausa entre repeticiones',interval),field('Duración máxima',max));alarmOptions.append(pattern);
  const volume=input('focusAlarmVolume','','range',state.profile.preferences.focusAlarmVolume??70);volume.min='0';volume.max='100';volume.step='5';volume.disabled=disabled;
  const vf=field('Volumen',volume),vv=element('span','focus-volume-value alarm-volume-value',String(volume.value)+'%');vf.append(vv);alarmOptions.append(vf);
  const audioActions=element('div','focus-audio-actions'),preview=button('Probar alarma','preview-focus-alarm','button secondary small');preview.disabled=disabled;audioActions.append(preview);
  const stop=button('Detener alarma','stop-focus-alarm','button ghost small');stop.id='focus-alarm-stop';stop.disabled=!focusAudioController.isAlarmPlaying();audioActions.append(stop);alarmOptions.append(audioActions);
  const notificationLabel=element('label','focus-option'),notifications=input('focusNotifications','','checkbox');notifications.checked=state.profile.preferences.focusNotifications!==false;notifications.disabled=Boolean(focus);
  notificationLabel.append(notifications,element('span','','Mostrar notificación del sistema al terminar'));alarmOptions.append(notificationLabel);
  alarmOptions.append(element('p','small-note','El MP3 requiere que la ventana esté abierta o minimizada. Si cierras la ventana, O-Isym puede mostrar una notificación silenciosa; al salir con Cmd + Q, los temporizadores se detienen.'));
  focusCard.append(alarmOptions);
  main.append(focusCard);
  const sessions = state.profile.focusSessions.slice().reverse();
  const today = localDate();
  const todaySessions = sessions.filter(session => session.endedAt && localDate(new Date(session.endedAt)) === today);
  const todayMinutes = todaySessions.reduce((total, session) => total + Math.round((session.durationSeconds || 0) / 60), 0);
  const stats = card('focus-stats');
  stats.append(heading('Tu concentración', 'Un resumen sin competir contra el reloj.'));
  const statsGrid = element('div', 'focus-stats-grid');
  [[String(todaySessions.length), 'sesiones hoy'], [todayMinutes + ' min', 'concentrados hoy'], [String(sessions.length), 'sesiones en total']].forEach(([value, label]) => {
    const metric = element('div', 'focus-stat');
    metric.append(element('strong', '', value), element('span', '', label));
    statsGrid.append(metric);
  });
  stats.append(statsGrid);
  main.append(stats);
  const history = card();
  history.append(heading('Sesiones recientes', 'Tu historial de concentración.'));
  sessions.slice(0, 8).forEach(session => {
    const row = element('div', 'history-row');
    const details = element('div', 'focus-history-detail');
    details.append(element('strong', '', session.taskTitle || 'Sesión libre'));
    if (session.activityTitle) details.append(element('span', 'muted', session.activityTitle));
    row.append(details, element('span', 'muted', Math.round(session.durationSeconds / 60) + ' min · ' + new Date(session.endedAt).toLocaleDateString('es-MX')));
    history.append(row);
  });
  if (!sessions.length) history.append(empty('Aún no hay sesiones', 'Cuando termines una sesión, aparecerá aquí.'));
  main.append(history);
  if (focus && !focus.pausedAt) startFocusTicker();
  else stopFocusTicker();
}
function renderGoals(main) {
  const header=element('div','view-heading-row');
  header.append(heading('Objetivos','Avanza poco a poco y revisa lo que importa.','navigation/goals.png'));
  const create=button('+ Nuevo objetivo','new-goal','button primary');create.id='goal-create-button';
  header.append(create);main.append(header);
  const goals=state.profile.goals.filter(goal=>!goal.archived);
  const summary=card('goal-summary-card');
  const total=goals.length,completed=goals.filter(goal=>goal.progress>=goal.target).length;
  summary.append(element('strong','',''+total),element('span','muted',' objetivos activos'),element('span','goal-summary-completed',completed+' completados'));
  main.append(summary);
  const list=card('goal-list-card');
  list.append(heading('En marcha','Actualiza el progreso cuando avances.'));
  if(!goals.length)list.append(empty('Todavía no tienes objetivos','Define uno pequeño y concreto para comenzar.'));
  goals.forEach(goal=>{
    const row=element('div','goal-row');
    const top=element('div','goal-top');
    top.append(element('strong','',goal.title),element('span','muted',goal.progress+' / '+goal.target+' '+goal.unit));
    const track=element('div','progress-track'),fill=element('div','progress-fill');
    fill.style.width=Math.min(100,goal.progress/goal.target*100)+'%';track.append(fill);
    const actions=element('div','button-group');
    actions.append(button('+1','goal-progress','button secondary small',{id:goal.id,amount:1}),button('−1','goal-progress','button secondary small',{id:goal.id,amount:-1}),actionIconButton('Editar','edit-goal','edit.png','button secondary small',{id:goal.id}),actionIconButton('Archivar','archive-goal','archivate.png','text-button',{id:goal.id}));
    row.append(top,track,actions);list.append(row);
  });
  main.append(list);
  const editing=state.editingGoalId?goalById(state.editingGoalId):null;
  if(state.showGoalForm||editing){
    const overlay=element('div','profile-modal-backdrop entity-editor-backdrop');overlay.dataset.profileModal='true';overlay.dataset.returnFocus='goal-create-button';
    const dialog=element('section','profile-modal entity-editor-panel');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','goal-modal-title');
    const form=element('form','form-card profile-modal-form');form.dataset.form=editing?'goal-edit':'goal';
    const title=element('h2','',editing?'Editar objetivo':'Nuevo objetivo');title.id='goal-modal-title';form.append(title);
    form.append(field('Nombre',input('title','Ej. Practicar guitarra','text',editing?.title||'')));
    form.append(field('Descripción',textarea('description','¿Qué quieres conseguir?',editing?.description||'')));
    const row=element('div','form-grid');
    row.append(field('Meta numérica',input('target','10','number',editing?.target||10)),field('Unidad',input('unit','sesiones','text',editing?.unit||'')));
    form.append(row,field('Fecha objetivo (opcional)',input('dueDate','','date',editing?.dueDate||'')));
    const actions=element('div','form-actions');
    actions.append(editing?actionIconButton('Guardar cambios','submit-form','save.png','button primary'):button('Crear objetivo','submit-form','button primary'),button('Cancelar',editing?'cancel-edit-goal':'close-goal-form','button secondary'));
    form.append(actions);dialog.append(form);overlay.append(dialog);main.append(overlay);
    $('input[name="title"]',overlay)?.focus();
  }
}
function renderInsights(main) {
  main.append(heading('Insights', 'Una mirada amable a tus hábitos y tu tiempo.', 'navigation/insights.png'));
  const today = localDate();
  const weekStart = shiftDate(today, -((new Date().getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(weekStart, index));
  const weekTasks = state.profile.tasks.filter(task => task.completedAt && days.includes(task.completedAt.slice(0, 10)));
  const completed = weekTasks.filter(task => task.status === 'done');
  const created = state.profile.tasks.filter(task => task.createdAt && days.includes(task.createdAt.slice(0, 10)));
  const validSessions = state.profile.focusSessions.filter(session => session && typeof session.endedAt === 'string' && Number.isFinite(Date.parse(session.endedAt)));
  const weekSessions = validSessions.filter(session => days.includes(session.endedAt.slice(0, 10)));
  const focusSeconds = weekSessions.reduce((sum, session) => sum + Math.max(0, Number(session.durationSeconds) || 0), 0);
  const focusMinutes = Math.round(focusSeconds / 60);
  const averageMinutes = weekSessions.length ? Math.round(focusSeconds / weekSessions.length / 60) : 0;
  const activeGoals = state.profile.goals.filter(goal => !goal.archived);
  const pendingDueSoon = state.profile.tasks.filter(task => task.status === 'pending' && task.dueDate && task.dueDate >= today && task.dueDate <= shiftDate(today, 7)).length;
  const metrics = element('div', 'metrics-grid');
  [
    ['Tareas completadas', completed.length],
    ['Tareas creadas', created.length],
    ['Tiempo de enfoque', focusMinutes + ' min'],
    ['Duración media', averageMinutes + ' min']
  ].forEach(([label, value]) => {
    const metric = card('metric-card');
    metric.append(element('span', 'muted', label), element('strong', '', value));
    metrics.append(metric);
  });
  main.append(metrics);

  const week = card();
  week.append(heading('Actividad de la semana', 'Tareas completadas por día. Las barras se ajustan a tu propia semana.'));
  const dailyCounts = days.map(day => state.profile.tasks.filter(task => task.status === 'done' && task.completedAt && task.completedAt.slice(0, 10) === day).length);
  const maxTasks = Math.max(1, ...dailyCounts);
  days.forEach((day, index) => {
    const line = element('div', 'chart-line');
    line.append(element('span', '', dateLabel(day, { weekday: 'short', day: 'numeric' })));
    const track = element('div', 'chart-track');
    const fill = element('div', 'chart-fill');
    fill.style.width = (dailyCounts[index] / maxTasks * 100) + '%';
    track.append(fill);
    line.append(track, element('strong', '', dailyCounts[index]));
    week.append(line);
  });
  const insightGrid=element('div','insights-grid');
  insightGrid.append(week);

  const focusCard = card();
  focusCard.append(heading('Tiempo de concentración', 'Minutos registrados en cada día de esta semana.'));
  const dailyFocus = days.map(day => Math.round(weekSessions.filter(session => session.endedAt.slice(0, 10) === day).reduce((sum, session) => sum + Math.max(0, Number(session.durationSeconds) || 0), 0) / 60));
  const maxFocus = Math.max(1, ...dailyFocus);
  days.forEach((day, index) => {
    const line = element('div', 'chart-line');
    line.append(element('span', '', dateLabel(day, { weekday: 'short', day: 'numeric' })));
    const track = element('div', 'chart-track');
    const fill = element('div', 'chart-fill');
    fill.style.width = (dailyFocus[index] / maxFocus * 100) + '%';
    track.append(fill);
    line.append(track, element('strong', '', dailyFocus[index] + 'm'));
    focusCard.append(line);
  });
  insightGrid.append(focusCard);

  const distribution = card();
  distribution.append(heading('Actividades de enfoque', 'Dónde se ha concentrado tu tiempo durante los últimos 30 días.'));
  const cutoff = shiftDate(today, -29);
  const recentSessions = validSessions.filter(session => session.endedAt.slice(0, 10) >= cutoff && session.endedAt.slice(0, 10) <= today);
  const totals = new Map();
  recentSessions.forEach(session => {
    const label = session.activityTitle || 'Sesión libre';
    totals.set(label, (totals.get(label) || 0) + Math.max(0, Number(session.durationSeconds) || 0));
  });
  const ranked = Array.from(totals.entries()).sort((left, right) => right[1] - left[1]).slice(0, 5);
  if (!ranked.length) distribution.append(empty('Aún no hay distribución', 'Cuando registres sesiones de enfoque, podrás ver cómo repartes tu tiempo.'));
  else {
    const totalSeconds = ranked.reduce((sum, item) => sum + item[1], 0);
    ranked.forEach(([label, seconds]) => {
      const line = element('div', 'chart-line');
      line.append(element('span', '', label));
      const track = element('div', 'chart-track');
      const fill = element('div', 'chart-fill');
      fill.style.width = (totalSeconds ? seconds / totalSeconds * 100 : 0) + '%';
      track.append(fill);
      line.append(track, element('strong', '', Math.round(seconds / 60) + 'm'));
      distribution.append(line);
    });
  }
  insightGrid.append(distribution);
  main.append(insightGrid);

  const overview = card('note-card');
  overview.append(element('strong', '', 'Panorama de tu organización'));
  const dueText = pendingDueSoon ? 'Tienes ' + pendingDueSoon + ' tarea(s) pendiente(s) con fecha límite en los próximos siete días.' : 'No hay tareas pendientes con fecha límite en los próximos siete días.';
  overview.append(element('p', 'muted', dueText));
  overview.append(element('p', 'muted', activeGoals.length + ' objetivo(s) activo(s). Puedes ajustar tus planes cuando cambien tus prioridades.'));
  overview.append(element('p', 'small-note', 'Las estadísticas son información, no una calificación. Descansar y dejar espacio libre también forma parte de una buena organización.'));
  main.append(overview);
}
function renderProfiles(main) {
  const profiles = state.snapshot.profiles || [];
  if (!state.selectedProfileId || !profiles.some(profile => profile.id === state.selectedProfileId)) {
    state.selectedProfileId = state.profile.id;
  }
  const selected = profiles.find(profile => profile.id === state.selectedProfileId) || state.profile;
  const header = element('div', 'profiles-page-heading');
  const headingCopy = element('div', 'section-heading');
  const profileTitle=element('div','profiles-heading-title');
  const profileTitleIcon=iconImage('actions/profiles.png','','profiles-heading-icon');
  profileTitle.append(profileTitleIcon,element('h1','','Perfiles'));
  headingCopy.append(profileTitle, element('p', 'muted', 'Administra tus espacios y mantén cada organización independiente.'));
  const headerActions=element('div','profiles-header-actions');
  const importButton=button('Importar perfil','import-profile','button secondary');
  const createButton = button('+ Crear perfil', 'new-profile', 'button primary');
  createButton.disabled = profiles.length >= 50;importButton.disabled=profiles.length>=50;
  headerActions.append(importButton,createButton);
  header.append(headingCopy, headerActions);
  const importInput=input('profileImportFile','','file');importInput.id='profile-import-file';importInput.accept='application/json,.json';importInput.hidden=true;
  main.append(importInput);
  const count = element('p', 'profiles-count', profiles.length + ' de 50 perfiles utilizados');
  const countTrack = element('div', 'profiles-count-track');
  const countFill = element('span', 'profiles-count-fill');
  countFill.style.width = Math.min(100, profiles.length / 50 * 100) + '%';
  countTrack.append(countFill);
  const countWrap = element('div', 'profiles-count-wrap');
  countWrap.append(count, countTrack);
  main.append(header, countWrap);

  const layout = element('div', 'profiles-layout');
  const listPanel = card('profiles-list-panel');
  listPanel.append(element('div', 'profiles-panel-heading', 'Tus espacios'));
  const list = element('div', 'profiles-list');
  profiles.forEach(profile => {
    const isActive = profile.id === state.profile.id;
    const isSelected = profile.id === selected.id;
    const item = button('', 'select-profile-admin', 'profile-admin-item' + (isSelected ? ' selected' : ''), { id: profile.id });
    item.setAttribute('aria-pressed', String(isSelected));
    const avatar = element('span', 'profile-admin-avatar');
    avatar.style.backgroundColor = profile.color || '#27856b';
    if (isImageAvatar(profile.avatarId)) avatar.append(makeAvatarImage(profile.avatarId));
    else avatar.textContent = avatarMark(profile);
    const copy = element('span', 'profile-admin-copy');
    copy.append(element('strong', '', profile.name), element('small', '', isActive ? 'En uso' : 'Perfil independiente'));
    item.append(avatar, copy);
    if (isActive) item.append(element('span', 'profile-current-dot'));
    list.append(item);
  });
  listPanel.append(list);
  if (profiles.length < 50) listPanel.append(button('+ Crear otro perfil', 'new-profile', 'text-button profile-list-create'));
  else listPanel.append(element('p', 'small-note', 'Has alcanzado el límite de 50 perfiles.'));
  const detail = card('profile-detail-panel');
  const avatar = element('div', 'profile-detail-avatar');
  avatar.style.backgroundColor = selected.color || '#27856b';
  if (isImageAvatar(selected.avatarId)) avatar.append(makeAvatarImage(selected.avatarId));
  else avatar.textContent = avatarMark(selected);
  const identity = element('div', 'profile-detail-identity');
  identity.append(avatar, element('div', 'profile-detail-name'));
  const nameBlock = identity.lastChild;
  nameBlock.append(element('h2', '', selected.name), element('p', 'muted', selected.id === state.profile.id ? 'Este es el espacio que estás utilizando' : 'Este espacio no está activo'));
  const identityTop = element('div', 'profile-detail-top');
  identityTop.append(identity);
  if (selected.id !== state.profile.id) identityTop.append(button('Usar este perfil', 'switch-profile', 'button primary', { id: selected.id }));
  else identityTop.append(element('span', 'profile-active-label', 'Perfil actual'));
  detail.append(identityTop);
  const created = selected.createdAt && Number.isFinite(Date.parse(selected.createdAt)) ? new Date(selected.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No disponible';
  const updated = selected.updatedAt && Number.isFinite(Date.parse(selected.updatedAt)) ? new Date(selected.updatedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No disponible';
  const dates = element('div', 'profile-dates');
  dates.append(element('span', '', 'Creado ' + created), element('span', '', 'Actualizado ' + updated));
  detail.append(dates);
  const stats = [
    ['Pendientes', selected.tasks.filter(task => task.status === 'pending').length],
    ['Completadas', selected.tasks.filter(task => task.status === 'done').length],
    ['Actividades', selected.activities.filter(activity => !activity.archived).length],
    ['Objetivos', selected.goals.filter(goal => !goal.archived).length],
    ['Sesiones Focus', selected.focusSessions.length]
  ];
  const statsGrid = element('div', 'profile-stats-grid');
  stats.forEach(([label, value]) => {
    const stat = element('div', 'profile-stat');
    stat.append(element('strong', '', value), element('span', '', label));
    statsGrid.append(stat);
  });
  detail.append(element('h3', 'profile-section-title', 'Resumen del espacio'), statsGrid);
  const preferences = selected.preferences || {};
  const preferenceGrid = element('div', 'profile-preference-grid');
  [
    ['Apariencia', ({light:'Claro',dark:'Oscuro',system:'Automático'}[preferences.appearanceMode]||'Claro') + ' · ' + Appearance.findPalette(preferences.appearancePalette).name],
    ['Enfoque', (preferences.focusMinutes || 25) + ' min'],
    ['Descanso', (preferences.breakMinutes || 5) + ' min'],
    ['Planificación', ({manual:'Manual',suggested:'Sugerido',hybrid:'Híbrido',automatic:'Automático'}[preferences.autonomy] || 'Sugerido')]
  ].forEach(([label,value]) => {
    const cell=element('div','profile-preference');
    cell.append(element('span','muted',label),element('strong','',value));
    preferenceGrid.append(cell);
  });
  detail.append(element('h3','profile-section-title','Preferencias principales'),preferenceGrid);
  const actions = element('div', 'profile-management-actions');
  actions.append(actionIconButton('Editar perfil', 'edit-profile', 'edit.png', 'button secondary', { id: selected.id }));
  actions.append(actionIconButton('Duplicar configuración', 'duplicate-profile', 'duplicate.png', 'button secondary', { id: selected.id }));
  actions.append(actionIconButton('Exportar perfil', 'export-profile', 'export.png', 'button secondary', { id: selected.id }));
  const deleteButton = button('Eliminar perfil', 'delete-profile', 'text-button danger', { id: selected.id });
  deleteButton.disabled = profiles.length <= 1;
  actions.append(deleteButton);
  detail.append(element('h3','profile-section-title','Administrar'),actions);
  if (selected.activeFocus) detail.append(element('p','profile-focus-note','Este perfil conserva una sesión Focus ' + (selected.activeFocus.pausedAt ? 'en pausa.' : 'en curso.') + ' La sesión no se elimina al cambiar de perfil.'));
  layout.append(listPanel, detail);
  main.append(layout);
}

function openDuplicateProfileModal(source) {
  const overlay=element('div','profile-modal-backdrop');overlay.dataset.profileModal='true';
  const dialog=element('section','profile-modal');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','duplicate-profile-title');
  const form=element('form','form-card profile-modal-form');form.dataset.form='profile-duplicate';form.dataset.sourceId=source.id;
  const title=element('h2','','Duplicar configuración');title.id='duplicate-profile-title';
  form.append(title,element('p','muted','Se copiarán la apariencia y las preferencias. Las tareas, actividades, objetivos y el historial no se copiarán.'));
  form.append(field('Nombre del nuevo perfil',input('name','Nombre del perfil', 'text',source.name+' (copia)')));
  const actions=element('div','form-actions profile-wizard-actions');
  actions.append(button('Cancelar','close-profile-modal','button secondary'),button('Crear copia','submit-form','button primary'));
  form.append(actions);dialog.append(form);overlay.append(dialog);root.append(overlay);
  $('input[name="name"]',form).focus();$('input[name="name"]',form).select();
}

function openProfileEditor(profile) {
  if (!profile) return;
  const overlay=element('div','profile-modal-backdrop');
  overlay.dataset.profileModal='true';
  const dialog=element('section','profile-modal');
  dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','edit-profile-title');
  const form=element('form','form-card profile-modal-form');
  form.dataset.form='profile-edit';form.dataset.profileId=profile.id;
  const title=element('h2','','Editar perfil');title.id='edit-profile-title';
  form.append(title,element('p','muted','Los cambios se aplicarán únicamente a este espacio. Sus tareas e historial se conservarán.'));
  form.append(field('Nombre del perfil',input('name','Nombre', 'text',profile.name)));
  const age=input('age','Edad (opcional)','number',profile.age==null?'':profile.age);age.min='1';age.max='120';age.step='1';
  form.append(field('Edad (opcional)',age),element('p','small-note','No se guarda fecha de nacimiento.'));
  form.append(element('span','field-label','Avatar'));
  buildAvatarPicker(form,profile.avatarId || 'profile-1');
  form.append(field('Color del avatar',input('color','','color',profile.color)));
  form.append(element('p','small-note','Los colores y el modo oscuro se configuran desde Ajustes → Apariencia.'));
  const preferences=element('details','profile-advanced-preferences');
  const preferencesSummary=element('summary','','Preferencias de planificación y Focus');
  preferences.append(preferencesSummary);
  const preferenceGrid=element('div','profile-editor-preference-grid');
  preferenceGrid.append(field('Autonomía del planificador',select('autonomy',[
    {value:'manual',label:'Manual'},{value:'suggested',label:'Sugerido'},{value:'hybrid',label:'Híbrido'},{value:'automatic',label:'Automático'}
  ],profile.preferences.autonomy || 'suggested')));
  preferenceGrid.append(field('Minutos de enfoque',input('focusMinutes','25','number',profile.preferences.focusMinutes || 25)));
  preferenceGrid.append(field('Minutos de descanso',input('breakMinutes','5','number',profile.preferences.breakMinutes || 5)));
  preferenceGrid.append(field('Inicio habitual',input('workingDayStart','','time',profile.preferences.workingDayStart || '09:00')));
  preferenceGrid.append(field('Fin habitual',input('workingDayEnd','','time',profile.preferences.workingDayEnd || '17:00')));
  preferenceGrid.append(field('Inicio de semana',select('weekStartsOn',[
    {value:'1',label:'Lunes'},{value:'0',label:'Domingo'}
  ],String(profile.preferences.weekStartsOn ?? 1))));
  preferenceGrid.append(field('Música de Focus',select('focusMusicTrack',[
    {value:'',label:'Sin música'},...FOCUS_MUSIC_CATALOG.map(track=>({value:track.id,label:track.name}))
  ],profile.preferences.focusMusicTrack || '')));
  preferenceGrid.append(field('Volumen de música (%)',input('focusMusicVolume','35','number',profile.preferences.focusMusicVolume ?? 35)));
  preferenceGrid.append(field('Alarma al terminar Focus',select('focusEndAlarmEnabled',[
    {value:'true',label:'Activada'},{value:'false',label:'Desactivada'}
  ],String(profile.preferences.focusEndAlarmEnabled !== false))));
  preferenceGrid.append(field('Sonido de alarma',select('focusEndTone',FOCUS_ALARM_CATALOG.map(sound=>({value:sound.id,label:sound.name})),profile.preferences.focusEndTone || 'clock')));
  preferenceGrid.append(field('Volumen de alarma (%)',input('focusAlarmVolume','70','number',profile.preferences.focusAlarmVolume ?? 70)));
  preferenceGrid.append(field('Repeticiones de alarma',select('focusAlarmRepeats',Array.from({length:10},(_,i)=>({value:String(i+1),label:(i+1)+(i?' veces':' vez')})),String(profile.preferences.focusAlarmRepeats || 3))));
  preferenceGrid.append(field('Intervalo entre repeticiones',select('focusAlarmIntervalSeconds',Array.from({length:15},(_,i)=>({value:String(i+1),label:(i+1)+' segundos'})),String(profile.preferences.focusAlarmIntervalSeconds || 2))));
  preferenceGrid.append(field('Duración máxima de alarma',select('focusAlarmMaxSeconds',[5,10,15,20,30,45,60,90,120].map(value=>({value:String(value),label:value+' segundos'})),String(profile.preferences.focusAlarmMaxSeconds || 30))));
  preferenceGrid.append(field('Notificaciones de Focus',select('focusNotifications',[
    {value:'true',label:'Activadas'},{value:'false',label:'Desactivadas'}
  ],String(profile.preferences.focusNotifications !== false))));
  preferenceGrid.append(field('Movimiento de interfaz',select('motionEnabled',[
    {value:'true',label:'Activado'},{value:'false',label:'Reducido'}
  ],String(profile.preferences.motionEnabled !== false))));
  preferences.append(preferenceGrid,element('p','small-note','Estos cambios pertenecen únicamente a este perfil. Las sesiones que ya estén en curso no se modifican.'));
  form.append(preferences);
  const previewRow=element('div','profile-avatar-preview-row');
  const preview=element('div','profile-avatar profile-avatar-preview','');preview.setAttribute('aria-hidden','true');
  previewRow.append(preview,element('span','muted','Vista previa del perfil'));form.append(previewRow);
  const actions=element('div','form-actions profile-wizard-actions');
  actions.append(button('Cancelar','close-profile-modal','button secondary'),actionIconButton('Guardar cambios','submit-form','save.png','button primary'));
  form.append(actions);dialog.append(form);overlay.append(dialog);root.append(overlay);
  updateProfilePreview(form);$('input[name="name"]',form).focus();
}

function renderSettings(main) {
  const sections = [
    ['profile','Mi perfil','Identidad y avatar'],
    ['appearance','Apariencia','Temas claros, oscuros y colores'],
    ['planning','Planificación','Horario y autonomía'],
    ['notifications','Notificaciones','Recordatorios y segundo plano'],
    ['focus','Focus y sonido','Sesiones, música y alarmas'],
    ['data','Datos y copias','Importar, exportar y recuperar'],
    ['shortcuts','Atajos y ayuda','Navegación rápida'],
    ['profiles','Perfiles','Administrar espacios']
  ];
  if (!sections.some(item => item[0] === state.settingsSection)) state.settingsSection = 'profile';
  const layout = element('div', 'settings-layout');
  const navigation = element('nav', 'settings-navigation');
  navigation.setAttribute('aria-label', 'Categorías de ajustes');
  navigation.append(element('span','eyebrow','PREFERENCIAS'));
  sections.forEach(([id,label,description]) => {
    const item=button('', 'settings-section', 'settings-nav-item'+(state.settingsSection===id?' active':''), {section:id});
    item.append(element('strong','',label),element('small','',description));
    if(state.settingsSection===id)item.setAttribute('aria-current','page');
    navigation.append(item);
  });
  const panel=element('section','settings-panel');
  const active=sections.find(item=>item[0]===state.settingsSection);
  panel.append(heading(active[1],active[2],state.settingsSection==='profiles'?'actions/profiles.png':({profile:'interface/settings.png',planning:'navigation/dashboard.png',notifications:'notifications/task-reminder.png',focus:'focus/timer.png',data:'actions/export.png',shortcuts:'interface/search.png'}[state.settingsSection]||'interface/settings.png')));
  if(state.settingsSection==='profile'){
    const form=element('form','form-card settings-form');
    form.dataset.form='profile-settings';
    form.append(field('Nombre',input('name','Nombre del perfil','text',state.profile.name)));
    const age=input('age','Edad en años','number',state.profile.age==null?'':state.profile.age);age.min='1';age.max='120';age.step='1';
    form.append(field('Edad (opcional)',age),element('p','small-note','La edad adapta algunas sugerencias. No se guarda fecha de nacimiento.'));
    form.append(field('Color del avatar',input('color','','color',state.profile.color)));
    form.append(element('span','field-label','Avatar'));
    buildAvatarPicker(form,state.profile.avatarId||'profile-1');
    const previewRow=element('div','profile-avatar-preview-row');
    const preview=element('div','profile-avatar profile-avatar-preview','');preview.setAttribute('aria-hidden','true');
    previewRow.append(preview,element('span','muted','Vista previa del perfil'));form.append(previewRow);updateProfilePreview(form);
    form.append(button('Personalizar toda la interfaz','open-appearance','button secondary'));
    form.append(field('Movimiento de la interfaz',select('motionEnabled',[
      {value:'true',label:'Activado — transiciones sutiles'},
      {value:'false',label:'Reducido — menos movimiento'}
    ],String(state.profile.preferences.motionEnabled!==false))));
    form.append(element('p','small-note','Para cambiar los temas claros, oscuros y las paletas, abre Apariencia.'));
    form.append(actionIconButton('Guardar cambios','submit-form','save.png','button primary'));
    panel.append(form);
  } else if(state.settingsSection==='appearance'){
    renderAppearanceSettings(panel);
  } else if(state.settingsSection==='planning'){
    const form=element('form','form-card settings-form');form.dataset.form='profile-planning-settings';
    form.append(field('Autonomía del planificador',select('autonomy',[
      {value:'manual',label:'Manual — yo organizo todo'},
      {value:'suggested',label:'Sugerido — O-Isym propone'},
      {value:'hybrid',label:'Híbrido — aplica reglas permitidas'},
      {value:'automatic',label:'Automático — organiza tareas flexibles'}
    ],state.profile.preferences.autonomy)));
    form.append(element('p','small-note','El modo define cuánto interviene el planificador. Las propuestas deben poder revisarse antes de aplicarlas.'));
    const durations=element('div','form-grid');
    durations.append(field('Minutos de enfoque',input('focusMinutes','25','number',state.profile.preferences.focusMinutes)));
    durations.append(field('Minutos de descanso',input('breakMinutes','5','number',state.profile.preferences.breakMinutes)));
    form.append(durations);
    const hours=element('div','form-grid');
    hours.append(field('Inicio habitual',input('workingDayStart','','time',state.profile.preferences.workingDayStart||'09:00')));
    hours.append(field('Fin habitual',input('workingDayEnd','','time',state.profile.preferences.workingDayEnd||'17:00')));
    form.append(hours,actionIconButton('Guardar planificación','submit-form','save.png','button primary'));
    panel.append(form);
  } else if(state.settingsSection==='notifications'){
    const form=element('form','form-card settings-form notification-settings-form');
    form.dataset.form='profile-task-notifications';
    const preferences=state.profile.preferences;
    form.append(element('h3','','Recordatorios de tareas'));
    form.append(element('p','muted','O-Isym revisa tu agenda en segundo plano y muestra una notificación nativa de macOS cuando llega el momento de una tarea.'));
    form.append(field('Notificaciones de tareas',select('taskNotificationsEnabled',[
      {value:'true',label:'Activadas'}, {value:'false',label:'Desactivadas'}
    ],String(preferences.taskNotificationsEnabled!==false))));
    form.append(field('Qué tareas deben avisar',select('taskNotificationScope',[
      {value:'all',label:'Todas las tareas programadas'},
      {value:'activity',label:'Solo tareas vinculadas a una actividad'},
      {value:'high',label:'Solo tareas de prioridad alta'}
    ],preferences.taskNotificationScope||'all')));
    form.append(field('Cuándo avisar',select('taskNotificationLeadMinutes',[
      {value:'0',label:'A la hora exacta'}, {value:'5',label:'5 minutos antes'},
      {value:'10',label:'10 minutos antes'}, {value:'15',label:'15 minutos antes'},
      {value:'30',label:'30 minutos antes'}, {value:'60',label:'1 hora antes'}
    ],String(preferences.taskNotificationLeadMinutes??0))));
    form.append(field('Sonido de la notificación',select('taskNotificationSound',[
      {value:'true',label:'Activado'}, {value:'false',label:'Silenciosa'}
    ],String(preferences.taskNotificationSound!==false))));
    form.append(field('Si el aviso vence mientras el Mac está suspendido',select('taskNotificationMissed',[
      {value:'notify',label:'Avisarme al volver (hasta 12 horas después)'},
      {value:'skip',label:'Omitir los avisos que ya pasaron'}
    ],preferences.taskNotificationMissed||'notify')));
    form.append(field('Al iniciar sesión en el Mac',select('launchAtLogin',[
      {value:'false',label:'No abrir O-Isym automáticamente'},
      {value:'true',label:'Abrir O-Isym en segundo plano al iniciar sesión'}
    ],String(preferences.launchAtLogin===true))));
    form.append(element('p','small-note','Al cerrar la ventana, O-Isym permanece en la barra de menús junto a los iconos del sistema. Usa el menú de O-Isym para volver a abrirlo o salir por completo.'));
    const actions=element('div','form-actions');
    actions.append(button('Enviar notificación de prueba','test-task-notification','button secondary'));
    actions.append(actionIconButton('Guardar preferencias','submit-form','save.png','button primary'));
    form.append(actions);
    const status=element('p','notification-system-status small-note','Comprobando disponibilidad de notificaciones…');
    status.dataset.notificationStatus='true';
    const info=card('settings-info-card notification-system-card');
    info.append(element('h3','','Notificaciones del sistema'),status,element('p','muted',(window.oisym?.platform==='android'?'Activa los permisos desde Más → Android · permisos. Android puede retrasar las alarmas si no autorizas avisos exactos.':'macOS puede ocultar o silenciar avisos si O-Isym no tiene permiso en Ajustes del Sistema → Notificaciones. El botón de prueba permite comprobarlo.')));
    panel.append(form,info);
    window.oisym?.notifications?.getStatus?.().then(result=>{
      const target=$('[data-notification-status]',panel);
      if(target)target.textContent=window.oisym?.platform==='android'?('Notificaciones: '+result.permission+'. Alarmas exactas: '+(result.exactAlarms?'activadas':'sin permiso')+'. Puedes configurarlas en Más → Android · permisos.'):(result.supported?'Notificaciones nativas disponibles. ':'Este sistema no informa compatibilidad con notificaciones nativas. ')+(result.canManageLogin?'Inicio automático: '+(result.launchAtLogin?'activado.':'desactivado.'):'El inicio automático no está disponible en este sistema.')+' Si no aparecen avisos, revisa los permisos de O-Isym en macOS.';
    }).catch(()=>{const target=$('[data-notification-status]',panel);if(target)target.textContent='No se pudo consultar el estado de las notificaciones.';});
  } else if(state.settingsSection==='focus'){
    const info=card('settings-info-card');
    info.append(element('p','','Las opciones de sesión, música, vista previa, alarma y notificaciones siguen centralizadas en Enfoque para evitar controles duplicados o preferencias desincronizadas.'));
    info.append(button('Abrir Enfoque','navigate','button primary',{view:'focus'}));
    panel.append(info);
  } else if(state.settingsSection==='data'){
    const dataCard=card('settings-info-card');
    dataCard.append(element('h3','','Copia completa de O-Isym'),element('p','muted','Incluye todos los perfiles y sus datos. Importar una copia completa reemplaza el estado actual; O-Isym conserva una copia de seguridad antes de hacerlo.'));
    dataCard.append(actionIconButton('Exportar copia JSON','export-data','export.png','button secondary'));
    const importLabel=field('Archivo de copia JSON',input('backupFile','','file'));
    importLabel.querySelector('input').accept='application/json,.json';importLabel.querySelector('input').id='backup-file';
    dataCard.append(importLabel,button('Importar archivo seleccionado','import-data','button secondary'));
    panel.append(dataCard);
    const migration=card('settings-info-card');
    migration.append(heading('Datos del prototipo anterior','El almacenamiento antiguo no se borra.'));
    const legacy=inspectLegacyData();migration.append(element('p','muted',legacy.summary));
    if(!state.profile.legacyImportedAt&&legacy.total>0){
      migration.append(element('p','small-note','La importación crea tareas y actividades en este perfil. Los datos originales se conservan.'));
      migration.append(button('Importar datos del prototipo','import-legacy','button secondary'));
    }else if(state.profile.legacyImportedAt){
      migration.append(element('p','small-note','Este perfil ya importó datos el '+new Date(state.profile.legacyImportedAt).toLocaleString('es-MX')+'.'));
    }
    panel.append(migration);
  } else if(state.settingsSection==='shortcuts'){
    const shortcuts=card('settings-info-card');
    shortcuts.append(heading('Atajos de teclado','Navega sin tener que usar siempre el ratón.'));
    [['N','Nueva tarea'],['T','Ir a Hoy'],['← / →','Día anterior o siguiente en Calendario y Planificador'],['[ / ]','Semana o mes anterior/siguiente'],['?','Mostrar ayuda rápida']].forEach(([key,label])=>{
      const row=element('div','shortcut-row');row.append(element('kbd','',key),element('span','',label));shortcuts.append(row);
    });
    panel.append(shortcuts);
  } else if(state.settingsSection==='profiles'){
    const profiles=card('settings-info-card');
    profiles.append(element('p','muted','Cada espacio conserva sus propias tareas, objetivos, sesiones y preferencias.'));
    profiles.append(button('Administrar perfiles','navigate','button primary',{view:'profiles'}));
    panel.append(profiles);
  }
  layout.append(navigation,panel);
  main.append(heading('Ajustes','Configura O-Isym por categorías, sin recorrer una página interminable.'),layout);
}

function inspectLegacyData() {
  let activities = 0;
  let dates = 0;
  let colors = false;
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (key && key.startsWith('acts_')) {
      dates++;
      try { activities += JSON.parse(localStorage.getItem(key) || '[]').length; } catch {}
    }
    if (key === 'oisym_colors') colors = true;
  }
  return { activities, dates, colors, total: activities + (colors ? 1 : 0), summary: activities + ' registros de agenda en ' + dates + ' días' + (colors ? ' y una paleta personalizada.' : '.') };
}

async function handleSubmit(form) {
  const data = formData(form);
  const originalProfile=normalizeProfile(JSON.parse(JSON.stringify(state.profile)));
  const restoreProfile=()=>{state.profile=originalProfile;state.snapshot.profiles=state.snapshot.profiles.map(item=>item.id===originalProfile.id?originalProfile:item);state.snapshot.activeProfileId=originalProfile.id;};
  try {
    if (form.dataset.form === 'profile-create') {
      if (state.snapshot.profiles.length >= 50) throw new Error('Has alcanzado el máximo de perfiles.');
      if (!String(data.name || '').trim()) throw new Error('Escribe un nombre para el perfil.');
      const previousProfileId = state.profile.id;
      const ageText=String(data.age||'').trim();if(ageText&&(!Number.isInteger(Number(ageText))||Number(ageText)<1||Number(ageText)>120))throw new Error('La edad debe estar entre 1 y 120 años.');
      const age=ageText?Number(ageText):null;
      const profile=createProfile(data.name,'#27856b',age);profile.avatarId=isImageAvatar(data.avatarId)?data.avatarId:'profile-1';
      profile.preferences.theme=['classic','warm','sky','playful'].includes(data.theme)?data.theme:getDefaultThemeForAge(age);
      profile.color=/^#[0-9a-f]{6}$/i.test(data.color)?data.color:'#27856b';
      // Honor choices made in the profile wizard in the new appearance engine.
      profile.preferences.appearancePalette=appearanceDefaults(profile).appearancePalette;
      profile.preferences.appearancePalettes={light:profile.preferences.appearancePalette,dark:profile.preferences.appearancePalette};
      profile.preferences.appearanceColors.accent=profile.color.toLowerCase()==='#27856b' ? '' : profile.color.toLowerCase();
      profile.preferences.appearanceColorsByMode={
        light:{...profile.preferences.appearanceColors},dark:{...profile.preferences.appearanceColors}
      };
      state.snapshot.profiles.push(profile);
      focusAudioController.stopAll();
      stopFocusTicker();
      window.oisym?.focusAlarms?.cancel().catch(() => {});
      state.profile = profile;
      const saved = await save();
      if (!saved) {
        state.snapshot.profiles = state.snapshot.profiles.filter(item => item.id !== profile.id);
        state.profile = state.snapshot.profiles.find(item => item.id === previousProfileId) || state.snapshot.profiles[0];
        state.snapshot.activeProfileId = state.profile.id;
        syncLaunchAtLogin();
        if(state.profile.activeFocus&&!state.profile.activeFocus.pausedAt)startFocusTicker();
        syncFocusNotificationSchedule();startFocusMusic();
        throw new Error('No se pudo guardar el perfil.');
      }
      state.view = 'today';
      syncLaunchAtLogin();
      syncFocusNotificationSchedule();
      const modal = $('[data-profile-modal]');
      if (modal) modal.remove();
      showToast('Perfil creado.');
    } else if (form.dataset.form === 'profile-duplicate') {
      const source=state.snapshot.profiles.find(item=>item.id===form.dataset.sourceId);
      const name=String(data.name||'').trim();
      if(!source)throw new Error('El perfil original ya no existe.');
      if(!name)throw new Error('Escribe un nombre para el perfil.');
      if(name.length>60)throw new Error('El nombre admite hasta 60 caracteres.');
      if(state.snapshot.profiles.length>=50)throw new Error('Has alcanzado el máximo de 50 perfiles.');
      const copy=createProfile(name,source.color,source.age);
      copy.avatarId=source.avatarId;
      copy.preferences={...copy.preferences,...source.preferences};
      copy.tasks=[];copy.activities=[];copy.goals=[];copy.focusSessions=[];copy.activeFocus=null;copy.legacyImportedAt=null;
      const next={...state.snapshot,profiles:[...state.snapshot.profiles,copy],updatedAt:new Date().toISOString()};
      state.snapshot=await window.oisym.storage.save(next);
      state.selectedProfileId=copy.id;
      const modal=$('[data-profile-modal]');if(modal)modal.remove();
      showToast('Configuración duplicada. El nuevo perfil empieza sin contenido ni historial.');
    } else if (form.dataset.form === 'profile-edit') {
      const profileId = form.dataset.profileId;
      const current = state.snapshot.profiles.find(item => item.id === profileId);
      if (!current) throw new Error('El perfil que intentas editar ya no existe.');
      const name = String(data.name || '').trim();
      if (!name) throw new Error('Escribe un nombre para el perfil.');
      if (name.length > 60) throw new Error('El nombre admite hasta 60 caracteres.');
      const ageText = String(data.age || '').trim();
      if (ageText && (!Number.isInteger(Number(ageText)) || Number(ageText) < 1 || Number(ageText) > 120)) throw new Error('La edad debe estar entre 1 y 120 años.');
      const workStart=String(data.workingDayStart||'');
      const workEnd=String(data.workingDayEnd||'');
      if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(workStart)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(workEnd)||workEnd<=workStart)throw new Error('El horario habitual debe terminar después de comenzar.');
      const nextProfile = normalizeProfile({
        ...current,
        name,
        age: ageText ? Number(ageText) : null,
        color: /^#[0-9a-f]{6}$/i.test(data.color || '') ? data.color : current.color,
        avatarId: isImageAvatar(data.avatarId) ? data.avatarId : current.avatarId,
        preferences: {
          ...current.preferences,
          autonomy: ['manual','suggested','hybrid','automatic'].includes(data.autonomy) ? data.autonomy : current.preferences.autonomy,
          focusMinutes: data.focusMinutes,
          breakMinutes: data.breakMinutes,
          workingDayStart: workStart,
          workingDayEnd: workEnd,
          weekStartsOn: data.weekStartsOn === '0' ? 0 : 1,
          focusMusicTrack: musicTrackById(data.focusMusicTrack) ? data.focusMusicTrack : '',
          focusMusicVolume: data.focusMusicVolume,
          focusEndAlarmEnabled: data.focusEndAlarmEnabled === 'true',
          focusEndTone: alarmSoundById(data.focusEndTone) ? data.focusEndTone : current.preferences.focusEndTone,
          focusAlarmVolume: data.focusAlarmVolume,
          focusAlarmRepeats: data.focusAlarmRepeats,
          focusAlarmIntervalSeconds: data.focusAlarmIntervalSeconds,
          focusAlarmMaxSeconds: data.focusAlarmMaxSeconds,
          focusNotifications: data.focusNotifications === 'true',
          motionEnabled: data.motionEnabled === 'true'
        },
        updatedAt: new Date().toISOString()
      });
      const nextSnapshot = {
        ...state.snapshot,
        profiles: state.snapshot.profiles.map(item => item.id === profileId ? nextProfile : item),
        updatedAt: new Date().toISOString()
      };
      const savedSnapshot = await window.oisym.storage.save(nextSnapshot);
      state.snapshot = savedSnapshot;
      if (state.profile.id === profileId) state.profile = savedSnapshot.profiles.find(item => item.id === profileId);
      state.selectedProfileId = profileId;
      const modal = $('[data-profile-modal]');
      if (modal) modal.remove();
      showToast('Perfil actualizado.');
    } else if (form.dataset.form === 'task' || form.dataset.form === 'planner-task' || form.dataset.form === 'task-edit') {
      data.locked = data.locked === 'true';
      data.reminderEnabled = data.reminderEnabled !== 'false';
      if (data.startTime || data.endTime) {
        if (!data.startTime || !data.endTime || data.endTime <= data.startTime) throw new Error('Si asignas un horario, la hora de fin debe ser posterior al inicio.');
      }
      if (form.dataset.form === 'planner-task') {
        data.scheduledDate = state.selectedDate;
        if (!data.startTime || !data.endTime || data.endTime <= data.startTime) throw new Error('El horario debe tener una hora de fin posterior al inicio.');
        data.estimatedMinutes = (Number(data.endTime.slice(0, 2)) * 60 + Number(data.endTime.slice(3))) - (Number(data.startTime.slice(0, 2)) * 60 + Number(data.startTime.slice(3)));
      }
      const editingId = state.editingTaskId;
      const mutation = form.dataset.form === 'task-edit'
        ? { type: 'edit', id: editingId, data }
        : { type: 'create', data };
      const original = editingId ? taskById(editingId) : null;
      if (original?.locked && form.dataset.form === 'task-edit' &&
          ['scheduledDate', 'startTime', 'endTime'].some(key => data[key] !== original[key])) {
        if (!confirm('Este bloque está protegido. ¿Confirmas que quieres modificar su horario?')) return;
        mutation.allowLocked = true;
      }
      const candidate = taskMutation(state.profile, mutation);
      const affected = form.dataset.form === 'task-edit' ? candidate.tasks.find(task => task.id === editingId) : candidate.tasks[0];
      if (affected?.scheduledDate && affected.startTime && affected.endTime) {
        const collisions = detectScheduleConflicts(candidate, affected.scheduledDate)
          .filter(item => item.firstId === affected.id || item.secondId === affected.id);
        if (collisions.length && !confirm('El horario se superpone con ' + collisions.length + ' bloque(s). ¿Guardar de todos modos?')) return;
      }
      state.profile.tasks = candidate.tasks;
      const saved=await save();
      if(!saved){restoreProfile();state.showTaskForm=form.dataset.form!=='planner-task';state.editingTaskId=editingId;return;}
      state.editingTaskId=null;state.showTaskForm=false;state.taskFormDefaults={};state.plannerAnalysis=null;
      showToast(form.dataset.form==='task-edit'?'Cambios guardados.':'Tarea guardada.');
      state.view = form.dataset.form === 'planner-task' ? 'planner' : state.view;
    } else if (form.dataset.form === 'day-template-create') {
      if ((state.profile.dayTemplates || []).length >= 100) throw new Error('Máximo de 100 plantillas por perfil.');
      const activity = activityById(data.activityId);
      const entryTitle = String(data.title || '').trim() || activity?.name || '';
      const weekdays = Array.from(form.querySelectorAll('input[name="weekday"]:checked'), item => Number(item.value));
      const template = createDayTemplate({
        name: data.name, weekdays, startDate: data.startDate, endDate: data.endDate,
        entries: [{ title: entryTitle, startTime: data.startTime, endTime: data.endTime,
          activityId: activity?.id || null }]
      });
      state.profile.dayTemplates = [...(state.profile.dayTemplates || []), template];
      if (!await save()) { restoreProfile(); return; }
      state.selectedTemplateId = template.id;
      state.templatePreview = null;
      showToast('Plantilla guardada. No se han creado tareas hasta que la apliques.');
    } else if (form.dataset.form === 'day-template-edit') {
      const template = (state.profile.dayTemplates || []).find(item => item.id === data.templateId);
      if (!template) throw new Error('La plantilla ya no existe.');
      const weekdays = Array.from(form.querySelectorAll('input[name="weekday"]:checked'), item => Number(item.value));
      const validated = createDayTemplate({ name: data.name, weekdays,
        startDate: data.startDate, endDate: data.endDate, entries: template.entries });
      state.profile.dayTemplates = state.profile.dayTemplates.map(item => item.id === template.id
        ? { ...item, name: validated.name, recurrence: {
            ...validated.recurrence, exceptions: [...(item.recurrence.exceptions || [])] }
          } : item);
      if (!await save()) { restoreProfile(); return; }
      state.editingTemplateId = null; state.templatePreview = null;
      showToast('Regla de la plantilla actualizada. Las tareas creadas se conservan.');
    } else if (form.dataset.form === 'day-template-entry') {
      const template = (state.profile.dayTemplates || []).find(item => item.id === data.templateId);
      if (!template) throw new Error('Selecciona una plantilla existente.');
      if (template.entries.length >= 30) throw new Error('Máximo de 30 bloques por plantilla.');
      const draft = createDayTemplate({
        name: 'Bloque temporal', weekdays: [0, 1, 2, 3, 4, 5, 6],
        entries: [{ title: data.title, startTime: data.startTime, endTime: data.endTime }]
      }).entries[0];
      state.profile.dayTemplates = state.profile.dayTemplates.map(item => item.id === template.id
        ? { ...item, entries: [...item.entries, draft] } : item);
      if (!await save()) { restoreProfile(); return; }
      state.templatePreview = null;
      showToast('Bloque añadido a la plantilla.');
    } else if (form.dataset.form === 'activity-edit') {
      const editingId=state.editingActivityId;
      const current = activityById(editingId);
      if (!current) throw new Error('La actividad que intentas editar ya no existe.');
      state.profile.activities = state.profile.activities.map(item => item.id === current.id ? updateActivity(item, data) : item);
      const saved=await save();
      if(!saved){restoreProfile();state.editingActivityId=editingId;state.showActivityForm=true;return;}
      state.editingActivityId=null;state.showActivityForm=false;
      showToast('Actividad actualizada.');
    } else if (form.dataset.form === 'activity') {
      state.profile.activities.unshift(createActivity(data));
      const saved=await save();
      if(!saved){restoreProfile();state.showActivityForm=true;return;}
      state.showActivityForm=false;
      showToast('Actividad creada.');
    } else if (form.dataset.form === 'goal-edit') {
      const editingId=state.editingGoalId;
      const current = goalById(editingId);
      if (!current) throw new Error('El objetivo que intentas editar ya no existe.');
      state.profile.goals = state.profile.goals.map(item => item.id === current.id ? updateGoal(item, data) : item);
      const saved=await save();
      if(!saved){restoreProfile();state.editingGoalId=editingId;state.showGoalForm=true;return;}
      state.editingGoalId=null;state.showGoalForm=false;
      showToast('Objetivo actualizado.');
    } else if (form.dataset.form === 'goal') {
      state.profile.goals.unshift(createGoal(data));
      const saved=await save();
      if(!saved){restoreProfile();state.showGoalForm=true;return;}
      state.showGoalForm=false;
      showToast('Objetivo creado.');
    } else if (form.dataset.form === 'profile-settings') {
      const name=String(data.name||'').trim();
      if(!name)throw new Error('Escribe un nombre para el perfil.');
      const ageValue=String(data.age||'').trim();
      if(ageValue&&(!Number.isInteger(Number(ageValue))||Number(ageValue)<1||Number(ageValue)>120))throw new Error('La edad debe estar entre 1 y 120 años.');
      const beforeSave=normalizeProfile(JSON.parse(JSON.stringify(state.profile)));
      state.profile.name=name.slice(0,60);
      state.profile.age=ageValue?Number(ageValue):null;
      state.profile.preferences.ageBand=getAgeBand(state.profile.age);
      state.profile.color=/^#[0-9a-f]{6}$/i.test(data.color||'')?data.color:state.profile.color;
      state.profile.avatarId=isImageAvatar(data.avatarId)?data.avatarId:state.profile.avatarId;
      state.profile.preferences.motionEnabled=data.motionEnabled!=='false';
      const saved=await save();
      if(!saved){state.profile=beforeSave;state.snapshot.profiles=state.snapshot.profiles.map(item=>item.id===beforeSave.id?beforeSave:item);state.snapshot.activeProfileId=beforeSave.id;updateShell();return;}
      showToast('Perfil actualizado.');
    } else if (form.dataset.form === 'profile-appearance-settings') {
      // Backwards-compatible keyboard submit; autosave already handles normal edits.
      applyAppearanceSelection(form);
      await flushAppearanceChanges();
    } else if (form.dataset.form === 'profile-task-notifications') {
      const beforeSave=normalizeProfile(JSON.parse(JSON.stringify(state.profile)));
      state.profile.preferences.taskNotificationsEnabled=data.taskNotificationsEnabled==='true';
      state.profile.preferences.taskNotificationScope=['all','activity','high'].includes(data.taskNotificationScope)?data.taskNotificationScope:'all';
      state.profile.preferences.taskNotificationLeadMinutes=[0,5,10,15,30,60].includes(Number(data.taskNotificationLeadMinutes))?Number(data.taskNotificationLeadMinutes):0;
      state.profile.preferences.taskNotificationSound=data.taskNotificationSound==='true';
      state.profile.preferences.taskNotificationMissed=data.taskNotificationMissed==='skip'?'skip':'notify';
      state.profile.preferences.launchAtLogin=data.launchAtLogin==='true';
      const saved=await save();
      if(!saved){state.profile=beforeSave;state.snapshot.profiles=state.snapshot.profiles.map(item=>item.id===beforeSave.id?beforeSave:item);state.snapshot.activeProfileId=beforeSave.id;updateShell();return;}
      const loginUpdated=await window.oisym?.notifications?.setLaunchAtLogin?.(state.profile.preferences.launchAtLogin);
      showToast(loginUpdated===false?'Preferencias guardadas, pero macOS no confirmó el inicio automático.':'Preferencias de notificaciones guardadas.');
    } else if (form.dataset.form === 'profile-planning-settings') {
      const start=data.workingDayStart,end=data.workingDayEnd;
      if(!start||!end||end<=start)throw new Error('El horario habitual debe terminar después de comenzar.');
      if(!['manual','suggested','hybrid','automatic'].includes(data.autonomy))throw new Error('Selecciona un modo de planificación válido.');
      const beforeSave=normalizeProfile(JSON.parse(JSON.stringify(state.profile)));
      state.profile.preferences.autonomy=data.autonomy;
      state.profile.preferences.focusMinutes=clampNumber(data.focusMinutes,5,180,25);
      state.profile.preferences.breakMinutes=clampNumber(data.breakMinutes,1,60,5);
      state.profile.preferences.workingDayStart=start;
      state.profile.preferences.workingDayEnd=end;
      const saved=await save();
      if(!saved){state.profile=beforeSave;state.snapshot.profiles=state.snapshot.profiles.map(item=>item.id===beforeSave.id?beforeSave:item);state.snapshot.activeProfileId=beforeSave.id;updateShell();return;}
      showToast('Planificación guardada.');
    }
    updateShell();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

const focusAudioController=window.OIsymFocusAudio.createFocusAudioController({onChange:()=>updateFocusAudioStopControl(),onError:kind=>showToast(kind==='alarm'?'No se pudo reproducir la alarma.':'No se pudo reproducir el audio.','error')});
function updateFocusAudioStopControl(){
 const alarmPlaying=focusAudioController.isAlarmPlaying(),previewPlaying=focusAudioController.isPreviewPlaying();let el=document.getElementById('focus-audio-stop-control');
 if(alarmPlaying||previewPlaying){if(!el){el=element('div','focus-audio-stop-control');el.id='focus-audio-stop-control';document.body.append(el);}el.replaceChildren();
  if(alarmPlaying){el.append(element('span','','La alarma está sonando'));const stop=button('Detener alarma','stop-focus-alarm','button secondary small');stop.addEventListener('click',stopFocusAlarmPlayback);el.append(stop);}
  if(previewPlaying){el.append(element('span','','Vista previa musical'));const stop=button('Detener música','stop-focus-music-preview','button secondary small');stop.addEventListener('click',stopFocusMusicPreview);el.append(stop);}
 }else if(el)el.remove();
 const ms=$('#focus-music-preview-stop');if(ms)ms.disabled=!previewPlaying;
 const mp=$('#focus-music-preview');if(mp)mp.textContent=previewPlaying?'Reproduciendo vista previa…':'Escuchar vista previa';
 const as=$('#focus-alarm-stop');if(as)as.disabled=!alarmPlaying;
}
function stopFocusAlarmPlayback(){focusAudioController.stopAlarm();}
function playFocusAlarm(preview=false){
 const prefs=state.profile.preferences;if(!preview&&prefs.focusEndAlarmEnabled===false)return false;
 const sound=alarmSoundById(prefs.focusEndTone||'clock');if(!sound)return false;
 if(preview)stopFocusMusicPreview();
 return focusAudioController.playAlarm('assets/audio/alarms/'+sound.file,{volume:Math.max(0,Math.min(100,Number(prefs.focusAlarmVolume??70)))/100,plays:Number(prefs.focusAlarmRepeats)||3,intervalSeconds:Number(prefs.focusAlarmIntervalSeconds)||2,maxSeconds:Number(prefs.focusAlarmMaxSeconds)||30});
}
function stopFocusMusic(){focusAudioController.stopMusic();}
function stopFocusMusicPreview(){focusAudioController.stopPreview();}
function startFocusMusic(){
 const focus=state.profile?.activeFocus,track=musicTrackById(state.profile?.preferences?.focusMusicTrack);
 if(!focus||focus.pausedAt||!track){stopFocusMusic();return;}
 focusAudioController.startMusic('assets/audio/music/'+track.id+'.mp3',Math.max(0,Math.min(100,Number(state.profile.preferences.focusMusicVolume??35)))/100);
}
function previewFocusMusic(){
 const track=musicTrackById($('#focus-music-track')?.value||state.profile.preferences.focusMusicTrack||'');
 if(!track)return showToast('Selecciona una pista para escucharla.','error');
 stopFocusAlarmPlayback();
 focusAudioController.previewMusic('assets/audio/music/'+track.id+'.mp3',Math.max(0,Math.min(100,Number(state.profile.preferences.focusMusicVolume??35)))/100,20000);
}
function notifyFocusFinished(taskTitle,isBreak=false){if(window.oisym?.platform==='android'){void window.oisym.focusAlarms.complete().catch(()=>{});return;}if(!isBreak){stopFocusMusic();playFocusAlarm(false);}if(!window.oisym.focusAlarms&&state.profile.preferences.focusNotifications!==false&&'Notification'in window&&Notification.permission==='granted'){try{new Notification(isBreak?'Descanso terminado':'Focus terminado',{body:isBreak?'Tu descanso terminó. Puedes volver a concentrarte.':(taskTitle?'Terminaste tu sesión de '+taskTitle+'.':'Terminaste tu sesión de concentración.'),silent:true});}catch(error){}}}
function updateFocusDurationSuggestion() {
  const taskId = $('#focus-task')?.value || null;
  const activityId = $('#focus-activity')?.value || null;
  const duration = $('#focus-duration');
  if (duration) duration.value = getSuggestedFocusMinutes(state.profile, taskId, activityId);
  const activity = activityById(activityId);
  const hint = $('.focus-hint');
  if (hint) hint.textContent = activity ? 'Duración sugerida de «' + activity.name + '»: ' + activity.durationMinutes + ' min. Puedes ajustarla solo para esta sesión.' : 'Se usa tu duración habitual como sugerencia. Puedes cambiarla sin modificar tus preferencias.';
}
function isFocusSaveBlocked(profile = state.profile) {
  const focus = profile?.activeFocus;
  return Boolean(focus && state.focusSaveFailures.get(profile.id) === (focus.sessionStartedAt || focus.startedAt));
}
function syncFocusNotificationSchedule(){const focus=state.profile?.activeFocus,alarms=window.oisym?.focusAlarms;if(!alarms)return;if(!focus||focus.pausedAt||isFocusSaveBlocked()){alarms.cancel().catch(()=>{});return;}const endAt=Date.parse(focus.startedAt)+(focus.durationSeconds-(Number(focus.elapsedBeforePause)||0))*1000;alarms.schedule({endsAt:new Date(Math.max(Date.now(),endAt)).toISOString(),isBreak:focus.isBreak===true,taskTitle:taskById(focus.taskId)?.title||focus.activityTitle||'',notificationsEnabled:state.profile.preferences.focusNotifications!==false,soundEnabled:false}).catch(()=>{});}
function refreshFocusClock() {
  const focus = state.profile?.activeFocus;
  if (!focus || focus.pausedAt) return;
  const remaining = getFocusRemainingSeconds(focus);
  const display = $('#focus-clock');
  if (display) display.textContent = String(Math.floor(remaining / 60)).padStart(2, '0') + ':' + String(remaining % 60).padStart(2, '0');
  if (remaining <= 0 && !isFocusSaveBlocked()) void finishFocus({ completed: true });
}
function startFocusTicker() {
  stopFocusTicker();
  if (isFocusSaveBlocked()) return;
  refreshFocusClock();
  if (!state.profile.activeFocus || state.profile.activeFocus.pausedAt || state.focusFinishing || isFocusSaveBlocked()) return;
  state.focusTick = setInterval(refreshFocusClock, 500);
}
function stopFocusTicker() {
  if (state.focusTick) clearInterval(state.focusTick);
  state.focusTick = null;
}
async function finishFocus(options = {}) {
  const focus = state.profile?.activeFocus;
  if (!focus || state.focusFinishing) return;
  const profileId = state.profile.id;
  state.focusFinishing = true;
  const now = new Date().toISOString();
  const task = taskById(focus.taskId);
  const session = focus.isBreak ? null : createFocusSession(focus, task ? task.title : '', now);
  if (session) state.profile.focusSessions.push(session);
  state.profile.activeFocus = null;
  stopFocusTicker();
  if(options.completed && window.oisym?.platform==='android'){
    void window.oisym.focusAlarms.complete().catch(()=>{});
    focusAudioController.stopMusic();focusAudioController.stopPreview();
  }else focusAudioController.stopAll();
  if (!options.completed) window.oisym?.focusAlarms?.cancel().catch(() => {});
  const saved = await save();
  state.focusFinishing = false;
  if (!saved) {
    // Restore only this session, preserving edits and profile switches made during the write.
    const profile = state.profile?.id === profileId ? state.profile : state.snapshot.profiles.find(item => item.id === profileId);
    if (profile) {
      if (session) profile.focusSessions = profile.focusSessions.filter(item => item.id !== session.id);
      profile.activeFocus = focus;
      if (getFocusRemainingSeconds(focus) <= 0) state.focusSaveFailures.set(profileId, focus.sessionStartedAt || focus.startedAt);
    }
    if (state.profile?.id === profileId) {
      if (!isFocusSaveBlocked() && !focus.pausedAt) startFocusTicker();
      syncFocusNotificationSchedule();
      if (!isFocusSaveBlocked()) startFocusMusic();
    }
    updateShell();
    if (!options.silent) showToast('No se pudo guardar el final de Focus. Conservamos la sesión para que puedas reintentar.', 'error');
    return false;
  }
  state.focusSaveFailures.delete(profileId);
  if (options.completed && !options.silent && state.profile?.id === profileId) notifyFocusFinished(task ? task.title : '', Boolean(focus.isBreak));
  if (!options.silent) showToast(saved ? (options.completed ? (focus.isBreak ? 'Descanso terminado. Cuando quieras, puedes volver a concentrarte.' : '¡Tiempo completado! Tu sesión quedó guardada. Es buen momento para descansar.') : (focus.isBreak ? 'Descanso finalizado.' : 'Sesión guardada.')) : 'La sesión terminó, pero no se pudo guardar. Revisa el almacenamiento.', saved ? 'success' : 'error');
  updateShell();
  return true;
}

root.addEventListener('click', async event => {
  if (event.target.matches('[data-profile-modal]')) { if(event.target.dataset.dirty==='true'&&!confirm('Hay cambios sin guardar. ¿Cerrar sin guardarlos?'))return; const focusId=event.target.dataset.returnFocus;if(focusId==='task-create-button'){state.showTaskForm=false;state.editingTaskId=null;}if(focusId==='activity-create-button'){state.showActivityForm=false;state.editingActivityId=null;}if(focusId==='goal-create-button'){state.showGoalForm=false;state.editingGoalId=null;}event.target.remove();if(focusId)document.getElementById(focusId)?.focus();else $('.profile-add')?.focus();return; }
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (state.focusFinishing && ['focus-start', 'focus-break', 'focus-toggle', 'focus-stop', 'focus-reset', 'focus-retry-save'].includes(action)) return;
  const id = target.dataset.id;
  if (/^ideas-(note|activity)-(create|duplicate|delete|color)$/.test(action) && state.ideaViewportSaveTimer && !await flushIdeaChanges()) return;
  if (action === 'retry-boot') { await boot(); return; }
  if (action === 'recovery-overwrite') {
    if (!confirm('O-Isym guardará una copia exacta del archivo actual y después creará un espacio nuevo vacío. ¿Quieres continuar?')) return;
    try {
      const result = await window.oisym.storage.recovery.overwrite();
      await initializeApp(await window.oisym.storage.read());
      showToast(result.backupName ? 'Copia de emergencia guardada. O-Isym está listo.' : 'O-Isym está listo con un espacio nuevo.');
    } catch (recoveryError) {
      await showRecoveryScreen(recoveryError);
    }
    return;
  }
  if (action === 'recovery-restore') {
    const backupName = $('#recovery-backup-select')?.value;
    if (!backupName) return showToast('Selecciona una copia válida.', 'error');
    if (!confirm('O-Isym conservará primero el archivo actual y después restaurará la copia seleccionada. ¿Continuar?')) return;
    try {
      await window.oisym.storage.recovery.restore(backupName);
      await initializeApp(await window.oisym.storage.read());
      showToast('Copia de seguridad restaurada correctamente.');
    } catch (recoveryError) {
      await showRecoveryScreen(recoveryError);
    }
    return;
  }
  if (action === 'navigate') { if (!await flushAppearanceChanges()) return; if (state.ideaViewportSaveTimer || state.ideaSaveFailed) { clearTimeout(state.ideaViewportSaveTimer); state.ideaViewportSaveTimer = null; if (!await save()) return; } const openModal=$('[data-profile-modal]');if(openModal?.dataset.dirty==='true'&&!confirm('Hay cambios sin guardar. ¿Cerrar sin guardarlos?'))return;if(openModal){if(openModal.dataset.returnFocus==='task-create-button'){state.showTaskForm=false;state.editingTaskId=null;}if(openModal.dataset.returnFocus==='activity-create-button'){state.showActivityForm=false;state.editingActivityId=null;}if(openModal.dataset.returnFocus==='goal-create-button'){state.showGoalForm=false;state.editingGoalId=null;}openModal.remove();}state.view = target.dataset.view; updateShell(); }
  if (action === 'ideas-activity-create') {
    const board = state.profile.ideaBoards.find(item => item.id === state.selectedIdeaBoardId);
    if (!board) return showToast('No se encontró el pizarrón.', 'error');
    if (board.nodes.length >= window.OIsymDomain.IDEA_BOARD_LIMITS.nodes) return showToast('Has alcanzado el máximo de elementos del pizarrón.', 'error');
    const zoom = Number(board.viewport?.zoom) || 1;
    const node = createIdeaNode('activity', {
      x: Math.round(-(Number(board.viewport?.x) || 0) / zoom - 145),
      y: Math.round(-(Number(board.viewport?.y) || 0) / zoom - 115)
    });
    board.nodes.push(node);
    board.modifiedAt = new Date().toISOString();
    if (!await save()) { board.nodes = board.nodes.filter(item => item.id !== node.id); return; }
    updateShell();
    showToast('Actividad añadida al pizarrón.');
    return;
  }
  if (action === 'ideas-activity-color') {
    const board = state.profile.ideaBoards.find(item => item.id === state.selectedIdeaBoardId);
    const node = board?.nodes.find(item => item.id === id && item.type === 'activity');
    if (!node) return;
    try {
      const updated = updateIdeaNode(node, { color: target.dataset.color });
      board.nodes = board.nodes.map(item => item.id === id ? updated : item);
      if (!await save()) return;
      updateShell();
    } catch (error) { showToast(error.message, 'error'); }
    return;
  }
  if (action === 'ideas-activity-duplicate') {
    const board = state.profile.ideaBoards.find(item => item.id === state.selectedIdeaBoardId);
    const source = board?.nodes.find(item => item.id === id && item.type === 'activity');
    if (!source) return;
    if (board.nodes.length >= window.OIsymDomain.IDEA_BOARD_LIMITS.nodes) return showToast('Has alcanzado el máximo de elementos del pizarrón.', 'error');
    const copy = createIdeaNode('activity', { ...source, x: source.x + 32, y: source.y + 32, title: source.title + ' (copia)' });
    board.nodes.push(copy);
    if (!await save()) { board.nodes = board.nodes.filter(item => item.id !== copy.id); return; }
    updateShell();
    showToast('Actividad duplicada.');
    return;
  }
  if (action === 'ideas-activity-delete') {
    const board = state.profile.ideaBoards.find(item => item.id === state.selectedIdeaBoardId);
    const activity = board?.nodes.find(item => item.id === id && item.type === 'activity');
    if (!activity) return;
    if (!confirm('¿Eliminar esta actividad del pizarrón?')) return;
    const previous = board.nodes;
    const previousConnections = board.connections;
    board.nodes = board.nodes.filter(item => item.id !== id).map(item => item.type === 'group' ? { ...item, childrenIds: item.childrenIds.filter(childId => childId !== id) } : item).filter(item => item.type !== 'group' || item.childrenIds.length);
    board.connections = board.connections.filter(connection => board.nodes.some(n => n.id === connection.from) && board.nodes.some(n => n.id === connection.to));
    if (!await save()) { board.nodes = previous; board.connections = previousConnections; return; }
    updateShell();
    showToast('Actividad eliminada junto con sus conexiones.');
    return;
  }
  if (action === 'ideas-note-create') {
    const board = state.profile.ideaBoards.find(item => item.id === state.selectedIdeaBoardId);
    if (!board) return showToast('No se encontró el pizarrón.', 'error');
    const zoom = Number(board.viewport?.zoom) || 1;
    const node = createIdeaNode('note', {
      x: Math.round(-(Number(board.viewport?.x) || 0) / zoom - 130),
      y: Math.round(-(Number(board.viewport?.y) || 0) / zoom - 95)
    });
    if (board.nodes.length >= window.OIsymDomain.IDEA_BOARD_LIMITS.nodes) return showToast('Has alcanzado el máximo de elementos del pizarrón.', 'error');
    board.nodes.push(node);
    board.modifiedAt = new Date().toISOString();
    if (!await save()) { board.nodes = board.nodes.filter(item => item.id !== node.id); return; }
    updateShell();
    showToast('Nota creada.');
    return;
  }
  if (action === 'ideas-note-color') {
    const board = state.profile.ideaBoards.find(item => item.id === state.selectedIdeaBoardId);
    const node = board?.nodes.find(item => item.id === id && item.type === 'note');
    if (!node) return;
    const previous = node.color;
    try {
      const updated = updateIdeaNode(node, { color: target.dataset.color });
      board.nodes = board.nodes.map(item => item.id === id ? updated : item);
      board.modifiedAt = new Date().toISOString();
      if (!await save()) { board.nodes = board.nodes.map(item => item.id === id ? { ...updated, color: previous } : item); return; }
      updateShell();
    } catch (error) { showToast(error.message, 'error'); }
    return;
  }
  if (action === 'ideas-note-duplicate') {
    const board = state.profile.ideaBoards.find(item => item.id === state.selectedIdeaBoardId);
    const source = board?.nodes.find(item => item.id === id && item.type === 'note');
    if (!source) return;
    if (board.nodes.length >= window.OIsymDomain.IDEA_BOARD_LIMITS.nodes) return showToast('Has alcanzado el máximo de elementos del pizarrón.', 'error');
    const copy = createIdeaNode('note', { ...source, x: source.x + 32, y: source.y + 32, title: source.title + ' (copia)' });
    board.nodes.push(copy);
    board.modifiedAt = new Date().toISOString();
    if (!await save()) { board.nodes = board.nodes.filter(item => item.id !== copy.id); return; }
    updateShell();
    showToast('Nota duplicada.');
    return;
  }
  if (action === 'ideas-note-delete') {
    const board = state.profile.ideaBoards.find(item => item.id === state.selectedIdeaBoardId);
    const note = board?.nodes.find(item => item.id === id && item.type === 'note');
    if (!note) return;
    if (!confirm('¿Eliminar esta nota? Puedes recuperarla con Deshacer.')) return;
    const previous = board.nodes;
    const previousConnections = board.connections;
    board.nodes = board.nodes.filter(item => item.id !== id).map(item => item.type === 'group' ? { ...item, childrenIds: item.childrenIds.filter(childId => childId !== id) } : item).filter(item => item.type !== 'group' || item.childrenIds.length);
    board.connections = board.connections.filter(connection => board.nodes.some(n => n.id === connection.from) && board.nodes.some(n => n.id === connection.to));
    board.modifiedAt = new Date().toISOString();
    if (!await save()) { board.nodes = previous; board.connections = previousConnections; return; }
    updateShell();
    showToast('Nota eliminada junto con sus conexiones.');
    return;
  }
  if (action === 'ideas-library') {
    if (state.ideaViewportSaveTimer || state.ideaSaveFailed) { clearTimeout(state.ideaViewportSaveTimer); state.ideaViewportSaveTimer = null; if (!await save()) return; }
    state.plannerSection = 'library'; state.selectedIdeaBoardId = null; updateShell(); return;
  }
  if (action === 'ideas-open') { state.selectedIdeaBoardId = id; state.plannerSection = 'board'; updateShell(); return; }
  if (action === 'ideas-create') {
    const title = await requestText('Nombre del nuevo pizarrón:');
    if (title === null) return;
    try {
      const previous = cloneActiveProfile();
      state.profile.ideaBoards = normalizeIdeaBoards([...state.profile.ideaBoards, createIdeaBoard({ title })]);
      if (!await save()) { restoreActiveProfile(previous); updateShell(); return; }
      state.plannerSection = 'board';
      state.selectedIdeaBoardId = state.profile.ideaBoards[state.profile.ideaBoards.length - 1].id;
      updateShell();
      showToast('Pizarrón creado.');
    } catch (error) { showToast(error.message, 'error'); }
    return;
  }
  if (action === 'ideas-import-trigger') { $('#ideas-import-file')?.click(); return; }
  if (action === 'ideas-edit') {
    const board = state.profile.ideaBoards.find(item => item.id === id);
    if (!board) return showToast('No se encontró el pizarrón.', 'error');
    const title = await requestText('Nombre del pizarrón:', board.title);
    if (title === null) return;
    if (!title.trim()) return showToast('El nombre no puede quedar vacío.', 'error');
    const description = await requestText('Descripción (opcional, máximo 500 caracteres):', board.description || '');
    if (description === null) return;
    if (description.length > 500) return showToast('La descripción admite hasta 500 caracteres.', 'error');
    const previous = cloneActiveProfile();
    board.title = title.trim().slice(0, 100);
    board.description = description.trim();
    board.modifiedAt = new Date().toISOString();
    try {
      state.profile.ideaBoards = normalizeIdeaBoards(state.profile.ideaBoards);
      if (!await save()) { restoreActiveProfile(previous); updateShell(); return; }
      updateShell(); showToast('Pizarrón actualizado.');
    } catch (error) { restoreActiveProfile(previous); updateShell(); showToast(error.message, 'error'); }
    return;
  }
  if (action === 'ideas-export') {
    const board = state.profile.ideaBoards.find(item => item.id === id);
    if (!board) return showToast('No se encontró el pizarrón.', 'error');
    try {
      const payload = createIdeaBoardExport(board);
      if(window.oisym?.files){await window.oisym.files.export('oisym-pizarron.oisym',JSON.stringify(payload,null,2));return;}
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = element('a');
      const safeName = String(board.title).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-_]+/gi,'-').replace(/^-|-$/g,'').toLowerCase() || 'pizarron';
      anchor.href = url;
      anchor.download = 'oisym-' + safeName + '.oisym';
      document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Pizarrón exportado.');
    } catch (error) { showToast('No se pudo exportar el pizarrón: ' + error.message, 'error'); }
    return;
  }
  if (action === 'ideas-rename') {
    const board = state.profile.ideaBoards.find(item => item.id === id);
    if (!board) return showToast('No se encontró el pizarrón.', 'error');
    const title = await requestText('Nuevo nombre del pizarrón:', board.title);
    if (title === null) return;
    if (!title.trim()) return showToast('El nombre no puede quedar vacío.', 'error');
    const previous = cloneActiveProfile();
    board.title = title.trim().slice(0, 100);
    board.modifiedAt = new Date().toISOString();
    if (!await save()) { restoreActiveProfile(previous); updateShell(); return; }
    updateShell(); showToast('Nombre actualizado.'); return;
  }
  if (action === 'ideas-duplicate') {
    const source = state.profile.ideaBoards.find(item => item.id === id);
    if (!source) return showToast('No se encontró el pizarrón.', 'error');
    if (state.profile.ideaBoards.length >= 100) return showToast('Has alcanzado el máximo de pizarrones.', 'error');
    const title = await requestText('Nombre de la copia:', source.title + ' (copia)');
    if (title === null) return;
    try {
      const previous = cloneActiveProfile();
      const copy = JSON.parse(JSON.stringify(source));
      const idMap = new Map(copy.nodes.map(node => [node.id, window.OIsymDomain.makeId('idea')]));
      copy.id = window.OIsymDomain.makeId('board');
      copy.title = title.trim().slice(0, 100);
      if (!copy.title) throw new Error('Escribe un nombre para la copia.');
      copy.createdAt = copy.modifiedAt = new Date().toISOString();
      copy.nodes = copy.nodes.map(node => ({ ...node, id: idMap.get(node.id), ...(node.type === 'group' ? { childrenIds: node.childrenIds.map(childId => idMap.get(childId)) } : {}) }));
      copy.connections = copy.connections.map(edge => ({ ...edge, id: window.OIsymDomain.makeId('connection'), from: idMap.get(edge.from), to: idMap.get(edge.to) }));
      state.profile.ideaBoards = normalizeIdeaBoards([...state.profile.ideaBoards, copy]);
      if (!await save()) { restoreActiveProfile(previous); updateShell(); return; }
      updateShell(); showToast('Pizarrón duplicado.'); 
    } catch (error) { showToast(error.message, 'error'); }
    return;
  }
  if (action === 'ideas-delete') {
    const board = state.profile.ideaBoards.find(item => item.id === id);
    if (!board) return showToast('No se encontró el pizarrón.', 'error');
    if (!confirm('¿Eliminar el pizarrón «' + board.title + '»? Esta acción no se puede deshacer.')) return;
    const previous = cloneActiveProfile();
    state.profile.ideaBoards = state.profile.ideaBoards.filter(item => item.id !== id);
    if (!await save()) { restoreActiveProfile(previous); updateShell(); return; }
    if (state.selectedIdeaBoardId === id) { state.selectedIdeaBoardId = null; state.plannerSection = 'library'; }
    updateShell(); showToast('Pizarrón eliminado.'); return;
  }
  if (action === 'new-task') { state.editingTaskId=null;state.taskFormDefaults={};state.showTaskForm=true;updateShell();return; }
  if (action === 'toggle-sidebar') { state.sidebarCollapsed = !state.sidebarCollapsed; updateShell(); $('#toggle-sidebar')?.focus(); return; }
  if (action === 'topbar-today' || action === 'topbar-calendar') {
    state.selectedDate = localDate(); state.calendarDate = new Date();
    state.view = action === 'topbar-today' ? 'today' : 'calendar';
    if (state.view === 'calendar') state.calendarMode = 'day';
    state.plannerAnalysis = null; state.templatePreview = null; updateShell();
    $('#main-content')?.focus(); return;
  }
  if (action === 'plan-task') {
    if (!taskById(id)) return showToast('La tarea ya no existe.', 'error');
    state.editingTaskId = id; state.showTaskForm = true;
    state.taskEditorFocusField = 'scheduledDate'; updateShell(); return;
  }
  if (action === 'new-activity') { state.view='activities';state.editingActivityId=null;state.showActivityForm=true;updateShell();return; }
  if (action === 'new-goal') { state.view='goals';state.editingGoalId=null;state.showGoalForm=true;updateShell();return; }
  if (action === 'close-goal-form') { state.showGoalForm=false;state.editingGoalId=null;updateShell();$('#goal-create-button')?.focus();return; }
  if (action === 'close-activity-form') { state.showActivityForm=false;state.editingActivityId=null;updateShell();$('#activity-create-button')?.focus();return; }
  if (action === 'close-task-form') { closeTaskEditor(); return; }
  if (action === 'settings-section') {
    if (!await flushAppearanceChanges()) return;
    state.settingsSection = target.dataset.section; updateShell(); return;
  }
  if (action === 'open-appearance') { state.view='settings'; state.settingsSection='appearance'; updateShell(); return; }
  if (action === 'appearance-edit-scheme') {
    const form=target.closest('form[data-form="profile-appearance-settings"]');
    if (!form) return;
    refreshAppearanceEditor(form,target.dataset.scheme);
    return;
  }
  if (action === 'appearance-palette') {
    const form=target.closest('form[data-form="profile-appearance-settings"]');
    if (!form) return;
    form.querySelector('[name="appearancePalette"]').value=target.dataset.palette;
    applyAppearanceSelection(form);
    return;
  }
  if (action === 'appearance-reset') {
    const form=target.closest('form[data-form="profile-appearance-settings"]');
    if (!form) return;
    const defaults=appearanceDefaults(state.profile);
    const editScheme=form.querySelector('[name="appearanceEditScheme"]').value;
    form.querySelector('[name="appearancePalette"]').value=defaults.appearancePalettes[editScheme];
    appearanceColorFields.forEach(([key]) => {
      form.querySelector('[name="custom-'+key+'"]').checked=false;
    });
    form.querySelector('[name="appearanceIconTone"]').value='automatic';
    form.querySelector('[name="appearanceIconBackgroundCustom"]').checked=false;
    applyAppearanceSelection(form);
    return;
  }
  if (action === 'dismiss-launch-at-login') {
    try { localStorage.setItem('oisym-mac-launch-prompt-dismissed', 'true'); } catch {}
    $('[data-launch-prompt]')?.remove();
    return;
  }
  if (action === 'enable-launch-at-login') {
    const previous = state.profile.preferences.launchAtLogin === true;
    try {
      const enabled = await window.oisym?.notifications?.setLaunchAtLogin?.(true);
      if (!enabled) throw new Error('macOS no confirmó el inicio automático.');
      state.profile.preferences.launchAtLogin = true;
      const saved = await save();
      if (!saved) {
        state.profile.preferences.launchAtLogin = previous;
        await window.oisym?.notifications?.setLaunchAtLogin?.(previous);
        return;
      }
      syncLaunchAtLogin();
      $('[data-launch-prompt]')?.remove();
      showToast('O-Isym se abrirá en segundo plano al iniciar sesión.');
    } catch (error) {
      state.profile.preferences.launchAtLogin = previous;
      showToast('No se pudo añadir O-Isym al inicio: ' + error.message, 'error');
    }
    return;
  }
  if (action === 'test-task-notification') {
    const sent=await window.oisym?.notifications?.sendTest?.();
    showToast(sent?'Notificación de prueba enviada. Si no aparece, revisa los permisos de macOS.':'No se pudo enviar la notificación de prueba.',''+(sent?'success':'error'));
    return;
  }
  if (action === 'select-profile-admin') { state.selectedProfileId = id; updateShell(); return; }
  if (action === 'edit-profile') { openProfileEditor(state.snapshot.profiles.find(item => item.id === id)); return; }
  if (action === 'import-profile') { $('#profile-import-file')?.click(); return; }
  if (action === 'duplicate-profile') {
    const source = state.snapshot.profiles.find(item => item.id === id);
    if (!source) return showToast('No se encontró el perfil.', 'error');
    if (state.snapshot.profiles.length >= 50) return showToast('Has alcanzado el máximo de 50 perfiles.', 'error');
    openDuplicateProfileModal(source);
    return;
  }
  if (action === 'export-profile') {
    const profile = state.snapshot.profiles.find(item => item.id === id);
    if (!profile) return showToast('No se encontró el perfil.', 'error');
    const payload = { format: 'oisym-profile', version: 1, exportedAt: new Date().toISOString(), profile };
    if(window.oisym?.files){await window.oisym.files.export('oisym-perfil.json',JSON.stringify(payload,null,2));return;}
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = element('a');
    anchor.href = url;
    anchor.download = 'oisym-perfil-' + String(profile.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-_]+/gi,'-').replace(/^-|-$/g,'').toLowerCase() + '-' + localDate() + '.json';
    document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    showToast('Perfil exportado.');
    return;
  }
  if (action === 'cancel-new-profile' || action === 'close-profile-modal') { const modal = $('[data-profile-modal]'); if (modal && modal.dataset.dirty === 'true' && !confirm('Hay cambios sin guardar. ¿Cerrar sin guardarlos?')) return; const focusId=modal?.dataset.returnFocus;if(focusId==='activity-create-button'){state.showActivityForm=false;state.editingActivityId=null;}if(focusId==='goal-create-button'){state.showGoalForm=false;state.editingGoalId=null;}if(modal)modal.remove();if(focusId)document.getElementById(focusId)?.focus();else $('.profile-add')?.focus();return; }
  if(action==='choose-profile-avatar'){const form=target.closest('form'),hidden=$('input[name="avatarId"]',form);if(form&&hidden){hidden.value=target.dataset.avatar;updateProfilePreview(form);}return;}
  if(action==='profile-wizard-next'||action==='profile-wizard-back'){const form=target.closest('form'),current=Number($('[data-profile-step]:not([hidden])',form)?.dataset.profileStep||1);if(action==='profile-wizard-next'&&current===1){const name=$('input[name="name"]',form),age=$('input[name="age"]',form);if(!name.value.trim()){name.focus();return showToast('Escribe un nombre para el perfil.','error');}if(age.value&&!age.checkValidity()){age.focus();return showToast('La edad debe estar entre 1 y 120 años.','error');}const theme=$('select[name="theme"]',form);if(theme&&age.value)theme.value=getDefaultThemeForAge(Number(age.value));}const next=action==='profile-wizard-next'?Math.min(3,current+1):Math.max(1,current-1);$$('[data-profile-step]',form).forEach(step=>step.hidden=Number(step.dataset.profileStep)!==next);$('[data-action="profile-wizard-back"]',form).hidden=next===1;$('[data-action="profile-wizard-next"]',form).hidden=next===3;$('[data-action="submit-form"]',form).hidden=next!==3;if(next===3)updateProfilePreview(form);return;}
  if(action==='use-activity-idea'){const form=target.closest('form');if(form){form.closest('[data-profile-modal]')?.setAttribute('data-dirty','true');$('input[name="name"]',form).value=target.dataset.name||'';$('input[name="category"]',form).value=target.dataset.category||'';$('textarea[name="description"]',form).value=target.dataset.description||'';$('input[name="durationMinutes"]',form).value=target.dataset.minutes||'20';$('input[name="name"]',form).focus();}return;}
  if (action === 'new-profile') {
    if(state.snapshot.profiles.length>=50)return showToast('Has alcanzado el máximo de perfiles.','error');
    const overlay=element('div','profile-modal-backdrop');overlay.dataset.profileModal='true';
    const dialog=element('section','profile-modal');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','new-profile-title');
    const form=element('form','form-card profile-modal-form');form.dataset.form='profile-create';
    const title=element('h2','','Vamos a crear tu espacio');title.id='new-profile-title';form.append(title,element('p','muted','Primero te conoceremos un poquito y después podrás personalizarlo.'));
    const one=element('div','profile-wizard-step');one.dataset.profileStep='1';one.append(element('h3','','1. ¿Cómo te llamas?'),field('Nombre del perfil',input('name','Escribe un nombre','text','')));
    const age=input('age','Tu edad','number','');age.min='1';age.max='120';age.step='1';one.append(field('Edad (opcional)',age),element('p','small-note','Si la indicas, adaptaremos algunas sugerencias y el estilo inicial. No pedimos tu fecha de nacimiento.'));
    const two=element('div','profile-wizard-step');two.dataset.profileStep='2';two.hidden=true;two.append(element('h3','','2. ¡Elige tu foto!'),element('p','muted','Puedes cambiarla cuando quieras desde los ajustes del perfil.'));buildAvatarPicker(two,'profile-1');
    const three=element('div','profile-wizard-step');three.dataset.profileStep='3';three.hidden=true;three.append(element('h3','','3. Dale tu estilo'));
    three.append(field('Estilo visual',select('theme',[{value:'playful',label:'Colorido — alegre y dinámico'},{value:'sky',label:'Cielo — azul y tranquilo'},{value:'warm',label:'Cálido — tonos suaves'},{value:'classic',label:'Clásico — limpio y equilibrado'}],'playful')),field('Color de acento',input('color','','color','#27856b')));
    const previewRow=element('div','profile-avatar-preview-row'),preview=element('div','profile-avatar profile-avatar-preview','');preview.setAttribute('aria-hidden','true');previewRow.append(preview,element('span','muted','Así se verá tu perfil'));three.append(previewRow);
    const actions=element('div','form-actions profile-wizard-actions');actions.append(button('Cancelar','cancel-new-profile','button secondary'),button('Atrás','profile-wizard-back','button secondary',{step:'2'}),button('Siguiente','profile-wizard-next','button primary'),button('Crear mi perfil','submit-form','button primary'));
    form.append(one,two,three,actions);dialog.append(form);overlay.append(dialog);root.append(overlay);
    $('[data-action="profile-wizard-back"]',form).hidden=true;$('[data-action="submit-form"]',form).hidden=true;
    updateProfilePreview(form);$('input[name="name"]',form).focus();
  }
  if (action === 'quick-task') {
    state.taskFormDefaults = {}; state.showTaskForm = true; state.editingTaskId = null; updateShell();
    const title = $('.task-form input[name="title"]');
    if (title) title.focus();
  }
  if (action === 'submit-form') {
    const form = target.closest('form');
    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
    }
  }
  if (action === 'toggle-task') {
    const task = taskById(id);
    if (task) {
      const previousProfile = cloneActiveProfile();
      state.profile = taskMutation(state.profile, { type: 'toggle', id });
      if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
      updateShell();
    }
  }
  if (action === 'edit-task') {
    if (!taskById(id)) return;
    state.editingTaskId = id;
    state.showTaskForm = true;
    updateShell();
    const titleInput = $('.task-form input[name="title"]');
    if (titleInput) { titleInput.focus(); titleInput.select(); }
  }
  if (action === 'cancel-edit-task') { closeTaskEditor(); return; }
  if (['task-action-lock', 'task-action-postpone', 'task-action-delete'].includes(action)) {
    const task = taskById(id);
    if (!task) return showToast('La tarea ya no existe.', 'error');
    const previous = cloneActiveProfile();
    if (action === 'task-action-delete') {
      if (!confirm(task.locked ? 'Este compromiso está bloqueado. ¿Eliminarlo de todas las vistas?'
        : '¿Eliminar esta tarea de todas las vistas?')) return;
      state.profile = taskMutation(state.profile, { type: 'delete', id, allowLocked: true });
    } else if (action === 'task-action-lock') {
      state.profile = taskMutation(state.profile, { type: 'edit', id, data: { locked: !task.locked } });
    } else {
      if (task.locked) return showToast('Desbloquea primero este compromiso.', 'error');
      const nextDate = shiftDate(task.scheduledDate || localDate(), 1);
      const candidate = taskMutation(state.profile, { type: 'edit', id,
        data: { scheduledDate: nextDate } });
      if (task.startTime && task.endTime) {
        const conflicts = detectScheduleConflicts(candidate, nextDate)
          .filter(item => item.firstId === id || item.secondId === id);
        if (conflicts.length && !confirm('Hay ' + conflicts.length +
          ' superposición(es) en el nuevo día. ¿Mover de todos modos?')) return;
      }
      state.profile = candidate;
    }
    if (!await save()) { restoreActiveProfile(previous); updateShell(); return; }
    updateShell();
    return;
  }
  if (action === 'task-from-activity') {
    const activity = activityById(id);
    if (activity) {
      const previousProfile = cloneActiveProfile();
      state.profile = taskMutation(state.profile, { type: 'create', data: { title: activity.name, description: activity.description, estimatedMinutes: activity.durationMinutes, activityId: id, scheduledDate: state.selectedDate } });
      if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
      showToast('Tarea creada desde la actividad.'); updateShell();
    }
  }
  if (action === 'edit-activity') {
    if (!activityById(id)) return;
    state.editingActivityId = id;
    state.showActivityForm = true;
    state.view = 'activities';
    updateShell();
    const nameInput = $('.form-card input[name="name"]');
    if (nameInput) { nameInput.focus(); nameInput.select(); }
  }
  if (action === 'cancel-edit-activity') { state.editingActivityId = null; state.showActivityForm=false; updateShell(); }
  if (action === 'archive-activity') {
    const previousProfile = cloneActiveProfile();
    state.profile.activities = state.profile.activities.map(item => item.id === id ? { ...item, archived: true } : item);
    if (state.editingActivityId === id) state.editingActivityId = null;
    if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
    updateShell();
  }
  if (action === 'select-date') {
    state.selectedDate = target.dataset.date;
    state.calendarDate = new Date(state.selectedDate + 'T12:00:00');
    state.plannerAnalysis = null; state.templatePreview = null;
    updateShell();
  }
  if (action === 'calendar-prev') { state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() - 1, 1); updateShell(); }
  if (action === 'calendar-next') { state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() + 1, 1); updateShell(); }
  if (action === 'calendar-today') { state.calendarDate = new Date(); state.selectedDate = localDate(); updateShell(); }
  if (action === 'calendar-mode-month') { state.calendarMode = 'month'; updateShell(); }
  if (action === 'calendar-mode-week') { state.calendarMode = 'week'; updateShell(); }
  if (action === 'calendar-mode-day' || action === 'calendar-mode-agenda') {
    state.calendarMode = action === 'calendar-mode-day' ? 'day' : 'agenda';
    state.calendarDate = new Date(state.selectedDate + 'T12:00:00'); updateShell();
  }
  if (action === 'calendar-day-prev' || action === 'calendar-day-next') {
    state.selectedDate = shiftDate(state.selectedDate, action === 'calendar-day-prev' ? -1 : 1);
    state.calendarDate = new Date(state.selectedDate + 'T12:00:00');
    state.plannerAnalysis = null; state.templatePreview = null; updateShell();
  }
  if (action === 'calendar-week-prev' || action === 'calendar-week-next') {
    state.selectedDate = shiftDate(state.selectedDate, action === 'calendar-week-prev' ? -7 : 7);
    const [year, month, day] = state.selectedDate.split('-').map(Number);
    state.calendarDate = new Date(year, month - 1, day);
    updateShell();
  }
  if (action === 'calendar-add-task') {
    state.showTaskForm = true;
    state.editingTaskId = null;
    state.taskFormDefaults = { scheduledDate: state.selectedDate };
    updateShell();
    const dateField = $('.task-form input[name="scheduledDate"]');
    const titleField = $('.task-form input[name="title"]');
    if (dateField) dateField.value = state.selectedDate;
    if (titleField) titleField.focus();
  }
  if (action === 'navigate-date') { state.selectedDate = target.dataset.date; state.calendarDate = new Date(state.selectedDate + 'T12:00:00'); state.view = 'calendar'; state.calendarMode = 'day'; state.plannerAnalysis = null; updateShell(); }
  if (action === 'apply-recommendation') {
    const task = taskById(id);
    if (task && !task.locked && task.status === 'pending') {
      const previousProfile = cloneActiveProfile();
      state.profile = taskMutation(state.profile, { type: 'edit', id, data: { scheduledDate: target.dataset.date, startTime: '', endTime: '' } });
      if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
      updateShell(); showToast('Propuesta aplicada.');
    }
  }
  if (action === 'schedule-inbox-task') {
    const task = taskById(id);
    if (!task || task.status !== 'pending' || task.locked || task.scheduledDate) return;
    const previous = cloneActiveProfile();
    try {
      state.profile = taskMutation(state.profile, { type: 'edit', id,
        data: { scheduledDate: target.dataset.date, startTime: '', endTime: '' } });
      if (!await save()) { restoreActiveProfile(previous); updateShell(); return; }
      state.plannerAnalysis = null; updateShell(); showToast('Tarea asignada al día. Puedes agregar las horas cuando quieras.');
    } catch (error) { restoreActiveProfile(previous); showToast(error.message, 'error'); }
    return;
  }
  if (action === 'template-preview') {
    try { previewDayTemplate(state.profile, id, state.selectedDate);
      state.templatePreview = { id, date: state.selectedDate }; updateShell();
    } catch (error) { showToast(error.message, 'error'); }
    return;
  }
  if (action === 'template-preview-close') {
    state.templatePreview = null; updateShell(); return;
  }
  if (action === 'template-edit') {
    state.editingTemplateId = state.editingTemplateId === id ? null : id;
    state.templatePreview = null; updateShell(); return;
  }
  if (action === 'template-edit-cancel') {
    state.editingTemplateId = null; updateShell(); return;
  }
  if (action === 'template-entry-remove') {
    const template = (state.profile.dayTemplates || []).find(item => item.id === id);
    const entry = template?.entries?.find(item => item.id === target.dataset.entry);
    if (!entry || template.entries.length <= 1) return showToast('Toda plantilla necesita al menos un bloque.', 'error');
    if (!confirm('¿Quitar el bloque «' + entry.title + '»? Las tareas ya creadas se conservarán.')) return;
    const previous = cloneActiveProfile();
    state.profile.dayTemplates = state.profile.dayTemplates.map(item => item.id === id
      ? { ...item, entries: item.entries.filter(item => item.id !== entry.id) } : item);
    if (!await save()) { restoreActiveProfile(previous); updateShell(); return; }
    state.templatePreview = null; updateShell(); showToast('Bloque eliminado de la plantilla.');
    return;
  }
  if (action === 'template-exception') {
    const previous = cloneActiveProfile();
    try {
      const template = (state.profile.dayTemplates || []).find(item => item.id === id);
      if (!template) throw new Error('La plantilla ya no existe.');
      const excluded = new Set(template.recurrence.exceptions || []);
      if (excluded.has(state.selectedDate)) excluded.delete(state.selectedDate);
      else excluded.add(state.selectedDate);
      state.profile.dayTemplates = state.profile.dayTemplates.map(item => item.id === id
        ? { ...item, recurrence: { ...item.recurrence, exceptions: [...excluded].sort() } } : item);
      if (!await save()) { restoreActiveProfile(previous); updateShell(); return; }
      state.templatePreview = null; updateShell();
      showToast('Excepción de la rutina actualizada. Las tareas existentes se conservan.');
    } catch (error) { restoreActiveProfile(previous); showToast(error.message, 'error'); }
    return;
  }
  if (action === 'template-delete') {
    const template = (state.profile.dayTemplates || []).find(item => item.id === id);
    if (!template || !confirm('¿Eliminar la plantilla «' + template.name + '»? Las tareas existentes se conservarán.')) return;
    const previous = cloneActiveProfile();
    state.profile.dayTemplates = state.profile.dayTemplates.filter(item => item.id !== id);
    if (!await save()) { restoreActiveProfile(previous); updateShell(); return; }
    state.templatePreview = null; state.editingTemplateId = null; updateShell(); showToast('Plantilla eliminada.');
    return;
  }
  if (action === 'template-apply') {
    if (!state.templatePreview || state.templatePreview.id !== id ||
        state.templatePreview.date !== state.selectedDate) return showToast('Previsualiza primero la plantilla de este día.', 'error');
    const previous = cloneActiveProfile();
    try {
      const proposal = previewDayTemplate(state.profile, id, state.selectedDate);
      if (!proposal.proposals.length) return showToast('No hay bloques nuevos para aplicar.');
      const overlaps = proposal.proposals.filter(item => item.conflicts.length);
      if (overlaps.length && !confirm('Hay ' + overlaps.length + ' bloques que se superponen. ¿Aplicarlos de todos modos?')) return;
      const applied = applyDayTemplate(state.profile, id, state.selectedDate, { allowConflicts: overlaps.length > 0 });
      state.profile = applied.profile;
      if (!await save()) { restoreActiveProfile(previous); updateShell(); return; }
      state.templatePreview = null; state.plannerAnalysis = null; updateShell();
      showToast(applied.added + ' tareas creadas desde la plantilla.');
    } catch (error) { restoreActiveProfile(previous); showToast(error.message, 'error'); }
    return;
  }
  if (action === 'open-inbox') {
    state.taskFilter = 'inbox'; state.view = 'tasks'; updateShell(); return;
  }
  if (action === 'generate-plan') {
    state.plannerAnalysis = analyzeSchedule(state.profile, state.selectedDate);
    updateShell();
    if (!state.plannerAnalysis.proposals.length) showToast('Análisis listo. No hay horarios que aplicar.');
  }
  if (action === 'apply-plan') {
    const analysis = state.plannerAnalysis;
    if (!analysis || analysis.date !== state.selectedDate) return showToast('Vuelve a analizar el día antes de aplicar.', 'error');
    const refreshed = analyzeSchedule(state.profile, state.selectedDate);
    const samePreview = refreshed.proposals.length === analysis.proposals.length &&
      refreshed.proposals.every((item, index) => item.taskId === analysis.proposals[index].taskId &&
        item.startTime === analysis.proposals[index].startTime && item.endTime === analysis.proposals[index].endTime);
    if (!samePreview) {
      state.plannerAnalysis = refreshed;
      updateShell();
      return showToast('La agenda cambió. Revisa la vista previa actualizada antes de aplicar.', 'error');
    }
    const previousProfile = cloneActiveProfile();
    const map = new Map(analysis.proposals.map(item => [item.taskId, item]));
    let applied = 0;
    let candidate = state.profile;
    for (const task of state.profile.tasks) {
      const proposal = map.get(task.id);
      if (!proposal || task.locked || task.status !== 'pending') continue;
      if (task.scheduledDate && task.scheduledDate !== analysis.date) continue;
      if (task.scheduledDate === analysis.date && task.startTime && task.endTime) continue;
      candidate = taskMutation(candidate, { type: 'edit', id: task.id,
        data: { scheduledDate: proposal.date, startTime: proposal.startTime, endTime: proposal.endTime } });
      applied++;
    }
    state.profile = candidate;
    state.plannerAnalysis = null;
    if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
    updateShell();
    showToast(applied + ' propuestas aplicadas.');
  }
  if (action === 'discard-plan') {
    state.plannerAnalysis = null;
    updateShell();
    showToast('Propuestas descartadas.');
  }
  if (action === 'focus-start' && !state.profile.activeFocus) {
    const taskId = $('#focus-task')?.value || null;
    const task = taskById(taskId);
    const activityId = $('#focus-activity')?.value || (task ? task.activityId : null);
    const activity = activityById(activityId);
    const requestedMinutes = clampNumber($('#focus-duration')?.value, 5, 180, getSuggestedFocusMinutes(state.profile, taskId, activityId));
    if ($('#focus-duration') && (!$('#focus-duration').value || Number($('#focus-duration').value) < 5 || Number($('#focus-duration').value) > 180)) {
      return showToast('Elige una duración entre 5 y 180 minutos.', 'error');
    }
    state.profile.preferences.focusEndAlarmEnabled = $('.focus-panel input[name="focusEndAlarmEnabled"]')?.checked !== false;
    state.profile.preferences.focusNotifications = $('.focus-panel input[name="focusNotifications"]')?.checked !== false;
    stopFocusMusicPreview(); stopFocusAlarmPlayback();
    const now = new Date().toISOString();
    const previousProfile = cloneActiveProfile();
    state.profile.activeFocus = { taskId, activityId, activityTitle: activity ? activity.name : '', startedAt: now, sessionStartedAt: now, pausedAt: null, elapsedBeforePause: 0, durationSeconds: requestedMinutes * 60 };
    if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
    syncFocusNotificationSchedule();
    startFocusMusic();
    updateShell();
  }
  if (action === 'focus-break' && !state.profile.activeFocus) {
    stopFocusMusicPreview(); stopFocusAlarmPlayback();
    const now = new Date().toISOString();
    const previousProfile = cloneActiveProfile();
    state.profile.activeFocus = { taskId: null, activityTitle: '', isBreak: true, startedAt: now, sessionStartedAt: now, pausedAt: null, elapsedBeforePause: 0, durationSeconds: state.profile.preferences.breakMinutes * 60 };
    if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
    syncFocusNotificationSchedule(); startFocusMusic(); updateShell();
  }
  if (action === 'focus-toggle') {
    const focus = state.profile.activeFocus;
    if (focus) {
      const previousProfile = cloneActiveProfile();
      if (focus.pausedAt) {
        focus.startedAt = new Date().toISOString();
        focus.pausedAt = null;
      } else {
        focus.elapsedBeforePause += Math.floor((Date.now() - new Date(focus.startedAt).getTime()) / 1000);
        focus.pausedAt = new Date().toISOString();
      }
      if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
      if (focus.pausedAt) {
        window.oisym?.focusAlarms?.cancel().catch(() => {});
        focusAudioController.stopAll();
      } else {
        syncFocusNotificationSchedule();
        startFocusMusic();
      }
      updateShell();
    }
  }
  if (action === 'preview-focus-alarm') playFocusAlarm(true);
  if (action === 'stop-focus-alarm') stopFocusAlarmPlayback();
  if (action === 'preview-focus-music') previewFocusMusic();
  if (action === 'stop-focus-music-preview') stopFocusMusicPreview();
  if (action === 'focus-stop') await finishFocus();
  if (action === 'focus-retry-save' && isFocusSaveBlocked()) await finishFocus({ completed: true });
  if (action === 'focus-reset') {
    if (state.profile.activeFocus && !confirm('¿Terminar y descartar la sesión actual?')) return;
    const previousProfile = cloneActiveProfile();
    state.profile.activeFocus = null; stopFocusTicker();
    focusAudioController.stopAll();
    window.oisym?.focusAlarms?.cancel().catch(() => {});
    if (!await save()) {
      restoreActiveProfile(previousProfile);
      if (state.profile.activeFocus && !state.profile.activeFocus.pausedAt) startFocusTicker();
      syncFocusNotificationSchedule(); startFocusMusic(); updateShell(); return;
    }
    updateShell();
  }
  if (action === 'goal-progress') {
    const previousProfile = cloneActiveProfile();
    state.profile.goals = state.profile.goals.map(goal => goal.id === id ? { ...goal, progress: Math.max(0, Math.min(goal.target, goal.progress + Number(target.dataset.amount))) } : goal);
    if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
    updateShell();
  }
  if (action === 'edit-goal') {
    if (!goalById(id)) return;
    state.editingGoalId = id;
    state.showGoalForm = true;
    state.view = 'goals';
    updateShell();
    const titleInput = $('.form-card input[name="title"]');
    if (titleInput) { titleInput.focus(); titleInput.select(); }
  }
  if (action === 'cancel-edit-goal') { state.editingGoalId = null; state.showGoalForm=false; updateShell(); }
  if (action === 'archive-goal') {
    const previousProfile = cloneActiveProfile();
    state.profile.goals = state.profile.goals.map(goal => goal.id === id ? { ...goal, archived: true } : goal);
    if (state.editingGoalId === id) state.editingGoalId = null;
    if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
    updateShell();
  }
  if (action === 'export-data') {
    if(window.oisym?.files){await window.oisym.files.export('oisym-backup-'+localDate()+'.json',JSON.stringify(state.snapshot,null,2));return;}
    const blob = new Blob([JSON.stringify(state.snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = element('a');
    anchor.href = url; anchor.download = 'oisym-backup-' + localDate() + '.json';
    document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  }
  if (action === 'import-data') {
    const file = $('#backup-file')?.files?.[0];
    if (!file) return showToast('Selecciona primero un archivo JSON.', 'error');
    const previousSnapshot = JSON.parse(JSON.stringify(state.snapshot));
    const previousProfile = state.profile;
    const previousSelectedProfileId = state.selectedProfileId;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('El archivo supera el límite de 5 MB.');
      const imported = JSON.parse(await file.text());
      validateSnapshot(imported);
      if (!Array.isArray(imported.profiles) || imported.profiles.length === 0) {
        throw new Error('La copia no contiene perfiles. No se modificó tu información actual.');
      }
      imported.profiles.forEach(validateImportedProfile);
      const normalizedProfiles = imported.profiles.map(normalizeProfile);
      const activeProfile = normalizedProfiles.find(profile => profile.id === imported.activeProfileId) || normalizedProfiles[0];
      if (!confirm('La importación reemplazará los datos actuales. O-Isym conservará una copia de seguridad. ¿Continuar?')) return;
      focusAudioController.stopAll();
      state.snapshot = { ...imported, profiles: normalizedProfiles, activeProfileId: activeProfile.id };
      state.profile = activeProfile;
      state.selectedProfileId = activeProfile.id;
      const saved = await save();
      if (!saved) {
        state.snapshot = previousSnapshot;
        state.profile = previousProfile;
        state.selectedProfileId = previousSelectedProfileId;
        syncLaunchAtLogin();
        syncFocusNotificationSchedule();
        startFocusMusic();
        return;
      }
      syncLaunchAtLogin();
      syncFocusNotificationSchedule();
      startFocusMusic();
      updateShell();
      showToast('Copia importada.');
    } catch (error) {
      state.snapshot = previousSnapshot;
      state.profile = previousProfile;
      state.selectedProfileId = previousSelectedProfileId;
      syncLaunchAtLogin();
      syncFocusNotificationSchedule();
      startFocusMusic();
      showToast('No se pudo importar: ' + error.message, 'error');
    }
  }
  if (action === 'import-legacy') {
    if (state.profile.legacyImportedAt) return;
    const previousProfile = cloneActiveProfile();
    const activitiesByName = new Map(state.profile.activities.map(activity => [activity.name.toLowerCase(), activity]));
    let importedCount = 0;
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith('acts_')) continue;
      const date = key.slice(5);
      let oldItems = [];
      try { oldItems = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
      if (!Array.isArray(oldItems)) continue;
      oldItems.forEach(old => {
        if (!old || typeof old.name !== 'string' || !old.name.trim()) return;
        const normalizedName = old.name.trim().toLowerCase();
        let activity = activitiesByName.get(normalizedName);
        if (!activity) {
          activity = createActivity({ name: old.name, category: 'Importada', description: old.goal || '', durationMinutes: 30 });
          state.profile.activities.push(activity); activitiesByName.set(normalizedName, activity);
        }
        state.profile.tasks.push(createTask({
          title: old.name, description: old.goal || '', scheduledDate: date,
          activityId: activity.id, priority: 'medium', estimatedMinutes: 30
        }));
        const task = state.profile.tasks[state.profile.tasks.length - 1];
        if (old.completed) state.profile.tasks[state.profile.tasks.length - 1] = updateTask(task, { status: 'done' });
        importedCount++;
      });
    }
    const oldColors = localStorage.getItem('oisym_colors');
    if (oldColors) {
      try {
        const colors = JSON.parse(oldColors);
        if (/^#[0-9a-f]{6}$/i.test(colors.accent || '')) state.profile.color = colors.accent;
      } catch {}
    }
    state.profile.legacyImportedAt = new Date().toISOString();
    if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
    updateShell(); showToast(importedCount + ' registros importados. El prototipo original sigue intacto.');
  }
  if (action === 'switch-profile') {
    const profile = state.snapshot.profiles.find(item => item.id === id);
    if (profile && profile.id !== state.profile.id) {
      const previousProfile = state.profile;
      const previousActiveId = state.snapshot.activeProfileId;
      if (!await save()) return;
      focusAudioController.stopAll();
      window.oisym?.focusAlarms?.cancel().catch(() => {});
      state.profile = normalizeProfile(profile);
      state.snapshot.activeProfileId = id;
      const saved = await save();
      if (!saved) {
        state.profile = previousProfile;
        state.snapshot.activeProfileId = previousActiveId;
        startFocusMusic();
        return;
      }
      state.selectedProfileId = id;
      syncLaunchAtLogin();
      if(state.profile.activeFocus&&!state.profile.activeFocus.pausedAt)startFocusTicker();else stopFocusTicker();
      syncFocusNotificationSchedule();
      startFocusMusic();
      updateShell();
      showToast('Cambiaste al perfil «' + profile.name + '».');
    }
  }
  if (action === 'delete-profile') {
    const targetProfile = state.snapshot.profiles.find(item => item.id === id);
    if (!targetProfile) return showToast('No se encontró el perfil.', 'error');
    if (state.snapshot.profiles.length <= 1) return showToast('Debe existir al menos un perfil.', 'error');
    const summary = [
      targetProfile.tasks.filter(item => item.status === 'pending').length + ' tareas pendientes',
      targetProfile.tasks.filter(item => item.status === 'done').length + ' completadas',
      targetProfile.activities.length + ' actividades',
      targetProfile.goals.length + ' objetivos',
      targetProfile.focusSessions.length + ' sesiones Focus',
      targetProfile.activeFocus ? 'Tiene una sesión Focus activa' : ''
    ].filter(Boolean).join(', ');
    if (!confirm('Eliminar el perfil «' + targetProfile.name + '»?\n\nSe borrarán únicamente sus datos: ' + summary + '.\n\nLos demás perfiles no se modificarán. Esta acción no se puede deshacer desde la aplicación.')) return;
    const previousSnapshot = state.snapshot;
    const wasActive = targetProfile.id === state.profile.id;
    const fallback = wasActive ? state.snapshot.profiles.find(item => item.id !== targetProfile.id) : null;
    const nextSnapshot = {
      ...state.snapshot,
      profiles: state.snapshot.profiles.filter(item => item.id !== targetProfile.id),
      activeProfileId: wasActive ? fallback.id : state.profile.id,
      updatedAt: new Date().toISOString()
    };
    try {
      if (wasActive) {
        focusAudioController.stopAll();
        stopFocusTicker();
        window.oisym?.focusAlarms?.cancel().catch(() => {});
      }
      state.snapshot = await window.oisym.storage.save(nextSnapshot);
      state.profile = state.snapshot.profiles.find(item => item.id === state.snapshot.activeProfileId) || state.profile;
      if (wasActive) syncLaunchAtLogin();
      state.selectedProfileId = state.profile.id;
      if(state.profile.activeFocus&&!state.profile.activeFocus.pausedAt)startFocusTicker();else stopFocusTicker();
      syncFocusNotificationSchedule();
      if (wasActive) startFocusMusic();
      showToast('Perfil eliminado.');
      updateShell();
    } catch (error) {
      state.snapshot = previousSnapshot;
      state.profile = state.snapshot.profiles.find(item => item.id === state.snapshot.activeProfileId) || state.profile;
      showToast('No se pudo eliminar el perfil: ' + error.message, 'error');
      updateShell();
    }
    return;
  }
});

document.addEventListener('keydown', event => {
  if (state.view === 'planner' && state.plannerSection === 'board' && !document.querySelector('dialog[open]') && (event.metaKey || event.ctrlKey) && !event.altKey && ['z', 'y'].includes(event.key.toLowerCase())) {
    event.preventDefault(); event.stopPropagation();
    if (!event.repeat) restoreIdeaBoardHistory(event.key.toLowerCase() === 'y' || event.shiftKey ? 'redo' : 'undo');
    return;
  }
  const profileModal = $('[data-profile-modal]');
  if (profileModal && event.key === 'Escape') {
    event.preventDefault();
    if(profileModal.dataset.dirty==='true'&&!confirm('Hay cambios sin guardar. ¿Cerrar sin guardarlos?'))return;
    if(profileModal.dataset.returnFocus==='task-create-button'){state.showTaskForm=false;state.editingTaskId=null;}
    if(profileModal.dataset.returnFocus==='activity-create-button'){state.showActivityForm=false;state.editingActivityId=null;}
    if(profileModal.dataset.returnFocus==='goal-create-button'){state.showGoalForm=false;state.editingGoalId=null;}
    profileModal.remove();
    if(profileModal.dataset.returnFocus)document.getElementById(profileModal.dataset.returnFocus)?.focus();else $('.profile-add')?.focus();
    return;
  }
  if (profileModal && event.key === 'Tab') {
    const focusable = $$('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', profileModal)
      .filter(node => !node.hidden && node.getClientRects().length > 0);
    if (focusable.length) {
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !profileModal.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !profileModal.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    } else {
      event.preventDefault();
    }
    return;
  }
  if (!state.profile || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target;
  if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
  const key = event.key.toLowerCase();
  if (key === '?') {
    event.preventDefault();
    showToast('Atajos: N nueva tarea · T Hoy · ←/→ cambiar día · [ / ] semana o mes.');
    return;
  }
  if (key === 'n') {
    event.preventDefault();
    state.editingTaskId = null;
    state.taskFormDefaults = {};
    state.showTaskForm = true;
    updateShell();
    const titleField = $('.task-form input[name="title"]');
    if (titleField) titleField.focus();
    return;
  }
  if (key === 't') {
    event.preventDefault();
    state.view = 'today';
    state.selectedDate = localDate();
    state.calendarDate = new Date();
    state.plannerAnalysis = null;
    updateShell();
    return;
  }
  if (state.view === 'planner' && (key === 'arrowleft' || key === 'arrowright')) {
    event.preventDefault();
    state.selectedDate = shiftDate(state.selectedDate, key === 'arrowleft' ? -1 : 1);
    state.plannerAnalysis = null;
    updateShell();
    return;
  }
  if (state.view === 'calendar' && (key === 'arrowleft' || key === 'arrowright')) {
    event.preventDefault();
    state.selectedDate = shiftDate(state.selectedDate, key === 'arrowleft' ? -1 : 1);
    state.calendarDate = new Date(state.selectedDate + 'T12:00:00');
    updateShell();
    return;
  }
  if (state.view === 'calendar' && (key === '[' || key === ']')) {
    event.preventDefault();
    const amount = key === '[' ? -1 : 1;
    if (state.calendarMode === 'week') state.selectedDate = shiftDate(state.selectedDate, amount * 7);
    else state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() + amount, 1);
    state.plannerAnalysis = null;
    updateShell();
  }
});

root.addEventListener('submit', event => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  handleSubmit(form);
});
root.addEventListener('input', event => {
  if (event.target.id === 'idea-board-search') {
    state.ideaBoardSearch = event.target.value;
    const cursor = event.target.selectionStart;
    updateShell();
    const next = $('#idea-board-search');
    if (next) { next.focus(); next.setSelectionRange(cursor, cursor); }
    return;
  }

  const appearanceForm=event.target.closest('form[data-form="profile-appearance-settings"]');
  if (appearanceForm) {
    if (event.target.name==='appearanceMode') {
      refreshAppearanceEditor(appearanceForm,appearanceScheme(event.target.value));
    }
    const key=appearanceColorFields.find(([name])=>event.target.name==='appearance-'+name)?.[0];
    if (key) appearanceForm.querySelector('[name="custom-'+key+'"]').checked=true;
    if (event.target.name==='appearanceIconColor')
      appearanceForm.querySelector('[name="appearanceIconTone"]').value='custom';
    if (event.target.name==='appearanceIconBackgroundColor')
      appearanceForm.querySelector('[name="appearanceIconBackgroundCustom"]').checked=true;
    applyAppearanceSelection(appearanceForm);
    return;
  }
  if (event.target.closest('[data-profile-modal]')) event.target.closest('[data-profile-modal]').dataset.dirty='true';
  if ((event.target.name === 'name' || event.target.name === 'color') && (event.target.closest('[data-profile-modal]') || event.target.closest('form[data-form="profile-settings"]'))) updateProfilePreview(event.target.closest('form'));
  if (event.target.name === 'focusAlarmVolume') { const value = $('.alarm-volume-value'); if (value) value.textContent = event.target.value + '%'; }
  if (event.target.name === 'focusMusicVolume') {
    const value = $('.music-volume-value'); if (value) value.textContent = event.target.value + '%';
    focusAudioController.setMusicVolume(Math.max(0, Math.min(100, Number(event.target.value))) / 100);
  }
});
root.addEventListener('change', async event => {
  if (event.target.id === 'ideas-import-file') {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    try {
      if (files.length > 20) throw new Error('Puedes importar hasta 20 pizarrones a la vez.');
      const totalSize = files.reduce((total, file) => total + file.size, 0);
      if (files.some(file => file.size > 10 * 1024 * 1024)) throw new Error('Cada archivo debe pesar como máximo 10 MB.');
      if (totalSize > 20 * 1024 * 1024) throw new Error('El tamaño combinado de los archivos supera los 20 MB.');
      if (state.profile.ideaBoards.length + files.length > 100) throw new Error('La importación superaría el máximo de 100 pizarrones por perfil.');
      const importedBoards = [];
      for (const file of files) {
        try {
          const payload = JSON.parse(await file.text());
          const imported = prepareIdeaBoardImport(payload, [...state.profile.ideaBoards, ...importedBoards]);
          importedBoards.push(imported);
        } catch (error) {
          throw new Error(file.name + ': ' + error.message);
        }
      }
      const summary = importedBoards.map((board, index) =>
        (index + 1) + '. ' + files[index].name + '\n   ' + board.title + ' · ' + board.nodes.length + ' elementos · ' + board.connections.length + ' conexiones'
      ).join('\n');
      if (!confirm('Se importarán ' + importedBoards.length + ' pizarrón(es):\n\n' + summary + '\n\nSe añadirán como pizarrones nuevos. Ninguno existente será reemplazado. ¿Continuar?')) return;
      const previous = cloneActiveProfile();
      state.profile.ideaBoards = normalizeIdeaBoards([...state.profile.ideaBoards, ...importedBoards]);
      if (!await save()) { restoreActiveProfile(previous); updateShell(); return; }
      state.plannerSection = 'library';
      state.selectedIdeaBoardId = null;
      updateShell();
      showToast(importedBoards.length === 1 ? 'Pizarrón importado correctamente.' : 'Se importaron ' + importedBoards.length + ' pizarrones correctamente.');
    } catch (error) { showToast('No se pudo importar: ' + error.message, 'error'); }
    return;
  }

  if (event.target.id === 'idea-board-sort') { state.ideaBoardSort = event.target.value; updateShell(); return; }

  if(event.target.id==='profile-import-file'){
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    if(state.snapshot.profiles.length>=50)return showToast('Has alcanzado el máximo de 50 perfiles.','error');
    try{
      if(file.size>5*1024*1024)throw new Error('El archivo supera el límite de 5 MB.');
      const payload=JSON.parse(await file.text());
      if(!payload||payload.format!=='oisym-profile'||payload.version!==1||!payload.profile||typeof payload.profile!=='object')throw new Error('El archivo no es una exportación de perfil O-Isym compatible.');
      const raw=payload.profile;
      validateImportedProfile(raw);
      let imported=normalizeProfile(raw);
      if(state.snapshot.profiles.some(item=>item.id===imported.id))imported.id=createProfile(imported.name).id;
      imported.activeFocus=normalizeProfile({...imported,activeFocus:raw.activeFocus}).activeFocus;
      imported.updatedAt=new Date().toISOString();
      const next={...state.snapshot,profiles:[...state.snapshot.profiles,imported],updatedAt:new Date().toISOString()};
      state.snapshot=await window.oisym.storage.save(next);
      state.selectedProfileId=imported.id;
      state.view='profiles';updateShell();
      showToast('Perfil importado. Se añadió sin cambiar tu espacio actual.');
    }catch(error){showToast('No se pudo importar el perfil: '+error.message,'error');}
    return;
  }
  const appearanceForm=event.target.closest('form[data-form="profile-appearance-settings"]');
  if (appearanceForm) {
    if (event.target.name==='appearanceMode')
      refreshAppearanceEditor(appearanceForm,appearanceScheme(event.target.value));
    applyAppearanceSelection(appearanceForm);
    return;
  }
  if (event.target.closest('[data-profile-modal]')) event.target.closest('[data-profile-modal]').dataset.dirty='true';
  if ((event.target.name === 'avatarId' || event.target.name === 'color') && (event.target.closest('[data-profile-modal]') || event.target.closest('form[data-form="profile-settings"]'))) updateProfilePreview(event.target.closest('form'));
  if (event.target.id === 'profile-select') {
    const profileId = event.target.value;
    if (!await flushAppearanceChanges()) { event.target.value=state.profile.id; return; }
    if (!await flushIdeaChanges()) { event.target.value = state.profile.id; return; }
    const profile = state.snapshot.profiles.find(item => item.id === profileId);
    if (profile && profile.id !== state.profile.id) {
      const previousProfile = cloneActiveProfile();
      if (!await save()) { event.target.value = state.profile.id; return; }
      focusAudioController.stopAll();
      stopFocusTicker();
      window.oisym?.focusAlarms?.cancel().catch(() => {});
      const nextProfile = state.snapshot.profiles.find(item => item.id === profileId);
      state.profile = normalizeProfile(nextProfile);
      state.snapshot.activeProfileId = profileId;
      if (!await save()) {
        restoreActiveProfile(previousProfile);
        if (state.profile.activeFocus && !state.profile.activeFocus.pausedAt) startFocusTicker();
        syncFocusNotificationSchedule(); startFocusMusic(); updateShell();
        return;
      }
      syncLaunchAtLogin();
      if (state.profile.activeFocus && !state.profile.activeFocus.pausedAt) startFocusTicker();
      syncFocusNotificationSchedule(); startFocusMusic(); updateShell();
    }
  }
  if (event.target.id === 'planner-date') {
    state.selectedDate = event.target.value || localDate();
    state.calendarDate = new Date(state.selectedDate + 'T12:00:00');
    state.plannerAnalysis = null; state.templatePreview = null;
    updateShell();
  }
  if (event.target.id === 'focus-task') {
    const task = taskById(event.target.value);
    const activityControl = $('#focus-activity');
    if (activityControl) activityControl.value = task?.activityId || '';
    updateFocusDurationSuggestion();
  }
  if (event.target.id === 'focus-activity') updateFocusDurationSuggestion();
  if (event.target.name === 'focusEndAlarmEnabled' || event.target.name === 'focusNotifications') {
    const previousProfile = cloneActiveProfile();
    state.profile.preferences[event.target.name] = event.target.checked;
    if (event.target.name === 'focusEndAlarmEnabled') {
      $('.focus-alarm-settings select, .focus-alarm-settings input[type="range"], .focus-alarm-settings [data-action="preview-focus-alarm"]').forEach(control => {
        control.disabled = Boolean(state.profile.activeFocus) || !event.target.checked;
      });
    }
    if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
  }
  if (event.target.name === 'focusMusicTrack') {
    const previousProfile = cloneActiveProfile();
    state.profile.preferences.focusMusicTrack = FOCUS_MUSIC_CATALOG.some(track => track.id === event.target.value) ? event.target.value : '';
    const track = musicTrackById(state.profile.preferences.focusMusicTrack);
    const description = $('.music-description');
    if (description) description.textContent = track ? track.description : 'No se reproducirá música durante la sesión.';
    const preview = $('#focus-music-preview');
    if (preview) preview.disabled = !track || Boolean(state.profile.activeFocus);
    stopFocusMusicPreview();
    if (!await save()) { restoreActiveProfile(previousProfile); updateShell(); return; }
  }
  if (event.target.name === 'focusMusicVolume') {
    const previousProfile = cloneActiveProfile();
    state.profile.preferences.focusMusicVolume = clampNumber(event.target.value, 0, 100, 35);
    focusAudioController.setMusicVolume(state.profile.preferences.focusMusicVolume / 100);
    if (!await save()) { restoreActiveProfile(previousProfile); focusAudioController.setMusicVolume(previousProfile.preferences.focusMusicVolume / 100); updateShell(); return; }
  }
  if (['focusEndTone','focusAlarmVolume','focusAlarmRepeats','focusAlarmIntervalSeconds','focusAlarmMaxSeconds'].includes(event.target.name)) {
    const previousProfile = cloneActiveProfile();
    const name=event.target.name;
    if(name==='focusEndTone'){state.profile.preferences.focusEndTone=FOCUS_ALARM_CATALOG.some(x=>x.id===event.target.value)?event.target.value:'clock';stopFocusAlarmPlayback();}
    else{const b={focusAlarmVolume:[0,100,70],focusAlarmRepeats:[1,10,3],focusAlarmIntervalSeconds:[1,15,2],focusAlarmMaxSeconds:[5,120,30]}[name];state.profile.preferences[name]=Math.round(clampNumber(event.target.value,b[0],b[1],b[2]));}
    const value=$('.alarm-volume-value');if(value&&name==='focusAlarmVolume')value.textContent=state.profile.preferences.focusAlarmVolume+'%';
    if(name==='focusAlarmVolume')focusAudioController.setAlarmVolume(state.profile.preferences.focusAlarmVolume/100);
    if (!await save()) { restoreActiveProfile(previousProfile); focusAudioController.setAlarmVolume(previousProfile.preferences.focusAlarmVolume / 100); updateShell(); return; }
  }
});

async function initializeApp(snapshot) {
  state.snapshot = snapshot;
  if (!Array.isArray(state.snapshot.profiles)) state.snapshot.profiles = [];
  state.snapshot.profiles = state.snapshot.profiles.map(normalizeProfile);
  if (!state.snapshot.profiles.length) {
    const profile = createProfile('Mi espacio');
    state.snapshot.profiles.push(profile);
    state.snapshot.activeProfileId = profile.id;
  }
  state.profile = state.snapshot.profiles.find(profile => profile.id === state.snapshot.activeProfileId) || state.snapshot.profiles[0];
  state.snapshot.activeProfileId = state.profile.id;
  buildShell();
  updateShell();
  if (state.profile.activeFocus) {
    if (getFocusRemainingSeconds(state.profile.activeFocus) <= 0) {
      const finished = await finishFocus({ completed: true, silent: true });
      if (finished) showToast('La sesión terminó mientras O-Isym estaba cerrado. Se guardó en tu historial.');
    } else if (!state.profile.activeFocus.pausedAt) {
      startFocusTicker();
      syncFocusNotificationSchedule();
      startFocusMusic();
    } else {
      window.oisym?.focusAlarms?.cancel().catch(() => {});
      stopFocusMusic();
    }
  }
  await save();
  if (state.pendingTaskReminder) {
    const reminder = state.pendingTaskReminder;
    state.pendingTaskReminder = null;
    openTaskFromReminder(reminder);
  }
}

async function awaitReminderProfile(profile,reminder){
  if(!await save())return;
  focusAudioController.stopAll();stopFocusTicker();
  await window.oisym?.focusAlarms?.cancel();
  state.profile=normalizeProfile(profile);state.snapshot.activeProfileId=profile.id;
  await save();openTaskFromReminder(reminder);
}
function openTaskFromReminder(reminder) {
  if (!state.profile) { state.pendingTaskReminder = reminder; return; }
  if(reminder?.profileId && reminder.profileId!==state.profile.id){
    const owner=state.snapshot.profiles.find(p=>p.id===reminder.profileId);
    if(owner){awaitReminderProfile(owner,reminder);return;}
  }
  const task = reminder && taskById(reminder.taskId);
  // A reminder whose task was deleted must open the original calendar day,
  // never the unrelated Ideas/Pizarrones section.
  state.selectedDate = window.OIsymPlanning.validDate(reminder?.scheduledDate)
    ? reminder.scheduledDate : localDate();
  state.calendarDate = new Date(state.selectedDate + 'T12:00:00');
  state.view = task ? 'tasks' : 'calendar';
  if (!task) state.calendarMode = 'day';
  state.editingTaskId = task ? task.id : null;
  state.showTaskForm = Boolean(task);
  state.plannerAnalysis = null;
  updateShell();
  showToast(task ? 'Abrimos la tarea de tu recordatorio.' : 'Abrimos el día de tu recordatorio.');
}

async function showRecoveryScreen(error) {
  root.replaceChildren();
  const panel = element('section', 'fatal-screen recovery-screen');
  panel.append(
    element('div', 'recovery-mark', 'O'),
    element('h1', '', 'Necesitamos revisar tus datos'),
    element('p', 'recovery-error', error.message),
    element('p', 'muted', 'O-Isym no ha modificado el archivo original. Antes de reemplazarlo, guardará una copia íntegra en la carpeta de copias de seguridad.')
  );
  try {
    const backups = await window.oisym.storage.recovery.listBackups();
    if (backups.length) {
      panel.append(element('h2', '', 'También encontramos copias anteriores'));
      const picker = element('select', 'input recovery-select');
      picker.id = 'recovery-backup-select';
      backups.forEach(backup => {
        const option = element('option', '', new Date(backup.updatedAt).toLocaleString('es-MX') + ' · ' + backup.profiles + ' perfiles');
        option.value = backup.name;
        picker.append(option);
      });
      panel.append(picker, button('Restaurar esta copia', 'recovery-restore', 'button secondary'));
    } else {
      panel.append(element('p', 'muted', 'No encontramos copias anteriores válidas.'));
    }
  } catch (backupError) {
    panel.append(element('p', 'muted', 'No se pudieron consultar las copias anteriores: ' + backupError.message));
  }
  panel.append(
    button('Guardar copia y sobrescribir', 'recovery-overwrite', 'button primary'),
    element('p', 'recovery-note', 'Esta opción conserva el archivo actual como copia de emergencia y crea un espacio nuevo. Si tienes una copia anterior válida, es mejor restaurarla.')
  );
  root.append(panel);
}

async function boot() {
  try {
    await initializeApp(await window.oisym.storage.read());
  } catch (error) {
    if (['OISYM_STORE_CORRUPT', 'OISYM_STORE_INVALID', 'OISYM_STORE_PROTECTED'].includes(error.code)) {
      await showRecoveryScreen(error);
      return;
    }
    root.replaceChildren();
    const panel = element('section', 'fatal-screen recovery-screen');
    panel.append(
      element('h1', '', 'O-Isym no pudo iniciar'),
      element('p', 'recovery-error', error.message),
      element('p', 'muted', 'No se ha ejecutado ninguna acción de recuperación ni se han sobrescrito tus datos. Cierra O-Isym y revisa la versión de la aplicación.')
    );
    panel.append(button('Volver a intentar', 'retry-boot', 'button secondary'));
    root.append(panel);
  }
}

const systemAppearanceQuery=window.matchMedia?.('(prefers-color-scheme: dark)');
if (systemAppearanceQuery) {
  const onAppearanceChange=() => {
    if (state.profile?.preferences.appearanceMode !== 'system') return;
    applyProfileAppearance();
    if (state.view==='settings' && state.settingsSection==='appearance')
      refreshAppearanceEditor($('form[data-form="profile-appearance-settings"]'),prefersDark()?'dark':'light');
  };
  if (systemAppearanceQuery.addEventListener) systemAppearanceQuery.addEventListener('change',onAppearanceChange);
  else if (systemAppearanceQuery.addListener) systemAppearanceQuery.addListener(onAppearanceChange);
}
window.oisym?.notifications?.onOpenTask?.(openTaskFromReminder);
window.oisym?.onSaveBeforeClose?.(async () => {
  if (!await flushAppearanceChanges()) return false;
  return flushIdeaChanges();
});
boot();


// Recalcular con el reloj real al volver de suspensión o al recuperar la ventana.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.profile?.activeFocus) refreshFocusClock();
});
window.addEventListener('focus', () => {
  if (state.profile?.activeFocus) refreshFocusClock();
});
