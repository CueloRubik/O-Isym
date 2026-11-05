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


test('focus timer calculates elapsed and remaining time from wall clock after suspension', () => {
  const { getFocusElapsedSeconds, getFocusRemainingSeconds } = require('../src/domain.js');
  const focus = { startedAt: '2026-11-04T10:00:00.000Z', pausedAt: null, elapsedBeforePause: 120, durationSeconds: 1500 };
  const now = Date.parse('2026-11-04T10:10:00.000Z');
  assert.equal(getFocusElapsedSeconds(focus, now), 720);
  assert.equal(getFocusRemainingSeconds(focus, now), 780);
  assert.equal(getFocusRemainingSeconds(focus, Date.parse('2026-11-04T10:30:00.000Z')), 0);
});

test('paused focus sessions do not accumulate time while the app is closed', () => {
  const { getFocusElapsedSeconds, getFocusRemainingSeconds } = require('../src/domain.js');
  const focus = { startedAt: '2026-11-04T10:00:00.000Z', pausedAt: '2026-11-04T10:05:00.000Z', elapsedBeforePause: 300, durationSeconds: 1500 };
  assert.equal(getFocusElapsedSeconds(focus, Date.parse('2026-11-04T11:00:00.000Z')), 300);
  assert.equal(getFocusRemainingSeconds(focus, Date.parse('2026-11-04T11:00:00.000Z')), 1200);
});

test('active focus recovery normalizes old or malformed optional fields safely', () => {
  const { normalizeActiveFocus, normalizeProfile } = require('../src/domain.js');
  const recovered = normalizeActiveFocus({ startedAt: '2026-11-04T10:00:00.000Z', durationSeconds: 900 });
  assert.equal(recovered.sessionStartedAt, recovered.startedAt);
  assert.equal(recovered.elapsedBeforePause, 0);
  assert.equal(recovered.durationSeconds, 900);
  assert.equal(normalizeActiveFocus({ startedAt: 'not-a-date' }), null);
  const profile = normalizeProfile({ name: 'Focus', preferences: { focusMinutes: 40 }, activeFocus: { startedAt: '2026-11-04T10:00:00.000Z' } });
  assert.equal(profile.activeFocus.durationSeconds, 2400);
});

test('completed focus sessions preserve their actual completion time after delayed recovery', () => {
  const { createFocusSession } = require('../src/domain.js');
  const focus = { taskId: 'task-1', startedAt: '2026-11-04T10:00:00.000Z', sessionStartedAt: '2026-11-04T10:00:00.000Z', pausedAt: null, elapsedBeforePause: 0, durationSeconds: 1500 };
  const session = createFocusSession(focus, 'Estudiar', '2026-11-04T10:40:00.000Z');
  assert.equal(session.durationSeconds, 1500);
  assert.equal(session.endedAt, '2026-11-04T10:25:00.000Z');
  assert.equal(session.taskTitle, 'Estudiar');
});


test('focus duration follows the selected task activity, with profile preference as fallback', () => {
  const { createProfile, createActivity, createTask, getSuggestedFocusMinutes } = require('../src/domain.js');
  const profile = createProfile('Focus');
  profile.preferences.focusMinutes = 35;
  const activity = createActivity({ name: 'Piano', durationMinutes: 50 });
  profile.activities.push(activity);
  const task = createTask({ title: 'Practicar piano', activityId: activity.id });
  profile.tasks.push(task);
  assert.equal(getSuggestedFocusMinutes(profile, task.id), 50);
  assert.equal(getSuggestedFocusMinutes(profile, null, activity.id), 50);
  assert.equal(getSuggestedFocusMinutes(profile, null), 35);
});

test('focus preferences default to enabled but can be disabled safely', () => {
  const { createProfile, normalizeProfile } = require('../src/domain.js');
  const profile = createProfile('Focus');
  assert.equal(profile.preferences.focusSound, true);
  assert.equal(profile.preferences.focusNotifications, true);
  const normalized = normalizeProfile({ name: 'Anterior', preferences: { focusSound: false, focusNotifications: false } });
  assert.equal(normalized.preferences.focusSound, false);
  assert.equal(normalized.preferences.focusNotifications, false);
});


