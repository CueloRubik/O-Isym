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

test('workspace groups its navigation and keeps quick capture available outside Today', async t => {
  const r = await renderer(); t.after(r.dispose);
  openCalendar(r, '2026-11-11', 'day');
  assert.ok(r.query('.workspace-shell'));
  assert.equal(r.queryAll?.('.navigation-group')?.length || r.w.document.querySelectorAll('.navigation-group').length, 3);
  assert.ok(r.query('.topbar-create'));
  assert.equal(r.query('#topbar-view-name').textContent, 'Calendario');
  r.click('[data-action="toggle-sidebar"]');
  assert.equal(r.app.state.sidebarCollapsed, true);
  assert.equal(r.query('.workspace-shell').classList.contains('is-sidebar-collapsed'), true);
  r.click('[data-action="toggle-sidebar"]');
  assert.equal(r.app.state.sidebarCollapsed, false);
  r.click('.topbar-create');
  assert.ok(r.query('.task-editor-panel'));
  assert.ok(r.query('.task-form input[name="title"]'));
  assert.deepEqual(r.errors, []);
});

test('task inspector reuses the same record and protects unsaved changes', async t => {
  const r = await renderer(); t.after(r.dispose);
  const task = D.createTask({ title: 'Plan pendiente' });
  r.app.state.profile.tasks.push(task);
  r.app.state.view = 'tasks'; r.app.updateShell();
  r.click('[data-action="plan-task"]');
  assert.equal(r.app.state.editingTaskId, task.id);
  assert.equal(r.w.document.activeElement.name, 'scheduledDate');
  const field = r.query('.task-form input[name="scheduledDate"]');
  field.value = '2026-11-15';
  field.dispatchEvent(new r.w.Event('input', { bubbles: true }));
  r.w.confirm = () => false;
  r.click('.task-editor-close');
  assert.ok(r.query('.task-editor-panel'));
  assert.equal(r.app.state.editingTaskId, task.id);
  r.w.confirm = () => true;
  r.click('.task-editor-close');
  assert.equal(r.query('.task-editor-panel'), null);
  assert.equal(r.app.state.profile.tasks[0].scheduledDate, '');
  assert.deepEqual(r.errors, []);
});

test('calendar day draws real time blocks and keeps overlapping entries editable', async t => {
  const r = await renderer(); t.after(r.dispose);
  const first = D.createTask({ title: 'Bloque A', scheduledDate: '2026-11-11', startTime: '09:00', endTime: '10:00' });
  const second = D.createTask({ title: 'Bloque B', scheduledDate: '2026-11-11', startTime: '09:30', endTime: '10:30' });
  r.app.state.profile.tasks.push(first, second);
  openCalendar(r, '2026-11-11', 'day');
  const blocks = Array.from(r.w.document.querySelectorAll('.day-positioned-block'));
  assert.equal(blocks.length, 2);
  assert.notEqual(blocks[0].style.left, blocks[1].style.left);
  assert.equal(r.w.document.querySelectorAll('.day-ruler-label').length > 0, true);
  assert.ok(r.query('.schedule-conflicts'));
  assert.ok(blocks[0].querySelector('[data-action="edit-task"]'));
  r.click('[data-action="calendar-mode-agenda"]');
  assert.equal(r.w.document.querySelectorAll('.day-positioned-block').length, 0);
  assert.equal(r.w.document.querySelectorAll('.day-agenda-list .day-time-block').length, 2);
  assert.deepEqual(r.errors, []);
});

test('locked scheduled task asks for explicit permission before moving in shared editor', async t => {
  const r = await renderer(); t.after(r.dispose);
  const task = D.createTask({ title: 'Compromiso fijo', scheduledDate: '2026-11-11',
    startTime: '09:00', endTime: '10:00', locked: true });
  r.app.state.profile.tasks.push(task);
  await r.app.save();
  openCalendar(r, '2026-11-11', 'day');
  r.click('[data-action="edit-task"]');
  r.query('.task-form input[name="startTime"]').value = '10:00';
  r.query('.task-form input[name="endTime"]').value = '11:00';
  r.w.confirm = () => false;
  submit(r, '.task-form'); await settle(r);
  assert.equal(r.app.state.profile.tasks[0].startTime, '09:00');
  r.w.confirm = () => true;
  submit(r, '.task-form'); await settle(r);
  assert.equal(r.app.state.profile.tasks[0].startTime, '10:00');
  assert.equal(r.saved().profiles[0].tasks[0].startTime, '10:00');
  assert.deepEqual(r.errors, []);
});

