const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createFocusNotificationScheduler } = require('../electron/focus-notifications');

function makeHarness() {
  let clock = Date.parse('2026-11-04T12:00:00.000Z');
  let nextId = 1;
  const timers = new Map();
  const notifications = [];
  const powerMonitor = new EventEmitter();

  class FakeNotification {
    constructor(options) { this.options = options; }
    show() { notifications.push(this.options); }
    static isSupported() { return true; }
  }

  const scheduler = createFocusNotificationScheduler({
    Notification: FakeNotification,
    powerMonitor,
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
    endsAt: new Date(start + 30000).toISOString(),
    nextReminderAt: new Date(start + 10000).toISOString(),
    reminderMinutes: 10,
    taskTitle: 'Estudiar matemáticas'
  });

  h.advance(10000);
  assert.equal(h.notifications.length, 1);
  assert.equal(h.notifications[0].title, 'Pausa breve');
  assert.match(h.notifications[0].body, /Estudiar matemáticas/);

  h.advance(10000);
  assert.equal(h.notifications.length, 2);
  assert.equal(h.notifications[1].title, 'Pausa breve');

  h.advance(10000);
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
    endsAt: new Date(start + 30000).toISOString(),
    nextReminderAt: new Date(start + 10000).toISOString(),
    reminderMinutes: 10,
    taskTitle: 'Lectura'
  });

  h.sleep(15000);
  h.resume();
  assert.equal(h.notifications.length, 1);
  assert.equal(h.notifications[0].title, 'Pausa breve');

  h.sleep(20000);
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
