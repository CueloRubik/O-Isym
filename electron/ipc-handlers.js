const path = require('node:path');
const { loginQuery, loginOptions } = require('./login-items');
const { fileURLToPath } = require('node:url');

function isTrustedMainFrame(event, BrowserWindow, indexPath) {
  if (!BrowserWindow.fromWebContents(event.sender)) return false;
  if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame) return false;

  try {
    const senderPath = path.resolve(fileURLToPath(event.senderFrame.url));
    return senderPath === path.resolve(indexPath);
  } catch {
    return false;
  }
}

function registerIpcHandlers({ ipcMain, BrowserWindow, storage, indexPath, focusNotifications, taskNotifications, app }) {
  const assertTrusted = event => {
    if (!isTrustedMainFrame(event, BrowserWindow, indexPath)) {
      throw new Error('Solicitud IPC no autorizada.');
    }
  };

  // Electron invoke rejections do not preserve custom Error properties such as code.
  const storageResult = async operation => {
    try { return { ok: true, value: await operation() }; }
    catch (error) {
      return { ok: false, error: { message: error.message || 'No se pudo acceder a los datos.', code: error.code || null } };
    }
  };

  ipcMain.handle('oisym:storage:read', async event => {
    assertTrusted(event);
    return storageResult(() => storage.read());
  });

  ipcMain.handle('oisym:storage:save', async (event, snapshot) => {
    assertTrusted(event);
    return storageResult(async () => {
      const saved = await storage.save(snapshot);
      if (taskNotifications) taskNotifications.scheduleSnapshot(saved);
      return saved;
    });
  });

  ipcMain.handle('oisym:storage:recovery:list', async event => {
    assertTrusted(event);
    return storageResult(() => storage.recovery.listBackups());
  });

  ipcMain.handle('oisym:storage:recovery:overwrite', async event => {
    assertTrusted(event);
    return storageResult(() => storage.recovery.overwriteWithFreshData());
  });

  ipcMain.handle('oisym:storage:recovery:restore', async (event, name) => {
    assertTrusted(event);
    return storageResult(() => storage.recovery.restoreBackup(name));
  });

  ipcMain.handle('oisym:notifications:status', event => {
    assertTrusted(event);
    const canManageLogin = process.platform === 'darwin' || process.platform === 'win32' && app?.isPackaged && !process.env?.PORTABLE_EXECUTABLE_FILE;
    const login = canManageLogin && app && typeof app.getLoginItemSettings === 'function' ? app.getLoginItemSettings(loginQuery()) : {};
    return { supported: Boolean(require('electron').Notification?.isSupported?.()), launchAtLogin: login.openAtLogin === true, canManageLogin: Boolean(canManageLogin), packaged: app?.isPackaged === true, portable: Boolean(process.env?.PORTABLE_EXECUTABLE_FILE), platform: process.platform, loginStatus: login.status || null };
  });

  ipcMain.handle('oisym:notifications:open-settings', async event => {
    assertTrusted(event);
    if (process.platform !== 'win32') return false;
    await require('electron').shell.openExternal('ms-settings:notifications');
    return true;
  });

  ipcMain.handle('oisym:notifications:test', event => {
    assertTrusted(event);
    return taskNotifications ? taskNotifications.sendTestNotification() : false;
  });

  ipcMain.handle('oisym:notifications:launch-at-login', (event, enabled) => {
    assertTrusted(event);
    if (process.platform === 'win32' && (!app?.isPackaged || process.env?.PORTABLE_EXECUTABLE_FILE)) return false;
    if (typeof enabled !== 'boolean' || !['darwin', 'win32'].includes(process.platform) || !app || typeof app.setLoginItemSettings !== 'function') return false;
    app.setLoginItemSettings(loginOptions(enabled));
    return app.getLoginItemSettings(loginQuery()).openAtLogin === enabled;
  });

  ipcMain.handle('oisym:focus:notifications:schedule', (event, payload) => {
    assertTrusted(event);
    return focusNotifications ? focusNotifications.schedule(payload) : false;
  });

  ipcMain.handle('oisym:focus:notifications:cancel', event => {
    assertTrusted(event);
    if (focusNotifications) focusNotifications.cancel();
    return true;
  });
}

module.exports = { isTrustedMainFrame, registerIpcHandlers };
