const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
function setup(platform = 'darwin') {
  const ipcMain = new EventEmitter(); const app = new EventEmitter();
  app.disableHardwareAcceleration=()=>{};app.whenReady=()=>({then:()=>({catch:()=>{}})});
  app.quit=()=>{app.quits=(app.quits||0)+1};
  class BrowserWindow extends EventEmitter {
    constructor(){super();this.webContents=new EventEmitter();this.webContents.send=(name)=>{this.sent=name};this.webContents.setWindowOpenHandler=()=>{};}
    loadFile(){return Promise.resolve()} hide(){this.hidden=true} show(){this.hidden=false} close(){this.closed=true}
  }
  const context={require:name=>name==='electron'?{app,ipcMain,BrowserWindow,dialog:{showErrorBox(){}},Menu:{},Tray:{},nativeImage:{}}:name==='./ipc-handlers'?{registerIpcHandlers(){},isTrustedMainFrame:e=>e.trusted===true}:name.startsWith('./')?{}:require(name),__dirname:path.join(__dirname,'../electron'),process:{platform},console,setTimeout:()=>1,clearTimeout(){}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../electron/main.js'),'utf8')+'\ncreateWindow(); globalThis.windowUnderTest=mainWindow;',context);
  const win=context.windowUnderTest;
  return {win,app,ipcMain,request:()=>{let prevented=false;win.emit('close',{preventDefault(){prevented=true}});return prevented},reply:(saved,trusted=true)=>ipcMain.emit('oisym:window:saved-before-close',{sender:win.webContents,trusted},saved)};
}
test('macOS close waits for trusted save confirmation before hiding',()=>{const r=setup();assert.equal(r.request(),true);assert.equal(r.win.hidden,undefined);assert.equal(r.win.sent,'oisym:window:save-before-close');r.reply(true,false);assert.equal(r.win.hidden,undefined);r.reply(true);assert.equal(r.win.hidden,true);});
test('failed save keeps the window open and allows a later close retry',()=>{const r=setup();r.request();r.reply(false);assert.equal(r.win.hidden,false);assert.equal(r.request(),true);r.reply(true);assert.equal(r.win.hidden,true);});
test('quit resumes only after saving, while Windows ordinary close closes the window',()=>{const r=setup();r.app.emit('before-quit');r.request();assert.equal(r.app.quits,undefined);r.reply(true);assert.equal(r.app.quits,1);const w=setup('win32');w.request();assert.equal(w.win.closed,undefined);w.reply(true);assert.equal(w.win.closed,true);});
