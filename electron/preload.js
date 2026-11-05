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

const focusAlarms = Object.freeze({
  schedule: payload => ipcRenderer.invoke('oisym:focus:notifications:schedule', payload),
  cancel: () => ipcRenderer.invoke('oisym:focus:notifications:cancel')
});

contextBridge.exposeInMainWorld('oisym', Object.freeze({
  storage,
  focusAlarms
}));