test('active Focus recovery preserves whether the timer is a break', () => {
  const { normalizeActiveFocus } = require('../src/domain.js');
  const restored = normalizeActiveFocus({ isBreak: true, activityId: 'activity-1', activityTitle: 'Piano', startedAt: '2026-11-04T10:00:00.000Z', durationSeconds: 300 });
  assert.equal(restored.isBreak, true);
  assert.equal(restored.activityId, 'activity-1');
  assert.equal(restored.activityTitle, 'Piano');
});


test('planner fills real gaps without overlapping existing appointments', () => {
  const { createProfile, createTask, analyzeSchedule } = require('../src/domain.js');
  const profile = createProfile('Huecos');
  profile.preferences.workingDayStart = '09:00';
  profile.preferences.workingDayEnd = '12:00';
  profile.tasks.push(createTask({ title: 'Cita', scheduledDate: '2026-11-05', startTime: '10:00', endTime: '11:00', locked: true }));
  profile.tasks.push(createTask({ title: 'Estudio', estimatedMinutes: 60, priority: 'high' }));
  profile.tasks.push(createTask({ title: 'Lectura', estimatedMinutes: 60 }));
  const result = analyzeSchedule(profile, '2026-11-05');
  assert.deepEqual(result.proposals.map(item => [item.title, item.startTime, item.endTime]), [
    ['Estudio', '09:00', '10:00'],
    ['Lectura', '11:00', '12:00']
  ]);
  assert.ok(result.proposals.every(item => item.reason.length > 10));
});

test('planner orders by nearest due date before priority and explains the choice', () => {
  const { createProfile, createTask, analyzeSchedule } = require('../src/domain.js');
  const profile = createProfile('Fechas');
  profile.preferences.workingDayStart = '09:00';
  profile.preferences.workingDayEnd = '11:00';
  profile.tasks.push(createTask({ title: 'Alta sin fecha', priority: 'high', estimatedMinutes: 60 }));
  profile.tasks.push(createTask({ title: 'Vence mañana', priority: 'low', dueDate: '2026-11-06', estimatedMinutes: 60 }));
  const result = analyzeSchedule(profile, '2026-11-05');
  assert.equal(result.proposals[0].title, 'Vence mañana');
  assert.match(result.proposals[0].reason, /fecha límite/);
  assert.equal(result.proposals[1].title, 'Alta sin fecha');
});

test('planner reports overdue tasks instead of scheduling them after their deadline', () => {
  const { createProfile, createTask, analyzeSchedule } = require('../src/domain.js');
  const profile = createProfile('Atrasadas');
  profile.tasks.push(createTask({ title: 'Vencida', dueDate: '2026-11-03' }));
  const result = analyzeSchedule(profile, '2026-11-05');
  assert.equal(result.proposals.length, 0);
  assert.match(result.skipped[0].reason, /Ya venció/);
});

test('planner reports tasks that cannot fit in the remaining workday', () => {
  const { createProfile, createTask, analyzeSchedule } = require('../src/domain.js');
  const profile = createProfile('Sin espacio');
  profile.preferences.workingDayStart = '09:00';
  profile.preferences.workingDayEnd = '10:00';
  profile.tasks.push(createTask({ title: 'Muy larga', estimatedMinutes: 90 }));
  const result = analyzeSchedule(profile, '2026-11-05');
  assert.equal(result.proposals.length, 0);
  assert.match(result.skipped[0].reason, /No queda un espacio/);
});

test('planner does not move tasks already scheduled on another date or locked tasks', () => {
  const { createProfile, createTask, analyzeSchedule } = require('../src/domain.js');
  const profile = createProfile('Protección');
  profile.tasks.push(createTask({ title: 'Otro día', scheduledDate: '2026-11-06' }));
  profile.tasks.push(createTask({ title: 'Bloqueada', locked: true }));
  const result = analyzeSchedule(profile, '2026-11-05');
  assert.equal(result.proposals.length, 0);
  assert.equal(result.skipped.length, 0);
});

