'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ALLOWED_LEAD_MINUTES = [0, 5, 10, 15, 30, 60];
const MISSED_GRACE_MS = 12 * 60 * 60 * 1000;
// Allow ordinary event-loop delays without treating an on-time reminder as missed.
const ON_TIME_TOLERANCE_MS = 60 * 1000;

function localDateTime(dateKey, timeKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey || '')) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(timeKey || ''))) return NaN;
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = timeKey.split(':').map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return NaN;
  return date.getTime();
}

function createTaskNotificationScheduler({
  Notification,
  powerMonitor,
  platform = process.platform,
  iconPath = '',
  sentPath = '',
  onOpenTask = () => {},
  now = Date.now,
  setTimer = setTimeout,
  clearTimer = clearTimeout
}) {
  let timer = null;
  let disposed = false;
  let retryTimer = null;
  const failures = new Map();
  let lastSnapshot = null;
  const sent = new Set();
  const liveNotifications = new Set();

  if (sentPath) {
    try {
      const stored = JSON.parse(fs.readFileSync(sentPath, 'utf8'));
      if (Array.isArray(stored)) stored.filter(value => typeof value === 'string').slice(-500).forEach(value => sent.add(value));
    } catch {}
  }

  function persistSent() {
    if (!sentPath) return;
    const directory = path.dirname(sentPath);
    const temporary = sentPath + '.tmp';
    try {
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(temporary, JSON.stringify([...sent].slice(-500)), { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(temporary, sentPath);
    } catch (error) {
      try { fs.unlinkSync(temporary); } catch {}
      console.error('[O-Isym] No se pudo guardar el historial de recordatorios:', error);
    }
  }

  function cancelTimer() {
    if (timer !== null) clearTimer(timer);
    timer = null;
  }

  function markSent(key) {
    sent.add(key);
    while (sent.size > 500) sent.delete(sent.values().next().value);
    persistSent();
  }

  // Bounded, delayed retries: a failed toast must not need an unrelated edit to retry.
  function retryFailed(reminder) {
    if (disposed || !reminder.key) return;
    const attempts = (failures.get(reminder.key) || 0) + 1;
    failures.set(reminder.key, attempts);
    while (failures.size > 500) failures.delete(failures.keys().next().value);
    if (attempts > 3 || retryTimer !== null) return;
    retryTimer = setTimer(() => {
      retryTimer = null;
      if (!disposed && lastSnapshot) scheduleSnapshot(lastSnapshot);
    }, 30000);
  }

  function showReminder(reminder) {
    let notification;
    try {
      if (!Notification || (typeof Notification.isSupported === 'function' && !Notification.isSupported())) return false;
      notification = new Notification({
        title: platform === 'darwin' ? 'O-Isym' : 'Hora de ' + reminder.activityName,
        ...(platform === 'darwin' ? { subtitle: 'Hora de ' + reminder.activityName } : {}),
        body: reminder.body,
        icon: iconPath || undefined,
        silent: !reminder.soundEnabled,
        ...(platform === 'darwin' && reminder.soundEnabled ? { sound: 'Ping' } : {})
      });
      let failed = false;
      liveNotifications.add(notification);
      notification.once('close', () => liveNotifications.delete(notification));
      notification.on('failed', (_event, error) => {
        failed = true;
        liveNotifications.delete(notification);
        console.error('[O-Isym] Falló una notificación de tarea:', error);
        if (reminder.key && sent.delete(reminder.key)) persistSent();
        retryFailed(reminder);
      });
      notification.on('click', () => onOpenTask(reminder));
      notification.show();
      return !failed;
    } catch (error) {
      liveNotifications.delete(notification);
      console.error('[O-Isym] No se pudo mostrar una notificación de tarea:', error);
      retryFailed(reminder);
      return false;
    }
  }

  function buildReminders(snapshot) {
    const profile = snapshot && Array.isArray(snapshot.profiles)
      ? snapshot.profiles.find(item => item && item.id === snapshot.activeProfileId)
      : null;
    if (!profile || !Array.isArray(profile.tasks)) return [];
    const preferences = profile.preferences || {};
    if (preferences.taskNotificationsEnabled === false) return [];
    const scope = ['all', 'activity', 'high'].includes(preferences.taskNotificationScope) ? preferences.taskNotificationScope : 'all';
    const lead = ALLOWED_LEAD_MINUTES.includes(Number(preferences.taskNotificationLeadMinutes)) ? Number(preferences.taskNotificationLeadMinutes) : 0;
    const soundEnabled = preferences.taskNotificationSound !== false;
    const reminders = [];
    for (const task of profile.tasks) {
      if (!task || task.status !== 'pending' || task.reminderEnabled === false || !task.scheduledDate || !task.startTime) continue;
      if (scope === 'high' && task.priority !== 'high') continue;
      const activity = (profile.activities || []).find(item => item && item.id === task.activityId && !item.archived);
      if (scope === 'activity' && !activity) continue;
      const dueAt = localDateTime(task.scheduledDate, task.startTime);
      if (!Number.isFinite(dueAt)) continue;
      const activityName = activity ? activity.name : task.title;
      const dateText = new Date(dueAt).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
      const range = task.endTime ? task.startTime + '–' + task.endTime : task.startTime;
      const body = task.title === activityName
        ? dateText + ' · ' + range
        : task.title + ' · ' + dateText + ' · ' + range;
      reminders.push({
        key: [profile.id, task.id, task.scheduledDate, task.startTime].join(':'),
        taskId: task.id,
        scheduledDate: task.scheduledDate,
        triggerAt: dueAt - lead * 60000,
        activityName: String(activityName || task.title).slice(0, 100),
        body: String(body).slice(0, 240),
        soundEnabled
      });
    }
    return reminders.sort((a, b) => a.triggerAt - b.triggerAt);
  }

  function processDue(reminders, missedBehavior) {
    const current = now();
    for (const reminder of reminders) {
      if (sent.has(reminder.key) || reminder.triggerAt > current) continue;
      const missedBy = current - reminder.triggerAt;
      if (missedBy <= ON_TIME_TOLERANCE_MS || missedBehavior === 'notify' && missedBy <= MISSED_GRACE_MS) {
        if (showReminder(reminder)) markSent(reminder.key);
      } else {
        markSent(reminder.key);
      }
    }
  }

  function scheduleSnapshot(snapshot) {
    if (disposed) return;
    lastSnapshot = snapshot;
    cancelTimer();
    const profile = snapshot && Array.isArray(snapshot.profiles)
      ? snapshot.profiles.find(item => item && item.id === snapshot.activeProfileId)
      : null;
    const preferences = profile && profile.preferences || {};
    const missedBehavior = preferences.taskNotificationMissed === 'skip' ? 'skip' : 'notify';
    const reminders = buildReminders(snapshot);
    processDue(reminders, missedBehavior);
    const next = reminders.find(item => !sent.has(item.key) && item.triggerAt > now());
    if (next) {
      timer = setTimer(() => {
        timer = null;
        if (disposed) return;
        const currentProfile = lastSnapshot && lastSnapshot.profiles.find(item => item.id === lastSnapshot.activeProfileId);
        const currentMissed = currentProfile?.preferences?.taskNotificationMissed === 'skip' ? 'skip' : 'notify';
        const fresh = buildReminders(lastSnapshot);
        processDue(fresh, currentMissed);
        scheduleNext(fresh);
      }, Math.max(1, Math.min(2147483647, next.triggerAt - now())));
    }
  }

  function scheduleNext(reminders) {
    if (disposed) return;
    cancelTimer();
    const next = reminders.find(item => !sent.has(item.key) && item.triggerAt > now());
    if (!next) return;
    timer = setTimer(() => {
      timer = null;
      if (disposed) return;
      const profile = lastSnapshot && lastSnapshot.profiles.find(item => item.id === lastSnapshot.activeProfileId);
      const missedBehavior = profile?.preferences?.taskNotificationMissed === 'skip' ? 'skip' : 'notify';
      const fresh = buildReminders(lastSnapshot);
      processDue(fresh, missedBehavior);
      scheduleNext(fresh);
    }, Math.max(1, Math.min(2147483647, next.triggerAt - now())));
  }

  function onResume() {
    if (lastSnapshot) scheduleSnapshot(lastSnapshot);
  }
  if (powerMonitor && typeof powerMonitor.on === 'function') powerMonitor.on('resume', onResume);

  function dispose() {
    disposed = true;
    if (retryTimer !== null) clearTimer(retryTimer);
    retryTimer = null;
    for (const notification of liveNotifications) notification.close();
    liveNotifications.clear();
    cancelTimer();
    if (powerMonitor && typeof powerMonitor.removeListener === 'function') powerMonitor.removeListener('resume', onResume);
  }

  return Object.freeze({
    scheduleSnapshot,
    dispose,
    getScheduledCount: () => buildReminders(lastSnapshot).filter(item => !sent.has(item.key)).length,
    sendTestNotification: () => {
      const profile = lastSnapshot && Array.isArray(lastSnapshot.profiles)
        ? lastSnapshot.profiles.find(item => item && item.id === lastSnapshot.activeProfileId)
        : null;
      return showReminder({
        activityName: 'tu próxima actividad',
        body: 'Así se verán los recordatorios de tus tareas. Puedes cambiar estas opciones en Ajustes.',
        soundEnabled: profile?.preferences?.taskNotificationSound !== false
      });
    }
  });
}

module.exports = { ALLOWED_LEAD_MINUTES, localDateTime, createTaskNotificationScheduler };
