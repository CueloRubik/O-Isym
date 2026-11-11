const test=require('node:test');
const assert=require('node:assert/strict');
const {renderer}=require('./helpers/renderer.cjs');

test('keyboard undo is one step after repeated renders; redo and camera are preserved',async t=>{
 const r=await renderer();t.after(r.dispose);
 const original=r.current().nodes.length;
 r.click('[data-action="ideas-note-create"]');await r.wait();
 r.click('[data-action="ideas-note-create"]');await r.wait();
 for(let i=0;i<4;i++)r.app.updateShell();
 r.current().viewport={x:400,y:-250,zoom:1.5};await r.app.save();
 const camera=JSON.stringify(r.current().viewport);
 r.query('.ideas-canvas-viewport').dispatchEvent(new r.w.KeyboardEvent('keydown',{key:'z',metaKey:true,bubbles:true,cancelable:true}));await r.wait();
 assert.equal(r.current().nodes.length,original+1);
 assert.equal(JSON.stringify(r.current().viewport),camera);
 assert.equal(r.query('[data-action="ideas-history-redo"]').disabled,false);
 r.click('[data-action="ideas-history-redo"]');await r.wait();assert.equal(r.current().nodes.length,original+2);
 assert.deepEqual(r.errors,[]);
});
test('pending text is undoable from a text field and redo retains selection',async t=>{
 const r=await renderer();t.after(r.dispose);
 const id=r.current().nodes[0].id;r.app.state.ideaSelections[r.current().id].add(id);
 const input=r.query('.ideas-note-editor');input.value='Texto pendiente';input.dispatchEvent(new r.w.Event('input',{bubbles:true}));
 input.dispatchEvent(new r.w.KeyboardEvent('keydown',{key:'z',metaKey:true,bubbles:true,cancelable:true}));await r.wait();
 assert.equal(r.current().nodes[0].body,'');
 assert.ok(r.app.state.ideaSelections[r.current().id].has(id));
 r.click('[data-action="ideas-history-redo"]');await r.wait();assert.equal(r.current().nodes[0].body,'Texto pendiente');
});
test('late saves never erase newer edits; closing flushes pending text and reports failure',async t=>{
 const r=await renderer();t.after(r.dispose);r.delay(25);
 r.current().nodes[0].body='Primero';const first=r.app.save();
 r.current().nodes[0].body='Segundo';const second=r.app.save();await Promise.all([first,second]);
 assert.equal(r.current().nodes[0].body,'Segundo');assert.equal(r.saved().profiles[0].ideaBoards[0].nodes[0].body,'Segundo');
 const input=r.query('.ideas-note-editor');input.value='Antes de cerrar';input.dispatchEvent(new r.w.Event('input',{bubbles:true}));assert.equal(await r.close(),true);
 assert.equal(r.saved().profiles[0].ideaBoards[0].nodes[0].body,'Antes de cerrar');
 r.fail(true);r.current().nodes[0].body='Conservar abierto';assert.equal(await r.close(),false);assert.equal(r.current().nodes[0].body,'Conservar abierto');
});
test('regrouping transfers membership and ungroup keeps cards; failed save restores groups',async t=>{
 const r=await renderer();t.after(r.dispose);const ids=r.current().nodes.map(n=>n.id),selection=r.app.state.ideaSelections[r.current().id];
 const select=arr=>{selection.clear();arr.forEach(id=>selection.add(id));r.app.updateShell()};
 select(ids.slice(0,2));r.click('[data-action="ideas-group-create"]');await r.answer('Uno');
 select(ids.slice(0,3));r.click('[data-action="ideas-group-create"]');await r.answer('Dos');
 assert.equal(r.current().nodes.filter(n=>n.type==='group').length,1);
 assert.equal(r.current().nodes.find(n=>n.type==='group').childrenIds.length,3);
 r.fail(true);r.click('[data-action="ideas-group-remove"]');await r.wait();assert.equal(r.current().nodes.filter(n=>n.type==='group').length,1);
 r.fail(false);r.click('[data-action="ideas-group-remove"]');await r.wait();assert.equal(r.current().nodes.length,4);assert.deepEqual(r.errors,[]);
});
test('rectangle adds selection with Shift, previews hits and empty click clears; middle and trackpad pan',async t=>{
 const r=await renderer();t.after(r.dispose);const v='.ideas-canvas-viewport';
 r.pointer(v,'pointerdown',{clientX:-10,clientY:-10});r.pointer(v,'pointermove',{clientX:280,clientY:210});
 assert.ok(r.query('.is-selection-preview'));r.pointer(v,'pointerup',{clientX:280,clientY:210});
 const selection=r.app.state.ideaSelections[r.current().id];assert.equal(selection.size,1);
 r.pointer(v,'pointerdown',{clientX:340,clientY:-10,shiftKey:true});r.pointer(v,'pointermove',{clientX:630,clientY:210,shiftKey:true});r.pointer(v,'pointerup',{clientX:630,clientY:210});assert.equal(selection.size,2);
 r.pointer(v,'pointerdown',{clientX:-100,clientY:-100});r.pointer(v,'pointerup',{clientX:-100,clientY:-100});assert.equal(selection.size,0);
 r.pointer(v,'pointerdown',{button:1,clientX:0,clientY:0});r.pointer(v,'pointermove',{clientX:100,clientY:50});r.pointer(v,'pointerup',{clientX:100,clientY:50});assert.equal(r.current().viewport.x,100);
 r.query(v).dispatchEvent(new r.w.WheelEvent('wheel',{deltaX:20,deltaY:30,bubbles:true,cancelable:true}));assert.equal(r.current().viewport.x,80);assert.equal(r.current().viewport.zoom,1);
});
test('connections persist and produce finite SVG paths after camera changes',async t=>{
 const r=await renderer();t.after(r.dispose);
 r.click('[data-action="ideas-connect-arrow"]');
 const cards=r.w.document.querySelectorAll('.ideas-note-card');cards[0].click();cards[1].click();await r.answer('Relación');
 assert.equal(r.current().connections.length,1);
 const path=r.query('.ideas-connection-line');assert.ok(path);assert.ok(path.getAttribute('marker-end'));assert.doesNotMatch(path.getAttribute('d'),/NaN|Infinity/);
 assert.equal(r.saved().profiles[0].ideaBoards[0].connections.length,1);assert.deepEqual(r.errors,[]);
});
test('group selection moves all members; Option selects one card and Shift adds',async t=>{
 const r=await renderer();t.after(r.dispose);const ids=r.current().nodes.map(n=>n.id), selection=r.app.state.ideaSelections[r.current().id];
 ids.slice(0,2).forEach(id=>selection.add(id));r.app.updateShell();r.click('[data-action="ideas-group-create"]');await r.answer('Grupo');
 selection.clear();r.app.updateShell();
 const card='[data-node-id="'+ids[0]+'"]';
 r.pointer(card+' .ideas-note-editor','pointerdown');assert.equal(selection.size,3);
 r.pointer(card+' .ideas-note-header','pointerdown',{clientX:0,clientY:0});r.pointer(card+' .ideas-note-header','pointermove',{clientX:50,clientY:25});r.pointer(card+' .ideas-note-header','pointerup',{clientX:50,clientY:25});await r.wait();
 assert.equal(r.current().nodes[0].x,50);assert.equal(r.current().nodes[1].x,400);assert.equal(r.current().nodes[2].x,700);
 r.pointer(card+' .ideas-note-editor','pointerdown',{altKey:true});assert.equal(selection.size,1);assert.ok(selection.has(ids[0]));
 r.pointer('[data-node-id="'+ids[2]+'"] .ideas-note-editor','pointerdown',{shiftKey:true});assert.equal(selection.size,2);
});
test('every configured icon exists and dialog reopening does not add duplicate icons',async t=>{
 const fs=require('node:fs'),path=require('node:path');const r=await renderer();t.after(r.dispose);
 for(const image of r.w.document.querySelectorAll('img[src^="assets/icons/"]')) assert.ok(fs.existsSync(path.join(__dirname,'..',image.getAttribute('src'))),image.src);
 r.app.updateShell();for(const button of r.w.document.querySelectorAll('[data-action^="ideas-"]')) assert.ok(button.querySelectorAll('.button-icon').length<=1);
 assert.ok(r.query('[data-action="ideas-help"] img'));assert.ok(r.query('[data-action="ideas-history-undo"] img'));
});
test('saved boards survive a real storage roundtrip with text, groups, connections and camera',async t=>{
 const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
 const {createStorage}=require('../electron/storage');const r=await renderer();t.after(r.dispose);
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'oisym-boards-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));
 r.current().nodes[0].body='Conservar al reabrir';r.current().viewport={x:123,y:-321,zoom:0.75};await r.close();
 await createStorage(directory).save(r.saved());const reopened=await createStorage(directory).read();
 assert.deepEqual(reopened.profiles[0].ideaBoards,r.saved().profiles[0].ideaBoards);
});
test('closing also saves edits made while the first close write is pending',async t=>{
 const r=await renderer();t.after(r.dispose);r.delay(30);r.current().nodes[0].body='Primero';
 const closing=r.close();r.current().nodes[0].body='Último';assert.equal(await closing,true);
 assert.equal(r.saved().profiles[0].ideaBoards[0].nodes[0].body,'Último');
});