test('planner uses safe default working hours when saved preferences are invalid', () => {
  const { createProfile, createTask, analyzeSchedule } = require('../src/domain.js');
  const profile = createProfile('Horario inválido');
  profile.preferences.workingDayStart = 'bad';
  profile.preferences.workingDayEnd = 'bad';
  profile.tasks.push(createTask({ title: 'Tarea' }));
  const result = analyzeSchedule(profile, '2026-11-05');
  assert.equal(result.proposals[0].startTime, '09:00');
  assert.equal(result.workday.end, '17:00');
});


test('planner rejects impossible calendar dates without producing proposals', () => {
  const { createProfile, createTask, analyzeSchedule } = require('../src/domain.js');
  const profile = createProfile('Fecha imposible');
  profile.tasks.push(createTask({ title: 'Tarea' }));
  const result = analyzeSchedule(profile, '2026-02-30');
  assert.equal(result.proposals.length, 0);
  assert.equal(result.skipped.length, 0);
});


test('calendar date navigation handles leap days and year boundaries', () => {
  const { shiftDate } = require('../src/domain.js');
  assert.equal(shiftDate('2024-02-28', 1), '2024-02-29');
  assert.equal(shiftDate('2024-02-29', 1), '2024-03-01');
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDate('2027-01-01', -1), '2026-12-31');
});


test('profile visual preferences have safe defaults and normalize unknown values', () => {
  const { createProfile, normalizeProfile } = require('../src/domain.js');
  const profile = createProfile('Personal');
  assert.equal(profile.avatarId, 'initials');
  assert.equal(profile.preferences.theme, 'classic');
  assert.equal(profile.preferences.motionEnabled, true);
  const normalized = normalizeProfile({ name: 'Antiguo', avatarId: 'unknown', preferences: { theme: 'neon', motionEnabled: false } });
  assert.equal(normalized.avatarId, 'initials');
  assert.equal(normalized.preferences.theme, 'classic');
  assert.equal(normalized.preferences.motionEnabled, false);
});

test('profile normalization preserves supported visual customization', () => {
  const { normalizeProfile } = require('../src/domain.js');
  const profile = normalizeProfile({ name: 'Personalizado', avatarId: 'compass', preferences: { theme: 'sky', motionEnabled: false } });
  assert.equal(profile.avatarId, 'compass');
  assert.equal(profile.preferences.theme, 'sky');
  assert.equal(profile.preferences.motionEnabled, false);
});


test('profiles store age bands and choose an age-appropriate starting theme', () => {
  const { createProfile, normalizeProfile, getAgeBand, getDefaultThemeForAge } = require('../src/domain.js');
  const child=createProfile('Peque','#27856b',10), teen=createProfile('Joven','#27856b',15), adult=createProfile('Adulto','#27856b',28);
  assert.equal(child.age,10); assert.equal(child.preferences.ageBand,'child'); assert.equal(child.preferences.theme,'playful');
  assert.equal(teen.preferences.ageBand,'teen'); assert.equal(teen.preferences.theme,'sky');
  assert.equal(adult.preferences.ageBand,'adult'); assert.equal(adult.preferences.theme,'classic');
  assert.equal(getAgeBand(0),'general'); assert.equal(getAgeBand(121),'general'); assert.equal(getDefaultThemeForAge(8),'playful');
  const restored=normalizeProfile({name:'Antiguo',age:11,avatarId:'profile-18',preferences:{}});
  assert.equal(restored.age,11); assert.equal(restored.avatarId,'profile-18'); assert.equal(restored.preferences.ageBand,'child');
});
test('profile normalization keeps valid age and avatar image ids and safely falls back for invalid values', () => {
  const { normalizeProfile }=require('../src/domain.js');
  const valid=normalizeProfile({name:'Foto',age:17,avatarId:'profile-7',preferences:{theme:'playful'}});
  assert.equal(valid.avatarId,'profile-7'); assert.equal(valid.age,17); assert.equal(valid.preferences.theme,'playful');
  const invalid=normalizeProfile({name:'Inválido',age:999,avatarId:'profile-19',preferences:{}});
  assert.equal(invalid.age,null); assert.equal(invalid.avatarId,'initials'); assert.equal(invalid.preferences.ageBand,'general');
});


