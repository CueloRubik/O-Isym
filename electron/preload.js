const { contextBridge, ipcRenderer } = require('electron');

async function storageRequest(channel, ...args) {
  const result = await ipcRenderer.invoke(channel, ...args);
  if (result?.ok === true) return result.value;
  const error = new Error(result?.error?.message || 'No se pudo acceder a los datos de O-Isym.');
  if (typeof result?.error?.code === 'string') error.code = result.error.code;
  throw error;
}

const storage = Object.freeze({
  read: () => storageRequest('oisym:storage:read'),
  save: snapshot => storageRequest('oisym:storage:save', snapshot),
  recovery: Object.freeze({
    listBackups: () => storageRequest('oisym:storage:recovery:list'),
    overwrite: () => storageRequest('oisym:storage:recovery:overwrite'),
    restore: name => storageRequest('oisym:storage:recovery:restore', name)
  })
});

const notifications = Object.freeze({
  getStatus: () => ipcRenderer.invoke('oisym:notifications:status'),
  openSettings: () => ipcRenderer.invoke('oisym:notifications:open-settings'),
  sendTest: () => ipcRenderer.invoke('oisym:notifications:test'),
  setLaunchAtLogin: enabled => ipcRenderer.invoke('oisym:notifications:launch-at-login', enabled),
  onOpenTask: callback => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, reminder) => callback(reminder);
    ipcRenderer.on('oisym:notifications:open-task', listener);
    return () => ipcRenderer.removeListener('oisym:notifications:open-task', listener);
  }
});

const focusAlarms = Object.freeze({
  schedule: payload => ipcRenderer.invoke('oisym:focus:notifications:schedule', payload),
  cancel: () => ipcRenderer.invoke('oisym:focus:notifications:cancel')
});

contextBridge.exposeInMainWorld('oisym', Object.freeze({
  platform: process.platform,
  storage,
  onSaveBeforeClose: callback => {
    if (typeof callback !== 'function') return () => {};
    const listener = async () => {
      let saved = false;
      try { saved = await callback() === true; } catch {}
      ipcRenderer.send('oisym:window:saved-before-close', saved);
    };
    ipcRenderer.on('oisym:window:save-before-close', listener);
    return () => ipcRenderer.removeListener('oisym:window:save-before-close', listener);
  },
  focusAlarms,
  notifications
}));
