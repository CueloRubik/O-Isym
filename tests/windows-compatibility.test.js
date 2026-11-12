const test = require('node:test');
const assert = require('node:assert/strict');
const { renderer } = require('./helpers/renderer.cjs');
const { mainProcess } = require('./helpers/main-process.cjs');
const { createStorage } = require('../electron/storage');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

test('Windows confirmations preserve unsaved text, restore focus, and never call native confirm', async t => {
  const r = await renderer(); t.after(r.dispose);
  r.w.oisym.platform = 'win32';
  r.w.confirm = () => { throw new Error('Native confirmation must not run on Windows'); };
  r.app.state.view = 'tasks'; r.app.updateShell();
  r.click('[data-action="new-task"]');
  const title = r.query('.task-form input[name="title"]');
  title.value = 'Texto sin guardar';
  title.dispatchEvent(new r.w.Event('input', { bubbles: true }));
  title.focus();
  r.click('.task-editor-close'); await r.wait();
  let dialog = r.query('[data-confirm-dialog]');
  assert.ok(dialog);
  dialog.querySelector('button[type="button"]').click(); await r.wait();
  assert.equal(r.query('[data-confirm-dialog]'), null);
  assert.equal(r.w.document.activeElement, title);
  assert.equal(title.value, 'Texto sin guardar');
  title.value += ' y sigo escribiendo';
  r.click('.task-editor-close'); await r.wait();
  dialog = r.query('[data-confirm-dialog]');
  dialog.dispatchEvent(new r.w.Event('cancel', { cancelable: true })); await r.wait();
  assert.equal(r.w.document.activeElement, title);
  assert.ok(title.value.endsWith('escribiendo'));
  r.click('.task-editor-close'); await r.wait();
  r.query('[data-confirm-dialog] form').dispatchEvent(new r.w.Event('submit', { bubbles: true, cancelable: true }));
  await r.wait();
  assert.equal(r.query('[data-confirm-dialog]'), null);
  assert.equal(r.query('.task-editor-panel'), null);
  assert.deepEqual(r.errors, []);
});

test('Windows registers toast identity, saves before hiding, and reopens from tray', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'oisym-win-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const h = mainProcess({ directory, storage: createStorage(directory), platform: 'win32' });
  await h.start();
  assert.equal(h.app.appUserModelId, 'com.oisym.app');
  assert.ok(h.tray());
  const win = h.windows[0];
  let prevented = false;
  win.emit('close', { preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(win.visible, true);
  h.ipcMain.emit('oisym:window:saved-before-close', { sender: win.webContents }, true);
  assert.equal(win.visible, false);
  assert.equal(h.app.quits, undefined);
  h.tray().emit('double-click');
  assert.equal(win.visible, true);
  assert.equal(win.focused, true);
  h.app.emit('before-quit');
  win.emit('close', { preventDefault() {} });
  h.ipcMain.emit('oisym:window:saved-before-close', { sender: win.webContents }, true);
  assert.equal(h.app.quits, 1);
});


test('Windows login startup uses a hidden argument and keeps an accessible tray', async t => {
  const { loginOptions, loginQuery, HIDDEN_LOGIN_ARGUMENT } = require('../electron/login-items');
  assert.deepEqual(loginOptions(true, 'win32'), { openAtLogin: true, args: [HIDDEN_LOGIN_ARGUMENT] });
  assert.deepEqual(loginOptions(false, 'win32'), { openAtLogin: false, args: [HIDDEN_LOGIN_ARGUMENT] });
  assert.deepEqual(loginQuery('win32'), { args: [HIDDEN_LOGIN_ARGUMENT] });
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'oisym-win-login-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const storage = createStorage(directory);
  const snapshot = await storage.read();
  const profile = require('../src/domain').createProfile('Windows');
  profile.preferences.launchAtLogin = true;
  snapshot.profiles = [profile]; snapshot.activeProfileId = profile.id;
  await storage.save(snapshot);
  const h = mainProcess({ directory, storage, platform: 'win32', args: [HIDDEN_LOGIN_ARGUMENT] });
  await h.start();
  assert.equal(h.windows[0].visible, false);
  assert.ok(h.tray());
  assert.deepEqual(JSON.parse(JSON.stringify(h.app.loginSettings)), loginOptions(true, 'win32'));
  h.app.emit('second-instance');
  assert.equal(h.windows[0].visible, true);
});

test('Windows window receives the packaged ICO and a collapsed menu bar', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'oisym-win-icon-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const h = mainProcess({ directory, storage: createStorage(directory), platform: 'win32' });
  await h.start();
  assert.equal(h.windows[0].options.icon, path.resolve(__dirname, '../app.ico'));
  assert.equal(h.windows[0].options.autoHideMenuBar, true);
});

