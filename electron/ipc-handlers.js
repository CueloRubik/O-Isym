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

function registerIpcHandlers({ ipcMain, BrowserWindow, storage, indexPath }) {
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
    return storage.save(snapshot);
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
}

module.exports = { isTrustedMainFrame, registerIpcHandlers };
