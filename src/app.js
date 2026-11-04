const {
  createProfile, normalizeProfile, createActivity, updateActivity, createTask, updateTask,
  createGoal, updateGoal, localDate, shiftDate, getRecommendations, suggestSchedule,
  validateSnapshot, clampNumber, getSuggestedFocusMinutes, getFocusElapsedSeconds, getFocusRemainingSeconds, createFocusSession
} = window.OIsymDomain;

const root = document.getElementById('app');
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
  editingGoalId: null
};

const $ = (selector, parent = root) => parent.querySelector(selector);
const $$ = (selector, parent = root) => Array.from(parent.querySelectorAll(selector));
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
};
const button = (label, action, className = 'button secondary', data = {}) => {
  const node = element('button', className, label);
  node.type = 'button';
  node.dataset.action = action;
  Object.entries(data).forEach(([key, value]) => node.dataset[key] = String(value));
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
const heading = (title, subtitle) => {
  const wrap = element('div', 'section-heading');
  wrap.append(element('h2', '', title));
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

function buildShell() {
  root.replaceChildren();
  const shell = element('div', 'shell');
  const sidebar = element('aside', 'sidebar');
  const brand = element('div', 'brand');
  brand.append(element('div', 'brand-mark', 'O'), element('div', 'brand-copy'));
  brand.lastChild.append(element('strong', '', 'O-Isym'), element('span', '', 'tu espacio, a tu ritmo'));
  sidebar.append(brand);

  const profileBox = element('div', 'profile-switcher');
  const profileSelect = select('profile', []);
  profileSelect.id = 'profile-select';
  profileBox.append(element('span', 'eyebrow', 'ESPACIO ACTUAL'), profileSelect, button('+ Perfil', 'new-profile', 'profile-add'));
  sidebar.append(profileBox);

  const nav = element('nav', 'navigation');
  const items = [
    ['today', 'Hoy', '◷'], ['tasks', 'Tareas', '▤'], ['activities', 'Actividades', '◇'],
    ['calendar', 'Calendario', '▦'], ['planner', 'Planificador', '⌁'], ['focus', 'Enfoque', '◉'],
    ['goals', 'Objetivos', '◎'], ['insights', 'Insights', '↗']
  ];
  items.forEach(([id, label, icon]) => {
    const item = button('', 'navigate', 'nav-item', { view: id });
    item.append(element('span', 'nav-icon', icon), element('span', '', label));
    nav.append(item);
  });
  sidebar.append(nav);
  const sidebarBottom = element('div', 'sidebar-bottom');
  sidebarBottom.append(button('Ajustes', 'navigate', 'nav-item settings-link', { view: 'settings' }));
  sidebarBottom.append(element('div', 'sidebar-note', 'Tus datos permanecen en este dispositivo.'));
  sidebar.append(sidebarBottom);

  const workspace = element('div', 'workspace');
  const topbar = element('header', 'topbar');
  const topLeft = element('div', 'topbar-date');
  topLeft.id = 'topbar-date';
  const topRight = element('div', 'topbar-actions');
  topRight.append(button('+ Nueva tarea', 'quick-task', 'button primary'));
  topbar.append(topLeft, topRight);
  const main = element('main', 'main-content');
  main.id = 'main-content';
  workspace.append(topbar, main);
  shell.append(sidebar, workspace);
  root.append(shell);
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
  root.style.setProperty('--accent', state.profile.color);
  $('#topbar-date').textContent = dateLabel(localDate(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === state.view));
  const main = $('#main-content');
  main.replaceChildren();
  const renderers = {
    today: renderToday, tasks: renderTasks, activities: renderActivities,
    calendar: renderCalendar, planner: renderPlanner, focus: renderFocus,
    goals: renderGoals, insights: renderInsights, settings: renderSettings
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
  form.append(field('Notas (opcional)', textarea('description', 'Detalles o contexto…', defaults.description || '')));
  const locked = select('locked', [{ value: 'false', label: 'Tarea flexible' }, { value: 'true', label: 'Compromiso bloqueado' }], String(Boolean(defaults.locked)));
  form.append(field('Tipo de tarea', locked));
  const actions = element('div', 'form-actions');
  actions.append(button(editing ? 'Guardar cambios' : 'Guardar tarea', 'submit-form', 'button primary'));
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
    if (task.scheduledDate) meta.append(element('span', 'meta-chip', dateLabel(task.scheduledDate, { day: 'numeric', month: 'short' })));
    if (task.startTime) meta.append(element('span', 'meta-chip', task.startTime + (task.endTime ? '–' + task.endTime : '')));
    meta.append(element('span', 'meta-chip ' + priorityClass(task.priority), priorityLabel(task.priority)));
    if (task.locked) meta.append(element('span', 'meta-chip locked-chip', 'Bloqueada'));
    const activity = activityById(task.activityId);
    if (activity) meta.append(element('span', 'meta-chip', activity.name));
    if (task.description) meta.append(element('span', 'task-description', task.description));
    content.append(meta);
    const actions = element('div', 'task-actions');
    actions.append(button('Editar', 'edit-task', 'icon-button', { id: task.id }));
    actions.append(button('⋯', 'task-menu', 'icon-button', { id: task.id }));
    row.append(check, content, actions);
    list.append(row);
  });
  parent.append(list);
}

function renderToday(main) {
  const date = localDate();
  const tasks = state.profile.tasks.filter(task => task.status === 'pending' && (task.scheduledDate === date || !task.scheduledDate || task.dueDate === date));
  const overdue = state.profile.tasks.filter(task => task.status === 'pending' && task.dueDate && task.dueDate < date);
  const done = state.profile.tasks.filter(task => task.status === 'done' && task.completedAt && task.completedAt.slice(0, 10) === date);
  const hero = card('welcome-card');
  const greeting = new Date().getHours() < 12 ? 'Buenos días' : (new Date().getHours() < 19 ? 'Buenas tardes' : 'Buenas noches');
  hero.append(element('div', 'eyebrow', dateLabel(date, { weekday: 'long', day: 'numeric', month: 'long' })), element('h1', '', greeting + ', ' + state.profile.name), element('p', '', 'Organiza lo importante. Deja espacio para lo inesperado.'));
  const progress = element('div', 'progress-wrap');
  const progressTop = element('div', 'progress-label');
  progressTop.append(element('span', '', 'Tu día'), element('strong', '', done.length + ' de ' + (done.length + tasks.length) + ' tareas'));
  const bar = element('div', 'progress-track');
  const fill = element('div', 'progress-fill');
  fill.style.width = (done.length + tasks.length ? Math.round(done.length / (done.length + tasks.length) * 100) : 0) + '%';
  bar.append(fill);
  progress.append(progressTop, bar);
  hero.append(progress);
  main.append(hero);

  const grid = element('div', 'dashboard-grid');
  const primary = element('div', 'dashboard-main');
  const taskCard = card();
  taskCard.append(heading('Lo que tienes hoy', 'Una lista clara, sin presión.'));
  renderTaskList(taskCard, tasks, { emptyTitle: 'Tu agenda está despejada', emptyDetail: 'Puedes agregar una tarea o reservar tiempo para algo importante.' });
  taskCard.append(button('+ Añadir tarea', 'quick-task', 'button primary'));
  primary.append(taskCard);
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
  main.append(heading('Tareas', 'Todo lo que quieres hacer, en un solo lugar.'));
  const toolbar = element('div', 'toolbar');
  const filter = select('task-filter', [
    { value: 'active', label: 'Pendientes' }, { value: 'all', label: 'Todas' }, { value: 'done', label: 'Completadas' }
  ], 'active');
  filter.id = 'task-filter';
  const search = input('task-search', 'Buscar por nombre o notas…');
  search.id = 'task-search';
  toolbar.append(filter, search);
  main.append(toolbar);
  const list = card();
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
  addTaskForm(main, editing || {});
}

function renderActivities(main) {
  main.append(heading('Actividades', 'Crea plantillas reutilizables para las cosas que haces.'));
  const editing = state.editingActivityId ? activityById(state.editingActivityId) : null;
  const form = element('form', 'form-card');
  form.dataset.form = editing ? 'activity-edit' : 'activity';
  form.append(element('h3', '', editing ? 'Editar actividad' : 'Nueva actividad'));
  const grid = element('div', 'form-grid');
  grid.append(field('Nombre', input('name', 'Ej. Lectura', 'text', editing?.name || '')), field('Categoría', input('category', 'Personal, estudio, salud…', 'text', editing?.category || '')));
  form.append(grid);
  form.append(field('Descripción', textarea('description', '¿En qué consiste?', editing?.description || '')));
  const row = element('div', 'form-grid');
  row.append(field('Duración orientativa (min)', input('durationMinutes', '30', 'number', editing?.durationMinutes || 30)), field('Frecuencia', input('frequency', 'Ej. Tres veces por semana', 'text', editing?.frequency || '')));
  form.append(row, button(editing ? 'Guardar cambios' : 'Crear actividad', 'submit-form', 'button primary'));
  if (editing) form.append(button('Cancelar', 'cancel-edit-activity', 'button secondary'));
  main.append(form);
  const list = card();
  list.append(heading('Tu catálogo', state.profile.activities.length + ' actividades'));
  const active = state.profile.activities.filter(item => !item.archived);
  if (!active.length) list.append(empty('Tu catálogo empieza aquí', 'Guarda actividades para convertirlas después en tareas.'));
  active.forEach(activity => {
    const rowItem = element('div', 'activity-row');
    const detail = element('div', '');
    detail.append(element('strong', '', activity.name), element('p', 'muted', activity.category + ' · ' + activity.durationMinutes + ' min · ' + activity.frequency));
    if (activity.description) detail.append(element('p', 'muted', activity.description));
    rowItem.append(detail, button('Editar', 'edit-activity', 'button secondary small', { id: activity.id }), button('Crear tarea', 'task-from-activity', 'button secondary small', { id: activity.id }), button('Archivar', 'archive-activity', 'text-button', { id: activity.id }));
    list.append(rowItem);
  });
  main.append(list);
}

function renderCalendar(main) {
  const selected = state.selectedDate;
  const selectedDate = new Date(Number(selected.slice(0, 4)), Number(selected.slice(5, 7)) - 1, Number(selected.slice(8, 10)));
  const header = element('div', 'calendar-heading');
  const title = element('div', '');
  const controls = element('div', 'button-group calendar-controls');
  const modeControls = element('div', 'button-group calendar-mode');
  modeControls.append(
    button('Mes', 'calendar-mode-month', 'button ' + (state.calendarMode === 'month' ? 'primary' : 'secondary')),
    button('Semana', 'calendar-mode-week', 'button ' + (state.calendarMode === 'week' ? 'primary' : 'secondary'))
  );
  controls.append(modeControls);
  if (state.calendarMode === 'month') {
    const year = state.calendarDate.getFullYear();
    const month = state.calendarDate.getMonth();
    title.append(element('h1', '', state.calendarDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })), element('p', 'muted', 'Selecciona un día para revisar su agenda.'));
    controls.append(button('‹', 'calendar-prev', 'button secondary'), button('Hoy', 'calendar-today', 'button secondary'), button('›', 'calendar-next', 'button secondary'));
    header.append(title, controls);
    main.append(header);
    const wrap = card('calendar-card');
    const grid = element('div', 'calendar-grid');
    ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(day => grid.append(element('div', 'calendar-weekday', day)));
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < offset; i++) grid.append(element('div', 'calendar-blank'));
    for (let day = 1; day <= count; day++) {
      const key = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      const cell = button('', 'select-date', 'calendar-day' + (key === localDate() ? ' is-today' : '') + (key === selected ? ' is-selected' : ''), { date: key });
      cell.append(element('span', 'calendar-number', day));
      const countTasks = state.profile.tasks.filter(task => task.status === 'pending' && (task.scheduledDate === key || task.dueDate === key)).length;
      if (countTasks) cell.append(element('span', 'calendar-count', countTasks + (countTasks === 1 ? ' tarea' : ' tareas')));
      grid.append(cell);
    }
    wrap.append(grid);
    main.append(wrap);
  } else {
    const weekStart = shiftDate(selected, -((selectedDate.getDay() + 6) % 7));
    const weekEnd = shiftDate(weekStart, 6);
    title.append(element('h1', '', dateLabel(weekStart, { day: 'numeric', month: 'long' }) + ' – ' + dateLabel(weekEnd, { day: 'numeric', month: 'long', year: 'numeric' })), element('p', 'muted', 'Elige un día para consultar sus tareas.'));
    controls.append(button('‹ Semana', 'calendar-week-prev', 'button secondary'), button('Esta semana', 'calendar-today', 'button secondary'), button('Semana ›', 'calendar-week-next', 'button secondary'));
    header.append(title, controls);
    main.append(header);
    const week = card('week-calendar');
    for (let index = 0; index < 7; index++) {
      const key = shiftDate(weekStart, index);
      const dayTasks = state.profile.tasks.filter(task => task.status === 'pending' && (task.scheduledDate === key || task.dueDate === key));
      const dayButton = button('', 'select-date', 'week-day' + (key === localDate() ? ' is-today' : '') + (key === selected ? ' is-selected' : ''), { date: key });
      const top = element('div', 'week-day-top');
      top.append(element('strong', '', dateLabel(key, { weekday: 'short' })), element('span', '', key.slice(-2)));
      dayButton.append(top, element('span', 'week-day-count', dayTasks.length ? dayTasks.length + (dayTasks.length === 1 ? ' pendiente' : ' pendientes') : 'Sin pendientes'));
      dayTasks.slice(0, 2).forEach(task => dayButton.append(element('span', 'week-day-task', task.title)));
      if (dayTasks.length > 2) dayButton.append(element('span', 'week-day-more', '+' + (dayTasks.length - 2) + ' más'));
      week.append(dayButton);
    }
    main.append(week);
  }
  const selectedCard = card();
  const dayItems = state.profile.tasks.filter(task => task.scheduledDate === selected || task.dueDate === selected);
  selectedCard.append(heading(dateLabel(selected), dayItems.length ? dayItems.length + ' tareas asociadas a este día' : 'No hay tareas asociadas a este día'));
  renderTaskList(selectedCard, dayItems, { emptyTitle: 'Día despejado', emptyDetail: 'Puedes dejarlo así o añadir una tarea para esta fecha.' });
  selectedCard.append(button('+ Añadir tarea para este día', 'calendar-add-task', 'button primary'));
  selectedCard.append(button('Abrir planificador', 'navigate-date', 'button secondary', { date: selected }));
  main.append(selectedCard);
}

