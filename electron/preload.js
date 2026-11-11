const { contextBridge, ipcRenderer } = require('electron');

const storage = Object.freeze({
  read: () => ipcRenderer.invoke('oisym:storage:read'),
  save: snapshot => ipcRenderer.invoke('oisym:storage:save', snapshot),
  recovery: Object.freeze({
    listBackups: () => ipcRenderer.invoke('oisym:storage:recovery:list'),
    overwrite: () => ipcRenderer.invoke('oisym:storage:recovery:overwrite'),
    restore: name => ipcRenderer.invoke('oisym:storage:recovery:restore', name)
  })
});

const notifications = Object.freeze({
  getStatus: () => ipcRenderer.invoke('oisym:notifications:status'),
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
