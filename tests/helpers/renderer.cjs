const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const D = require('../../src/domain');
const clone = value => JSON.parse(JSON.stringify(value));
const wait = () => new Promise(resolve => setTimeout(resolve, 15));
async function renderer() {
  const errors = [];
  const dom = new JSDOM('<div id="app"></div>', { runScripts: 'outside-only', url: 'https://oisym.test', pretendToBeVisual: true });
  const w = dom.window;
  w.addEventListener('error', e => errors.push(e.error));
  w.confirm = () => true;
  w.prompt = () => { throw new Error('Electron does not support prompt'); };
  w.HTMLElement.prototype.setPointerCapture = () => {};
  w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  const profile = D.createProfile('Pruebas');
  const board = D.createIdeaBoard({ title: 'Prueba' });
  board.nodes = [0,1,2,3].map(i => D.createIdeaNode('note', { title: 'Nota '+i, x: i*350, y: 0 }));
  profile.ideaBoards = [board];
  let saved = { schemaVersion:1, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), profiles: [profile], activeProfileId: profile.id };
  let fail = false, delay = 0, close;
  w.oisym = {
    storage: { read: async () => clone(saved), save: async snapshot => {
      if (delay) await new Promise(r => setTimeout(r,delay));
      if (fail) throw new Error('Fallo simulado');
      saved = clone(snapshot); return clone(saved);
    } },
    onSaveBeforeClose: cb => { close = cb; }
  };
  for (const file of ['domain.js','planning.js','appearance.js','focus-audio.js','app.js']) {
    w.eval(fs.readFileSync(path.join(__dirname,'../../src',file),'utf8') + (file==='app.js' ? '\nwindow.testApp={state,save,flushIdeaChanges,restoreIdeaBoardHistory,updateShell};' : ''));
  }
  await wait();
  const app = w.testApp;
  app.state.view='planner'; app.state.plannerSection='board'; app.state.selectedIdeaBoardId=board.id; app.updateShell();
  const query = selector => w.document.querySelector(selector);
  const click = selector => { const node=query(selector); if (!node) throw new Error('Missing '+selector); node.click(); };
  const pointer = (selector,type,opts={}) => { const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,...opts}); Object.defineProperty(e,'pointerId',{value:1}); query(selector).dispatchEvent(e); };
  const answer = async value => { query('dialog input').value=value;query('dialog form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(); };
  const current = () => app.state.profile.ideaBoards[0];
  return { w, app, errors, query, click, pointer, answer, current, wait, saved:()=>saved, fail:value=>{fail=value}, delay:value=>{delay=value}, close:()=>close(), dispose:()=>dom.window.close() };
}
module.exports={renderer};