test('task options use explicit controls and safely move the same task to the next day', async t => {
  const r = await renderer(); t.after(r.dispose);
  const task = D.createTask({ title: 'Estudiar', scheduledDate: '2026-11-11',
    startTime: '09:00', endTime: '10:00' });
  r.app.state.profile.tasks.push(task);
  await r.app.save();
  r.app.state.view = 'tasks'; r.app.updateShell();
  const details = r.query('.task-action-menu');
  assert.ok(details);
  details.open = true;
  assert.ok(r.query('[data-action="task-action-lock"]'));
  assert.ok(r.query('[data-action="task-action-postpone"]'));
  assert.ok(r.query('[data-action="task-action-delete"]'));
  r.click('[data-action="task-action-postpone"]'); await settle(r);
  assert.equal(r.app.state.profile.tasks.length, 1);
  assert.equal(r.app.state.profile.tasks[0].id, task.id);
  assert.equal(r.app.state.profile.tasks[0].scheduledDate, '2026-11-12');
  assert.equal(r.app.state.profile.tasks[0].startTime, '09:00');
  assert.equal(r.saved().profiles[0].tasks[0].scheduledDate, '2026-11-12');
  assert.deepEqual(r.errors, []);
});

test('task action menu requires confirmation before deleting a protected task', async t => {
  const r = await renderer(); t.after(r.dispose);
  const task = D.createTask({ title: 'Cita importante', locked: true });
  r.app.state.profile.tasks.push(task);
  await r.app.save();
  r.app.state.view = 'tasks'; r.app.updateShell();
  r.w.confirm = () => false;
  r.click('[data-action="task-action-delete"]'); await settle(r);
  assert.equal(r.app.state.profile.tasks.length, 1);
  r.w.confirm = () => true;
  r.click('[data-action="task-action-delete"]'); await settle(r);
  assert.equal(r.app.state.profile.tasks.length, 0);
  assert.equal(r.saved().profiles[0].tasks.length, 0);
  assert.deepEqual(r.errors, []);
});

test('activity and goal editors use the same side panel layout without changing data flows', async t => {
  const r = await renderer(); t.after(r.dispose);
  r.app.state.view = 'activities'; r.app.updateShell();
  r.click('[data-action="new-activity"]');
  assert.ok(r.query('.entity-editor-backdrop .entity-editor-panel'));
  r.click('[data-action="close-activity-form"]');
  r.app.state.view = 'goals'; r.app.updateShell();
  r.click('[data-action="new-goal"]');
  assert.ok(r.query('.entity-editor-backdrop .entity-editor-panel'));
  r.click('[data-action="close-goal-form"]');
  assert.equal(r.query('.entity-editor-panel'), null);
  assert.deepEqual(r.errors, []);
});

test('appearance gallery previews twelve palettes without changing the saved profile', async t => {
  const r=await renderer();t.after(r.dispose);
  r.app.state.view='settings';r.app.state.settingsSection='appearance';r.app.updateShell();
  const picker=r.query('.appearance-form');
  assert.ok(picker);
  assert.equal(r.w.document.querySelectorAll('.appearance-palette-button').length,12);
  const initialAccent=r.query('.appearance-preview').style.getPropertyValue('--preview-accent');
  r.click('[data-action="appearance-palette"][data-palette="orchid"]');
  const after=r.query('.appearance-preview').style.getPropertyValue('--preview-accent');
  assert.notEqual(initialAccent,after);
  assert.equal(r.app.state.profile.preferences.appearancePalette,'forest');
  assert.equal(r.saved().profiles[0].preferences.appearancePalette,'forest');
  assert.deepEqual(r.errors,[]);
});
test('dark appearance saves only after confirmation and survives rerender and reload', async t => {
  const r=await renderer();t.after(r.dispose);
  r.app.state.view='settings';r.app.state.settingsSection='appearance';r.app.updateShell();
  const dark=r.query('input[name="appearanceMode"][value="dark"]');
  dark.checked=true;dark.dispatchEvent(new r.w.Event('change',{bubbles:true}));
  r.click('[data-action="appearance-palette"][data-palette="midnight"]');
  assert.equal(r.app.state.profile.preferences.appearanceMode,'light');
  submit(r,'.appearance-form');await settle(r);
  assert.equal(r.app.state.profile.preferences.appearanceMode,'dark');
  assert.equal(r.saved().profiles[0].preferences.appearancePalette,'midnight');
  assert.equal(r.w.document.documentElement.dataset.scheme,'dark');
  r.app.updateShell();
  assert.equal(r.query('input[name="appearanceMode"][value="dark"]').checked,true);
  assert.equal(r.query('.appearance-palette-button[data-palette="midnight"]').getAttribute('aria-pressed'),'true');
  assert.deepEqual(r.errors,[]);
});
test('custom colors set their own toggles and low contrast text gets a warning', async t => {
  const r=await renderer();t.after(r.dispose);
  r.app.state.view='settings';r.app.state.settingsSection='appearance';r.app.updateShell();
  const color=r.query('[name="appearance-text"]');
  const surface=r.query('[name="appearance-surface"]');
  surface.value='#101010';surface.dispatchEvent(new r.w.Event('input',{bubbles:true}));
  color.value='#101010';color.dispatchEvent(new r.w.Event('input',{bubbles:true}));
  assert.equal(r.query('[name="custom-surface"]').checked,true);
  assert.equal(r.query('[name="custom-text"]').checked,true);
  assert.ok(r.query('.appearance-contrast-note.warning'));
  submit(r,'.appearance-form');await settle(r);
  assert.equal(r.saved().profiles[0].preferences.appearanceColors.text,'#101010');
  assert.equal(r.saved().profiles[0].preferences.appearanceColors.surface,'#101010');
  assert.deepEqual(r.errors,[]);
});
test('failed appearance save rolls back colors and mode without affecting tasks', async t => {
  const r=await renderer();t.after(r.dispose);
  const original=D.createTask({title:'Se conserva'});
  r.app.state.profile.tasks.push(original);
  await r.app.save();
  r.app.state.view='settings';r.app.state.settingsSection='appearance';r.app.updateShell();
  r.query('input[name="appearanceMode"][value="dark"]').checked=true;
  r.fail(true);submit(r,'.appearance-form');await settle(r);
  assert.equal(r.app.state.profile.preferences.appearanceMode,'light');
  assert.equal(r.w.document.documentElement.dataset.scheme,'light');
  assert.equal(r.saved().profiles[0].tasks[0].id,original.id);
  assert.equal(r.saved().profiles[0].preferences.appearanceMode,'light');
  assert.deepEqual(r.errors,[]);
});
test('restoring suggested colors affects preview only until saved', async t => {
  const r=await renderer();t.after(r.dispose);
  r.app.state.profile.preferences.appearanceMode='dark';
  r.app.state.profile.preferences.appearancePalette='orchid';
  await r.app.save();
  r.app.state.view='settings';r.app.state.settingsSection='appearance';r.app.updateShell();
  r.click('[data-action="appearance-reset"]');
  assert.equal(r.query('input[name="appearanceMode"][value="light"]').checked,true);
  assert.equal(r.app.state.profile.preferences.appearanceMode,'dark');
  submit(r,'.appearance-form');await settle(r);
  assert.equal(r.app.state.profile.preferences.appearanceMode,'light');
  assert.equal(r.saved().profiles[0].preferences.appearancePalette,'forest');
  assert.deepEqual(r.errors,[]);
});

