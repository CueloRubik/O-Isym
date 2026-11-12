const { app, BrowserWindow, ipcMain, dialog, Notification, powerMonitor } = require('electron');
const path = require('node:path');

const { createStorage } = require('./storage');
const { HIDDEN_LOGIN_ARGUMENT, loginQuery, loginOptions } = require('./login-items');
const { registerIpcHandlers, isTrustedMainFrame } = require('./ipc-handlers');
const { createFocusNotificationScheduler } = require('./focus-notifications');
const { createTaskNotificationScheduler } = require('./task-notifications');
const { Menu, Tray, nativeImage } = require('electron');

const indexPath = path.join(__dirname, '..', 'index.html');
const reminderIconPath = path.join(__dirname, '..', 'assets', 'icons', 'notifications', 'task-reminder.png');
const appIconPath = path.join(__dirname, '..', 'assets', 'icons', 'app.png');
const windowsIconPath = path.join(__dirname, '..', 'app.ico');

// Evita fallos de inicialización gráfica en Macs antiguos con GPU Intel integrada.
if (process.platform === 'darwin') app.disableHardwareAcceleration();

// Must match electron-builder's appId / installed Windows shortcut identity.
if (process.platform === 'win32') app.setAppUserModelId('com.oisym.app');

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
let startupComplete = false;
let openRequested = false;

// Only one process may own the snapshot and its notification timers.
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) app.quit();
else app.on('second-instance', () => showMainWindow());

function deliverPendingTaskReminder() {
  if (!pendingTaskReminder || !mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isLoading()) return;
  const reminder = pendingTaskReminder;
  pendingTaskReminder = null;
  mainWindow.webContents.send('oisym:notifications:open-task', reminder);
}

function showMainWindow(reminder) {
  if (reminder && typeof reminder.taskId === 'string' && reminder.taskId &&
      typeof reminder.scheduledDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(reminder.scheduledDate)) {
    // Never forward native event/MenuItem objects through IPC.
    pendingTaskReminder = { taskId: reminder.taskId, scheduledDate: reminder.scheduledDate };
  }
  if (!startupComplete) { openRequested = true; return; }
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
  if (!['darwin', 'win32'].includes(process.platform) || tray) return;
  let image = nativeImage.createFromPath(process.platform === 'win32' ? windowsIconPath : appIconPath);
  if (image.isEmpty()) image = nativeImage.createFromPath(path.join(__dirname, '..', 'app.icns'));
  if (image.isEmpty()) image = nativeImage.createFromPath(reminderIconPath);
  if (!image.isEmpty()) image = image.resize({ width: process.platform === 'win32' ? 20 : 18, height: process.platform === 'win32' ? 20 : 18 });
  tray = new Tray(image);
  tray.setToolTip('O-Isym');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir O-Isym', click: () => showMainWindow() },
    { label: 'La app sigue activa al cerrar la ventana', enabled: false },
    { type: 'separator' },
    { label: 'Salir de O-Isym', click: () => app.quit() }
  ]));
  tray.on('click', () => showMainWindow());
  tray.on('double-click', () => showMainWindow());
}

