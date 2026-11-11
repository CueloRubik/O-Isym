'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../src/appearance');
const D = require('../src/domain');
const rgb = value => [1,3,5].map(i => parseInt(value.slice(i,i+2),16));

test('all twelve palettes render both light and dark with legible primary text and actions', () => {
  assert.equal(A.PALETTES.length, 18);
  for (const palette of A.PALETTES) {
    for (const mode of ['light','dark']) {
      const result = A.makeTokens({appearancePalette:palette.id,appearanceMode:mode});
      const vars=result.vars;
      assert.equal(result.dark, mode==='dark');
      assert.ok(A.contrast(vars['--text'],vars['--surface'])>=4.5,
        palette.id+' '+mode+' foreground');
      assert.ok(A.contrast(vars['--ui-accent-text'],vars['--accent'])>=4.5,
        palette.id+' '+mode+' primary action');
      assert.ok(A.contrast(vars['--accent-dark'],vars['--surface'])>=4.5,
        palette.id+' '+mode+' accent on cards');
      assert.match(vars['--page'],/^#[a-f0-9]{6}$/);
    }
  }
});
test('automatic mode follows OS preference; explicit mode ignores it', () => {
  const prefs={appearanceMode:'system',appearancePalette:'ocean'};
  assert.equal(A.makeTokens(prefs,false).dark,false);
  assert.equal(A.makeTokens(prefs,true).dark,true);
  assert.equal(A.makeTokens({...prefs,appearanceMode:'light'},true).dark,false);
  assert.equal(A.makeTokens({...prefs,appearanceMode:'dark'},false).dark,true);
});
test('personalized colors are accepted but unreadable text is corrected for display only', () => {
  const pref={appearanceMode:'dark',appearancePalette:'midnight',
    appearanceColors:{accent:'#2b3f5b',page:'#112233',surface:'#141820',text:'#141820'}};
  const result=A.makeTokens(pref);
  assert.equal(result.vars['--surface'],'#141820');
  assert.equal(result.vars['--page'],'#112233');
  assert.equal(result.vars['--accent'],'#2b3f5b');
  assert.equal(result.contrastAdjusted,true);
  assert.ok(A.contrast(result.vars['--text'],result.vars['--surface'])>=4.5);
  assert.ok(A.contrast(result.vars['--ui-accent-text'],result.vars['--accent'])>=4.5);
  assert.equal(pref.appearanceColors.text,'#141820');
});
test('profile appearance normalizes invalid fields and migrates legacy preferences safely', () => {
  const old=D.normalizeProfile({name:'Perfil antiguo',color:'#115599',preferences:{theme:'sky'}});
  assert.equal(old.preferences.appearanceMode,'light');
  assert.equal(old.preferences.appearancePalette,'ocean');
  assert.equal(old.preferences.appearanceColors.accent,'#115599');
  const bad=D.normalizeProfile({name:'Inválido',preferences:{
    appearanceMode:'glitter',appearancePalette:'unknown',
    appearanceColors:{accent:'url(hack)',page:'#ff0000',extra:'value'}
  }});
  assert.equal(bad.preferences.appearanceMode,'light');
  assert.equal(bad.preferences.appearancePalette,'forest');
  assert.equal(bad.preferences.appearanceColors.accent,'');
  assert.equal(bad.preferences.appearanceColors.page,'#ff0000');
  assert.equal(Object.hasOwn(bad.preferences.appearanceColors,'extra'),false);
  const fresh=D.createProfile('Nuevo');
  assert.equal(fresh.preferences.appearanceMode,'light');
});
test('import validation rejects unsafe appearance data but accepts previous profiles', () => {
  const base=D.createProfile('Compatible');
  assert.doesNotThrow(() => D.validateImportedProfile(base));
  const old=JSON.parse(JSON.stringify(base));
  delete old.preferences.appearanceMode;
  delete old.preferences.appearanceColors;
  delete old.preferences.appearancePalette;
  assert.doesNotThrow(() => D.validateImportedProfile(old));
  const bad=JSON.parse(JSON.stringify(base));
  bad.preferences.appearanceColors={accent:'rgb(3,4,5)'};
  assert.throws(() => D.validateImportedProfile(bad),/colores personalizados/i);
  bad.preferences.appearanceColors={accent:'#123456'};
  bad.preferences.appearanceMode='unknown';
  assert.throws(() => D.validateImportedProfile(bad),/apariencia/i);
});
test('independent profile preferences retain their own palettes', () => {
  const forest=D.createProfile('A'),ocean=D.createProfile('B');
  forest.preferences.appearanceMode='dark';
  forest.preferences.appearancePalette='forest';
  ocean.preferences.appearanceMode='light';
  ocean.preferences.appearancePalette='ocean';
  assert.notEqual(A.makeTokens(forest.preferences).vars['--page'],A.makeTokens(ocean.preferences).vars['--page']);
  assert.equal(ocean.preferences.appearanceMode,'light');
});
