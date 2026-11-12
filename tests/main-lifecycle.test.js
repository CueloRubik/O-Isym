const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { mainProcess } = require('./helpers/main-process.cjs');
const { createStorage } = require('../electron/storage');

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'oisym-startup-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return { directory, storage: createStorage(directory) };
}

for (const damaged of ['{incompleto', JSON.stringify({ schemaVersion: 99 })]) {
  test('startup opens recovery without rewriting invalid data: ' + damaged, async t => {
    const f = await fixture(t);
    await fs.writeFile(f.storage.storePath, damaged);
    const h = mainProcess({ ...f, atLogin: true });
    await h.start();
    assert.equal(h.windows.length, 1);
    assert.equal(h.windows[0].visible, true);
    assert.equal(h.notifications.length, 0);
    assert.equal(h.dialogs.length, 0);
    assert.equal(h.app.loginSettings, undefined);
    assert.equal(await fs.readFile(f.storage.storePath, 'utf8'), damaged);
  });
}

test('a second process quits before reading or scheduling any shared data', async t => {
  const f = await fixture(t);
  const h = mainProcess({ ...f, ownsLock: false });
  await h.start();
  assert.equal(h.app.quits, 1);
  assert.equal(h.readyCalls(), 0);
  assert.equal(h.storageOpens(), 0);
  assert.equal(h.windows.length, 0);
  assert.equal(h.notifications.length, 0);
});

test('second-instance before readiness opens the login window once, then reuses it', async t => {
  const f = await fixture(t);
  await f.storage.read();
  const h = mainProcess({ ...f, atLogin: true });
  h.app.emit('second-instance');
  assert.equal(h.windows.length, 0);
  await h.start();
  assert.equal(h.windows.length, 1);
  const win = h.windows[0];
  assert.equal(win.visible, true);
  win.hide(); win.minimized = true;
  h.app.emit('second-instance', { native: () => {} });
  assert.equal(win.visible, true);
  assert.equal(win.minimized, false);
  assert.equal(win.focused, true);
  assert.equal(h.windows.length, 1);
  assert.equal(h.storageOpens(), 1);
});

test('tray, menu and activation open the window without forwarding native objects', async t => {
  const f = await fixture(t);
  const h = mainProcess(f);
  await h.start();
  const win = h.windows[0];
  const native = { label: 'Abrir O-Isym', cannotClone() {} };
  for (const open of [
    () => h.menu()[0].click(native),
    () => h.tray().emit('click', native),
    () => h.tray().emit('double-click', native),
    () => h.app.emit('activate', native),
    () => h.openReminder(native)
  ]) {
    win.hide(); open();
    assert.equal(win.visible, true);
    assert.equal(win.sent.length, 0);
  }
  h.openReminder({ taskId: 'task-1', scheduledDate: '2026-11-11', native() {} });
  assert.deepEqual(win.sent, [{ name: 'oisym:notifications:open-task', payload: { taskId: 'task-1', scheduledDate: '2026-11-11' } }]);
});