function createWindow(options = {}) {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 360,
    minHeight: 560,
    resizable: true,
    icon: process.platform === 'win32' ? windowsIconPath : appIconPath,
    autoHideMenuBar: process.platform === 'win32',
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
  let closePending = false;
  let closeApproved = false;
  let closeTimer = null;
  const onSaveBeforeClose = (event, success) => {
    if (event.sender !== win.webContents || !isTrustedMainFrame(event, BrowserWindow, indexPath) || !closePending) return;
    clearTimeout(closeTimer); closePending = false;
    if (success !== true) { isQuitting = false; win.show(); return; }
    if (!isQuitting && (process.platform === 'darwin' || process.platform === 'win32' && tray)) win.hide();
    else { closeApproved = true; if (isQuitting) app.quit(); else win.close(); }
  };
  ipcMain.on('oisym:window:saved-before-close', onSaveBeforeClose);
  win.on('close', event => {
    if (closeApproved) return;
    event.preventDefault();
    if (closePending) return;
    closePending = true;
    win.webContents.send('oisym:window:save-before-close');
    closeTimer = setTimeout(() => {
      closePending = false; isQuitting = false; win.show();
      dialog.showErrorBox('No se cerró O-Isym', 'No se pudo confirmar el guardado. La ventana seguirá abierta para que puedas revisar tus cambios y volver a intentar.');
    }, 15000);
  });
  win.on('closed', () => { clearTimeout(closeTimer); ipcMain.removeListener('oisym:window:saved-before-close', onSaveBeforeClose); });
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

if (hasSingleInstanceLock) app.whenReady().then(async () => {
  try {
    const storage = createStorage(app.getPath('userData'));
    focusNotifications = createFocusNotificationScheduler({ Notification, powerMonitor, iconPath: reminderIconPath, onOpen: () => showMainWindow() });
    taskNotifications = createTaskNotificationScheduler({
      Notification,
      powerMonitor,
      iconPath: reminderIconPath,
      sentPath: path.join(app.getPath('userData'), 'task-notifications-sent.json'),
      onOpenTask: showMainWindow
    });
    registerIpcHandlers({ ipcMain, BrowserWindow, storage, indexPath, focusNotifications, taskNotifications, app });
    try { createTray(); } catch (error) {
      if (tray) { tray.destroy(); tray = null; }
      reportStartupError('No se pudo crear el icono de segundo plano', error);
    }
    const supportsLoginItems = process.platform === 'darwin' || process.platform === 'win32' && app.isPackaged && !process.env?.PORTABLE_EXECUTABLE_FILE;
    const loginSettings = supportsLoginItems ? app.getLoginItemSettings(loginQuery(process.platform)) : {};
    let initialSnapshot = null;
    try { initialSnapshot = await storage.read(); }
    catch (error) {
      if (!['OISYM_STORE_CORRUPT', 'OISYM_STORE_INVALID'].includes(error.code)) throw error;
      // Open the recovery UI without replacing the unreadable file or scheduling stale tasks.
      reportStartupError('Los datos necesitan recuperación', error);
    }
    if (initialSnapshot) taskNotifications.scheduleSnapshot(initialSnapshot);
    const activeProfile = initialSnapshot?.profiles.find(profile => profile.id === initialSnapshot.activeProfileId);
    if (supportsLoginItems && initialSnapshot) app.setLoginItemSettings(loginOptions(activeProfile?.preferences?.launchAtLogin === true, process.platform));
    const launchedAtLogin = process.platform === 'darwin' && loginSettings.wasOpenedAtLogin ||
      process.platform === 'win32' && tray && activeProfile?.preferences?.launchAtLogin === true && process.argv?.includes(HIDDEN_LOGIN_ARGUMENT);
    startupComplete = true;
    createWindow({ show: openRequested || !initialSnapshot || !launchedAtLogin });

    app.on('activate', () => showMainWindow());
  } catch (error) {
    reportStartupError('Error al iniciar O-Isym', error);
    dialog.showErrorBox('O-Isym no pudo iniciarse', (error.stack || error.message) + '\n\nTus archivos de datos no se han borrado.');
  }
}).catch(error => {
  reportStartupError('Electron no pudo estar listo', error);
  dialog.showErrorBox('O-Isym no pudo iniciarse', (error.stack || error.message) + '\n\nTus archivos de datos no se han borrado.');
});

app.on('before-quit', () => { isQuitting = true; });
app.on('will-quit', () => {
  if (focusNotifications) focusNotifications.dispose();
  if (taskNotifications) taskNotifications.dispose();
  if (tray) { tray.destroy(); tray = null; }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !(process.platform === 'win32' && tray)) app.quit();
});
