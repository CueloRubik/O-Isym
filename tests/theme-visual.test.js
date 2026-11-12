'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const Icons=require('../src/icons');
const css=fs.readFileSync(path.join(__dirname,'../src/styles/appearance.css'),'utf8');

test('all primary navigation and search icons render as stroked SVGs, not opaque masks',()=>{
  const doc=new JSDOM('<!doctype html><div id="app"></div>').window.document;
  const paths=['navigation/today.png','navigation/calendar.png','navigation/tasks.png',
    'navigation/activities.png','navigation/goals.png','navigation/dashboard.png',
    'focus/timer.png','navigation/insights.png','actions/profiles.png','interface/settings.png',
    'interface/search.png','interface/add.png','actions/edit.png','actions/save.png'];
  for(const source of paths){
    const svg=Icons.glyph(source,doc,'nav-icon-image');
    assert.ok(svg,'Missing vector: '+source);
    assert.equal(svg.tagName.toLowerCase(),'svg');
    assert.equal(svg.getAttribute('stroke'),'currentColor');
    assert.equal(svg.getAttribute('fill'),'none');
    assert.ok(svg.children.length>0,'Empty vector: '+source);
    assert.equal(svg.getAttribute('aria-hidden'),'true');
  }
  assert.match(css,/svg\.icon-glyph\s*\{\s*filter:\s*none\s*!important/);
});

test('board search wrapper, input and icon use a single theme field token',()=>{
  assert.match(css,/html\[data-scheme\] \.search-field/);
  assert.match(css,/html\[data-scheme\] \.ideas-library-toolbar \.search-field/);
  assert.match(css,/background:\s*var\(--ui-field\)/);
  assert.match(css,/\.workspace-main \.search-field \.input/);
  assert.match(css,/background:\s*transparent/);
  assert.match(css,/\.search-field \.icon-glyph\s*\{\s*color:\s*var\(--ui-field-text\)/);
});