function renderPlanner(main) {
  const dateBar = element('div', 'calendar-heading');
  const title = element('div', '');
  title.append(element('h1', '', 'Planificador'), element('p', 'muted', dateLabel(state.selectedDate) + ' · Los compromisos bloqueados se respetan.'));
  const dateInput = input('selectedDate', '', 'date', state.selectedDate);
  dateInput.id = 'planner-date';
  dateBar.append(title, dateInput);
  main.append(dateBar);
  const scheduled = state.profile.tasks.filter(task => task.status === 'pending' && task.scheduledDate === state.selectedDate).sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));
  const agenda = card();
  agenda.append(heading('Agenda', scheduled.length + ' elementos programados'));
  renderTaskList(agenda, scheduled, { emptyTitle: 'No hay bloques programados', emptyDetail: 'Puedes asignar fecha y horario a una tarea.' });
  main.append(agenda);
  const unscheduled = card();
  const waiting = state.profile.tasks.filter(task => task.status === 'pending' && !task.scheduledDate);
  unscheduled.append(heading('Por organizar', waiting.length + ' tareas sin horario asignado'));
  renderTaskList(unscheduled, waiting, { emptyTitle: 'Todo tiene un día asignado', emptyDetail: 'No hay tareas pendientes de organizar.' });
  main.append(unscheduled);
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
  add.append(row2, button('Añadir a la agenda', 'submit-form', 'button primary'));
  main.append(add);
  const planner = card();
  planner.append(heading('Planificación asistida', 'Las propuestas nunca se aplican sin tu aprobación.'));
  planner.append(element('p', 'muted', 'Modo actual: ' + ({ manual: 'Manual', suggested: 'Sugerido', hybrid: 'Híbrido', automatic: 'Automático' }[state.profile.preferences.autonomy])));
  planner.append(button('Proponer horarios para tareas sin programar', 'generate-plan', 'button primary'));
  main.append(planner);
}

