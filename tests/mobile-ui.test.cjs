'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {renderer}=require('./helpers/renderer.cjs');
async function mobile(options={}){
 const r=await renderer(options);
 r.w.document.documentElement.classList.add('oisym-android');
 r.w.oisym.platform='android';
 r.w.scrollTo=()=>{};
 r.w.eval(fs.readFileSync(path.join(__dirname,'../mobile/ui.js'),'utf8'));
 r.app.updateShell();await r.wait();
 return r;
}
test('mobile navigation mounts once, marks the active destination and hides the closed drawer',async t=>{
 const r=await mobile({startInBoard:false});t.after(r.dispose);
 assert.equal(r.w.document.querySelectorAll('.mobile-navigation').length,1);
 assert.equal(r.query('.workspace-sidebar').getAttribute('aria-hidden'),'true');
 assert.equal(r.query('.mobile-navigation [data-view="today"]').getAttribute('aria-current'),'page');
 r.click('[data-mobile-more]');
 assert.equal(r.query('.workspace-sidebar').getAttribute('aria-hidden'),'false');
 assert.ok(r.w.document.body.classList.contains('mobile-scroll-locked'));
 r.click('.workspace-sidebar [data-view="tasks"]');await r.wait();
 assert.equal(r.app.state.view,'tasks');
 assert.equal(r.query('[data-mobile-more]').classList.contains('active'),true);
 assert.equal(r.query('[data-mobile-more]').getAttribute('aria-expanded'),'false');
 assert.equal(r.w.document.body.classList.contains('mobile-scroll-locked'),false);
 r.app.updateShell();await r.wait();
 assert.equal(r.w.document.querySelectorAll('.mobile-navigation').length,1);
 assert.deepEqual(r.errors,[]);
});
test('Android back closes a dirty editor through the existing confirmation instead of discarding it',async t=>{
 const r=await mobile({startInBoard:false});t.after(r.dispose);
 r.click('[data-action="quick-task"]');await r.wait();
 const modal=r.query('[data-profile-modal]');assert.ok(modal);
 modal.dataset.dirty='true';r.w.confirm=()=>false;
 const back=()=>{const e=new r.w.CustomEvent('oisym:android-back',{cancelable:true});r.w.dispatchEvent(e);return e.defaultPrevented;};
 assert.equal(back(),true);assert.ok(r.query('[data-profile-modal]'));
 r.w.confirm=()=>true;assert.equal(back(),true);await r.wait();
 assert.equal(r.query('[data-profile-modal]'),null);
 assert.equal(r.app.state.showTaskForm,false);
 assert.equal(r.w.document.body.classList.contains('mobile-scroll-locked'),false);
 assert.deepEqual(r.errors,[]);
});
test('touch gestures in a board default to page scrolling and pan the board only after choosing that mode',async t=>{
 const r=await mobile();t.after(r.dispose);
 const canvas=r.query('.ideas-canvas-viewport');
 const touch=(type,x,y)=>{
  const e=new r.w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:x,clientY:y});
  Object.defineProperties(e,{pointerId:{value:7},pointerType:{value:'touch'}});
  canvas.dispatchEvent(e);return e;
 };
 assert.equal(canvas.dataset.mobileInteraction,'page');
 assert.equal(touch('pointerdown',150,200).defaultPrevented,false);
 r.click('[data-mobile-board-mode="board"]');
 assert.equal(canvas.dataset.mobileInteraction,'board');
 assert.equal(touch('pointerdown',150,200).defaultPrevented,true);
 touch('pointermove',190,230);touch('pointerup',190,230);
 await r.app.flushIdeaChanges();
 assert.equal(r.current().viewport.x,40);
 assert.equal(r.current().viewport.y,30);
 const back=new r.w.CustomEvent('oisym:android-back',{cancelable:true});r.w.dispatchEvent(back);await r.wait();
 assert.equal(back.defaultPrevented,true);assert.equal(r.app.state.plannerSection,'library');
 assert.deepEqual(r.errors,[]);
});
test('changing the Focus alarm setting disables all related controls and persists without a selector error',async t=>{
 const r=await mobile({startInBoard:false});t.after(r.dispose);
 r.app.state.view='focus';r.app.updateShell();await r.wait();
 const control=r.query('input[name="focusEndAlarmEnabled"]');assert.ok(control);
 control.checked=false;control.dispatchEvent(new r.w.Event('change',{bubbles:true}));
 await r.wait();await r.wait();
 assert.equal(r.saved().profiles[0].preferences.focusEndAlarmEnabled,false);
 const controls=r.w.document.querySelectorAll('.focus-alarm-settings select,.focus-alarm-settings input[type="range"],.focus-alarm-settings [data-action="preview-focus-alarm"]');
 assert.ok(controls.length>1);assert.ok([...controls].every(c=>c.disabled));
 assert.deepEqual(r.errors,[]);
});
test('Android scheduling errors are visible above the navigation',async t=>{
 const r=await mobile({startInBoard:false});t.after(r.dispose);
 r.w.dispatchEvent(new r.w.CustomEvent('oisym:android-warning',{detail:'No se pudo programar el aviso'}));
 assert.equal(r.query('.mobile-warning').textContent,'No se pudo programar el aviso');
 assert.equal(r.query('.mobile-warning').getAttribute('role'),'alert');
});
