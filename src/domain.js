(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OIsymDomain = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
const SCHEMA_VERSION = 1;
const AUTONOMY_MODES = ['manual', 'suggested', 'hybrid', 'automatic'];

function makeId(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 10);
  return prefix + '-' + Date.now().toString(36) + '-' + random;
}

function localDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function shiftDate(dateKey, amount) {
  const parts = dateKey.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2] + amount);
  return localDate(date);
}

function createProfile(name, color = '#27856b') {
  const now = new Date().toISOString();
  return {
    id: makeId('profile'),
    name: String(name).trim().slice(0, 60),
    color,
    createdAt: now,
    updatedAt: now,
    preferences: {
      autonomy: 'suggested',
      weekStartsOn: 1,
      focusMinutes: 25,
      breakMinutes: 5,
      workingDayStart: '09:00',
      workingDayEnd: '17:00'
    },
    activities: [],
    tasks: [],
    goals: [],
    focusSessions: [],
    activeFocus: null,
    legacyImportedAt: null
  };
}

function normalizeProfile(profile) {
  const base = createProfile(profile && profile.name ? profile.name : 'Mi espacio');
  const value = profile && typeof profile === 'object' ? profile : {};
  const preferences = value.preferences && typeof value.preferences === 'object' ? value.preferences : {};
  return {
    ...base,
    ...value,
    id: typeof value.id === 'string' && value.id ? value.id : base.id,
    name: typeof value.name === 'string' && value.name.trim() ? value.name.trim().slice(0, 60) : base.name,
    color: /^#[0-9a-f]{6}$/i.test(value.color || '') ? value.color : base.color,
    preferences: {
      ...base.preferences,
      ...preferences,
      autonomy: AUTONOMY_MODES.includes(preferences.autonomy) ? preferences.autonomy : 'suggested',
      focusMinutes: clampNumber(preferences.focusMinutes, 5, 180, 25),
      breakMinutes: clampNumber(preferences.breakMinutes, 1, 60, 5)
    },
    activities: Array.isArray(value.activities) ? value.activities : [],
    tasks: Array.isArray(value.tasks) ? value.tasks : [],
    goals: Array.isArray(value.goals) ? value.goals : [],
    focusSessions: Array.isArray(value.focusSessions) ? value.focusSessions : [],
    activeFocus: value.activeFocus && typeof value.activeFocus === 'object' ? value.activeFocus : null
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function createActivity(input) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('Escribe un nombre para la actividad.');
  return {
    id: makeId('activity'),
    name: name.slice(0, 90),
    category: String(input.category || 'Personal').trim().slice(0, 40),
    description: String(input.description || '').trim().slice(0, 500),
    durationMinutes: clampNumber(input.durationMinutes, 5, 600, 30),
    frequency: String(input.frequency || 'Cuando lo necesite').slice(0, 50),
    archived: false,
    createdAt: new Date().toISOString()
  };
}

function isValidDateKey(value) {
  if (!value) return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isValidTimeKey(value) {
  return !value || (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
}

function validateTaskSchedule(task) {
  if (!isValidDateKey(task.scheduledDate) || !isValidDateKey(task.dueDate)) {
    throw new Error('Las fechas de la tarea no son válidas.');
  }
  if (!isValidTimeKey(task.startTime) || !isValidTimeKey(task.endTime)) {
    throw new Error('La hora debe tener un formato válido.');
  }
  if (Boolean(task.startTime) !== Boolean(task.endTime)) {
    throw new Error('Indica tanto la hora de inicio como la de fin.');
  }
  if (task.startTime && task.endTime <= task.startTime) {
    throw new Error('La hora de fin debe ser posterior al inicio.');
  }
}

function createTask(input) {
  const title = String(input.title || '').trim();
  if (!title) throw new Error('Escribe un título para la tarea.');
  const task = {
    id: makeId('task'),
    title: title.slice(0, 140),
    description: String(input.description || '').trim().slice(0, 1000),
    status: 'pending',
    priority: ['low', 'medium', 'high'].includes(input.priority) ? input.priority : 'medium',
    estimatedMinutes: clampNumber(input.estimatedMinutes, 5, 1440, 30),
    dueDate: input.dueDate || '',
    scheduledDate: input.scheduledDate || '',
    startTime: input.startTime || '',
    endTime: input.endTime || '',
    locked: Boolean(input.locked),
    activityId: input.activityId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null
  };
  validateTaskSchedule(task);
  return task;
}

function updateTask(task, patch) {
  const next = { ...task, ...patch, updatedAt: new Date().toISOString() };
  if (patch.title !== undefined) {
    next.title = String(patch.title).trim().slice(0, 140);
    if (!next.title) throw new Error('El título no puede quedar vacío.');
  }
  if (patch.status !== undefined && !['pending', 'done'].includes(patch.status)) {
    throw new Error('El estado de la tarea no es válido.');
  }
  if (patch.priority !== undefined && !['low', 'medium', 'high'].includes(patch.priority)) {
    throw new Error('La prioridad de la tarea no es válida.');
  }
  if (patch.estimatedMinutes !== undefined) next.estimatedMinutes = clampNumber(patch.estimatedMinutes, 5, 1440, 30);
  if (patch.locked !== undefined) next.locked = Boolean(patch.locked);
  if (patch.activityId !== undefined) next.activityId = patch.activityId || null;
  validateTaskSchedule(next);
  if (patch.status === 'done') next.completedAt = new Date().toISOString();
  if (patch.status === 'pending') next.completedAt = null;
  return next;
}

function updateActivity(activity, patch) {
  const next = { ...activity, ...patch, updatedAt: new Date().toISOString() };
  if (patch.name !== undefined) {
    next.name = String(patch.name).trim().slice(0, 90);
    if (!next.name) throw new Error('El nombre de la actividad no puede quedar vacío.');
  }
  if (patch.category !== undefined) next.category = String(patch.category || 'Personal').trim().slice(0, 40);
  if (patch.description !== undefined) next.description = String(patch.description || '').trim().slice(0, 500);
  if (patch.durationMinutes !== undefined) next.durationMinutes = clampNumber(patch.durationMinutes, 5, 600, 30);
  if (patch.frequency !== undefined) next.frequency = String(patch.frequency || 'Cuando lo necesite').trim().slice(0, 50);
  return next;
}

function createGoal(input) {
  const title = String(input.title || '').trim();
  if (!title) throw new Error('Escribe un nombre para el objetivo.');
  const goal = {
    id: makeId('goal'),
    title: title.slice(0, 100),
    description: String(input.description || '').trim().slice(0, 500),
    target: clampNumber(input.target, 1, 1000000, 1),
    progress: 0,
    unit: String(input.unit || 'veces').trim().slice(0, 30),
    dueDate: input.dueDate || '',
    createdAt: new Date().toISOString(),
    archived: false
  };
  if (!isValidDateKey(goal.dueDate)) throw new Error('La fecha objetivo no es válida.');
  return goal;
}

function updateGoal(goal, patch) {
  const next = { ...goal, ...patch, updatedAt: new Date().toISOString() };
  if (patch.title !== undefined) {
    next.title = String(patch.title).trim().slice(0, 100);
    if (!next.title) throw new Error('El nombre del objetivo no puede quedar vacío.');
  }
  if (patch.description !== undefined) next.description = String(patch.description || '').trim().slice(0, 500);
  if (patch.target !== undefined) next.target = clampNumber(patch.target, 1, 1000000, 1);
  if (patch.unit !== undefined) next.unit = String(patch.unit || 'veces').trim().slice(0, 30);
  if (patch.dueDate !== undefined) next.dueDate = patch.dueDate || '';
  if (!isValidDateKey(next.dueDate)) throw new Error('La fecha objetivo no es válida.');
  next.progress = clampNumber(next.progress, 0, next.target, 0);
  return next;
}

function getRecommendations(profile, today = localDate()) {
  const mode = profile.preferences.autonomy;
  if (mode === 'manual') return [];
  const suggestions = [];
  for (const task of profile.tasks) {
    if (task.status !== 'pending' || task.locked) continue;
    if (task.dueDate && task.dueDate < today && task.scheduledDate !== today) {
      suggestions.push({
        id: 'overdue-' + task.id,
        taskId: task.id,
        title: 'Revisar tarea atrasada',
        detail: '“' + task.title + '” tiene una fecha anterior a hoy. Puedes reprogramarla sin alterar compromisos bloqueados.',
        date: today,
        kind: 'reschedule'
      });
    } else if (!task.scheduledDate && task.dueDate !== today) {
      suggestions.push({
        id: 'unscheduled-' + task.id,
        taskId: task.id,
        title: 'Encontrar un espacio para esta tarea',
        detail: '“' + task.title + '” todavía no tiene un día asignado.',
        date: today,
        kind: 'schedule'
      });
    }
  }
  return suggestions.slice(0, 5);
}

function suggestSchedule(profile, dateKey) {
  const startAt = profile.preferences.workingDayStart || '09:00';
  const endAt = profile.preferences.workingDayEnd || '17:00';
  const toMinutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  const fromMinutes = toMinutes(startAt);
  const untilMinutes = toMinutes(endAt);
  const occupied = profile.tasks
    .filter(task => task.status === 'pending' && task.scheduledDate === dateKey && task.startTime && task.endTime)
    .map(task => [toMinutes(task.startTime), toMinutes(task.endTime)])
    .sort((a, b) => a[0] - b[0]);
  const candidates = profile.tasks
    .filter(task => task.status === 'pending' && !task.locked && !task.scheduledDate)
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - ({ high: 0, medium: 1, low: 2 }[b.priority])));
  const proposals = [];
  let cursor = fromMinutes;
  for (const task of candidates) {
    const duration = clampNumber(task.estimatedMinutes, 5, 600, 30);
    for (const slot of occupied) {
      if (cursor + duration <= slot[0]) break;
      if (cursor < slot[1]) cursor = slot[1];
    }
    if (cursor + duration > untilMinutes) continue;
    const start = String(Math.floor(cursor / 60)).padStart(2, '0') + ':' + String(cursor % 60).padStart(2, '0');
    const finishMinutes = cursor + duration;
    const end = String(Math.floor(finishMinutes / 60)).padStart(2, '0') + ':' + String(finishMinutes % 60).padStart(2, '0');
    proposals.push({ taskId: task.id, date: dateKey, startTime: start, endTime: end });
    occupied.push([cursor, finishMinutes]);
    occupied.sort((a, b) => a[0] - b[0]);
    cursor = finishMinutes;
  }
  return proposals;
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || snapshot.schemaVersion !== SCHEMA_VERSION) {
    throw new Error('El archivo no tiene una versión de O-Isym compatible.');
  }
  if (!Array.isArray(snapshot.profiles) || snapshot.profiles.length > 50) {
    throw new Error('La lista de perfiles no es válida.');
  }
  const ids = new Set();
  for (const profile of snapshot.profiles) {
    if (!profile || typeof profile.id !== 'string' || !profile.id || ids.has(profile.id)) {
      throw new Error('Hay perfiles con identificadores inválidos o repetidos.');
    }
    if (typeof profile.name !== 'string' || !profile.name.trim() || profile.name.length > 60) {
      throw new Error('Hay un perfil con un nombre inválido.');
    }
    ids.add(profile.id);
  }
  if (snapshot.activeProfileId !== null && !ids.has(snapshot.activeProfileId)) {
    throw new Error('El perfil activo no existe en los datos.');
  }
  return true;
}

return { SCHEMA_VERSION, AUTONOMY_MODES, makeId, localDate, shiftDate, createProfile, normalizeProfile, clampNumber, createActivity, updateActivity, createTask, updateTask, createGoal, updateGoal, getRecommendations, suggestSchedule, validateSnapshot };
});