function renderFocus(main) {
  main.append(heading('Focus', 'Prepara tu sesión y después olvídate del reloj.'));
  const focus = state.profile.activeFocus;
  const focusCard = card('focus-panel');
  const selectedTask = focus ? taskById(focus.taskId) : null;
  const activity = selectedTask ? activityById(selectedTask.activityId) : null;
  const suggestedMinutes = focus ? Math.round(focus.durationSeconds / 60) : getSuggestedFocusMinutes(state.profile, $('#focus-task')?.value || null);
  const duration = focus ? Math.round(focus.durationSeconds / 60) : suggestedMinutes;
  const remaining = focus ? getFocusRemainingSeconds(focus) : duration * 60;
  const display = element('div', 'focus-clock', String(Math.floor(remaining / 60)).padStart(2, '0') + ':' + String(remaining % 60).padStart(2, '0'));
  display.id = 'focus-clock';
  focusCard.append(element('div', 'eyebrow', focus ? (focus.pausedAt ? 'SESIÓN EN PAUSA' : 'SESIÓN EN CURSO') : 'LISTO PARA CONCENTRARTE'), display);
  const taskSelect = select('taskId', [{ value: '', label: 'Sesión libre' }, ...state.profile.tasks.filter(task => task.status === 'pending').map(task => ({ value: task.id, label: task.title }))], focus ? focus.taskId || '' : '');
  taskSelect.id = 'focus-task';
  taskSelect.disabled = Boolean(focus);
  focusCard.append(field('¿En qué te vas a concentrar?', taskSelect));
  const durationInput = input('durationMinutes', 'Minutos', 'number', duration);
  durationInput.id = 'focus-duration';
  durationInput.min = '5'; durationInput.max = '180'; durationInput.step = '5';
  durationInput.disabled = Boolean(focus);
  focusCard.append(field('Duración de esta sesión (5–180 min)', durationInput));
  const durationHint = activity ? 'Sugerencia de la actividad «' + activity.name + '»: ' + activity.durationMinutes + ' min. Puedes ajustarla para esta sesión.' : 'Se usa tu duración habitual como sugerencia. Puedes cambiarla sin modificar tus preferencias.';
  focusCard.append(element('p', 'muted focus-hint', durationHint));
  const alarmOptions = element('div', 'focus-options');
  const soundLabel = element('label', 'focus-option');
  const sound = input('focusSound', '', 'checkbox'); sound.checked = state.profile.preferences.focusSound !== false; sound.disabled = Boolean(focus);
  soundLabel.append(sound, element('span', '', 'Alarma sonora al terminar'));
  const notificationLabel = element('label', 'focus-option');
  const notifications = input('focusNotifications', '', 'checkbox'); notifications.checked = state.profile.preferences.focusNotifications !== false; notifications.disabled = Boolean(focus);
  notificationLabel.append(notifications, element('span', '', 'Aviso del sistema'));
  alarmOptions.append(soundLabel, notificationLabel);
  focusCard.append(alarmOptions);
  const actions = element('div', 'button-group center');
  if (!focus) actions.append(button('Comenzar a concentrarme', 'focus-start', 'button primary large'));
  else {
    actions.append(button(focus.pausedAt ? 'Reanudar' : 'Pausar', 'focus-toggle', 'button primary large'));
    actions.append(button('Terminar sesión', 'focus-stop', 'button secondary'));
  }
  if (focus) actions.append(button('Reiniciar', 'focus-reset', 'button ghost'));
  focusCard.append(actions);
  if (focus) {
    const elapsed = getFocusElapsedSeconds(focus);
    focusCard.append(element('p', 'muted center-text', 'Tiempo concentrado: ' + Math.floor(elapsed / 60) + ' min · Al terminar recibirás un aviso.'));
  } else {
    focusCard.append(element('p', 'muted center-text', 'Al comenzar, puedes dejar esta pantalla y dedicarte a tu actividad. O-Isym te avisará al terminar.'));
  }
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
  main.append(heading('Objetivos', 'Avanza poco a poco y revisa lo que importa.'));
  const editing = state.editingGoalId ? goalById(state.editingGoalId) : null;
  const form = element('form', 'form-card');
  form.dataset.form = editing ? 'goal-edit' : 'goal';
  form.append(element('h3', '', editing ? 'Editar objetivo' : 'Nuevo objetivo'));
  form.append(field('Nombre', input('title', 'Ej. Practicar guitarra', 'text', editing?.title || '')));
  form.append(field('Descripción', textarea('description', '¿Qué quieres conseguir?', editing?.description || '')));
  const row = element('div', 'form-grid');
  row.append(field('Meta numérica', input('target', '10', 'number', editing?.target || 10)), field('Unidad', input('unit', 'sesiones', 'text', editing?.unit || '')));
  form.append(row, field('Fecha objetivo (opcional)', input('dueDate', '', 'date', editing?.dueDate || '')), button(editing ? 'Guardar cambios' : 'Crear objetivo', 'submit-form', 'button primary'));
  if (editing) form.append(button('Cancelar', 'cancel-edit-goal', 'button secondary'));
  main.append(form);
  const list = card();
  list.append(heading('En marcha', 'Actualiza el progreso cuando avances.'));
  const goals = state.profile.goals.filter(goal => !goal.archived);
  if (!goals.length) list.append(empty('Todavía no tienes objetivos', 'Define uno pequeño y concreto para comenzar.'));
  goals.forEach(goal => {
    const row = element('div', 'goal-row');
    const top = element('div', 'goal-top');
    top.append(element('strong', '', goal.title), element('span', 'muted', goal.progress + ' / ' + goal.target + ' ' + goal.unit));
    const track = element('div', 'progress-track');
    const fill = element('div', 'progress-fill');
    fill.style.width = Math.min(100, goal.progress / goal.target * 100) + '%';
    track.append(fill);
    const actions = element('div', 'button-group');
    actions.append(button('+1', 'goal-progress', 'button secondary small', { id: goal.id, amount: 1 }), button('−1', 'goal-progress', 'button secondary small', { id: goal.id, amount: -1 }), button('Editar', 'edit-goal', 'button secondary small', { id: goal.id }), button('Archivar', 'archive-goal', 'text-button', { id: goal.id }));
    row.append(top, track, actions);
    list.append(row);
  });
  main.append(list);
}

