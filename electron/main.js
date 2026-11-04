const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');

const { createStorage } = require('./storage');
const { registerIpcHandlers } = require('./ipc-handlers');

const indexPath = path.join(__dirname, '..', 'index.html');

// Evita fallos de inicialización gráfica en Macs antiguos con GPU Intel integrada.
app.disableHardwareAcceleration();

function reportStartupError(title, error) {
  const detail = error && (error.stack || error.message) ? (error.stack || error.message) : String(error);
  console.error('[O-Isym]', title, detail);
  try {
    const logPath = path.join(app.getPath('userData'), 'startup-error.log');
    require('node:fs').appendFileSync(logPath, new Date().toISOString() + ' ' + title + '\\n' + detail + '\\n\\n', 'utf8');
  } catch (logError) {
    console.error('[O-Isym] No se pudo escribir el registro:', logError);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 650,
    resizable: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      backgroundThrottling: false
    }
  });

  win.once('ready-to-show', () => win.show());
  win.webContents.on('render-process-gone', (_event, details) => {
    reportStartupError('El proceso visual se cerró', new Error(JSON.stringify(details)));
    dialog.showErrorBox('O-Isym tuvo un problema', 'La ventana de O-Isym se cerró inesperadamente. Se guardó un registro en la carpeta de datos de O-Isym.\\n\\n' + JSON.stringify(details));
  });
  win.webContents.on('did-fail-load', (_event, code, description, validatedURL) => {
    reportStartupError('No se pudo cargar la interfaz', new Error(code + ' ' + description + ' (' + validatedURL + ')'));
  });

  // La aplicación es local: no permitir navegar a páginas externas ni abrir ventanas nuevas.
  win.webContents.on('will-navigate', (event, destination) => {
    if (destination !== require('node:url').pathToFileURL(indexPath).toString()) {
      event.preventDefault();
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.loadFile(indexPath).catch(error => {
    reportStartupError('No se pudo abrir index.html', error);
    dialog.showErrorBox('O-Isym no pudo abrirse', 'No se pudo cargar la interfaz de la aplicación.\\n\\n' + (error.stack || error.message));
  });
}

app.whenReady().then(() => {
  try {
    const storage = createStorage(app.getPath('userData'));
    registerIpcHandlers({ ipcMain, BrowserWindow, storage, indexPath });
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  } catch (error) {
    reportStartupError('Error al iniciar O-Isym', error);
    dialog.showErrorBox('O-Isym no pudo iniciarse', (error.stack || error.message) + '\\n\\nTus archivos de datos no se han borrado.');
  }
}).catch(error => {
  reportStartupError('Electron no pudo estar listo', error);
  dialog.showErrorBox('O-Isym no pudo iniciarse', (error.stack || error.message) + '\\n\\nTus archivos de datos no se han borrado.');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
