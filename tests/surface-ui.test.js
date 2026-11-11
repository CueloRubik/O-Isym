'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const Appearance=require('../src/appearance');

const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/styles/surfaces.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const legacy=fs.readFileSync(path.join(root,'src/styles/app.css'),'utf8');
const workspace=fs.readFileSync(path.join(root,'src/styles/workspace.css'),'utf8');

test('the surface design loads after base, workspace and appearance styles',()=>{
  const files=['app.css','workspace.css','appearance.css','surfaces.css'];
  let previous=-1;
  for(const name of files){
    const tag='src/styles/'+name;
    const next=html.indexOf(tag);
    assert.ok(next>=0,'Missing '+name);
    assert.ok(next>previous,'Wrong stylesheet order: '+name);
    previous=next;
  }
});
test('all three corner settings define coordinated outer, inner, small and control corners',()=>{
  for(const mode of ['square','soft','rounded']){
    const match=source.match(new RegExp('html\\[data-radius="'+mode+'"\\]\\s*\\{([^}]+)\\}'));
    assert.ok(match,'Missing radius '+mode);
    for(const token of ['--ui-radius-card','--ui-radius-control','--ui-radius-nested','--ui-radius-tiny','--ui-radius-pill'])
      assert.ok(match[1].includes(token+':'),'Missing '+token+' for '+mode);
  }
  const doc=new JSDOM('<!doctype html><div id="app"></div>').window.document;
  for(const setting of ['square','soft','rounded']){
    Appearance.apply(doc.getElementById('app'),doc.documentElement,{
      appearanceMode:'light',appearanceRadius:setting,appearanceCardStyle:'elevated'
    },false);
    assert.equal(doc.documentElement.dataset.radius,setting);
  }
});
test('outer surfaces retain minimum insets and relief for every user-selected card style',()=>{
  assert.match(source,/--ui-outer-padding:\s*22px/);
  assert.match(source,/--ui-inner-padding:\s*14px/);
  assert.match(source,/--ui-surface-raised:/);
  assert.match(source,/--ui-surface-contained:/);
  assert.match(source,/--ui-surface-sunken:/);
  for(const mode of ['elevated','soft','outlined']){
    assert.ok(source.includes('[data-card-style="'+mode+'"]'),'No card variant '+mode);
    assert.match(source,new RegExp('data-card-style="'+mode+'"[^\\{]+\\{[^}]*box-shadow:'));
  }
  assert.ok(!/\.workspace-main \.card\s*\{[^}]*overflow:\s*hidden/s.test(source),
    'Cards must not clip their task menu popovers');
});
test('major screens and border-framed panels share the same nested radius and safe insets',()=>{
  for(const selector of [
    '.today-metric','.profile-stat','.profile-preference','.focus-stat',
    '.focus-music-settings','.focus-alarm-settings','.profile-focus-note',
    '.activity-ideas','.planner-proposal','.template-preview',
    '.ideas-library-toolbar','.ideas-canvas-toolbar','.task-toolbar',
    '.day-date-bar','.schedule-conflicts','.weekday-picker',
    '.calendar-day','.week-day','.task-menu-choices',
    '.appearance-palette-button','.appearance-color-control',
    '.task-editor-panel','.entity-editor-panel','.profile-modal',
    '.ideas-board-card','.ideas-note-card','.ideas-activity-card',
    '.ideas-canvas-viewport'
  ]){
    assert.ok(source.includes(selector),'Unreviewed surface: '+selector);
  }
  assert.match(source,/\.workspace-main \.card[^}]+padding:\s*var\(--ui-outer-padding\)/s);
  assert.match(source,/\.workspace-main \.today-completed-card \.task-row\s*\{[^}]+padding:\s*var\(--ui-inner-padding\)/s);
  assert.match(source,/\.ideas-note-card \.ideas-note-header\s*\{[^}]*padding:\s*7px 10px/s);
  assert.match(source,/\.ideas-note-editor\s*\{[^}]*padding:\s*10px 12px/s);
});
test('resizable canvas, timeline and floating task menus retain their functional geometry',()=>{
  assert.match(legacy,/\.ideas-canvas-world\s*\{[^}]+position:absolute/);
  assert.match(legacy,/\.ideas-connections-layer\s*\{[^}]+pointer-events:none/);
  assert.match(legacy,/\.ideas-note-resize\s*\{[^}]+cursor:nwse-resize/);
  assert.match(workspace,/\.day-time-block\.day-positioned-block\s*\{[^}]+position:\s*absolute/);
  assert.match(source,/\.day-time-block\.day-positioned-block\s*\{[^}]+padding:\s*6px 9px/);
  assert.match(workspace,/\.task-menu-choices\s*\{[^}]+position:\s*absolute/);
  assert.match(source,/\.task-menu-choices\s*\{[^}]+z-index:\s*8/);
  assert.ok(!source.includes('.ideas-canvas-world {'), 'Do not modify the canvas transform layer');
});
test('small windows keep nested padding and do not force dialog content against the edge',()=>{
  assert.match(source,/@media\s*\(max-width:\s*700px\)/);
  assert.match(source,/@media\s*\(max-width:\s*620px\)/);
  assert.match(source,/@media\s*\(max-width:\s*440px\)/);
  assert.match(source,/\.task-editor-panel \.task-editor-form\s*\{[^}]+padding:\s*var\(--ui-outer-padding\)/);
  assert.match(source,/\.task-editor-actions\s*\{[^}]+padding:\s*14px var\(--ui-outer-padding\)/);
  assert.match(source,/\.ideas-library-toolbar \.search-field/);
  assert.match(source,/\.ideas-library-toolbar select/);
});