function renderInsights(main) {
  main.append(heading('Insights', 'Una mirada amable a tus hábitos y tu tiempo.'));
  const today = localDate();
  const weekStart = shiftDate(today, -((new Date().getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(weekStart, index));
  const completed = state.profile.tasks.filter(task => task.status === 'done' && task.completedAt && days.includes(task.completedAt.slice(0, 10)));
  const created = state.profile.tasks.filter(task => task.createdAt && days.includes(task.createdAt.slice(0, 10)));
  const minutes = state.profile.focusSessions.filter(session => days.includes(session.endedAt.slice(0, 10))).reduce((sum, session) => sum + session.durationSeconds, 0) / 60;
  const metrics = element('div', 'metrics-grid');
  [['Tareas completadas', completed.length], ['Tareas creadas', created.length], ['Tiempo de enfoque', Math.round(minutes) + ' min'], ['Objetivos activos', state.profile.goals.filter(goal => !goal.archived).length]].forEach(([label, value]) => {
    const metric = card('metric-card');
    metric.append(element('span', 'muted', label), element('strong', '', value));
    metrics.append(metric);
  });
  main.append(metrics);
  const week = card();
  week.append(heading('Actividad de la semana', 'Tareas completadas por día.'));
  days.forEach(day => {
    const count = state.profile.tasks.filter(task => task.status === 'done' && task.completedAt && task.completedAt.slice(0, 10) === day).length;
    const line = element('div', 'chart-line');
    line.append(element('span', '', dateLabel(day, { weekday: 'short', day: 'numeric' })));
    const track = element('div', 'chart-track');
    const fill = element('div', 'chart-fill');
    fill.style.width = Math.min(100, count * 12) + '%';
    track.append(fill);
    line.append(track, element('strong', '', count));
    week.append(line);
  });
  main.append(week);
  const note = card('note-card');
  note.append(element('strong', '', 'Las estadísticas son información, no una calificación.'), element('p', 'muted', 'Descansar, cambiar de prioridades o dejar espacio libre también forma parte de una buena organización.'));
  main.append(note);
}

function renderSettings(main) {
  main.append(heading('Ajustes', 'Configura O-Isym para que trabaje a tu manera.'));
  const profileForm = element('form', 'form-card');
  profileForm.dataset.form = 'profile-settings';
  profileForm.append(element('h3', '', 'Tu perfil'));
  profileForm.append(field('Nombre', input('name', 'Nombre del perfil', 'text', state.profile.name)));
  profileForm.append(field('Color de acento', input('color', '', 'color', state.profile.color)));
  profileForm.append(field('Autonomía del planificador', select('autonomy', [
    { value: 'manual', label: 'Manual — yo organizo todo' },
    { value: 'suggested', label: 'Sugerido — O-Isym propone' },
    { value: 'hybrid', label: 'Híbrido — automatiza solo reglas permitidas' },
    { value: 'automatic', label: 'Automático — organiza tareas flexibles' }
  ], state.profile.preferences.autonomy)));
  const row = element('div', 'form-grid');
  row.append(field('Minutos de enfoque', input('focusMinutes', '', 'number', state.profile.preferences.focusMinutes)));
  row.append(field('Minutos de descanso', input('breakMinutes', '', 'number', state.profile.preferences.breakMinutes)));
  profileForm.append(row);
  const hours = element('div', 'form-grid');
  hours.append(field('Inicio habitual', input('workingDayStart', '', 'time', state.profile.preferences.workingDayStart || '09:00')));
  hours.append(field('Fin habitual', input('workingDayEnd', '', 'time', state.profile.preferences.workingDayEnd || '17:00')));
  profileForm.append(hours, button('Guardar preferencias', 'submit-form', 'button primary'));
  main.append(profileForm);

  const dataCard = card();
  dataCard.append(heading('Tus datos', 'Exporta una copia o recupera un archivo.'));
  dataCard.append(button('Exportar copia JSON', 'export-data', 'button secondary'));
  const importLabel = field('Importar copia JSON', input('backupFile', '', 'file'));
  importLabel.querySelector('input').accept = 'application/json,.json';
  importLabel.querySelector('input').id = 'backup-file';
  dataCard.append(importLabel);
  dataCard.append(button('Importar archivo seleccionado', 'import-data', 'button secondary'));
  main.append(dataCard);

  const migration = card();
  migration.append(heading('Datos del prototipo anterior', 'O-Isym no borra el almacenamiento antiguo.'));
  const legacy = inspectLegacyData();
  migration.append(element('p', 'muted', legacy.summary));
  if (!state.profile.legacyImportedAt && legacy.total > 0) {
    migration.append(element('p', 'small-note', 'La importación crea tareas y actividades en este perfil. Los datos originales de localStorage se conservan.'));
    migration.append(button('Importar datos del prototipo', 'import-legacy', 'button secondary'));
  } else if (state.profile.legacyImportedAt) {
    migration.append(element('p', 'small-note', 'Este perfil ya importó datos el ' + new Date(state.profile.legacyImportedAt).toLocaleString('es-MX') + '.'));
  }
  main.append(migration);

  const profiles = card();
  profiles.append(heading('Perfiles', 'Cada perfil mantiene sus propios datos.'));
  state.snapshot.profiles.forEach(profile => {
    const row = element('div', 'profile-row');
    row.append(element('strong', '', profile.name), element('span', 'muted', profile.id === state.profile.id ? 'Perfil actual' : 'Perfil independiente'));
    if (profile.id !== state.profile.id) row.append(button('Cambiar', 'switch-profile', 'button secondary small', { id: profile.id }));
    if (state.snapshot.profiles.length > 1 && profile.id === state.profile.id) row.append(button('Eliminar perfil', 'delete-profile', 'text-button danger'));
    profiles.append(row);
  });
  main.append(profiles);
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
  try {
    if (form.dataset.form === 'task' || form.dataset.form === 'planner-task' || form.dataset.form === 'task-edit') {
      data.locked = data.locked === 'true';
      if (data.startTime || data.endTime) {
        if (!data.startTime || !data.endTime || data.endTime <= data.startTime) throw new Error('Si asignas un horario, la hora de fin debe ser posterior al inicio.');
      }
      if (form.dataset.form === 'planner-task') {
        data.scheduledDate = state.selectedDate;
        if (!data.startTime || !data.endTime || data.endTime <= data.startTime) throw new Error('El horario debe tener una hora de fin posterior al inicio.');
        data.estimatedMinutes = (Number(data.endTime.slice(0, 2)) * 60 + Number(data.endTime.slice(3))) - (Number(data.startTime.slice(0, 2)) * 60 + Number(data.startTime.slice(3)));
      }
      if (form.dataset.form === 'task-edit') {
        const editingId = state.editingTaskId;
        const current = taskById(editingId);
        if (!current) throw new Error('La tarea que intentas editar ya no existe.');
        state.profile.tasks = state.profile.tasks.map(item => item.id === editingId ? updateTask(item, data) : item);
        state.editingTaskId = null;
        showToast('Cambios guardados.');
      } else {
        state.profile.tasks.unshift(createTask(data));
        showToast('Tarea guardada.');
      }
      await save();
      state.view = form.dataset.form === 'planner-task' ? 'planner' : state.view;
    } else if (form.dataset.form === 'activity-edit') {
      const current = activityById(state.editingActivityId);
      if (!current) throw new Error('La actividad que intentas editar ya no existe.');
      state.profile.activities = state.profile.activities.map(item => item.id === current.id ? updateActivity(item, data) : item);
      state.editingActivityId = null;
      await save();
      showToast('Actividad actualizada.');
    } else if (form.dataset.form === 'activity') {
      state.profile.activities.unshift(createActivity(data));
      await save();
      showToast('Actividad creada.');
    } else if (form.dataset.form === 'goal-edit') {
      const current = goalById(state.editingGoalId);
      if (!current) throw new Error('El objetivo que intentas editar ya no existe.');
      state.profile.goals = state.profile.goals.map(item => item.id === current.id ? updateGoal(item, data) : item);
      state.editingGoalId = null;
      await save();
      showToast('Objetivo actualizado.');
    } else if (form.dataset.form === 'goal') {
      state.profile.goals.unshift(createGoal(data));
      await save();
      showToast('Objetivo creado.');
    } else if (form.dataset.form === 'profile-settings') {
      state.profile.name = String(data.name).trim().slice(0, 60) || state.profile.name;
      state.profile.color = /^#[0-9a-f]{6}$/i.test(data.color) ? data.color : state.profile.color;
      state.profile.preferences.autonomy = data.autonomy;
      state.profile.preferences.focusMinutes = clampNumber(data.focusMinutes, 5, 180, 25);
      state.profile.preferences.breakMinutes = clampNumber(data.breakMinutes, 1, 60, 5);
      if (data.workingDayStart && data.workingDayEnd && data.workingDayEnd > data.workingDayStart) {
        state.profile.preferences.workingDayStart = data.workingDayStart;
        state.profile.preferences.workingDayEnd = data.workingDayEnd;
      } else {
        throw new Error('El horario habitual debe terminar después de comenzar.');
      }
      await save();
      showToast('Preferencias guardadas.');
    }
    updateShell();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

let focusAudioContext = null;
async function prepareFocusAlarm() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      focusAudioContext = focusAudioContext || new AudioContextClass();
      if (focusAudioContext.state === 'suspended') await focusAudioContext.resume();
    }
    if (state.profile.preferences.focusNotifications !== false && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  } catch (error) {
    // La sesión sigue funcionando aunque el sistema no permita audio o notificaciones.
  }
}
function playFocusAlarm() {
  if (state.profile.preferences.focusSound === false || !focusAudioContext || focusAudioContext.state !== 'running') return;
  try {
    [0, 0.38, 0.76].forEach((delay, index) => {
      const oscillator = focusAudioContext.createOscillator();
      const gain = focusAudioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = [660, 784, 988][index];
      gain.gain.setValueAtTime(0.0001, focusAudioContext.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.16, focusAudioContext.currentTime + delay + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, focusAudioContext.currentTime + delay + 0.28);
      oscillator.connect(gain); gain.connect(focusAudioContext.destination);
      oscillator.start(focusAudioContext.currentTime + delay);
      oscillator.stop(focusAudioContext.currentTime + delay + 0.3);
    });
  } catch (error) {}
}
function notifyFocusFinished(taskTitle) {
  playFocusAlarm();
  if (state.profile.preferences.focusNotifications !== false && 'Notification' in window && Notification.permission === 'granted') {
    try { new Notification('Focus terminado', { body: taskTitle ? 'Terminaste tu sesión de ' + taskTitle + '. Toca para volver a O-Isym.' : 'Terminaste tu sesión de concentración. Tómate un descanso.' }); } catch (error) {}
  }
}
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
  state.profile.focusSessions.push(createFocusSession(focus, task ? task.title : '', now));
  state.profile.activeFocus = null;
  stopFocusTicker();
  const saved = await save();
  state.focusFinishing = false;
  if (options.completed && !options.silent) notifyFocusFinished(task ? task.title : '');
  if (!options.silent) showToast(saved ? (options.completed ? '¡Tiempo completado! Tu sesión quedó guardada. Es buen momento para descansar.' : 'Sesión guardada.') : 'La sesión terminó, pero no se pudo guardar. Revisa el almacenamiento.', saved ? 'success' : 'error');
  updateShell();
}

root.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (action === 'navigate') { state.view = target.dataset.view; updateShell(); }
  if (action === 'new-profile') {
    const name = prompt('Nombre del nuevo perfil:');
    if (name && name.trim()) {
      if (state.snapshot.profiles.length >= 50) return showToast('Has alcanzado el máximo de perfiles.', 'error');
      const profile = createProfile(name);
      state.snapshot.profiles.push(profile);
      state.profile = profile;
      await save(); state.view = 'today'; updateShell(); showToast('Perfil creado.');
    }
  }
  if (action === 'quick-task') {
    state.view = 'tasks'; updateShell();
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
    state.view = 'tasks';
    updateShell();
    const titleInput = $('.task-form input[name="title"]');
    if (titleInput) { titleInput.focus(); titleInput.select(); }
  }
  if (action === 'cancel-edit-task') {
    state.editingTaskId = null;
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
    state.view = 'activities';
    updateShell();
    const nameInput = $('.form-card input[name="name"]');
    if (nameInput) { nameInput.focus(); nameInput.select(); }
  }
  if (action === 'cancel-edit-activity') { state.editingActivityId = null; updateShell(); }
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
    state.editingTaskId = null;
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
    const proposals = suggestSchedule(state.profile, state.selectedDate);
    if (!proposals.length) return showToast('No hay tareas flexibles sin programar o no queda espacio disponible.', 'error');
    if (confirm('O-Isym encontró ' + proposals.length + ' espacios. ¿Aplicar estas propuestas? Los compromisos bloqueados no se modificarán.')) {
      const map = new Map(proposals.map(item => [item.taskId, item]));
      state.profile.tasks = state.profile.tasks.map(task => {
        const proposal = map.get(task.id);
        return proposal && !task.locked ? updateTask(task, { scheduledDate: proposal.date, startTime: proposal.startTime, endTime: proposal.endTime }) : task;
      });
      await save(); updateShell(); showToast('Plan actualizado.');
    }
  }
  if (action === 'focus-start' && !state.profile.activeFocus) {
    const taskId = $('#focus-task')?.value || null;
    const task = taskById(taskId);
    const activity = task ? activityById(task.activityId) : null;
    const requestedMinutes = clampNumber($('#focus-duration')?.value, 5, 180, getSuggestedFocusMinutes(state.profile, taskId));
    if ($('#focus-duration') && (!$('#focus-duration').value || Number($('#focus-duration').value) < 5 || Number($('#focus-duration').value) > 180)) {
      return showToast('Elige una duración entre 5 y 180 minutos.', 'error');
    }
    state.profile.preferences.focusSound = $('#focus-panel input[name="focusSound"]')?.checked !== false;
    state.profile.preferences.focusNotifications = $('#focus-panel input[name="focusNotifications"]')?.checked !== false;
    await prepareFocusAlarm();
    const now = new Date().toISOString();
    state.profile.activeFocus = { taskId, activityTitle: activity ? activity.name : '', startedAt: now, sessionStartedAt: now, pausedAt: null, elapsedBeforePause: 0, durationSeconds: requestedMinutes * 60 };
    await save(); updateShell();
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
      await save(); updateShell();
    }
  }
  if (action === 'focus-stop') await finishFocus();
  if (action === 'focus-reset') {
    if (state.profile.activeFocus && !confirm('¿Terminar y descartar la sesión actual?')) return;
    state.profile.activeFocus = null; stopFocusTicker(); await save(); updateShell();
  }
  if (action === 'goal-progress') {
    state.profile.goals = state.profile.goals.map(goal => goal.id === id ? { ...goal, progress: Math.max(0, Math.min(goal.target, goal.progress + Number(target.dataset.amount))) } : goal);
    await save(); updateShell();
  }
  if (action === 'edit-goal') {
    if (!goalById(id)) return;
    state.editingGoalId = id;
    state.view = 'goals';
    updateShell();
    const titleInput = $('.form-card input[name="title"]');
    if (titleInput) { titleInput.focus(); titleInput.select(); }
  }
  if (action === 'cancel-edit-goal') { state.editingGoalId = null; updateShell(); }
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
    try {
      const imported = JSON.parse(await file.text());
      validateSnapshot(imported);
      if (!confirm('La importación reemplazará los datos actuales. O-Isym conservará una copia de seguridad. ¿Continuar?')) return;
      state.snapshot = imported;
      state.snapshot.profiles = state.snapshot.profiles.map(normalizeProfile);
      state.profile = state.snapshot.profiles.find(profile => profile.id === state.snapshot.activeProfileId) || state.snapshot.profiles[0];
      if (!state.profile) throw new Error('El archivo no contiene perfiles.');
      await save(); updateShell(); showToast('Copia importada.');
    } catch (error) { showToast('No se pudo importar: ' + error.message, 'error'); }
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
    if (profile) { state.profile = normalizeProfile(profile); state.snapshot.activeProfileId = id; await save(); updateShell(); }
  }
  if (action === 'delete-profile') {
    if (state.snapshot.profiles.length <= 1) return showToast('Debe existir al menos un perfil.', 'error');
    if (!confirm('Se eliminarán los datos de este perfil. Esta acción no se puede deshacer. ¿Continuar?')) return;
    state.snapshot.profiles = state.snapshot.profiles.filter(item => item.id !== state.profile.id);
    state.profile = normalizeProfile(state.snapshot.profiles[0]);
    state.snapshot.activeProfileId = state.profile.id;
    await save(); updateShell();
  }
});

