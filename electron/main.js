const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

const { createStorage } = require('./storage');
const { registerIpcHandlers } = require('./ipc-handlers');

const indexPath = path.join(__dirname, '..', 'index.html');
const storage = createStorage(app.getPath('userData'));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    resizable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  win.once('ready-to-show', () => win.show());

  // La aplicación es local: no permitir navegar a páginas externas ni abrir ventanas nuevas.
  win.webContents.on('will-navigate', (event, destination) => {
    if (destination !== require('node:url').pathToFileURL(indexPath).toString()) {
      event.preventDefault();
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.loadFile(indexPath);
}

app.whenReady().then(() => {
  registerIpcHandlers({ ipcMain, BrowserWindow, storage, indexPath });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
