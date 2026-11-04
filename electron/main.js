const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 950,
    minHeight: 700,
    resizable: true,
    webPreferences: {
      // Se conserva la configuración actual durante esta reorganización.
      // La migración a preload/contextIsolation se hará en una etapa separada.
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // index.html permanece en la raíz para conservar el origen de almacenamiento
  // local que utiliza la versión original de O-Isym.
  win.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
