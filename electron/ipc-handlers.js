const path = require('node:path');
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

  ipcMain.handle('oisym:storage:read', async event => {
    assertTrusted(event);
    return storage.read();
  });

  ipcMain.handle('oisym:storage:save', async (event, snapshot) => {
    assertTrusted(event);
    const saved = await storage.save(snapshot);
    if (taskNotifications) taskNotifications.scheduleSnapshot(saved);
    return saved;
  });

  ipcMain.handle('oisym:storage:recovery:list', async event => {
    assertTrusted(event);
    return storage.recovery.listBackups();
  });

  ipcMain.handle('oisym:storage:recovery:overwrite', async event => {
    assertTrusted(event);
    return storage.recovery.overwriteWithFreshData();
  });

  ipcMain.handle('oisym:storage:recovery:restore', async (event, name) => {
    assertTrusted(event);
    return storage.recovery.restoreBackup(name);
  });

  ipcMain.handle('oisym:notifications:status', event => {
    assertTrusted(event);
    const canManageLogin = process.platform === 'darwin' || process.platform === 'win32';
    const login = canManageLogin && app && typeof app.getLoginItemSettings === 'function' ? app.getLoginItemSettings() : {};
    return { supported: Boolean(require('electron').Notification?.isSupported?.()), launchAtLogin: login.openAtLogin === true, canManageLogin };
  });

  ipcMain.handle('oisym:notifications:test', event => {
    assertTrusted(event);
    return taskNotifications ? taskNotifications.sendTestNotification() : false;
  });

  ipcMain.handle('oisym:notifications:launch-at-login', (event, enabled) => {
    assertTrusted(event);
    if (typeof enabled !== 'boolean' || !['darwin', 'win32'].includes(process.platform) || !app || typeof app.setLoginItemSettings !== 'function') return false;
    app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: enabled });
    return app.getLoginItemSettings().openAtLogin === enabled;
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
