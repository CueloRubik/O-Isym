const test = require('node:test');
const assert = require('node:assert/strict');
const { renderer } = require('./helpers/renderer.cjs');
const { createProfile, createTask } = require('../src/domain');

const expired = (isBreak = false) => {
  const startedAt = new Date(Date.now() - 301000).toISOString();
  return { startedAt, sessionStartedAt: startedAt, durationSeconds: 300, elapsedBeforePause: 0, pausedAt: null, isBreak };
};

for (const isBreak of [false, true]) {
  test('failed expired ' + (isBreak ? 'break' : 'Focus') + ' waits for explicit retry without looping', async t => {
    const r = await renderer();
    t.after(() => r.dispose());
    const original = r.w.oisym.storage.save;
    let attempts = 0, fail = true;
    r.w.oisym.storage.save = async value => { attempts++; if (fail) throw Error('Disco no disponible'); return original(value); };
    r.app.state.profile.preferences.focusEndAlarmEnabled = false;
    r.app.state.profile.activeFocus = expired(isBreak);
    r.app.state.view = 'focus';
    r.app.updateShell();
    await r.wait();
    assert.equal(attempts, 1);
    assert.equal(r.app.state.focusTick, null);
    assert.equal(r.app.state.profile.focusSessions.length, 0);
    assert.ok(r.app.state.profile.activeFocus);
    assert.ok(r.query('[data-action="focus-retry-save"]'));
    for (let i = 0; i < 3; i++) {
      r.app.updateShell(); r.app.refreshFocusClock();
      r.w.dispatchEvent(new r.w.Event('focus'));
    }
    await r.wait();
    assert.equal(attempts, 1);
    r.click('[data-action="focus-retry-save"]');
    await r.wait();
    assert.equal(attempts, 2);
    fail = false;
    r.click('[data-action="focus-retry-save"]');
    await r.wait();
    assert.equal(attempts, 3);
    assert.equal(r.app.state.profile.activeFocus, null);
    assert.equal(r.app.state.profile.focusSessions.length, isBreak ? 0 : 1);
    assert.equal(r.saved().profiles[0].focusSessions.length, isBreak ? 0 : 1);
    assert.equal(r.app.state.focusSaveFailures.size, 0);
    assert.equal(r.errors.length, 0);
  });
}

test('failed Focus completion preserves task edits made while saving', async t => {
  const r = await renderer();
  t.after(() => r.dispose());
  let rejectSave;
  r.w.oisym.storage.save = () => new Promise((_resolve, reject) => { rejectSave = reject; });
  r.app.state.profile.activeFocus = expired();
  const completion = r.app.finishFocus({ completed: true });
  await r.wait();
  r.app.state.profile.tasks.push(createTask({ title: 'Creada mientras se guardaba' }));
  rejectSave(Error('Error de escritura'));
  await completion;
  assert.equal(r.app.state.profile.tasks.at(-1).title, 'Creada mientras se guardaba');
  assert.equal(r.app.state.profile.focusSessions.length, 0);
  assert.ok(r.app.state.profile.activeFocus);
});

test('failed Focus completion does not switch back to a profile left during the write', async t => {
  const r = await renderer();
  t.after(() => r.dispose());
  const first = r.app.state.profile;
  first.activeFocus = expired();
  let rejectSave;
  r.w.oisym.storage.save = () => new Promise((_resolve, reject) => { rejectSave = reject; });
  const completion = r.app.finishFocus({ completed: true });
  await r.wait();
  const second = createProfile('Segundo');
  r.app.state.snapshot.profiles.push(second);
  r.app.state.profile = second;
  r.app.state.snapshot.activeProfileId = second.id;
  rejectSave(Error('Error de escritura'));
  await completion;
  assert.equal(r.app.state.profile.id, second.id);
  assert.equal(r.app.state.snapshot.activeProfileId, second.id);
  assert.equal(second.activeFocus, null);
  assert.ok(first.activeFocus);
  assert.equal(first.focusSessions.length, 0);
});

test('a manual stop that fails before the deadline keeps one running session', async t => {
  const r = await renderer();
  t.after(() => r.dispose());
  let attempts = 0;
  r.w.oisym.storage.save = async () => { attempts++; throw Error('Sin espacio'); };
  const focus = expired();
  focus.startedAt = focus.sessionStartedAt = new Date(Date.now() - 1000).toISOString();
  r.app.state.profile.activeFocus = focus;
  assert.equal(await r.app.finishFocus(), false);
  await r.wait();
  assert.equal(attempts, 1);
  assert.ok(r.app.state.focusTick);
  assert.equal(r.app.state.profile.focusSessions.length, 0);
  assert.equal(r.app.state.focusSaveFailures.size, 0);
});

test('repeated retry clicks cannot save the same completed session twice', async t => {
  const r = await renderer();
  t.after(() => r.dispose());
  r.app.state.view = 'focus';
  r.app.state.profile.preferences.focusEndAlarmEnabled = false;
  r.app.state.profile.activeFocus = expired();
  r.fail(true);
  await r.app.finishFocus({ completed: true });
  r.fail(false);
  r.delay(50);
  r.click('[data-action="focus-retry-save"]');
  r.click('[data-action="focus-retry-save"]');
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(r.app.state.profile.activeFocus, null);
  assert.equal(r.app.state.profile.focusSessions.length, 1);
  assert.equal(r.saved().profiles[0].focusSessions.length, 1);
});
