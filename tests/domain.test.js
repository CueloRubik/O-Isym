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
