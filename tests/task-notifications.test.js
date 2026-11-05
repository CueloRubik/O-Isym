const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createTaskNotificationScheduler, localDateTime } = require('../electron/task-notifications');

function makeHarness() {
  let now = new Date(2026, 10, 5, 8, 0, 0, 0).getTime();
  let timerId = 0;
  const timers = new Map();
  const notifications = [];
  const powerMonitor = new EventEmitter();
  let openedTask = null;
  class FakeNotification extends EventEmitter {
    constructor(options) { super(); this.options = options; }
    show() { notifications.push(this); }
    static isSupported() { return true; }
  }
  const scheduler = createTaskNotificationScheduler({
    Notification: FakeNotification,
    powerMonitor,
    platform: 'darwin',
    now: () => now,
    setTimer: (fn, delay) => { const id = ++timerId; timers.set(id, { at: now + delay, fn }); return id; },
    clearTimer: id => timers.delete(id),
    onOpenTask: reminder => { openedTask = reminder; }
  });
  const date = new Date(now);
  const dateKey = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  function snapshot(startTime, overrides = {}) {
    const profile = {
      id: 'profile-1',
      name: 'Personal',
      preferences: { taskNotificationsEnabled: true, taskNotificationLeadMinutes: 0, taskNotificationSound: true, taskNotificationScope: 'all', taskNotificationMissed: 'notify', ...overrides.preferences },
      activities: [{ id: 'activity-1', name: 'Lectura', archived: false }],
      tasks: [{
        id: 'task-1', title: 'Leer capítulo', status: 'pending', priority: 'medium',
        scheduledDate: dateKey, startTime, endTime: '09:30', activityId: 'activity-1',
        reminderEnabled: true, ...overrides.task
      }]
    };
    return { activeProfileId: profile.id, profiles: [profile] };
  }
  function advance(ms) {
    now += ms;
    let count = 0;
    while (true) {
      const due = [...timers.entries()].filter(([, item]) => item.at <= now).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timers.delete(due[0]);
      due[1].fn();
      if (++count > 30) throw new Error('Timer loop');
    }
  }
  return {
    scheduler, notifications, dateKey, now: () => now, snapshot, advance,
    openNotification(index = 0) { notifications[index].emit('click'); return openedTask; },
    failNotification(index = 0) { notifications[index].emit('failed', new Error('No disponible')); },
    resume() { powerMonitor.emit('resume'); },
    dispose() { scheduler.dispose(); }
  };
}

test('localDateTime valida fechas y convierte una hora local', () => {
  assert.ok(Number.isFinite(localDateTime('2026-11-05', '09:30')));
  assert.ok(Number.isNaN(localDateTime('2026-02-30', '09:30')));
  assert.ok(Number.isNaN(localDateTime('2026-11-05', '25:00')));
});

test('avisa a la hora programada con actividad, tarea y horario', () => {
  const h = makeHarness();
  const start = new Date(h.now() + 60 * 60 * 1000);
  const time = String(start.getHours()).padStart(2, '0') + ':' + String(start.getMinutes()).padStart(2, '0');
  h.scheduler.scheduleSnapshot(h.snapshot(time));
  h.advance(60 * 60 * 1000);
  assert.equal(h.notifications.length, 1);
  assert.equal(h.notifications[0].options.title, 'O-Isym');
  assert.equal(h.notifications[0].options.subtitle, 'Hora de Lectura');
  assert.match(h.notifications[0].options.body, /Leer capítulo/);
  assert.match(h.notifications[0].options.body, /09:30|10:00|08:00/);
  assert.equal(h.notifications[0].options.silent, false);
  assert.equal(h.notifications[0].options.sound, 'Ping');
  h.advance(60 * 60 * 1000);
  assert.equal(h.notifications.length, 1);
  h.dispose();
});