test('development startup never registers electron.exe for Windows login', async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'oisym-win-dev-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const storage = createStorage(directory);
  const snapshot = await storage.read();
  const profile = require('../src/domain').createProfile('Windows dev');
  profile.preferences.launchAtLogin = true;
  snapshot.profiles = [profile]; snapshot.activeProfileId = profile.id;
  await storage.save(snapshot);
  const h = mainProcess({ directory, storage, platform: 'win32', packaged: false });
  await h.start();
  assert.equal(h.app.loginSettings, undefined);
  assert.equal(h.windows[0].visible, true);
});

test('Windows notification controls open system settings and explain development startup', async t => {
  const r = await renderer(); t.after(r.dispose);
  let opened = 0;
  r.w.oisym.platform = 'win32';
  r.w.oisym.notifications = {
    getStatus: async () => ({ platform: 'win32', supported: true, packaged: false, canManageLogin: false }),
    openSettings: async () => { opened++; return true; }
  };
  r.app.state.view = 'settings'; r.app.state.settingsSection = 'notifications'; r.app.updateShell();
  await r.wait();
  assert.equal(r.query('[name="launchAtLogin"]').disabled, true);
  r.click('[data-action="open-notification-settings"]'); await r.wait();
  assert.equal(opened, 1);
  assert.match(r.query('.notification-settings-form').textContent, /Instala O-Isym/);
  assert.deepEqual(r.errors, []);
});

test('Windows settings IPC accepts only trusted frames and a fixed system URL', async () => {
  const vm = require('node:vm');
  const handlers = new Map(), opened = [], registered = [];
  const indexPath = path.resolve(__dirname, '../index.html');
  const frame = { url: require('node:url').pathToFileURL(indexPath).href };
  const sender = { mainFrame: frame };
  const app = { isPackaged: false, getLoginItemSettings: () => ({}), setLoginItemSettings: value => registered.push(value) };
  const context = { exports: {}, module: { exports: {} }, process: { platform: 'win32', env: {} }, require: name => name === 'electron' ? { Notification: { isSupported: () => true }, shell: { openExternal: async url => opened.push(url) } } : name === './login-items' ? require('../electron/login-items') : require(name) };
  vm.runInNewContext(require('node:fs').readFileSync(path.resolve(__dirname, '../electron/ipc-handlers.js'), 'utf8'), context);
  context.module.exports.registerIpcHandlers({ ipcMain: { handle: (name, fn) => handlers.set(name, fn) }, BrowserWindow: { fromWebContents: value => value === sender }, storage: {}, indexPath, app });
  const event = { sender, senderFrame: frame };
  assert.equal(handlers.get('oisym:notifications:status')(event).canManageLogin, false);
  assert.equal(handlers.get('oisym:notifications:launch-at-login')(event, true), false);
  assert.equal(registered.length, 0);
  await assert.rejects(handlers.get('oisym:notifications:open-settings')({ sender, senderFrame: { url: frame.url } }), /no autorizada/);
  assert.equal(opened.length, 0);
  await handlers.get('oisym:notifications:open-settings')(event, 'https://untrusted.test');
  assert.deepEqual(opened, ['ms-settings:notifications']);
  app.isPackaged = true;
  context.process.env.PORTABLE_EXECUTABLE_FILE = 'C:\\portable.exe';
  assert.equal(handlers.get('oisym:notifications:launch-at-login')(event, true), false);
  assert.equal(registered.length, 0);
});
