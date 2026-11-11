(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./domain.js'));
  else root.OIsymPlanning = factory(root.OIsymDomain);
})(typeof globalThis !== 'undefined' ? globalThis : window, function (domain) {
  'use strict';
  const { createTask, updateTask, makeId, shiftDate } = domain;
  const priorities = { high: 0, medium: 1, low: 2 };
  const tasksOf = profile => Array.isArray(profile && profile.tasks) ? profile.tasks : [];
  const templatesOf = profile => Array.isArray(profile && profile.dayTemplates) ? profile.dayTemplates : [];
  const validDate = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return y >= 100 && date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  };
  const minute = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
    ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : null;
  const formattedTime = value => String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
  const orderTasks = (a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99')
    || (priorities[a.priority] ?? 1) - (priorities[b.priority] ?? 1) || String(a.title).localeCompare(String(b.title), 'es');

  // Only projections: no calendar-specific collection is written to disk.
  function getItemsForDay(profile, date) {
    if (!validDate(date)) return [];
    return tasksOf(profile).filter(task => task.scheduledDate === date || task.dueDate === date)
      .map(task => ({
        id: task.id, kind: 'task', task,
        scheduled: task.scheduledDate === date,
        deadline: task.dueDate === date,
        timed: task.scheduledDate === date && minute(task.startTime) !== null && minute(task.endTime) !== null
      })).sort((a, b) => Number(b.timed) - Number(a.timed) || orderTasks(a.task, b.task));
  }
  function getCalendarRange(profile, start, end) {
    if (!validDate(start) || !validDate(end) || end < start) return [];
    const result = [];
    for (let date = start; date <= end && result.length < 370; date = shiftDate(date, 1)) {
      result.push({ date, items: getItemsForDay(profile, date) });
    }
    return result;
  }
  function getUnscheduledTasks(profile) {
    return tasksOf(profile).filter(task => task.status === 'pending' && !task.scheduledDate)
      .slice().sort((a, b) => (priorities[a.priority] ?? 1) - (priorities[b.priority] ?? 1)
        || (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31')
        || String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  }
  function scheduledIntervals(profile, date) {
    return tasksOf(profile).filter(task => task.scheduledDate === date && task.status !== 'done')
      .map(task => ({ task, start: minute(task.startTime), end: minute(task.endTime) }))
      .filter(slot => slot.start !== null && slot.end !== null && slot.end > slot.start)
      .sort((a, b) => a.start - b.start || a.end - b.end);
  }
  function detectScheduleConflicts(profile, date) {
    const slots = scheduledIntervals(profile, date);
    const conflicts = [];
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length && slots[j].start < slots[i].end; j++) {
        if (slots[i].task.id !== slots[j].task.id && slots[j].end > slots[i].start) {
          conflicts.push({
            firstId: slots[i].task.id, secondId: slots[j].task.id,
            firstTitle: slots[i].task.title, secondTitle: slots[j].task.title,
            startTime: formattedTime(Math.max(slots[i].start, slots[j].start)),
            endTime: formattedTime(Math.min(slots[i].end, slots[j].end)),
            locked: Boolean(slots[i].task.locked || slots[j].task.locked)
          });
        }
      }
    }
    return conflicts;
  }
  function getFreeTimeSlots(profile, date) {
    const prefs = profile && profile.preferences || {};
    const requestedStart = minute(prefs.workingDayStart);
    const requestedEnd = minute(prefs.workingDayEnd);
    const start = requestedStart === null ? 540 : requestedStart;
    const end = requestedEnd === null || requestedEnd <= start ? 1020 : requestedEnd;
    const occupied = scheduledIntervals(profile, date).map(slot => [Math.max(start, slot.start), Math.min(end, slot.end)])
      .filter(pair => pair[1] > pair[0]);
    const merged = [];
    for (const slot of occupied) {
      const previous = merged[merged.length - 1];
      if (previous && slot[0] <= previous[1]) previous[1] = Math.max(previous[1], slot[1]);
      else merged.push(slot.slice());
    }
    const free = [];
    let cursor = start;
    for (const slot of merged) {
      if (slot[0] > cursor) free.push({ startTime: formattedTime(cursor), endTime: formattedTime(slot[0]), minutes: slot[0] - cursor });
      cursor = Math.max(cursor, slot[1]);
    }
    if (cursor < end) free.push({ startTime: formattedTime(cursor), endTime: formattedTime(end), minutes: end - cursor });
    const availableMinutes = free.reduce((sum, slot) => sum + slot.minutes, 0);
    return { startTime: formattedTime(start), endTime: formattedTime(end),
      free, availableMinutes, occupiedMinutes: end - start - availableMinutes,
      conflicts: detectScheduleConflicts(profile, date) };
  }
  function taskMutation(profile, change) {
    if (!profile || !Array.isArray(profile.tasks)) throw new Error('El perfil no tiene tareas válidas.');
    if (!change || !['create', 'edit', 'delete', 'toggle'].includes(change.type)) throw new Error('Operación de tarea no válida.');
    const original = tasksOf(profile).find(task => task.id === change.id);
    if (change.type !== 'create' && !original) throw new Error('La tarea ya no existe.');
    let tasks;
    if (change.type === 'create') tasks = [createTask(change.data || {}), ...profile.tasks];
    else if (change.type === 'delete') {
      if (original.locked && !change.allowLocked) throw new Error('Confirma el desbloqueo antes de eliminar este compromiso.');
      tasks = profile.tasks.filter(task => task.id !== change.id);
    } else {
      const patch = change.type === 'toggle' ? { status: original.status === 'done' ? 'pending' : 'done' } : (change.data || {});
      if (original.locked && !change.allowLocked &&
          ['scheduledDate', 'startTime', 'endTime'].some(field => patch[field] !== undefined && patch[field] !== original[field])) {
        throw new Error('El compromiso está bloqueado. Desbloquéalo antes de cambiar su horario.');
      }
      tasks = profile.tasks.map(task => task.id === original.id ? updateTask(task, patch) : task);
    }
    return { ...profile, tasks };
  }
  function createDayTemplate(input) {
    const name = String(input && input.name || '').trim();
    if (!name || name.length > 90) throw new Error('Escribe un nombre de plantilla de hasta 90 caracteres.');
    const entries = input.entries;
    if (!Array.isArray(entries) || !entries.length || entries.length > 30) throw new Error('La plantilla necesita entre 1 y 30 bloques.');
    const normalized = entries.map(entry => {
      const title = String(entry.title || '').trim();
      if (!title || title.length > 140 || minute(entry.startTime) === null || minute(entry.endTime) === null
        || minute(entry.endTime) <= minute(entry.startTime)) throw new Error('Cada bloque requiere un título y horas válidas.');
      return {
        id: makeId('entry'), title, startTime: entry.startTime, endTime: entry.endTime,
        priority: ['low', 'medium', 'high'].includes(entry.priority) ? entry.priority : 'medium',
        locked: Boolean(entry.locked), activityId: typeof entry.activityId === 'string' ? entry.activityId : null,
        reminderEnabled: entry.reminderEnabled !== false
      };
    });
    const weekdays = [...new Set((Array.isArray(input.weekdays) ? input.weekdays : [0,1,2,3,4,5,6]).map(Number))].sort();
    if (!weekdays.length || weekdays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new Error('Elige los días de la semana.');
    const startDate = input.startDate || '', endDate = input.endDate || '';
    if ((startDate && !validDate(startDate)) || (endDate && !validDate(endDate)) ||
        (startDate && endDate && endDate < startDate)) throw new Error('Las fechas de vigencia son inválidas.');
    const exceptions = Array.isArray(input.exceptions) ? [...new Set(input.exceptions)] : [];
    if (exceptions.some(date => !validDate(date)) || exceptions.length > 500) throw new Error('Las excepciones de la plantilla no son válidas.');
    return {
      id: makeId('template'), name, entries: normalized,
      recurrence: { weekdays, startDate, endDate, exceptions },
      createdAt: new Date().toISOString()
    };
  }
  function templateAppliesOn(template, date) {
    if (!validDate(date) || !template || !template.recurrence) return false;
    const rule = template.recurrence;
    if (rule.startDate && date < rule.startDate || rule.endDate && date > rule.endDate ||
        Array.isArray(rule.exceptions) && rule.exceptions.includes(date)) return false;
    const [y, m, d] = date.split('-').map(Number);
    return Array.isArray(rule.weekdays) && rule.weekdays.includes(new Date(y, m - 1, d).getDay());
  }
  function previewDayTemplate(profile, templateId, date) {
    const template = templatesOf(profile).find(item => item.id === templateId);
    if (!template) throw new Error('No se encontró la plantilla.');
    if (!validDate(date)) throw new Error('Selecciona una fecha válida.');
    if (!templateAppliesOn(template, date)) return { date, template, proposals: [], skipped: [{ reason: 'La plantilla no se aplica en esta fecha.' }] };
    const proposed = [];
    const skipped = [];
    const intervals = scheduledIntervals(profile, date);
    for (const entry of template.entries || []) {
      const existing = tasksOf(profile).find(task => task.templateId === templateId && task.templateEntryId === entry.id && task.scheduledDate === date);
      if (existing) { skipped.push({ title: entry.title, reason: 'Ya existe esta instancia para el día.' }); continue; }
      const a = minute(entry.startTime), b = minute(entry.endTime);
      if (!entry.title || a === null || b === null || b <= a) { skipped.push({ title: entry.title, reason: 'Bloque inválido.' }); continue; }
      const clashes = intervals.filter(slot => slot.start < b && a < slot.end);
      const proposedClashes = proposed.filter(slot => minute(slot.startTime) < b && a < minute(slot.endTime));
      proposed.push({ ...entry, date, templateId, templateEntryId: entry.id,
        conflicts: [...clashes.map(slot => slot.task.title), ...proposedClashes.map(slot => slot.title)] });
    }
    return { date, template, proposals: proposed, skipped };
  }
  function applyDayTemplate(profile, templateId, date, options = {}) {
    const preview = previewDayTemplate(profile, templateId, date);
    if (preview.proposals.some(entry => entry.conflicts.length) && options.allowConflicts !== true) {
      throw new Error('La plantilla tiene superposiciones. Revisa el horario antes de aplicarla.');
    }
    let updated = profile;
    for (const entry of preview.proposals) {
      const minutes = minute(entry.endTime) - minute(entry.startTime);
      updated = taskMutation(updated, { type: 'create', data: { ...entry, scheduledDate: date, estimatedMinutes: minutes } });
    }
    return { profile: updated, added: preview.proposals.length, skipped: preview.skipped.length };
  }
  return { validDate, minute, getItemsForDay, getCalendarRange, getUnscheduledTasks,
    detectScheduleConflicts, getFreeTimeSlots, taskMutation, createDayTemplate,
    templateAppliesOn, previewDayTemplate, applyDayTemplate };
});
