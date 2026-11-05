'use strict';

function createFocusNotificationScheduler({ Notification, powerMonitor, hasWindow = () => false, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let active = null;
  let timer = null;

  function clearScheduledTimer() {
    if (timer !== null) clearTimer(timer);
    timer = null;
  }

  function show(title, body, options = {}) {
    try {
      if (!Notification || (typeof Notification.isSupported === 'function' && !Notification.isSupported())) return;
      const notification = new Notification({ title, body, silent: options.silent === true });
      notification.on('failed', (_event, error) => console.error('[O-Isym] No se pudo mostrar una notificación:', error));
      notification.show();
    } catch (error) {
      // A notification can be unavailable or disabled by the operating system.
    }
  }

  function check() {
    clearScheduledTimer();
    if (!active) return;
    const currentTime = now();

    if (currentTime >= active.endsAt) {
      const completed = active;
      active = null;
      show(completed.isBreak ? 'Descanso terminado' : 'Focus terminado',
        completed.isBreak
          ? 'Tu descanso terminó. Cuando quieras, puedes volver a concentrarte.'
          : (completed.taskTitle
            ? 'Terminaste tu sesión de ' + completed.taskTitle + '. Tómate un descanso.'
            : 'Terminaste tu sesión de concentración. Tómate un descanso.'),
        { silent: Boolean(hasWindow()) && completed.soundEnabled });
      return;
    }

    if (active.nextReminderAt !== null && currentTime >= active.nextReminderAt) {
      show('Pausa breve', active.taskTitle
        ? 'Llevas un rato en Focus con «' + active.taskTitle + '». Puedes revisar cómo te sientes y continuar.'
        : 'Llevas un rato en Focus. Puedes revisar cómo te sientes y continuar.');
      do {
        active.nextReminderAt += active.reminderMinutes * 60 * 1000;
      } while (active.nextReminderAt <= currentTime);
      if (active.nextReminderAt >= active.endsAt) active.nextReminderAt = null;
    }

    const nextAt = active.nextReminderAt === null
      ? active.endsAt
      : Math.min(active.nextReminderAt, active.endsAt);
    timer = setTimer(check, Math.max(1, nextAt - now()));
  }

  function schedule(payload) {
    cancel();
    if (!payload || typeof payload !== 'object') return false;
    const endsAt = Date.parse(payload.endsAt);
    if (!Number.isFinite(endsAt)) return false;
    const isBreak = payload.isBreak === true;
    const reminderMinutes = isBreak ? 0 : Math.max(0, Math.min(60, Number(payload.reminderMinutes) || 0));
    const requestedReminderAt = Date.parse(payload.nextReminderAt);
    active = {
      endsAt,
      isBreak,
      taskTitle: typeof payload.taskTitle === 'string' ? payload.taskTitle.slice(0, 140) : '',
      soundEnabled: payload.soundEnabled !== false,
      reminderMinutes,
      nextReminderAt: reminderMinutes > 0 && Number.isFinite(requestedReminderAt) && requestedReminderAt < endsAt
        ? requestedReminderAt
        : null
    };
    check();
    return true;
  }

  function cancel() {
    clearScheduledTimer();
    active = null;
  }

  function onResume() {
    check();
  }

  if (powerMonitor && typeof powerMonitor.on === 'function') powerMonitor.on('resume', onResume);

  function dispose() {
    cancel();
    if (powerMonitor && typeof powerMonitor.removeListener === 'function') powerMonitor.removeListener('resume', onResume);
  }

  return Object.freeze({ schedule, cancel, dispose });
}

module.exports = { createFocusNotificationScheduler };
