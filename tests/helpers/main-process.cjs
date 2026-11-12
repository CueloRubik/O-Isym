const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function mainProcess({ storage, directory, platform = 'darwin', ownsLock = true, atLogin = false, args = [] } = {}) {
  const app = new EventEmitter();
  const ipcMain = new EventEmitter();
  const windows = [], notifications = [], dialogs = [];
  let storageOpens = 0, readyCalls = 0, menu, tray;
  let ready, startup;
  const readyPromise = new Promise(resolve => { ready = resolve; });
  app.requestSingleInstanceLock = () => ownsLock;
  app.setAppUserModelId = value => { app.appUserModelId = value; };
  app.disableHardwareAcceleration = () => {};
  app.whenReady = () => {
    readyCalls++;
    return { then: callback => { startup = readyPromise.then(callback); return startup; } };
  };
  app.quit = () => { app.quits = (app.quits || 0) + 1; };
  app.getPath = () => directory;
  app.getLoginItemSettings = () => ({ wasOpenedAtLogin: atLogin });
  app.setLoginItemSettings = value => { app.loginSettings = value; };
  class BrowserWindow extends EventEmitter {
    constructor(options) {
      super(); this.options = options; this.visible = options.show; this.sent = [];
      this.webContents = new EventEmitter();
      this.webContents.isLoading = () => Boolean(this.loading);
      this.webContents.send = (name, payload) => this.sent.push({ name, payload: structuredClone(payload) });
      this.webContents.setWindowOpenHandler = () => {};
      windows.push(this);
    }
    isDestroyed() { return Boolean(this.destroyed); }
    isMinimized() { return Boolean(this.minimized); }
    restore() { this.minimized = false; }
    show() { this.visible = true; }
    hide() { this.visible = false; }
    focus() { this.focused = true; }
    loadFile() {
      this.loading = true;
      return Promise.resolve().then(() => { this.loading = false; this.webContents.emit('did-finish-load'); });
    }
  }
  BrowserWindow.getAllWindows = () => windows.filter(win => !win.destroyed);
  class Tray extends EventEmitter {
    constructor() { super(); tray = this; }
    setToolTip() {}
    setContextMenu(value) { menu = value; }
    destroy() {}
  }
  const taskNotifications = { scheduleSnapshot: snapshot => notifications.push(snapshot), dispose() {} };
  const modules = {
    electron: { app, ipcMain, BrowserWindow, Tray,
      dialog: { showErrorBox: (...args) => dialogs.push(args) },
      Menu: { buildFromTemplate: value => value },
      nativeImage: { createFromPath: () => ({ isEmpty: () => false, resize() { return this; } }) }
    },
    './login-items': require('../../electron/login-items'),
    './storage': { createStorage: () => { storageOpens++; return storage; } },
    './ipc-handlers': { registerIpcHandlers() {}, isTrustedMainFrame: () => true },
    './focus-notifications': { createFocusNotificationScheduler: () => ({ dispose() {} }) },
    './task-notifications': { createTaskNotificationScheduler: () => taskNotifications }
  };
  const context = {
    require: name => Object.hasOwn(modules, name) ? modules[name] : require(name),
    __dirname: path.join(__dirname, '../../electron'), process: { platform, argv: args },
    console: { error() {} }, setTimeout: () => 1, clearTimeout() {}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../electron/main.js'), 'utf8'), context);
  const settle = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)); };
  return { app, ipcMain, windows, notifications, dialogs, settle,
    start: async () => { ready(); await startup; await settle(); },
    tray: () => tray, menu: () => menu,
    storageOpens: () => storageOpens, readyCalls: () => readyCalls,
    openReminder: reminder => { context.reminder = reminder; vm.runInNewContext('showMainWindow(reminder)', context); }
  };
}
module.exports = { mainProcess };
