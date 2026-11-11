'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { renderer } = require('./helpers/renderer.cjs');
const D = require('../src/domain');
const settle = async r => { await r.wait(); await r.wait(); };
function openCalendar(r, date = '2026-11-11', mode = 'day') {
  r.app.state.view = 'calendar';
  r.app.state.selectedDate = date;
  r.app.state.calendarDate = new Date(date + 'T12:00:00');
  r.app.state.calendarMode = mode;
  r.app.updateShell();
}
function submit(r, selector) {
  const form = r.query(selector);
  assert.ok(form, 'Formulario disponible: ' + selector);
  form.dispatchEvent(new r.w.Event('submit', { bubbles: true, cancelable: true }));
}
test('calendar modes remain accessible and share one selected date', async t => {
  const r = await renderer(); t.after(r.dispose);
  openCalendar(r);
  assert.ok(r.query('.day-timeline-card'));
  assert.ok(r.query('[data-action="calendar-mode-month"]'));
  r.click('[data-action="calendar-mode-week"]');
  assert.ok(r.query('.week-calendar'));
  r.click('[data-action="calendar-mode-month"]');
  assert.ok(r.query('.calendar-grid'));
  r.click('[data-action="calendar-mode-agenda"]');
  assert.ok(r.query('.unified-planner-card'));
  r.click('[data-action="calendar-mode-day"]');
  assert.ok(r.query('.day-timeline-card'));
  r.click('[data-action="calendar-day-next"]');
  assert.equal(r.app.state.selectedDate, '2026-11-12');
  assert.deepEqual(r.errors, []);
});
test('task created and edited from Calendar stays canonical, survives persistence and updates Today', async t => {
  const r = await renderer(); t.after(r.dispose);
  const date = D.localDate();
  openCalendar(r, date);
  r.click('[data-action="calendar-add-task"]');
  assert.ok(r.query('.task-form'));
  r.query('.task-form input[name="title"]').value = 'Practicar violín';
  r.query('.task-form input[name="startTime"]').value = '09:00';
  r.query('.task-form input[name="endTime"]').value = '09:45';
  submit(r, '.task-form'); await settle(r);
  assert.equal(r.app.state.profile.tasks.length, 1);
  const id = r.app.state.profile.tasks[0].id;
  assert.equal(r.app.state.profile.tasks[0].scheduledDate, date);
  assert.equal(r.saved().profiles[0].tasks[0].id, id);
  assert.ok(r.query('.day-time-block'));
  r.click('[data-action="edit-task"]');
  assert.equal(r.app.state.editingTaskId, id);
  r.query('.task-form input[name="title"]').value = 'Practicar música';
  submit(r, '.task-form'); await settle(r);
  assert.equal(r.app.state.profile.tasks.length, 1);
  assert.equal(r.app.state.profile.tasks[0].title, 'Practicar música');
  r.app.state.view = 'today'; r.app.updateShell();
  assert.ok(r.query('.today-agenda-card'));
  r.click('[data-action="toggle-task"]'); await settle(r);
  assert.equal(r.app.state.profile.tasks[0].status, 'done');
  assert.equal(r.saved().profiles[0].tasks[0].status, 'done');
  assert.deepEqual(r.errors, []);
});
test('rejected planning proposals do not mutate tasks; accepted ones persist once', async t => {
  const r = await renderer(); t.after(r.dispose);
  openCalendar(r);
  const task = D.createTask({ title: 'Lectura', estimatedMinutes: 30 });
  r.app.state.profile.tasks.push(task);
  r.app.updateShell();
  r.click('[data-action="generate-plan"]'); await settle(r);
  assert.ok(r.app.state.plannerAnalysis.proposals.length > 0);
  r.click('[data-action="discard-plan"]'); await settle(r);
  assert.equal(r.app.state.profile.tasks[0].scheduledDate, '');
  r.click('[data-action="generate-plan"]'); await settle(r);
  r.click('[data-action="apply-plan"]'); await settle(r);
  assert.equal(r.app.state.profile.tasks.length, 1);
  assert.equal(r.app.state.profile.tasks[0].scheduledDate, '2026-11-11');
  assert.equal(r.saved().profiles[0].tasks[0].id, task.id);
  assert.deepEqual(r.errors, []);
});
test('day templates are previewed, saved and applied once through the UI', async t => {
  const r = await renderer(); t.after(r.dispose);
  openCalendar(r);
  r.query('.day-template-form input[name="name"]').value = 'Mañana';
  r.query('.day-template-form input[name="title"]').value = 'Leer';
  submit(r, '.day-template-form'); await settle(r);
  assert.equal(r.app.state.profile.dayTemplates.length, 1);
  assert.equal(r.app.state.profile.tasks.length, 0);
  assert.equal(r.saved().profiles[0].dayTemplates.length, 1);
  r.click('[data-action="template-preview"]'); await settle(r);
  assert.ok(r.query('[data-action="template-apply"]'));
  r.click('[data-action="template-apply"]'); await settle(r);
  assert.equal(r.app.state.profile.tasks.length, 1);
  r.click('[data-action="template-preview"]'); await settle(r);
  assert.equal(r.query('[data-action="template-apply"]'), null);
  assert.equal(r.app.state.profile.tasks.length, 1);
  assert.deepEqual(r.errors, []);
});
test('failed planning write restores in-memory profile and keeps editor usable', async t => {
  const r = await renderer(); t.after(r.dispose);
  openCalendar(r);
  const task = D.createTask({ title: 'Sin planificar' });
  r.app.state.profile.tasks.push(task);
  await r.app.save();
  r.app.updateShell();
  r.fail(true);
  r.click('[data-action="schedule-inbox-task"]'); await settle(r);
  assert.equal(r.app.state.profile.tasks[0].scheduledDate, '');
  assert.equal(r.saved().profiles[0].tasks[0].scheduledDate, '');
  r.fail(false);
  r.click('[data-action="schedule-inbox-task"]'); await settle(r);
  assert.equal(r.app.state.profile.tasks[0].scheduledDate, '2026-11-11');
  assert.equal(r.saved().profiles[0].tasks[0].scheduledDate, '2026-11-11');
  assert.deepEqual(r.errors, []);
});
test('board canvas and Focus remain usable after navigating unified Calendar', async t => {
  const r = await renderer(); t.after(r.dispose);
  openCalendar(r);
  r.app.state.view = 'planner';
  r.app.state.plannerSection = 'board';
  r.app.updateShell();
  assert.ok(r.query('.ideas-canvas-viewport'));
  r.click('[data-action="ideas-note-create"]'); await settle(r);
  assert.equal(r.current().nodes.length, 5);
  r.app.state.view = 'focus'; r.app.updateShell();
  assert.ok(r.query('[data-action="focus-start"]'));
  assert.deepEqual(r.errors, []);
});

