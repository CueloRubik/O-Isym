const test = require('node:test');
const assert = require('node:assert/strict');
const { createProfile, createTask, analyzeSchedule } = require('../src/domain');
const { minute } = require('../src/planning');
const date = '2026-11-12';
const appointment = (startTime, endTime) => createTask({ title: 'Cita', scheduledDate: date, startTime, endTime });

test('planner does not use a late appointment to extend the workday', () => {
  const profile = createProfile('Límites');
  profile.preferences.workingDayStart = '09:00'; profile.preferences.workingDayEnd = '17:00';
  profile.tasks = [appointment('20:00', '21:00'), createTask({ title: 'No cabe', estimatedMinutes: 600 })];
  const result = analyzeSchedule(profile, date);
  assert.equal(result.proposals.length, 0);
  assert.match(result.skipped[0].reason, /600 minutos/);
});

test('planner preserves twelve-hour estimates and rejects a full-day task that cannot fit', () => {
  const profile = createProfile('Largas');
  profile.preferences.workingDayStart = '08:00'; profile.preferences.workingDayEnd = '23:00';
  profile.tasks = [createTask({ title: 'Doce horas', estimatedMinutes: 720 })];
  let result = analyzeSchedule(profile, date);
  assert.deepEqual(result.proposals.map(p => [p.startTime, p.endTime, p.durationMinutes]), [['08:00', '20:00', 720]]);
  profile.tasks = [createTask({ title: 'Día entero', estimatedMinutes: 1440 })];
  result = analyzeSchedule(profile, date);
  assert.equal(result.proposals.length, 0);
  assert.match(result.skipped[0].reason, /1440 minutos/);
});

test('planner respects duration, boundaries and collisions across appointments outside the workday', () => {
  for (const times of [[], [['06:00', '08:00']], [['06:00', '10:00']], [['16:00', '20:00']], [['20:00', '21:00']], [['06:00', '10:00'], ['16:00', '20:00']], [['06:00', '23:00']]]) {
    for (const duration of [30, 60, 120, 480, 600, 720, 1440]) {
      const profile = createProfile('Propiedades');
      profile.preferences.workingDayStart = '09:00'; profile.preferences.workingDayEnd = '17:00';
      const occupied = times.map(([a, b]) => appointment(a, b));
      profile.tasks = [...occupied, ...[0, 1, 2].map(i => createTask({ title: 'Tarea ' + i, estimatedMinutes: duration }))];
      const result = analyzeSchedule(profile, date);
      const accepted = [];
      for (const proposal of result.proposals) {
        const start = minute(proposal.startTime), end = minute(proposal.endTime);
        assert.ok(start >= 540 && end <= 1020);
        assert.equal(end - start, duration);
        assert.equal(proposal.durationMinutes, duration);
        for (const [a, b] of [...times.map(([a, b]) => [minute(a), minute(b)]), ...accepted]) assert.ok(end <= a || start >= b);
        accepted.push([start, end]);
      }
    }
  }
});
