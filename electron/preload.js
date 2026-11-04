const { contextBridge, ipcRenderer } = require('electron');

const storage = Object.freeze({
  read: () => ipcRenderer.invoke('oisym:storage:read'),
  save: snapshot => ipcRenderer.invoke('oisym:storage:save', snapshot)
});

contextBridge.exposeInMainWorld('oisym', Object.freeze({
  storage
}));
