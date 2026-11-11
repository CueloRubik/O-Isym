'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../src/domain');
const P = require('../src/planning');
const date = '2026-11-11';

function sample() {
  const profile = D.createProfile('Planificación');
  profile.preferences.workingDayStart = '09:00';
  profile.preferences.workingDayEnd = '13:00';
  return profile;
}
function add(profile, input) {
  const task = D.createTask(input);
  profile.tasks.push(task);
  return task;
}
test('one canonical task is shown once when scheduled date equals its deadline', () => {
  const profile = sample();
  const t = add(profile, { title: 'Repasar', scheduledDate: date, dueDate: date, startTime: '09:00', endTime: '10:00' });
  const day = P.getItemsForDay(profile, date);
  assert.equal(day.length, 1);
  assert.equal(day[0].id, t.id);
  assert.equal(day[0].task, t);
  assert.equal(day[0].scheduled, true);
  assert.equal(day[0].deadline, true);
});
test('deadline-only tasks have no invented timed calendar block', () => {
  const profile = sample();
  add(profile, { title: 'Entrega', dueDate: date });
  const item = P.getItemsForDay(profile, date)[0];
  assert.equal(item.deadline, true);
  assert.equal(item.scheduled, false);
  assert.equal(item.timed, false);
  assert.equal(P.getFreeTimeSlots(profile, date).availableMinutes, 240);
});
test('date range and unscheduled inbox share real task identities', () => {
  const profile = sample();
  const inbox = add(profile, { title: 'Sin fecha', priority: 'high' });
  add(profile, { title: 'Fecha límite', dueDate: '2026-11-12' });
  assert.equal(P.getUnscheduledTasks(profile)[0], inbox);
  const days = P.getCalendarRange(profile, '2026-11-11', '2026-11-13');
  assert.deepEqual(days.map(item => item.items.length), [0, 1, 0]);
  assert.deepEqual(P.getCalendarRange(profile, '2026-02-30', '2026-03-01'), []);
});
test('overlap detection merges reserved minutes and marks locked conflicts', () => {
  const profile = sample();
  add(profile, { title: 'Uno', scheduledDate: date, startTime: '09:00', endTime: '10:00', locked: true });
  add(profile, { title: 'Dos', scheduledDate: date, startTime: '09:30', endTime: '10:30' });
  add(profile, { title: 'Tres', scheduledDate: date, startTime: '10:30', endTime: '11:00' });
  const conflicts = P.detectScheduleConflicts(profile, date);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].locked, true);
  assert.equal(conflicts[0].startTime, '09:30');
  const available = P.getFreeTimeSlots(profile, date);
  assert.equal(available.occupiedMinutes, 120);
  assert.equal(available.availableMinutes, 120);
  assert.deepEqual(available.free, [{ startTime: '11:00', endTime: '13:00', minutes: 120 }]);
});
test('task mutations are immutable, preserve identifiers and reject locked moves', () => {
  const profile = sample();
  const t = add(profile, { title: 'Compromiso', scheduledDate: date, startTime: '09:00', endTime: '10:00', locked: true });
  const copy = P.taskMutation(profile, { type: 'toggle', id: t.id });
  assert.equal(profile.tasks[0].status, 'pending');
  assert.equal(copy.tasks[0].status, 'done');
  assert.equal(copy.tasks[0].id, t.id);
  assert.throws(() => P.taskMutation(profile, { type: 'edit', id: t.id, data: { startTime: '10:00', endTime: '11:00' } }), /bloqueado/);
  assert.equal(profile.tasks[0].startTime, '09:00');
  const unlocked = P.taskMutation(profile, { type: 'edit', id: t.id, data: { locked: false } });
  assert.equal(unlocked.tasks[0].locked, false);
});
test('template proposals do not mutate a profile and apply idempotently', () => {
  let profile = sample();
  const template = P.createDayTemplate({ name: 'Rutina', weekdays: [3], entries: [
    { title: 'Leer', startTime: '09:00', endTime: '09:30' },
    { title: 'Estudiar', startTime: '10:00', endTime: '10:40' }
  ] });
  profile.dayTemplates.push(template);
  const before = JSON.stringify(profile);
  const preview = P.previewDayTemplate(profile, template.id, date);
  assert.equal(preview.proposals.length, 2);
  assert.equal(JSON.stringify(profile), before);
  const first = P.applyDayTemplate(profile, template.id, date);
  assert.equal(first.added, 2);
  profile = first.profile;
  assert.equal(profile.tasks.length, 2);
  assert.equal(profile.tasks[0].templateEntryId, template.entries[1].id);
  assert.equal(profile.tasks[0].templateId, template.id);
  const second = P.applyDayTemplate(profile, template.id, date);
  assert.equal(second.added, 0);
  assert.equal(second.profile.tasks.length, 2);
  const changed = P.taskMutation(profile, { type: 'edit', id: profile.tasks[0].id, data: { title: 'Personalizado' } });
  assert.equal(changed.tasks[0].title, 'Personalizado');
  assert.equal(changed.dayTemplates[0].entries[1].title, 'Estudiar');
});
test('weekly recurrence respects range and skipped-date exceptions', () => {
  const profile = sample();
  const template = P.createDayTemplate({ name: 'Miércoles', weekdays: [3], startDate: '2026-11-11',
    endDate: '2026-11-30', exceptions: ['2026-11-18'],
    entries: [{ title: 'Practicar', startTime: '09:00', endTime: '10:00' }] });
  profile.dayTemplates = [template];
  assert.equal(P.templateAppliesOn(template, '2026-11-11'), true);
  assert.equal(P.templateAppliesOn(template, '2026-11-12'), false);
  assert.equal(P.templateAppliesOn(template, '2026-11-18'), false);
  assert.equal(P.templateAppliesOn(template, '2026-12-02'), false);
  assert.equal(P.previewDayTemplate(profile, template.id, '2026-11-18').proposals.length, 0);
});
test('locked collision requires explicit confirmation before applying a template', () => {
  const profile = sample();
  add(profile, { title: 'Clase', scheduledDate: date, startTime: '09:00', endTime: '10:00', locked: true });
  const template = P.createDayTemplate({ name: 'Otro', weekdays: [3],
    entries: [{ title: 'Practicar', startTime: '09:30', endTime: '10:30' }] });
  profile.dayTemplates.push(template);
  assert.deepEqual(P.previewDayTemplate(profile, template.id, date).proposals[0].conflicts, ['Clase']);
  assert.throws(() => P.applyDayTemplate(profile, template.id, date), /superposiciones/);
  assert.equal(profile.tasks.length, 1);
  const applied = P.applyDayTemplate(profile, template.id, date, { allowConflicts: true });
  assert.equal(applied.added, 1);
});
test('older profiles migrate without schema change and preserve Focus/boards', () => {
  const legacy = D.createProfile('Anterior');
  const id = legacy.id, originalBoard = D.createIdeaBoard({ title: 'Notas' });
  legacy.ideaBoards.push(originalBoard);
  legacy.activeFocus = { taskId: null, startedAt: '2026-11-11T10:00:00.000Z', durationSeconds: 1500, elapsedBeforePause: 0 };
  delete legacy.dayTemplates;
  const normalized = D.normalizeProfile(legacy);
  assert.equal(normalized.id, id);
  assert.deepEqual(normalized.dayTemplates, []);
  assert.equal(normalized.ideaBoards[0].id, originalBoard.id);
  assert.ok(normalized.activeFocus);
  assert.equal(D.validateImportedProfile(normalized), true);
});
test('validates imported recurring templates and rejects invalid entries', () => {
  const profile = sample();
  const template = P.createDayTemplate({ name: 'Rutina', weekdays: [3],
    entries: [{ title: 'Leer', startTime: '09:00', endTime: '10:00' }] });
  profile.dayTemplates = [template];
  assert.equal(D.validateImportedProfile(profile), true);
  const broken = JSON.parse(JSON.stringify(profile));
  broken.dayTemplates[0].entries[0].endTime = '08:00';
  assert.throws(() => D.validateImportedProfile(broken), /bloque inválido/);
});
test('templates are profile-local and independent of focus and idea boards', () => {
  const first = sample(), second = sample();
  const template = P.createDayTemplate({ name: 'Individual', weekdays: [3],
    entries: [{ title: 'Tarea', startTime: '10:00', endTime: '11:00' }] });
  first.dayTemplates.push(template);
  const saved = P.applyDayTemplate(first, template.id, date);
  assert.equal(second.tasks.length, 0);
  assert.equal(second.dayTemplates.length, 0);
  assert.equal(saved.profile.tasks.length, 1);
  assert.equal(first.tasks.length, 0);
});
