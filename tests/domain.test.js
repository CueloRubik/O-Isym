const test = require('node:test');
const assert = require('node:assert/strict');

test('profile defaults include isolated collections and safe autonomy', () => {
  const { createProfile, normalizeProfile } = require('../src/domain.js');
  const profile = createProfile('Prueba');
  assert.equal(profile.name, 'Prueba');
  assert.deepEqual(profile.tasks, []);
  assert.equal(profile.preferences.autonomy, 'suggested');
  const normalized = normalizeProfile({ id: 'x', name: 'X', preferences: { autonomy: 'unsafe' } });
  assert.equal(normalized.preferences.autonomy, 'suggested');
});

test('tasks validate titles and completion is reversible', async () => {
  const { createTask, updateTask } = require('../src/domain.js');
  assert.throws(() => createTask({ title: ' ' }), /título/);
  const task = createTask({ title: 'Estudiar', priority: 'high' });
  const done = updateTask(task, { status: 'done' });
  assert.equal(done.status, 'done');
  assert.ok(done.completedAt);
  assert.equal(updateTask(done, { status: 'pending' }).completedAt, null);
});

test('automatic scheduling never includes locked or already scheduled tasks', async () => {
  const { createProfile, createTask, suggestSchedule } = require('../src/domain.js');
  const profile = createProfile('Agenda');
  profile.tasks.push(createTask({ title: 'Flexible', estimatedMinutes: 30 }));
  profile.tasks.push(createTask({ title: 'Compromiso', estimatedMinutes: 60, locked: true }));
  profile.tasks.push(createTask({ title: 'Ya programada', scheduledDate: '2026-11-04', estimatedMinutes: 30 }));
  const proposals = suggestSchedule(profile, '2026-11-04');
  assert.equal(proposals.length, 1);
  assert.equal(proposals[0].taskId, profile.tasks[0].id);
});

test('snapshot rejects duplicate profiles and invalid active profile', async () => {
  const { createProfile, validateSnapshot } = require('../src/domain.js');
  const profile = createProfile('Uno');
  const snapshot = { schemaVersion: 1, activeProfileId: profile.id, profiles: [profile, profile] };
  assert.throws(() => validateSnapshot(snapshot), /repetidos/);
  snapshot.profiles = [profile];
  snapshot.activeProfileId = 'missing';
  assert.throws(() => validateSnapshot(snapshot), /no existe/);
});

test('task schedule validation rejects impossible dates and incomplete time ranges', () => {
  const { createTask, updateTask } = require('../src/domain.js');
  assert.throws(() => createTask({ title: 'Fecha', scheduledDate: '2026-02-30' }), /fechas/);
  assert.throws(() => createTask({ title: 'Hora', startTime: '09:00' }), /tanto la hora/);
  const task = createTask({ title: 'Válida', scheduledDate: '2026-11-04', startTime: '09:00', endTime: '10:00' });
  assert.throws(() => updateTask(task, { endTime: '08:00' }), /posterior/);
});

test('task edits normalize numeric fields and reject invalid state', () => {
  const { createTask, updateTask } = require('../src/domain.js');
  const task = createTask({ title: 'Tarea' });
  const edited = updateTask(task, { estimatedMinutes: '45', locked: true, activityId: '' });
  assert.equal(edited.estimatedMinutes, 45);
  assert.equal(edited.locked, true);
  assert.equal(edited.activityId, null);
  assert.throws(() => updateTask(task, { status: 'archived' }), /estado/);
  assert.throws(() => updateTask(task, { priority: 'urgent' }), /prioridad/);
});


test('activity edits validate names and normalize editable fields', () => {
  const { createActivity, updateActivity } = require('../src/domain.js');
  const activity = createActivity({ name: 'Lectura', durationMinutes: 20 });
  const edited = updateActivity(activity, { name: 'Lectura diaria', durationMinutes: '45', frequency: 'Cada día' });
  assert.equal(edited.name, 'Lectura diaria');
  assert.equal(edited.durationMinutes, 45);
  assert.equal(edited.frequency, 'Cada día');
  assert.throws(() => updateActivity(activity, { name: ' ' }), /nombre/);
});

test('goal edits preserve progress, clamp it to the new target, and validate dates', () => {
  const { createGoal, updateGoal } = require('../src/domain.js');
  const goal = createGoal({ title: 'Practicar', target: 10, dueDate: '2026-12-01' });
  const progressed = { ...goal, progress: 8 };
  const edited = updateGoal(progressed, { title: 'Practicar guitarra', target: '5', unit: 'sesiones' });
  assert.equal(edited.title, 'Practicar guitarra');
  assert.equal(edited.progress, 5);
  assert.equal(edited.unit, 'sesiones');
  assert.throws(() => updateGoal(goal, { title: '' }), /nombre/);
  assert.throws(() => updateGoal(goal, { dueDate: '2026-02-30' }), /fecha objetivo/);
});