test('Focus end alarm preferences normalize defaults, migration, and bounds', () => {
  const { createProfile, normalizeProfile, FOCUS_ALARM_TONES } = require('../src/domain.js');
  const fresh=createProfile('Focus');
  assert.equal(fresh.preferences.focusEndAlarmEnabled,true);
  assert.equal(fresh.preferences.focusEndTone,'clock');
  assert.equal(fresh.preferences.focusAlarmVolume,70);
  assert.equal(fresh.preferences.focusAlarmRepeats,3);
  assert.equal(fresh.preferences.focusAlarmIntervalSeconds,2);
  assert.equal(fresh.preferences.focusAlarmMaxSeconds,30);
  assert.deepEqual(FOCUS_ALARM_TONES,['clock','digital','funny','ringtone1','ringtone2','ringtone3','ringtone4','ringtone5','ringtone6','tititi']);
  const migrated=normalizeProfile({name:'Anterior',preferences:{focusSound:false,focusEndTone:'tititi',focusAlarmVolume:45}});
  assert.equal(migrated.preferences.focusEndAlarmEnabled,false);
  assert.equal(migrated.preferences.focusEndTone,'tititi');
  assert.equal(migrated.preferences.focusAlarmVolume,45);
  const custom=normalizeProfile({name:'Personalizado',preferences:{focusEndAlarmEnabled:true,focusEndTone:'ringtone6',focusAlarmRepeats:8,focusAlarmIntervalSeconds:5,focusAlarmMaxSeconds:60}});
  assert.equal(custom.preferences.focusAlarmRepeats,8);assert.equal(custom.preferences.focusAlarmIntervalSeconds,5);assert.equal(custom.preferences.focusAlarmMaxSeconds,60);
  const invalid=normalizeProfile({name:'Inválido',preferences:{focusEndAlarmEnabled:'no',focusEndTone:'unknown',focusAlarmRepeats:99,focusAlarmIntervalSeconds:-4,focusAlarmMaxSeconds:999,focusAlarmVolume:-5}});
  assert.equal(invalid.preferences.focusEndAlarmEnabled,true);assert.equal(invalid.preferences.focusEndTone,'clock');
  assert.equal(invalid.preferences.focusAlarmRepeats,10);assert.equal(invalid.preferences.focusAlarmIntervalSeconds,1);assert.equal(invalid.preferences.focusAlarmMaxSeconds,120);assert.equal(invalid.preferences.focusAlarmVolume,0);
});

test('Focus music preferences default to no music and validate the selected track', () => {
  const { createProfile, normalizeProfile, FOCUS_MUSIC_TRACKS } = require('../src/domain.js');
  const fresh = createProfile('Música');
  assert.equal(fresh.preferences.focusMusicTrack, '');
  assert.equal(fresh.preferences.focusMusicVolume, 35);
  assert.equal(FOCUS_MUSIC_TRACKS.length, 14);
  const selected = normalizeProfile({ name: 'Pista', preferences: { focusMusicTrack: 'focus6', focusMusicVolume: 45 } });
  assert.equal(selected.preferences.focusMusicTrack, 'focus6');
  assert.equal(selected.preferences.focusMusicVolume, 45);
  const invalid = normalizeProfile({ name: 'Inválido', preferences: { focusMusicTrack: 'focus99', focusMusicVolume: -1 } });
  assert.equal(invalid.preferences.focusMusicTrack, '');
  assert.equal(invalid.preferences.focusMusicVolume, 0);
});


test('Focus reminder interval defaults off and rejects unsupported values', () => {
  const { createProfile, normalizeProfile, FOCUS_REMINDER_INTERVALS } = require('../src/domain.js');
  const fresh = createProfile('Recordatorios');
  assert.equal(fresh.preferences.focusReminderMinutes, 0);
  assert.deepEqual(FOCUS_REMINDER_INTERVALS, [0, 5, 10, 15, 20, 25, 30, 45, 60]);
  const enabled = normalizeProfile({ name: 'Activo', preferences: { focusReminderMinutes: 15 } });
  assert.equal(enabled.preferences.focusReminderMinutes, 15);
  const invalid = normalizeProfile({ name: 'Inválido', preferences: { focusReminderMinutes: 17 } });
  assert.equal(invalid.preferences.focusReminderMinutes, 0);
});
