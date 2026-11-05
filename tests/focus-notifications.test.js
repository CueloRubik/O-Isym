const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createFocusNotificationScheduler } = require('../electron/focus-notifications');

function makeHarness({ hasWindow = () => false } = {}) {
  let clock = Date.parse('2026-11-04T12:00:00.000Z');
  let nextId = 1;
  const timers = new Map();
  const notifications = [];
  const powerMonitor = new EventEmitter();

  class FakeNotification extends EventEmitter {
    constructor(options) { super(); this.options = options; }
    show() { notifications.push(this.options); }
    static isSupported() { return true; }
  }

  const scheduler = createFocusNotificationScheduler({
    Notification: FakeNotification,
    powerMonitor,
    hasWindow,
    now: () => clock,
    setTimer: (callback, delay) => {
      const id = nextId++;
      timers.set(id, { at: clock + delay, callback });
      return id;
    },
    clearTimer: id => timers.delete(id)
  });

  function advance(milliseconds) {
    clock += milliseconds;
    let runs = 0;
    while (true) {
      const due = Array.from(timers.entries())
        .filter(([, timer]) => timer.at <= clock)
        .sort((left, right) => left[1].at - right[1].at)[0];
      if (!due) break;
      timers.delete(due[0]);
      due[1].callback();
      runs++;
      if (runs > 100) throw new Error('El scheduler no dejó de programar eventos vencidos.');
    }
  }

  function sleep(milliseconds) { clock += milliseconds; }
  function resume() { powerMonitor.emit('resume'); }

  return { scheduler, notifications, advance, sleep, resume, dispose: () => scheduler.dispose() };
}

test('Focus scheduler sends periodic reminders and one completion notification', () => {
  const h = makeHarness();
  const start = Date.parse('2026-11-04T12:00:00.000Z');
  h.scheduler.schedule({
    endsAt: new Date(start + 1800000).toISOString(),
    nextReminderAt: new Date(start + 600000).toISOString(),
    reminderMinutes: 10,
    taskTitle: 'Estudiar matemáticas'
  });

  h.advance(600000);
  assert.equal(h.notifications.length, 1);
  assert.equal(h.notifications[0].title, 'Pausa breve');
  assert.equal(h.notifications[0].sound, 'Submarine');
  assert.match(h.notifications[0].body, /Estudiar matemáticas/);

  h.advance(600000);
  assert.equal(h.notifications.length, 2);
  assert.equal(h.notifications[1].title, 'Pausa breve');

  h.advance(600000);
  assert.equal(h.notifications.length, 3);
  assert.equal(h.notifications[2].title, 'Focus terminado');
  h.advance(60000);
  assert.equal(h.notifications.length, 3);
  h.dispose();
});

test('Focus scheduler sends at most one reminder after sleep and catches up at the end', () => {
  const h = makeHarness();
  const start = Date.parse('2026-11-04T12:00:00.000Z');
  h.scheduler.schedule({
    endsAt: new Date(start + 1800000).toISOString(),
    nextReminderAt: new Date(start + 600000).toISOString(),
    reminderMinutes: 10,
    taskTitle: 'Lectura'
  });

  h.sleep(900000);
  h.resume();
  assert.equal(h.notifications.length, 1);
  assert.equal(h.notifications[0].title, 'Pausa breve');

  h.sleep(1200000);
  h.resume();
  assert.equal(h.notifications.length, 2);
  assert.equal(h.notifications[1].title, 'Focus terminado');
  h.dispose();
});

test('Focus scheduler can be cancelled and never reminds during a break', () => {
  const h = makeHarness();
  const start = Date.parse('2026-11-04T12:00:00.000Z');
  h.scheduler.schedule({
    endsAt: new Date(start + 30000).toISOString(),
    nextReminderAt: new Date(start + 10000).toISOString(),
    reminderMinutes: 10,
    isBreak: true
  });
  h.advance(30000);
  assert.equal(h.notifications.length, 1);
  assert.equal(h.notifications[0].title, 'Descanso terminado');

  h.scheduler.schedule({ endsAt: new Date(start + 90000).toISOString(), reminderMinutes: 10 });
  h.scheduler.cancel();
  h.advance(120000);
  assert.equal(h.notifications.length, 1);
  h.dispose();
});


test('Focus completion avoids duplicate sound when the renderer can play its selected tone', () => {
  const visible = makeHarness({ hasWindow: () => true });
  const start = Date.parse('2026-11-04T12:00:00.000Z');
  visible.scheduler.schedule({ endsAt: new Date(start + 1000).toISOString(), soundEnabled: true });
  visible.advance(1000);
  assert.equal(visible.notifications[0].silent, true);
  visible.dispose();

  const closed = makeHarness({ hasWindow: () => false });
  closed.scheduler.schedule({ endsAt: new Date(start + 1000).toISOString(), soundEnabled: true });
  closed.advance(1000);
  assert.equal(closed.notifications[0].silent, false);
  closed.dispose();
});


test('Focus reminders avoid duplicate sound when the renderer is available', () => {
  const h = makeHarness({ hasWindow: () => true });
  const start = Date.parse('2026-11-04T12:00:00.000Z');
  h.scheduler.schedule({
    endsAt: new Date(start + 1800000).toISOString(),
    nextReminderAt: new Date(start + 600000).toISOString(),
    reminderMinutes: 10,
    reminderTone: 'tititi',
    reminderSoundEnabled: true
  });
  h.advance(600000);
  assert.equal(h.notifications.length, 1);
  assert.equal(h.notifications[0].silent, true);
  h.dispose();
});

test('Focus reminders are silent when custom alarm sound or system notifications are disabled', () => {
  const silentSound = makeHarness();
  const start = Date.parse('2026-11-04T12:00:00.000Z');
  silentSound.scheduler.schedule({
    endsAt: new Date(start + 1800000).toISOString(),
    nextReminderAt: new Date(start + 600000).toISOString(),
    reminderMinutes: 10,
    reminderSoundEnabled: false
  });
  silentSound.advance(600000);
  assert.equal(silentSound.notifications[0].silent, true);
  silentSound.dispose();

  const notificationsOff = makeHarness();
  notificationsOff.scheduler.schedule({
    endsAt: new Date(start + 1800000).toISOString(),
    nextReminderAt: new Date(start + 600000).toISOString(),
    reminderMinutes: 10,
    notificationsEnabled: false
  });
  notificationsOff.advance(600000);
  assert.equal(notificationsOff.notifications.length, 0);
  notificationsOff.dispose();
});

test('Focus completion respects disabled sounds and disabled system notifications', () => {
  const h = makeHarness();
  const start = Date.parse('2026-11-04T12:00:00.000Z');
  h.scheduler.schedule({
    endsAt: new Date(start + 1000).toISOString(),
    soundEnabled: false,
    notificationsEnabled: true
  });
  h.advance(1000);
  assert.equal(h.notifications.length, 1);
  assert.equal(h.notifications[0].silent, true);
  h.dispose();

  const muted = makeHarness();
  muted.scheduler.schedule({
    endsAt: new Date(start + 1000).toISOString(),
    notificationsEnabled: false
  });
  muted.advance(1000);
  assert.equal(muted.notifications.length, 0);
  muted.dispose();
});