root.addEventListener('submit', event => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  handleSubmit(form);
});
root.addEventListener('change', event => {
  if (event.target.id === 'profile-select') {
    const profile = state.snapshot.profiles.find(item => item.id === event.target.value);
    if (profile) { state.profile = normalizeProfile(profile); state.snapshot.activeProfileId = profile.id; save().then(updateShell); }
  }
  if (event.target.id === 'planner-date') {
    state.selectedDate = event.target.value || localDate();
    updateShell();
  }
  if (event.target.id === 'focus-task') {
    const duration = $('#focus-duration');
    if (duration) duration.value = getSuggestedFocusMinutes(state.profile, event.target.value || null);
    const hint = $('.focus-hint');
    const task = taskById(event.target.value);
    const activity = task ? activityById(task.activityId) : null;
    if (hint) hint.textContent = activity ? 'Sugerencia de la actividad «' + activity.name + '»: ' + activity.durationMinutes + ' min. Puedes ajustarla para esta sesión.' : 'Se usa tu duración habitual como sugerencia. Puedes cambiarla sin modificar tus preferencias.';
  }
  if (event.target.name === 'focusSound' || event.target.name === 'focusNotifications') {
    state.profile.preferences[event.target.name] = event.target.checked;
    save();
  }
});

async function boot() {
  try {
    state.snapshot = await window.oisym.storage.read();
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
      }
    }
    await save();
  } catch (error) {
    root.replaceChildren();
    const panel = element('div', 'fatal-screen');
    panel.append(element('h1', '', 'No se pudieron abrir tus datos'), element('p', '', error.message), element('p', 'muted', 'O-Isym protegió el archivo y no lo sobrescribió. Revisa la carpeta de datos o restaura una copia de seguridad.'));
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
