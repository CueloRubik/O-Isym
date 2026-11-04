export const SCHEMA_VERSION = 1;
export const AUTONOMY_MODES = ['manual', 'suggested', 'hybrid', 'automatic'];

export function makeId(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 10);
  return prefix + '-' + Date.now().toString(36) + '-' + random;
}

export function localDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

export function shiftDate(dateKey, amount) {
  const parts = dateKey.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2] + amount);
  return localDate(date);
}

export function createProfile(name, color = '#27856b') {
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

export function normalizeProfile(profile) {
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

export function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function createActivity(input) {
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

export function createTask(input) {
  const title = String(input.title || '').trim();
  if (!title) throw new Error('Escribe un título para la tarea.');
  const date = input.scheduledDate || input.dueDate || '';
  return {
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
}

export function updateTask(task, patch) {
  const next = { ...task, ...patch, updatedAt: new Date().toISOString() };
  if (patch.title !== undefined) {
    next.title = String(patch.title).trim().slice(0, 140);
    if (!next.title) throw new Error('El título no puede quedar vacío.');
  }
  if (patch.status === 'done') next.completedAt = new Date().toISOString();
  if (patch.status === 'pending') next.completedAt = null;
  return next;
}

export function createGoal(input) {
  const title = String(input.title || '').trim();
  if (!title) throw new Error('Escribe un nombre para el objetivo.');
  return {
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
}

export function getRecommendations(profile, today = localDate()) {
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

export function suggestSchedule(profile, dateKey) {
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

export function validateSnapshot(snapshot) {
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
