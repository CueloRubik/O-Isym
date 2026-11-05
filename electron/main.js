const { app, BrowserWindow, ipcMain, dialog, Notification, powerMonitor } = require('electron');
const path = require('node:path');

const { createStorage } = require('./storage');
const { registerIpcHandlers } = require('./ipc-handlers');
const { createFocusNotificationScheduler } = require('./focus-notifications');
const { createTaskNotificationScheduler } = require('./task-notifications');
const { Menu, Tray, nativeImage } = require('electron');

const indexPath = path.join(__dirname, '..', 'index.html');
const reminderIconPath = path.join(__dirname, '..', 'assets', 'icons', 'notifications', 'task-reminder.png');
const appIconPath = path.join(__dirname, '..', 'assets', 'icons', 'app.png');

// Evita fallos de inicialización gráfica en Macs antiguos con GPU Intel integrada.
app.disableHardwareAcceleration();

function reportStartupError(title, error) {
  const detail = error && (error.stack || error.message) ? (error.stack || error.message) : String(error);
  console.error('[O-Isym]', title, detail);
  try {
    const logPath = path.join(app.getPath('userData'), 'startup-error.log');
    require('node:fs').appendFileSync(logPath, new Date().toISOString() + ' ' + title + '\n' + detail + '\n\n', 'utf8');
  } catch (logError) {
    console.error('[O-Isym] No se pudo escribir el registro:', logError);
  }
}

let isQuitting = false;
let mainWindow = null;
let tray = null;
let pendingTaskReminder = null;

function deliverPendingTaskReminder() {
  if (!pendingTaskReminder || !mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isLoading()) return;
  const reminder = pendingTaskReminder;
  pendingTaskReminder = null;
  mainWindow.webContents.send('oisym:notifications:open-task', reminder);
}

function showMainWindow(reminder) {
  if (reminder && typeof reminder === 'object') pendingTaskReminder = reminder;
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow({ show: true });
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  deliverPendingTaskReminder();
}

function createTray() {
  if (process.platform !== 'darwin' || tray) return;
  let image = nativeImage.createFromPath(appIconPath);
  if (image.isEmpty()) image = nativeImage.createFromPath(path.join(__dirname, '..', 'app.icns'));
  if (image.isEmpty()) image = nativeImage.createFromPath(reminderIconPath);
  if (!image.isEmpty()) image = image.resize({ width: 18, height: 18 });
  tray = new Tray(image);
  tray.setToolTip('O-Isym');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir O-Isym', click: showMainWindow },
    { label: 'La app sigue activa al cerrar la ventana', enabled: false },
    { type: 'separator' },
    { label: 'Salir de O-Isym', click: () => app.quit() }
  ]));
  tray.on('click', showMainWindow);
  tray.on('double-click', showMainWindow);
}

function createWindow(options = {}) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 360,
    minHeight: 560,
    resizable: true,
    show: options.show !== false,
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

  mainWindow = win;
  win.once('ready-to-show', () => { if (options.show !== false) win.show(); });
  win.webContents.on('did-finish-load', deliverPendingTaskReminder);
  win.on('close', event => {
    if (process.platform === 'darwin' && !isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });
  win.on('closed', () => { if (mainWindow === win) mainWindow = null; });
  win.webContents.on('render-process-gone', (_event, details) => {
    reportStartupError('El proceso visual se cerró', new Error(JSON.stringify(details)));
    dialog.showErrorBox('O-Isym tuvo un problema', 'La ventana de O-Isym se cerró inesperadamente. Se guardó un registro en la carpeta de datos de O-Isym.\n\n' + JSON.stringify(details));
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
    dialog.showErrorBox('O-Isym no pudo abrirse', 'No se pudo cargar la interfaz de la aplicación.\n\n' + (error.stack || error.message));
  });
}

let focusNotifications = null;
let taskNotifications = null;

app.whenReady().then(async () => {
  try {
    const storage = createStorage(app.getPath('userData'));
    focusNotifications = createFocusNotificationScheduler({ Notification, powerMonitor, hasWindow: () => BrowserWindow.getAllWindows().length > 0 });
    taskNotifications = createTaskNotificationScheduler({
      Notification,
      powerMonitor,
      iconPath: reminderIconPath,
      sentPath: path.join(app.getPath('userData'), 'task-notifications-sent.json'),
      onOpenTask: showMainWindow
    });
    registerIpcHandlers({ ipcMain, BrowserWindow, storage, indexPath, focusNotifications, taskNotifications, app });
    createTray();
    const supportsLoginItems = process.platform === 'darwin' || process.platform === 'win32';
    const loginSettings = supportsLoginItems ? app.getLoginItemSettings() : {};
    const initialSnapshot = await storage.read();
    taskNotifications.scheduleSnapshot(initialSnapshot);
    const activeProfile = initialSnapshot.profiles.find(profile => profile.id === initialSnapshot.activeProfileId);
    if (supportsLoginItems) app.setLoginItemSettings({ openAtLogin: activeProfile?.preferences?.launchAtLogin === true, openAsHidden: true });
    const launchedAtLogin = process.platform === 'darwin' && loginSettings.wasOpenedAtLogin;
    createWindow({ show: !launchedAtLogin });

    app.on('activate', () => showMainWindow());
  } catch (error) {
    reportStartupError('Error al iniciar O-Isym', error);
    dialog.showErrorBox('O-Isym no pudo iniciarse', (error.stack || error.message) + '\n\nTus archivos de datos no se han borrado.');
  }
}).catch(error => {
  reportStartupError('Electron no pudo estar listo', error);
  dialog.showErrorBox('O-Isym no pudo iniciarse', (error.stack || error.message) + '\n\nTus archivos de datos no se han borrado.');
});

app.on('before-quit', () => {
  isQuitting = true;
  if (focusNotifications) focusNotifications.dispose();
  if (taskNotifications) taskNotifications.dispose();
  if (tray) { tray.destroy(); tray = null; }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
