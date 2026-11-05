const {
  createProfile, normalizeProfile, createActivity, updateActivity, createTask, updateTask,
  createGoal, updateGoal, localDate, shiftDate, getRecommendations, analyzeSchedule,
  validateSnapshot, validateImportedProfile, clampNumber, getSuggestedFocusMinutes, getFocusElapsedSeconds, getFocusRemainingSeconds, createFocusSession, getAgeBand, getDefaultThemeForAge, FOCUS_ALARM_TONES
} = window.OIsymDomain;

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
  calendarMode: 'month',
  focusTick: null,
  focusFinishing: false,
  toastTimer: null,
  editingTaskId: null,
  editingActivityId: null,
  editingGoalId: null,
  plannerAnalysis: null,
  selectedProfileId: null,
  settingsSection: 'profile',
  showTaskForm: false,
  showActivityForm: false,
  showGoalForm: false
};

const $ = (selector, parent = root) => parent.querySelector(selector);
const $$ = (selector, parent = root) => Array.from(parent.querySelectorAll(selector));
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
};
const iconImage = (path, alt = '', className = 'ui-icon') => {
  const image = element('img', className);
  image.src = 'assets/icons/' + path;
  image.alt = alt;
  image.draggable = false;
  image.decoding = 'async';
  image.loading = 'lazy';
  if (!alt) image.setAttribute('aria-hidden', 'true');
  image.onerror = () => image.remove();
  return image;
};
const button = (label, action, className = 'button secondary', data = {}) => {
  const node = element('button', className, label);
  node.type = 'button';
  node.dataset.action = action;
  Object.entries(data).forEach(([key, value]) => node.dataset[key] = String(value));
  return node;
};
const actionIconButton = (label, action, icon, className = 'button secondary', data = {}) => {
  const node = button('', action, className + ' button-with-icon', data);
  const image = element('img', 'action-button-icon');
  image.src = 'assets/icons/actions/' + icon;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.draggable = false;
  image.decoding = 'async';
  image.onerror = () => image.remove();
  node.append(image, element('span', '', label));
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
const save = async () => {
  state.profile.updatedAt = new Date().toISOString();
  state.snapshot.profiles = state.snapshot.profiles.map(profile => profile.id === state.profile.id ? state.profile : profile);
  state.snapshot.activeProfileId = state.profile.id;
  state.snapshot.updatedAt = new Date().toISOString();
  try {
    state.snapshot = await window.oisym.storage.save(state.snapshot);
    state.profile = state.snapshot.profiles.find(profile => profile.id === state.snapshot.activeProfileId) || state.profile;
    return true;
  } catch (error) {
    showToast('No se pudo guardar: ' + error.message, 'error');
    return false;
  }
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
const makeAvatarImage = id => { const image=element('img','avatar-image'); image.src='assets/avatars/profile-'+String(id).replace('profile-','')+'.png'; image.alt=''; image.draggable=false; image.onerror=()=>image.remove(); return image; };
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
  const shell = element('div', 'shell');
  const sidebar = element('aside', 'sidebar');
  sidebar.setAttribute('aria-label', 'Barra lateral');
  const brand = element('div', 'brand');
  brand.append(element('div', 'brand-mark', 'O'), element('div', 'brand-copy'));
  brand.lastChild.append(element('strong', '', 'O-Isym'), element('span', '', 'tu espacio, a tu ritmo'));
  sidebar.append(brand);

  const profileBox = element('div', 'profile-switcher');
  const profileSelect = select('profile', []);
  profileSelect.id = 'profile-select';
  profileSelect.setAttribute('aria-label', 'Cambiar el perfil activo');
  profileBox.append(element('span', 'eyebrow', 'ESPACIO ACTUAL'), profileSelect, button('+ Perfil', 'new-profile', 'profile-add'));
  sidebar.append(profileBox);

  const nav = element('nav', 'navigation');
  nav.setAttribute('aria-label', 'Navegación principal');
  const profileNav = button('Perfiles', 'navigate', 'nav-item', { view: 'profiles' });
  profileNav.prepend(iconImage('actions/profiles.png', '', 'nav-icon-image'));
  nav.append(profileNav);
  const items = [
    ['today', 'Hoy', 'navigation/today.png'], ['tasks', 'Tareas', 'navigation/tasks.png'],
    ['activities', 'Actividades', 'navigation/activities.png'], ['calendar', 'Calendario', 'navigation/calendar.png'],
    ['planner', 'Planificador', 'navigation/planner.png'], ['focus', 'Enfoque', 'focus/timer.png'],
    ['goals', 'Objetivos', 'navigation/goals.png'], ['insights', 'Insights', 'navigation/insights.png']
  ];
  items.forEach(([id, label, iconPath]) => {
    const item = button('', 'navigate', 'nav-item', { view: id });
    item.append(iconImage(iconPath, '', 'nav-icon-image'), element('span', '', label));
    nav.append(item);
  });
  sidebar.append(nav);
  const sidebarBottom = element('div', 'sidebar-bottom');
  const settingsButton = button('Ajustes', 'navigate', 'nav-item settings-link', { view: 'settings' });
  settingsButton.prepend(iconImage('interface/settings.png', '', 'nav-icon-image'));
  sidebarBottom.append(settingsButton);
  sidebarBottom.append(element('div', 'sidebar-note', 'Tus datos permanecen en este dispositivo.'));
  sidebar.append(sidebarBottom);

  const workspace = element('div', 'workspace');
  const topbar = element('header', 'topbar');
  const topLeft = element('div', 'topbar-date');
  topLeft.id = 'topbar-date';
  const topRight = element('div', 'topbar-actions');
  const quickTaskButton = button('Nueva tarea', 'quick-task', 'button primary');
  quickTaskButton.prepend(iconImage('interface/add.png', '', 'button-icon'));
  topRight.append(quickTaskButton);
  topbar.append(topLeft, topRight);
  const main = element('main', 'main-content');
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
  root.style.setProperty('--accent', state.profile.color);
  root.dataset.theme = state.profile.preferences.theme || 'classic';
  root.classList.toggle('reduce-motion', state.profile.preferences.motionEnabled === false);
  $('#topbar-date').textContent = dateLabel(localDate(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const topbarTaskAction=$('.topbar-actions [data-action="quick-task"]');if(topbarTaskAction)topbarTaskAction.hidden=state.view!=='today';
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
}

function addTaskForm(parent, defaults = {}) {
  const editing = Boolean(state.editingTaskId);
  const form = element('form', 'form-card task-form');
  form.dataset.form = editing ? 'task-edit' : 'task';
  form.append(element('h3', '', editing ? 'Editar tarea' : 'Añadir tarea'));
  form.append(field('¿Qué necesitas hacer?', input('title', 'Ej. Leer 20 páginas', 'text', defaults.title || '')));
  const row = element('div', 'form-grid');
  row.append(field('Programar para (opcional)', input('scheduledDate', '', 'date', defaults.scheduledDate || '')));
  row.append(field('Fecha límite (opcional)', input('dueDate', '', 'date', defaults.dueDate || '')));
  form.append(row);
  const row2 = element('div', 'form-grid');
  row2.append(field('Prioridad', select('priority', [
    { value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' }, { value: 'high', label: 'Alta' }
  ], defaults.priority || 'medium')));
  row2.append(field('Duración estimada (min)', input('estimatedMinutes', '30', 'number', defaults.estimatedMinutes || 30)));
  form.append(row2);
  const row3 = element('div', 'form-grid');
  row3.append(field('Hora de inicio (opcional)', input('startTime', '', 'time', defaults.startTime || '')));
  row3.append(field('Hora de fin (opcional)', input('endTime', '', 'time', defaults.endTime || '')));
  form.append(row3);
  form.append(field('Vincular actividad', activitySelect('activityId', defaults.activityId || '')));
  form.append(field('Recordatorio de esta tarea', select('reminderEnabled', [
    { value: 'true', label: 'Avisarme a la hora programada' },
    { value: 'false', label: 'No enviar notificación para esta tarea' }
  ], String(defaults.reminderEnabled !== false))));
  form.append(element('p', 'small-note', 'Para recibir el aviso, asigna una fecha y una hora de inicio. Puedes cambiarlo después.'));
  form.append(field('Notas (opcional)', textarea('description', 'Detalles o contexto…', defaults.description || '')));
  const locked = select('locked', [{ value: 'false', label: 'Tarea flexible' }, { value: 'true', label: 'Compromiso bloqueado' }], String(Boolean(defaults.locked)));
  form.append(field('Tipo de tarea', locked));
  const actions = element('div', 'form-actions');
  actions.append(editing ? actionIconButton('Guardar cambios', 'submit-form', 'save.png', 'button primary') : button('Guardar tarea', 'submit-form', 'button primary'));
  if (editing) actions.append(button('Cancelar', 'cancel-edit-task', 'button secondary'));
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
    actions.append(actionIconButton('Editar', 'edit-task', 'edit.png', 'button secondary small', { id: task.id }));
    actions.append(button('⋯', 'task-menu', 'icon-button', { id: task.id }));
    row.append(check, content, actions);
    list.append(row);
  });
  parent.append(list);
}

function renderToday(main) {
  const date = localDate();
  const overdue = state.profile.tasks.filter(task => task.status === 'pending' && task.dueDate && task.dueDate < date);
  const overdueIds = new Set(overdue.map(task => task.id));
  const tasks = state.profile.tasks.filter(task => task.status === 'pending' && !overdueIds.has(task.id) && (
    task.scheduledDate === date || task.dueDate === date || (!task.scheduledDate && !task.dueDate)
  ));
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
  main.append(hero);

  const grid = element('div', 'dashboard-grid');
  const primary = element('div', 'dashboard-main');
  const taskCard = card();
  taskCard.append(heading(childMode?'Mis tareas de hoy':'Lo que tienes hoy',childMode?'¡Puedes ir haciendo una cosa a la vez!':'Una lista clara, sin presión.'));
  renderTaskList(taskCard, tasks, { emptyTitle: 'Tu agenda está despejada', emptyDetail: 'Puedes agregar una tarea o reservar tiempo para algo importante.' });
  taskCard.append(button('+ Añadir tarea', 'quick-task', 'button primary'));
  primary.append(taskCard);
  if (done.length) {
    const doneCard = card('today-completed-card');
    doneCard.append(heading('Completadas hoy', done.length === 1 ? 'Ya terminaste una tarea.' : 'Ya terminaste ' + done.length + ' tareas.'));
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
  focusCard.append(element('div', 'eyebrow', 'ESPACIO DE CONCENTRACIÓN'), element('h3', '','Un momento a la vez'), element('p', 'muted', 'Reserva unos minutos para concentrarte en una sola cosa.'));
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
    { value: 'active', label: 'Pendientes' }, { value: 'all', label: 'Todas' }, { value: 'done', label: 'Completadas' }
  ], 'active');
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
      const statusMatches = mode === 'all' || (mode === 'done' ? task.status === 'done' : task.status === 'pending');
      const textMatches = !query || (task.title + ' ' + task.description).toLocaleLowerCase('es').includes(query);
      return statusMatches && textMatches;
    });
    renderTaskList(list, tasks, { emptyTitle: query ? 'No hay coincidencias' : 'Todavía no hay tareas', emptyDetail: query ? 'Prueba con otras palabras.' : 'Crea tu primera tarea y aparecerá aquí.' });
  };
  filter.addEventListener('change', render);
  search.addEventListener('input', render);
  render();
  main.append(list);
  const editing = state.editingTaskId ? taskById(state.editingTaskId) : null;
  if(state.showTaskForm||editing){
    const overlay=element('div','profile-modal-backdrop');overlay.dataset.profileModal='true';overlay.dataset.returnFocus='task-create-button';
    const dialog=element('section','profile-modal');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','task-modal-title');
    const form=addTaskForm(dialog,editing||{});form.classList.add('profile-modal-form');
    const title=form.querySelector('h3');if(title)title.id='task-modal-title';
    if(!editing)form.querySelector('.form-actions').append(button('Cancelar','close-task-form','button secondary'));
    overlay.append(dialog);main.append(overlay);
    $('.task-form input[name="title"]',overlay)?.focus();
  }
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
    const overlay=element('div','profile-modal-backdrop');overlay.dataset.profileModal='true';overlay.dataset.returnFocus='activity-create-button';
    const dialog=element('section','profile-modal');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','activity-modal-title');
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
  const selected=state.selectedDate;
  const selectedDate=new Date(Number(selected.slice(0,4)),Number(selected.slice(5,7))-1,Number(selected.slice(8,10)));
  const layout=element('div','calendar-layout');
  const calendarPrimary=element('div','calendar-primary');
  const header=element('div','calendar-heading');
  const title=element('div','');
  const controls=element('div','button-group calendar-controls');
  const modeControls=element('div','button-group calendar-mode');
  const monthModeButton=button('Mes','calendar-mode-month','button '+(state.calendarMode==='month'?'primary':'secondary'));
  const weekModeButton=button('Semana','calendar-mode-week','button '+(state.calendarMode==='week'?'primary':'secondary'));
  monthModeButton.setAttribute('aria-pressed',String(state.calendarMode==='month'));
  weekModeButton.setAttribute('aria-pressed',String(state.calendarMode==='week'));
  modeControls.append(monthModeButton,weekModeButton);
  controls.append(modeControls);
  if(state.calendarMode==='month'){
    const year=state.calendarDate.getFullYear(),month=state.calendarDate.getMonth();
    const calendarTitle = element('div', 'view-title-with-icon');
    calendarTitle.append(iconImage('navigation/calendar.png', '', 'view-title-icon'), element('h1', '', state.calendarDate.toLocaleDateString('es-MX',{month:'long',year:'numeric'})));
    title.append(calendarTitle,element('p','muted','Selecciona un día para revisar su agenda. Atajos: ←/→ día · N tarea · T hoy · ? ayuda.'));
    const previousMonth=button('‹','calendar-prev','button secondary');
    previousMonth.setAttribute('aria-label','Mes anterior');
    const nextMonth=button('›','calendar-next','button secondary');
    nextMonth.setAttribute('aria-label','Mes siguiente');
    controls.append(previousMonth,button('Hoy','calendar-today','button secondary'),nextMonth);
    header.append(title,controls);calendarPrimary.append(header);
    const wrap=card('calendar-card'),grid=element('div','calendar-grid');
    ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(day=>grid.append(element('div','calendar-weekday',day)));
    const first=new Date(year,month,1),offset=(first.getDay()+6)%7,count=new Date(year,month+1,0).getDate();
    for(let i=0;i<offset;i++)grid.append(element('div','calendar-blank'));
    for(let day=1;day<=count;day++){
      const key=year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
      const countTasks=state.profile.tasks.filter(task=>task.status==='pending'&&(task.scheduledDate===key||task.dueDate===key)).length;
      const cell=button('','select-date','calendar-day'+(key===localDate()?' is-today':'')+(key===selected?' is-selected':''),{date:key});
      cell.setAttribute('aria-label',dateLabel(key,{weekday:'long',day:'numeric',month:'long'})+(countTasks?', '+countTasks+' tareas':', sin tareas'));
      cell.setAttribute('aria-pressed',String(key===selected));
      cell.append(element('span','calendar-number',day));
      if(countTasks)cell.append(element('span','calendar-count',countTasks+(countTasks===1?' tarea':' tareas')));
      grid.append(cell);
    }
    wrap.append(grid);calendarPrimary.append(wrap);
  }else{
    const weekStart=shiftDate(selected,-((selectedDate.getDay()+6)%7)),weekEnd=shiftDate(weekStart,6);
    const calendarWeekTitle = element('div', 'view-title-with-icon');
    calendarWeekTitle.append(iconImage('navigation/calendar.png', '', 'view-title-icon'), element('h1', '', dateLabel(weekStart,{day:'numeric',month:'long'})+' – '+dateLabel(weekEnd,{day:'numeric',month:'long',year:'numeric'})));
    title.append(calendarWeekTitle,element('p','muted','Elige un día para consultar sus tareas. Atajos: ←/→ día · N tarea · T hoy · ? ayuda.'));
    controls.append(button('‹ Semana','calendar-week-prev','button secondary'),button('Esta semana','calendar-today','button secondary'),button('Semana ›','calendar-week-next','button secondary'));
    header.append(title,controls);calendarPrimary.append(header);
    const week=card('week-calendar');
    for(let index=0;index<7;index++){
      const key=shiftDate(weekStart,index),dayTasks=state.profile.tasks.filter(task=>task.status==='pending'&&(task.scheduledDate===key||task.dueDate===key));
      const dayButton=button('','select-date','week-day'+(key===localDate()?' is-today':'')+(key===selected?' is-selected':''),{date:key});
      const top=element('div','week-day-top');top.append(element('strong','',dateLabel(key,{weekday:'short'})),element('span','',key.slice(-2)));
      dayButton.setAttribute('aria-label',dateLabel(key,{weekday:'long',day:'numeric',month:'long'})+', '+dayTasks.length+' tareas');
      dayButton.setAttribute('aria-pressed',String(key===selected));
      dayButton.append(top,element('span','week-day-count',dayTasks.length?dayTasks.length+(dayTasks.length===1?' pendiente':' pendientes'):'Sin pendientes'));
      dayTasks.slice(0,2).forEach(task=>dayButton.append(element('span','week-day-task',task.title)));
      if(dayTasks.length>2)dayButton.append(element('span','week-day-more','+'+(dayTasks.length-2)+' más'));
      week.append(dayButton);
    }
    calendarPrimary.append(week);
  }
  const selectedCard=card('calendar-detail-card');
  const dayItems=state.profile.tasks.filter(task=>task.scheduledDate===selected||task.dueDate===selected);
  selectedCard.append(heading(dateLabel(selected),dayItems.length?dayItems.length+' tareas asociadas a este día':'No hay tareas asociadas a este día'));
  renderTaskList(selectedCard,dayItems,{emptyTitle:'Día despejado',emptyDetail:'Puedes dejarlo así o añadir una tarea para esta fecha.'});
  selectedCard.append(button('+ Añadir tarea para este día','calendar-add-task','button primary'),button('Abrir planificador','navigate-date','button secondary',{date:selected}));
  layout.append(calendarPrimary,selectedCard);main.append(layout);
}
function renderPlanner(main) {
  const dateBar = element('div', 'calendar-heading');
  const title = element('div', '');
  const plannerTitle = element('div', 'view-title-with-icon');
  plannerTitle.append(iconImage('navigation/planner.png', '', 'view-title-icon'), element('h1', '', 'Planificador'));
  title.append(plannerTitle, element('p', 'muted', dateLabel(state.selectedDate) + ' · Los compromisos bloqueados se respetan. Atajos: ←/→ día · N tarea · T hoy · ? ayuda.'));
  const dateInput = input('selectedDate', '', 'date', state.selectedDate);
  dateInput.id = 'planner-date';
  dateBar.append(title, dateInput);
  main.append(dateBar);
  const scheduled = state.profile.tasks.filter(task => task.status === 'pending' && task.scheduledDate === state.selectedDate).sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));
  const plannerLayout=element('div','planner-layout');
  const plannerMain=element('div','planner-main-column');
  const plannerSide=element('div','planner-side-column');
  const agenda = card();
  agenda.append(heading('Agenda', scheduled.length + ' elementos programados'));
  const hours = state.profile.preferences;
  agenda.append(element('p', 'muted small-note', 'Horario habitual: ' + (hours.workingDayStart || '09:00') + '–' + (hours.workingDayEnd || '17:00') + '. Puedes cambiarlo en Ajustes.'));
  renderTaskList(agenda, scheduled, { emptyTitle: 'No hay bloques programados', emptyDetail: 'Puedes asignar fecha y horario a una tarea.' });
  plannerMain.append(agenda);
  const unscheduled = card();
  const waiting = state.profile.tasks.filter(task => task.status === 'pending' && !task.scheduledDate);
  unscheduled.append(heading('Por organizar', waiting.length + ' tareas sin día asignado'));
  renderTaskList(unscheduled, waiting, { emptyTitle: 'Todo tiene un día asignado', emptyDetail: 'No hay tareas pendientes de organizar.' });
  plannerSide.append(unscheduled);
  const add = element('form', 'form-card');
  add.dataset.form = 'planner-task';
  add.append(element('h3', '', 'Reservar un bloque'));
  const titleInput = input('title', 'Nombre del compromiso o tarea');
  add.append(field('Nombre', titleInput));
  const row = element('div', 'form-grid');
  row.append(field('Inicio', input('startTime', '', 'time', '09:00')), field('Fin', input('endTime', '', 'time', '10:00')));
  add.append(row);
  const row2 = element('div', 'form-grid');
  row2.append(field('Prioridad', select('priority', [{ value: 'low', label: 'Baja' }, { value: 'medium', label: 'Media' }, { value: 'high', label: 'Alta' }], 'medium')));
  row2.append(field('Tipo', select('locked', [{ value: 'false', label: 'Flexible' }, { value: 'true', label: 'Compromiso bloqueado' }], 'false')));
  const row3 = element('div', 'form-grid');
  row3.append(field('Notificación', select('reminderEnabled', [{ value: 'true', label: 'Avisarme a esta hora' }, { value: 'false', label: 'Sin aviso' }], 'true')));
  add.append(row2, row3, button('Añadir a la agenda', 'submit-form', 'button primary'));
  plannerSide.append(add);
  plannerLayout.append(plannerMain,plannerSide);
  main.append(plannerLayout);
  const planner = card();
  planner.append(heading('Planificación asistida', 'O-Isym busca huecos reales y explica cada propuesta. Nada se aplica sin tu aprobación.'));
  planner.append(element('p', 'muted', 'Modo actual: ' + ({ manual: 'Manual', suggested: 'Sugerido', hybrid: 'Híbrido', automatic: 'Automático' }[state.profile.preferences.autonomy])));
  planner.append(button('Analizar disponibilidad y proponer horarios', 'generate-plan', 'button primary'));
  if (state.plannerAnalysis && state.plannerAnalysis.date === state.selectedDate) {
    const analysis = state.plannerAnalysis;
    const summary = element('p', 'small-note', analysis.proposals.length + ' propuestas · ' + analysis.proposedMinutes + ' min por organizar · Jornada ' + analysis.workday.start + '–' + analysis.workday.end);
    planner.append(summary);
    if (analysis.proposals.length) {
      const proposalList = element('div', 'planner-proposals');
      analysis.proposals.forEach(proposal => {
        const item = element('article', 'planner-proposal');
        const top = element('div', 'planner-proposal-top');
        top.append(element('strong', '', proposal.title), element('span', 'planner-time', proposal.startTime + '–' + proposal.endTime));
        item.append(top, element('p', 'muted', proposal.reason));
        proposalList.append(item);
      });
      planner.append(proposalList);
      planner.append(element('p', 'small-note', 'Revisa los horarios antes de aplicarlos. Las tareas bloqueadas y los bloques ya programados no se cambian.'));
      const actions = element('div', 'button-group');
      actions.append(button('Aplicar propuestas', 'apply-plan', 'button primary'), button('Descartar', 'discard-plan', 'button secondary'));
      planner.append(actions);
    } else {
      planner.append(empty('No hay propuestas disponibles', 'No se encontró espacio para las tareas flexibles de este día.'));
    }
    if (analysis.skipped.length) {
      const skipped = element('div', 'planner-skipped');
      skipped.append(element('h4', '', 'Tareas que necesitan atención'));
      analysis.skipped.forEach(item => {
        const row = element('p', 'small-note');
        row.append(element('strong', '', item.title + ': '), document.createTextNode(item.reason));
        skipped.append(row);
      });
      planner.append(skipped);
    }
  }
  main.append(planner);
}
function renderFocus(main) {
  main.append(heading('Focus', 'Prepara tu sesión y después olvídate del reloj.', 'focus/timer.png'));
  const focus = state.profile.activeFocus;
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
  else {
    actions.append(button(focus.pausedAt ? 'Reanudar' : 'Pausar', 'focus-toggle', 'button primary large'));
    actions.append(button('Terminar sesión', 'focus-stop', 'button secondary'));
  }
  if (focus) actions.append(button('Reiniciar', 'focus-reset', 'button ghost'));
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
    const overlay=element('div','profile-modal-backdrop');overlay.dataset.profileModal='true';overlay.dataset.returnFocus='goal-create-button';
    const dialog=element('section','profile-modal');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','goal-modal-title');
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
  const profileTitleIcon=element('img','profiles-heading-icon');profileTitleIcon.src='assets/icons/actions/profiles.png';profileTitleIcon.alt='';profileTitleIcon.setAttribute('aria-hidden','true');profileTitleIcon.draggable=false;
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
    ['Tema', ({classic:'Clásico',warm:'Cálido',sky:'Cielo',playful:'Colorido'}[preferences.theme] || 'Clásico')],
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
  form.append(field('Color de acento',input('color','','color',profile.color)));
  form.append(field('Tema',select('theme',[
    {value:'classic',label:'Clásico'},{value:'warm',label:'Cálido'},{value:'sky',label:'Cielo'},{value:'playful',label:'Colorido'}
  ],profile.preferences.theme || 'classic')));
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
    ['profile','Mi perfil','Identidad y apariencia'],
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
  panel.append(heading(active[1],active[2],state.settingsSection==='profiles'?'actions/profiles.png':({profile:'interface/settings.png',planning:'navigation/planner.png',notifications:'notifications/task-reminder.png',focus:'focus/timer.png',data:'actions/export.png',shortcuts:'interface/search.png'}[state.settingsSection]||'interface/settings.png')));
  if(state.settingsSection==='profile'){
    const form=element('form','form-card settings-form');
    form.dataset.form='profile-settings';
    form.append(field('Nombre',input('name','Nombre del perfil','text',state.profile.name)));
    const age=input('age','Edad en años','number',state.profile.age==null?'':state.profile.age);age.min='1';age.max='120';age.step='1';
    form.append(field('Edad (opcional)',age),element('p','small-note','La edad adapta algunas sugerencias. No se guarda fecha de nacimiento.'));
    form.append(field('Color de acento',input('color','','color',state.profile.color)));
    form.append(element('span','field-label','Avatar'));
    buildAvatarPicker(form,state.profile.avatarId||'profile-1');
    const previewRow=element('div','profile-avatar-preview-row');
    const preview=element('div','profile-avatar profile-avatar-preview','');preview.setAttribute('aria-hidden','true');
    previewRow.append(preview,element('span','muted','Vista previa del perfil'));form.append(previewRow);updateProfilePreview(form);
    form.append(field('Tema',select('theme',[
      {value:'classic',label:'Clásico — limpio y equilibrado'},
      {value:'warm',label:'Cálido — tonos suaves'},
      {value:'sky',label:'Cielo — acentos azulados'},
      {value:'playful',label:'Colorido — alegre y dinámico'}
    ],state.profile.preferences.theme||'classic')));
    form.append(field('Movimiento de la interfaz',select('motionEnabled',[
      {value:'true',label:'Activado — transiciones sutiles'},
      {value:'false',label:'Reducido — menos movimiento'}
    ],String(state.profile.preferences.motionEnabled!==false))));
    form.append(element('p','small-note','El avatar, el color y el tema solo cambian la presentación de este perfil.'));
    form.append(actionIconButton('Guardar cambios','submit-form','save.png','button primary'));
    panel.append(form);
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
    info.append(element('h3','','Notificaciones del sistema'),status,element('p','muted','macOS puede ocultar o silenciar avisos si O-Isym no tiene permiso en Ajustes del Sistema → Notificaciones. El botón de prueba permite comprobarlo.'));
    panel.append(form,info);
    window.oisym?.notifications?.getStatus?.().then(result=>{
      const target=$('[data-notification-status]',panel);
      if(target)target.textContent=(result.supported?'Notificaciones nativas disponibles. ':'Este sistema no informa compatibilidad con notificaciones nativas. ')+(result.canManageLogin?'Inicio automático: '+(result.launchAtLogin?'activado.':'desactivado.'):'El inicio automático no está disponible en este sistema.')+' Si no aparecen avisos, revisa los permisos de O-Isym en macOS.';
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
          theme: ['classic','warm','sky','playful'].includes(data.theme) ? data.theme : current.preferences.theme,
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
      const editingId=state.editingTaskId;
      if (form.dataset.form === 'task-edit') {
        const current = taskById(editingId);
        if (!current) throw new Error('La tarea que intentas editar ya no existe.');
        state.profile.tasks = state.profile.tasks.map(item => item.id === editingId ? updateTask(item, data) : item);
      } else state.profile.tasks.unshift(createTask(data));
      const saved=await save();
      if(!saved){restoreProfile();state.showTaskForm=form.dataset.form!=='planner-task';state.editingTaskId=editingId;return;}
      state.editingTaskId=null;state.showTaskForm=false;
      showToast(form.dataset.form==='task-edit'?'Cambios guardados.':'Tarea guardada.');
      state.view = form.dataset.form === 'planner-task' ? 'planner' : state.view;
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
      state.profile.preferences.theme=['classic','warm','sky','playful'].includes(data.theme)?data.theme:getDefaultThemeForAge(state.profile.age);
      state.profile.preferences.motionEnabled=data.motionEnabled!=='false';
      const saved=await save();
      if(!saved){state.profile=beforeSave;state.snapshot.profiles=state.snapshot.profiles.map(item=>item.id===beforeSave.id?beforeSave:item);state.snapshot.activeProfileId=beforeSave.id;updateShell();return;}
      showToast('Perfil actualizado.');
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
function notifyFocusFinished(taskTitle,isBreak=false){if(!isBreak){stopFocusMusic();playFocusAlarm(false);}if(!window.oisym.focusAlarms&&state.profile.preferences.focusNotifications!==false&&'Notification'in window&&Notification.permission==='granted'){try{new Notification(isBreak?'Descanso terminado':'Focus terminado',{body:isBreak?'Tu descanso terminó. Puedes volver a concentrarte.':(taskTitle?'Terminaste tu sesión de '+taskTitle+'.':'Terminaste tu sesión de concentración.'),silent:true});}catch(error){}}}
function updateFocusDurationSuggestion() {
  const taskId = $('#focus-task')?.value || null;
  const activityId = $('#focus-activity')?.value || null;
  const duration = $('#focus-duration');
  if (duration) duration.value = getSuggestedFocusMinutes(state.profile, taskId, activityId);
  const activity = activityById(activityId);
  const hint = $('.focus-hint');
  if (hint) hint.textContent = activity ? 'Duración sugerida de «' + activity.name + '»: ' + activity.durationMinutes + ' min. Puedes ajustarla solo para esta sesión.' : 'Se usa tu duración habitual como sugerencia. Puedes cambiarla sin modificar tus preferencias.';
}
function syncFocusNotificationSchedule(){const focus=state.profile?.activeFocus,alarms=window.oisym?.focusAlarms;if(!alarms)return;if(!focus||focus.pausedAt){alarms.cancel().catch(()=>{});return;}const endAt=Date.parse(focus.startedAt)+(focus.durationSeconds-(Number(focus.elapsedBeforePause)||0))*1000;alarms.schedule({endsAt:new Date(Math.max(Date.now(),endAt)).toISOString(),isBreak:focus.isBreak===true,taskTitle:taskById(focus.taskId)?.title||focus.activityTitle||'',notificationsEnabled:state.profile.preferences.focusNotifications!==false,soundEnabled:false}).catch(()=>{});}
function refreshFocusClock() {
  const focus = state.profile?.activeFocus;
  if (!focus || focus.pausedAt) return;
  const remaining = getFocusRemainingSeconds(focus);
  const display = $('#focus-clock');
  if (display) display.textContent = String(Math.floor(remaining / 60)).padStart(2, '0') + ':' + String(remaining % 60).padStart(2, '0');
  if (remaining <= 0) finishFocus({ completed: true });
}
function startFocusTicker() {
  stopFocusTicker();
  refreshFocusClock();
  if (!state.profile.activeFocus || state.profile.activeFocus.pausedAt) return;
  state.focusTick = setInterval(refreshFocusClock, 500);
}
function stopFocusTicker() {
  if (state.focusTick) clearInterval(state.focusTick);
  state.focusTick = null;
}
async function finishFocus(options = {}) {
  const focus = state.profile?.activeFocus;
  if (!focus || state.focusFinishing) return;
  state.focusFinishing = true;
  const now = new Date().toISOString();
  const task = taskById(focus.taskId);
  if (!focus.isBreak) state.profile.focusSessions.push(createFocusSession(focus, task ? task.title : '', now));
  state.profile.activeFocus = null;
  stopFocusTicker();
  focusAudioController.stopAll();
  if (!options.completed) window.oisym?.focusAlarms?.cancel().catch(() => {});
  const saved = await save();
  state.focusFinishing = false;
  if (options.completed && !options.silent) notifyFocusFinished(task ? task.title : '', Boolean(focus.isBreak));
  if (!options.silent) showToast(saved ? (options.completed ? (focus.isBreak ? 'Descanso terminado. Cuando quieras, puedes volver a concentrarte.' : '¡Tiempo completado! Tu sesión quedó guardada. Es buen momento para descansar.') : (focus.isBreak ? 'Descanso finalizado.' : 'Sesión guardada.')) : 'La sesión terminó, pero no se pudo guardar. Revisa el almacenamiento.', saved ? 'success' : 'error');
  updateShell();
}

root.addEventListener('click', async event => {
  if (event.target.matches('[data-profile-modal]')) { if(event.target.dataset.dirty==='true'&&!confirm('Hay cambios sin guardar. ¿Cerrar sin guardarlos?'))return; const focusId=event.target.dataset.returnFocus;if(focusId==='task-create-button'){state.showTaskForm=false;state.editingTaskId=null;}if(focusId==='activity-create-button'){state.showActivityForm=false;state.editingActivityId=null;}if(focusId==='goal-create-button'){state.showGoalForm=false;state.editingGoalId=null;}event.target.remove();if(focusId)document.getElementById(focusId)?.focus();else $('.profile-add')?.focus();return; }
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
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
  if (action === 'navigate') { const openModal=$('[data-profile-modal]');if(openModal?.dataset.dirty==='true'&&!confirm('Hay cambios sin guardar. ¿Cerrar sin guardarlos?'))return;if(openModal){if(openModal.dataset.returnFocus==='task-create-button'){state.showTaskForm=false;state.editingTaskId=null;}if(openModal.dataset.returnFocus==='activity-create-button'){state.showActivityForm=false;state.editingActivityId=null;}if(openModal.dataset.returnFocus==='goal-create-button'){state.showGoalForm=false;state.editingGoalId=null;}openModal.remove();}state.view = target.dataset.view; updateShell(); }
  if (action === 'new-task') { state.view='tasks';state.editingTaskId=null;state.showTaskForm=true;updateShell();return; }
  if (action === 'new-activity') { state.view='activities';state.editingActivityId=null;state.showActivityForm=true;updateShell();return; }
  if (action === 'new-goal') { state.view='goals';state.editingGoalId=null;state.showGoalForm=true;updateShell();return; }
  if (action === 'close-goal-form') { state.showGoalForm=false;state.editingGoalId=null;updateShell();$('#goal-create-button')?.focus();return; }
  if (action === 'close-activity-form') { state.showActivityForm=false;state.editingActivityId=null;updateShell();$('#activity-create-button')?.focus();return; }
  if (action === 'close-task-form') { state.showTaskForm=false;state.editingTaskId=null;updateShell();$('#task-create-button')?.focus();return; }
  if (action === 'settings-section') { state.settingsSection = target.dataset.section; updateShell(); return; }
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
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = element('a');
    anchor.href = url;
    anchor.download = 'oisym-perfil-' + String(profile.name).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9-_]+/gi,'-').replace(/^-|-$/g,'').toLowerCase() + '-' + localDate() + '.json';
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
    state.view = 'tasks'; state.showTaskForm = true; state.editingTaskId = null; updateShell();
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
    if (task) { state.profile.tasks = state.profile.tasks.map(item => item.id === id ? updateTask(item, { status: item.status === 'done' ? 'pending' : 'done' }) : item); await save(); updateShell(); }
  }
  if (action === 'edit-task') {
    if (!taskById(id)) return;
    state.editingTaskId = id;
    state.showTaskForm = true;
    state.view = 'tasks';
    updateShell();
    const titleInput = $('.task-form input[name="title"]');
    if (titleInput) { titleInput.focus(); titleInput.select(); }
  }
  if (action === 'cancel-edit-task') {
    state.editingTaskId = null;
    state.showTaskForm = false;
    updateShell();
  }
  if (action === 'task-menu') {
    const task = taskById(id);
    if (!task) return;
    const choice = prompt('Escribe: bloquear, desbloquear, eliminar o posponer', task.locked ? 'desbloquear' : 'bloquear');
    if (choice === 'eliminar' && confirm('¿Eliminar esta tarea?')) state.profile.tasks = state.profile.tasks.filter(item => item.id !== id);
    else if (choice === 'bloquear' || choice === 'desbloquear') state.profile.tasks = state.profile.tasks.map(item => item.id === id ? updateTask(item, { locked: choice === 'bloquear' }) : item);
    else if (choice === 'posponer') state.profile.tasks = state.profile.tasks.map(item => item.id === id && !item.locked ? updateTask(item, { scheduledDate: shiftDate(localDate(), 1), startTime: '', endTime: '' }) : item);
    await save(); updateShell();
  }
  if (action === 'task-from-activity') {
    const activity = activityById(id);
    if (activity) {
      state.profile.tasks.unshift(createTask({ title: activity.name, description: activity.description, estimatedMinutes: activity.durationMinutes, activityId: id, scheduledDate: state.selectedDate }));
      await save(); showToast('Tarea creada desde la actividad.'); updateShell();
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
    state.profile.activities = state.profile.activities.map(item => item.id === id ? { ...item, archived: true } : item);
    if (state.editingActivityId === id) state.editingActivityId = null;
    await save(); updateShell();
  }
  if (action === 'select-date') { state.selectedDate = target.dataset.date; updateShell(); }
  if (action === 'calendar-prev') { state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() - 1, 1); updateShell(); }
  if (action === 'calendar-next') { state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() + 1, 1); updateShell(); }
  if (action === 'calendar-today') { state.calendarDate = new Date(); state.selectedDate = localDate(); updateShell(); }
  if (action === 'calendar-mode-month') { state.calendarMode = 'month'; updateShell(); }
  if (action === 'calendar-mode-week') { state.calendarMode = 'week'; updateShell(); }
  if (action === 'calendar-week-prev' || action === 'calendar-week-next') {
    state.selectedDate = shiftDate(state.selectedDate, action === 'calendar-week-prev' ? -7 : 7);
    const [year, month, day] = state.selectedDate.split('-').map(Number);
    state.calendarDate = new Date(year, month - 1, day);
    updateShell();
  }
  if (action === 'calendar-add-task') {
    state.view = 'tasks';
    state.showTaskForm = true;
    state.editingTaskId = null;
    state.showTaskForm = true;
    updateShell();
    const dateField = $('.task-form input[name="scheduledDate"]');
    const titleField = $('.task-form input[name="title"]');
    if (dateField) dateField.value = state.selectedDate;
    if (titleField) titleField.focus();
  }
  if (action === 'navigate-date') { state.selectedDate = target.dataset.date; state.view = 'planner'; updateShell(); }
  if (action === 'apply-recommendation') {
    const task = taskById(id);
    if (task && !task.locked && task.status === 'pending') {
      state.profile.tasks = state.profile.tasks.map(item => item.id === id ? updateTask(item, { scheduledDate: target.dataset.date, startTime: '', endTime: '' }) : item);
      await save(); updateShell(); showToast('Propuesta aplicada.');
    }
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
    const map = new Map(analysis.proposals.map(item => [item.taskId, item]));
    let applied = 0;
    state.profile.tasks = state.profile.tasks.map(task => {
      const proposal = map.get(task.id);
      if (!proposal || task.locked || task.status !== 'pending') return task;
      if (task.scheduledDate && task.scheduledDate !== analysis.date) return task;
      if (task.scheduledDate === analysis.date && task.startTime && task.endTime) return task;
      applied++;
      return updateTask(task, { scheduledDate: proposal.date, startTime: proposal.startTime, endTime: proposal.endTime });
    });
    state.plannerAnalysis = null;
    await save(); updateShell();
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
    state.profile.activeFocus = { taskId, activityId, activityTitle: activity ? activity.name : '', startedAt: now, sessionStartedAt: now, pausedAt: null, elapsedBeforePause: 0, durationSeconds: requestedMinutes * 60 };
    await save();
    syncFocusNotificationSchedule();
    startFocusMusic();
    updateShell();
  }
  if (action === 'focus-break' && !state.profile.activeFocus) {
    stopFocusMusicPreview(); stopFocusAlarmPlayback();
    const now = new Date().toISOString();
    state.profile.activeFocus = { taskId: null, activityTitle: '', isBreak: true, startedAt: now, sessionStartedAt: now, pausedAt: null, elapsedBeforePause: 0, durationSeconds: state.profile.preferences.breakMinutes * 60 };
    await save(); syncFocusNotificationSchedule(); startFocusMusic(); updateShell();
  }
  if (action === 'focus-toggle') {
    const focus = state.profile.activeFocus;
    if (focus) {
      if (focus.pausedAt) {
        focus.startedAt = new Date().toISOString();
        focus.pausedAt = null;
      } else {
        focus.elapsedBeforePause += Math.floor((Date.now() - new Date(focus.startedAt).getTime()) / 1000);
        focus.pausedAt = new Date().toISOString();
      }
      await save();
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
  if (action === 'focus-reset') {
    if (state.profile.activeFocus && !confirm('¿Terminar y descartar la sesión actual?')) return;
    state.profile.activeFocus = null; stopFocusTicker();
    focusAudioController.stopAll();
    window.oisym?.focusAlarms?.cancel().catch(() => {}); await save(); updateShell();
  }
  if (action === 'goal-progress') {
    state.profile.goals = state.profile.goals.map(goal => goal.id === id ? { ...goal, progress: Math.max(0, Math.min(goal.target, goal.progress + Number(target.dataset.amount))) } : goal);
    await save(); updateShell();
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
    state.profile.goals = state.profile.goals.map(goal => goal.id === id ? { ...goal, archived: true } : goal);
    if (state.editingGoalId === id) state.editingGoalId = null;
    await save(); updateShell();
  }
  if (action === 'export-data') {
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
    await save(); updateShell(); showToast(importedCount + ' registros importados. El prototipo original sigue intacto.');
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
    const focusable = $('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', profileModal)
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
    state.view = 'tasks';
    state.editingTaskId = null;
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
  if (event.target.closest('[data-profile-modal]')) event.target.closest('[data-profile-modal]').dataset.dirty='true';
  if ((event.target.name === 'name' || event.target.name === 'color') && (event.target.closest('[data-profile-modal]') || event.target.closest('form[data-form="profile-settings"]'))) updateProfilePreview(event.target.closest('form'));
  if (event.target.name === 'focusAlarmVolume') { const value = $('.alarm-volume-value'); if (value) value.textContent = event.target.value + '%'; }
  if (event.target.name === 'focusMusicVolume') {
    const value = $('.music-volume-value'); if (value) value.textContent = event.target.value + '%';
    focusAudioController.setMusicVolume(Math.max(0, Math.min(100, Number(event.target.value))) / 100);
  }
});
root.addEventListener('change', async event => {
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
  if (event.target.closest('[data-profile-modal]')) event.target.closest('[data-profile-modal]').dataset.dirty='true';
  if ((event.target.name === 'avatarId' || event.target.name === 'color') && (event.target.closest('[data-profile-modal]') || event.target.closest('form[data-form="profile-settings"]'))) updateProfilePreview(event.target.closest('form'));
  if (event.target.id === 'profile-select') {
    const profile = state.snapshot.profiles.find(item => item.id === event.target.value);
    if (profile) { focusAudioController.stopAll(); state.profile = normalizeProfile(profile); state.snapshot.activeProfileId = profile.id; save().then(() => { syncFocusNotificationSchedule(); startFocusMusic(); updateShell(); }); }
  }
  if (event.target.id === 'planner-date') {
    state.selectedDate = event.target.value || localDate();
    state.plannerAnalysis = null;
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
    state.profile.preferences[event.target.name] = event.target.checked;
    if (event.target.name === 'focusEndAlarmEnabled') {
      $('.focus-alarm-settings select, .focus-alarm-settings input[type="range"], .focus-alarm-settings [data-action="preview-focus-alarm"]').forEach(control => {
        control.disabled = Boolean(state.profile.activeFocus) || !event.target.checked;
      });
    }
    save();
  }
  if (event.target.name === 'focusMusicTrack') {
    state.profile.preferences.focusMusicTrack = FOCUS_MUSIC_CATALOG.some(track => track.id === event.target.value) ? event.target.value : '';
    const track = musicTrackById(state.profile.preferences.focusMusicTrack);
    const description = $('.music-description');
    if (description) description.textContent = track ? track.description : 'No se reproducirá música durante la sesión.';
    const preview = $('#focus-music-preview');
    if (preview) preview.disabled = !track || Boolean(state.profile.activeFocus);
    stopFocusMusicPreview();
    save();
  }
  if (event.target.name === 'focusMusicVolume') {
    state.profile.preferences.focusMusicVolume = clampNumber(event.target.value, 0, 100, 35);
    focusAudioController.setMusicVolume(state.profile.preferences.focusMusicVolume / 100);
    save();
  }
  if (['focusEndTone','focusAlarmVolume','focusAlarmRepeats','focusAlarmIntervalSeconds','focusAlarmMaxSeconds'].includes(event.target.name)) {
    const name=event.target.name;
    if(name==='focusEndTone'){state.profile.preferences.focusEndTone=FOCUS_ALARM_CATALOG.some(x=>x.id===event.target.value)?event.target.value:'clock';stopFocusAlarmPlayback();}
    else{const b={focusAlarmVolume:[0,100,70],focusAlarmRepeats:[1,10,3],focusAlarmIntervalSeconds:[1,15,2],focusAlarmMaxSeconds:[5,120,30]}[name];state.profile.preferences[name]=Math.round(clampNumber(event.target.value,b[0],b[1],b[2]));}
    const value=$('.alarm-volume-value');if(value&&name==='focusAlarmVolume')value.textContent=state.profile.preferences.focusAlarmVolume+'%';
    if(name==='focusAlarmVolume')focusAudioController.setAlarmVolume(state.profile.preferences.focusAlarmVolume/100);
    save();
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
      await finishFocus({ completed: true, silent: true });
      showToast('La sesión terminó mientras O-Isym estaba cerrado. Se guardó en tu historial.');
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

boot();


// Recalcular con el reloj real al volver de suspensión o al recuperar la ventana.
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.profile?.activeFocus) refreshFocusClock();
});
window.addEventListener('focus', () => {
  if (state.profile?.activeFocus) refreshFocusClock();
});