test('automatic appearance reacts to macOS changes while explicit light stays light', async t => {
  const r=await renderer();t.after(r.dispose);
  r.app.state.view='settings';r.app.state.settingsSection='appearance';r.app.updateShell();
  r.query('input[name="appearanceMode"][value="system"]').checked=true;
  submit(r,'.appearance-form');await settle(r);
  assert.equal(r.w.document.documentElement.dataset.scheme,'light');
  r.setSystemDark(true);
  assert.equal(r.w.document.documentElement.dataset.scheme,'dark');
  r.setSystemDark(false);
  assert.equal(r.w.document.documentElement.dataset.scheme,'light');
  r.query('input[name="appearanceMode"][value="light"]').checked=true;
  submit(r,'.appearance-form');await settle(r);
  r.setSystemDark(true);
  assert.equal(r.w.document.documentElement.dataset.scheme,'light');
  assert.deepEqual(r.errors,[]);
});
test('appearance is isolated between profiles when switching spaces', async t => {
  const r=await renderer();t.after(r.dispose);
  const first=r.app.state.profile;
  first.preferences.appearanceMode='dark';
  first.preferences.appearancePalette='midnight';
  const second=D.createProfile('Espacio B');
  second.preferences.appearanceMode='light';
  second.preferences.appearancePalette='rose';
  r.app.state.snapshot.profiles.push(second);
  await r.app.save();r.app.updateShell();
  assert.equal(r.w.document.documentElement.dataset.scheme,'dark');
  const selector=r.query('#profile-select');
  selector.value=second.id;selector.dispatchEvent(new r.w.Event('change',{bubbles:true}));
  await settle(r);
  assert.equal(r.app.state.profile.id,second.id);
  assert.equal(r.w.document.documentElement.dataset.scheme,'light');
  assert.equal(r.app.state.profile.preferences.appearancePalette,'rose');
  assert.equal(r.saved().profiles.find(p=>p.id===first.id).preferences.appearanceMode,'dark');
  assert.deepEqual(r.errors,[]);
});

test('profile creation wizard transfers its selected legacy theme into the new palette', async t => {
  const r=await renderer();t.after(r.dispose);
  r.click('[data-action="new-profile"]');
  const wizard=r.query('form[data-form="profile-create"]');
  assert.ok(wizard);
  wizard.querySelector('input[name="name"]').value='Segundo perfil';
  r.click('[data-action="profile-wizard-next"]');
  r.click('[data-action="profile-wizard-next"]');
  wizard.querySelector('select[name="theme"]').value='sky';
  wizard.querySelector('input[name="color"]').value='#225588';
  submit(r,'form[data-form="profile-create"]');await settle(r);
  assert.equal(r.app.state.profile.name,'Segundo perfil');
  assert.equal(r.app.state.profile.preferences.appearancePalette,'ocean');
  assert.equal(r.app.state.profile.preferences.appearanceColors.accent,'#225588');
  assert.equal(r.saved().profiles.length,2);
  assert.deepEqual(r.errors,[]);
});