test('editing a template rule preserves its identity and leaves existing tasks intact', async t => {
  const r = await renderer(); t.after(r.dispose);
  openCalendar(r);
  r.query('.day-template-form input[name="name"]').value = 'Plan original';
  r.query('.day-template-form input[name="title"]').value = 'Práctica';
  submit(r, '.day-template-form'); await settle(r);
  const id = r.app.state.profile.dayTemplates[0].id;
  r.click('[data-action="template-preview"]'); await settle(r);
  r.click('[data-action="template-apply"]'); await settle(r);
  const taskId = r.app.state.profile.tasks[0].id;
  r.click('[data-action="template-edit"]');
  assert.ok(r.query('.template-edit-form'));
  r.query('.template-edit-form input[name="name"]').value = 'Plan modificado';
  const wednesday = r.query('.template-edit-form input[name="weekday"][value="3"]');
  wednesday.checked = false;
  submit(r, '.template-edit-form'); await settle(r);
  assert.equal(r.app.state.profile.dayTemplates[0].id, id);
  assert.equal(r.app.state.profile.dayTemplates[0].name, 'Plan modificado');
  assert.equal(r.app.state.profile.dayTemplates[0].recurrence.weekdays.includes(3), false);
  assert.equal(r.app.state.profile.tasks[0].id, taskId);
  assert.equal(r.saved().profiles[0].tasks[0].id, taskId);
  assert.deepEqual(r.errors, []);
});
test('keyboard Tab while a task dialog is open does not throw or break navigation', async t => {
  const r = await renderer(); t.after(r.dispose);
  openCalendar(r);
  r.click('[data-action="calendar-add-task"]');
  const modal = r.query('[data-profile-modal]');
  assert.ok(modal);
  const e = new r.w.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab' });
  r.w.document.dispatchEvent(e);
  assert.equal(e.defaultPrevented, true);
  assert.deepEqual(r.errors, []);
});

test('a reminder for a deleted task opens its calendar date rather than Pizarrones', async t => {
  const r = await renderer(); t.after(r.dispose);
  r.w.eval('openTaskFromReminder({ taskId: "deleted-task", scheduledDate: "2026-11-12" })');
  assert.equal(r.app.state.view, 'calendar');
  assert.equal(r.app.state.calendarMode, 'day');
  assert.equal(r.app.state.selectedDate, '2026-11-12');
  assert.ok(r.query('.day-timeline-card'));
  assert.deepEqual(r.errors, []);
});

test('a reminder with an invalid date safely falls back to the local day', async t => {
  const r = await renderer(); t.after(r.dispose);
  r.w.eval('openTaskFromReminder({ taskId: "deleted-task", scheduledDate: "invalid-date" })');
  assert.equal(r.app.state.view, 'calendar');
  assert.equal(r.app.state.selectedDate, D.localDate());
  assert.ok(r.query('.day-timeline-card'));
  assert.deepEqual(r.errors, []);
});

test('a reminder for an existing task still opens the shared task editor', async t => {
  const r = await renderer(); t.after(r.dispose);
  const task = D.createTask({ title: 'Tarea recordada', scheduledDate: '2026-11-12' });
  r.app.state.profile.tasks.push(task);
  r.w.eval('openTaskFromReminder(' + JSON.stringify({ taskId: task.id, scheduledDate: '2026-11-12' }) + ')');
  assert.equal(r.app.state.view, 'tasks');
  assert.equal(r.app.state.editingTaskId, task.id);
  assert.ok(r.query('.task-form'));
  assert.deepEqual(r.errors, []);
});