test('respeta el tiempo de anticipación y el sonido silencioso', () => {
  const h = makeHarness();
  const start = new Date(h.now() + 15 * 60 * 1000);
  const time = String(start.getHours()).padStart(2, '0') + ':' + String(start.getMinutes()).padStart(2, '0');
  h.scheduler.scheduleSnapshot(h.snapshot(time, { preferences: { taskNotificationLeadMinutes: 10, taskNotificationSound: false } }));
  h.advance(5 * 60 * 1000 - 1);
  assert.equal(h.notifications.length, 0);
  h.advance(1);
  assert.equal(h.notifications.length, 1);
  assert.equal(h.notifications[0].options.silent, true);
  assert.equal(h.notifications[0].options.sound, undefined);
  h.dispose();
});

test('filtra tareas por actividad o prioridad y respeta el interruptor individual', () => {
  const h = makeHarness();
  const start = new Date(h.now() + 10 * 60 * 1000);
  const time = String(start.getHours()).padStart(2, '0') + ':' + String(start.getMinutes()).padStart(2, '0');
  h.scheduler.scheduleSnapshot(h.snapshot(time, { preferences: { taskNotificationScope: 'high' } }));
  assert.equal(h.scheduler.getScheduledCount(), 0);
  h.scheduler.scheduleSnapshot(h.snapshot(time, { task: { priority: 'high', reminderEnabled: false } }));
  assert.equal(h.scheduler.getScheduledCount(), 0);
  h.scheduler.scheduleSnapshot(h.snapshot(time, { preferences: { taskNotificationsEnabled: false } }));
  assert.equal(h.scheduler.getScheduledCount(), 0);
  h.dispose();
});

test('notifica una tarea vencida al volver dentro de la ventana permitida y evita duplicados', () => {
  const h = makeHarness();
  const start = new Date(h.now() - 5 * 60 * 1000);
  const time = String(start.getHours()).padStart(2, '0') + ':' + String(start.getMinutes()).padStart(2, '0');
  const snapshot = h.snapshot(time);
  h.scheduler.scheduleSnapshot(snapshot);
  h.scheduler.scheduleSnapshot(snapshot);
  assert.equal(h.notifications.length, 1);
  h.dispose();
});

test('omite avisos vencidos cuando esa es la preferencia elegida', () => {
  const h = makeHarness();
  const start = new Date(h.now() - 5 * 60 * 1000);
  const time = String(start.getHours()).padStart(2, '0') + ':' + String(start.getMinutes()).padStart(2, '0');
  h.scheduler.scheduleSnapshot(h.snapshot(time, { preferences: { taskNotificationMissed: 'skip' } }));
  assert.equal(h.notifications.length, 0);
  h.dispose();
});

test('al hacer clic en una notificación entrega el recordatorio correspondiente', () => {
  const h = makeHarness();
  const start = new Date(h.now() + 5 * 60 * 1000);
  const time = String(start.getHours()).padStart(2, '0') + ':' + String(start.getMinutes()).padStart(2, '0');
  h.scheduler.scheduleSnapshot(h.snapshot(time));
  h.advance(5 * 60 * 1000);
  assert.equal(h.openNotification().key.includes('task-1'), true);
  h.dispose();
});


test('la notificación de prueba respeta la preferencia de sonido del perfil', () => {
  const h = makeHarness();
  h.scheduler.scheduleSnapshot(h.snapshot('10:00', { preferences: { taskNotificationSound: false } }));
  assert.equal(h.scheduler.sendTestNotification(), true);
  assert.equal(h.notifications.at(-1).options.silent, true);
  assert.equal(h.notifications.at(-1).options.sound, undefined);
  h.dispose();
});

test('un fallo del sistema no deja el recordatorio marcado permanentemente como enviado', () => {
  const h = makeHarness();
  const start = new Date(h.now() + 5 * 60 * 1000);
  const time = String(start.getHours()).padStart(2, '0') + ':' + String(start.getMinutes()).padStart(2, '0');
  const snapshot = h.snapshot(time);
  h.scheduler.scheduleSnapshot(snapshot);
  h.advance(5 * 60 * 1000);
  assert.equal(h.notifications.length, 1);
  h.failNotification();
  h.scheduler.scheduleSnapshot(snapshot);
  assert.equal(h.notifications.length, 2);
  h.dispose();
});
