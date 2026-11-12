const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { registerIpcHandlers } = require('../../electron/ipc-handlers');
const { pathToFileURL } = require('node:url');

function storageBridge(storage) {
  const handlers = new Map();
  const indexPath = path.join(__dirname, '../../index.html');
  const frame = { url: pathToFileURL(indexPath).toString() };
  const sender = { mainFrame: frame };
  let trusted = true, exposed;
  registerIpcHandlers({
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    BrowserWindow: { fromWebContents: () => trusted ? {} : null },
    storage, indexPath
  });
  const electron = {
    contextBridge: { exposeInMainWorld: (_name, value) => { exposed = value; } },
    ipcRenderer: {
      invoke: async (channel, ...args) => {
        try { return structuredClone(await handlers.get(channel)({ sender, senderFrame: frame }, ...structuredClone(args))); }
        // Match Electron's loss of custom Error fields across invoke rejections.
        catch (error) { throw new Error(error.message); }
      },
      on() {}, removeListener() {}
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../electron/preload.js'), 'utf8'), { require: () => electron, process: { platform: 'linux' } });
  return { storage: exposed.storage, trust: value => { trusted = value; } };
}
module.exports = { storageBridge };
