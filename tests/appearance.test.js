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

test('light and dark store independent palette and every custom surface channel', () => {
  const p=D.createProfile('Modos independientes');
  p.preferences.appearanceMode='system';
  p.preferences.appearancePalettes={light:'rose',dark:'midnight'};
  p.preferences.appearanceColorsByMode={
    light:{accent:'#b45180',page:'#f8f5f0',surface:'#ffffff',sidebar:'#f5f0fa',field:'#f7f2f9',
      text:'#283142',border:'#d9ccdf',muted:'#516273'},
    dark:{accent:'#92aeff',page:'#121c30',surface:'#1c2942',sidebar:'#0f1725',field:'#253c4e',
      text:'#f1f6fa',border:'#49617a',muted:'#cbd3df'}
  };
  const light=A.makeTokens(p.preferences,false);
  const dark=A.makeTokens(p.preferences,true);
  assert.equal(light.palette,'rose');
  assert.equal(dark.palette,'midnight');
  assert.equal(light.vars['--ui-sidebar'],'#f5f0fa');
  assert.equal(light.vars['--ui-field'],'#f7f2f9');
  assert.equal(dark.vars['--ui-sidebar'],'#0f1725');
  assert.equal(dark.vars['--ui-field'],'#253c4e');
  for(const tokens of [light,dark]){
    const vars=tokens.vars;
    assert.ok(A.contrast(vars['--ui-sidebar-text'],vars['--ui-sidebar'])>=4.5);
    assert.ok(A.contrast(vars['--ui-sidebar-active-text'],vars['--ui-sidebar-active'])>=4.5);
    assert.ok(A.contrast(vars['--ui-field-text'],vars['--ui-field'])>=4.5);
    assert.ok(A.contrast(vars['--ui-input-placeholder'],vars['--ui-field'])>=4.5);
  }
  const restored=D.normalizeProfile(p);
  assert.equal(restored.preferences.appearanceColorsByMode.light.page,'#f8f5f0');
  assert.equal(restored.preferences.appearanceColorsByMode.dark.page,'#121c30');
  assert.equal(restored.preferences.appearancePalettes.dark,'midnight');
});

test('legacy colors migrate into both modes without changing the old profile schema', () => {
  const legacy=D.normalizeProfile({name:'Configuración anterior',preferences:{
    appearancePalette:'ocean',appearanceColors:{accent:'#123456',surface:'#ffffff'}
  }});
  assert.equal(legacy.preferences.appearancePalettes.light,'ocean');
  assert.equal(legacy.preferences.appearancePalettes.dark,'ocean');
  assert.equal(legacy.preferences.appearanceColorsByMode.light.accent,'#123456');
  assert.equal(legacy.preferences.appearanceColorsByMode.dark.accent,'#123456');
  assert.equal(legacy.preferences.appearanceColorsByMode.light.surface,'#ffffff');
  assert.equal(legacy.preferences.appearanceColorsByMode.dark.surface,'#ffffff');
});

test('new mode data rejects invalid imported colors or palette keys', () => {
  const p=D.createProfile('Importar');
  p.preferences.appearancePalettes={light:'rose',dark:'graphite'};
  p.preferences.appearanceColorsByMode={light:{field:'#fdfdfd'},dark:{sidebar:'#121212'}};
  p.preferences.appearanceDensity='compact';
  p.preferences.appearanceRadius='rounded';
  assert.doesNotThrow(()=>D.validateImportedProfile(p));
  p.preferences.appearanceColorsByMode.light.field='rgb(0,0,0)';
  assert.throws(()=>D.validateImportedProfile(p),/colores por modo/i);
  p.preferences.appearanceColorsByMode.light.field='#123456';
  p.preferences.appearancePalettes.dark='unknown';
  assert.throws(()=>D.validateImportedProfile(p),/paletas de cada modo/i);
  p.preferences.appearancePalettes.dark='graphite';
  p.preferences.appearanceDensity='unsafe';
  assert.throws(()=>D.validateImportedProfile(p),/Densidad/i);
});

test('icon configuration uses compatible defaults and survives profile normalization',()=>{
  const older=D.normalizeProfile({name:'Versión previa',preferences:{appearanceMode:'dark'}});
  assert.equal(older.preferences.appearanceIconMode,'vector');
  assert.equal(older.preferences.appearanceIconVariant,'outline');
  assert.equal(older.preferences.appearanceIconBackground,'none');
  assert.equal(older.preferences.appearanceCardStyle,'elevated');
  const decorated=D.createProfile('Personalizado');
  decorated.preferences.appearanceIconMode='image';
  decorated.preferences.appearanceIconVariant='duotone';
  decorated.preferences.appearanceIconTone='custom';
  decorated.preferences.appearanceIconBackground='filled';
  decorated.preferences.appearanceIconColorsByMode={light:'#146c84',dark:'#add8e6'};
  decorated.preferences.appearanceIconBackgroundColorsByMode={light:'#eef4f7',dark:'#123456'};
  decorated.preferences.appearanceCardStyle='soft';
  const normalized=D.normalizeProfile(decorated);
  assert.equal(normalized.preferences.appearanceIconMode,'image');
  assert.equal(normalized.preferences.appearanceIconVariant,'duotone');
  assert.equal(normalized.preferences.appearanceIconTone,'custom');
  assert.equal(normalized.preferences.appearanceIconColorsByMode.dark,'#add8e6');
  assert.equal(normalized.preferences.appearanceIconBackgroundColorsByMode.light,'#eef4f7');
  assert.equal(normalized.preferences.appearanceCardStyle,'soft');
  assert.doesNotThrow(()=>D.validateImportedProfile(normalized));
});
test('icon colors and icon tile backgrounds are readable in both schemes',()=>{
  const profile={
    appearanceIconTone:'custom', appearanceIconBackground:'filled',
    appearanceMode:'system',
    appearancePalettes:{light:'sage',dark:'midnight'},
    appearanceIconColorsByMode:{light:'#147f7b',dark:'#92b8ec'},
    appearanceIconBackgroundColorsByMode:{light:'#e9eff1',dark:'#1b2c42'}
  };
  for(const isDark of [false,true]){
    const {vars}=A.makeTokens(profile,isDark);
    assert.ok(A.contrast(vars['--ui-icon-color'],vars['--surface'])>=4.5);
    assert.ok(A.contrast(vars['--ui-nav-icon-color'],vars['--ui-sidebar'])>=4.5);
    assert.ok(A.contrast(vars['--ui-icon-tile-ink'],vars['--ui-icon-tile'])>=4.5);
    assert.ok(A.contrast(vars['--ui-nav-icon-tile-ink'],vars['--ui-nav-icon-tile'])>=4.5);
  }
});
test('invalid imported icon settings are rejected rather than accepted as CSS',()=>{
  const profile=D.createProfile('Seguridad');
  profile.preferences.appearanceIconMode='image';
  assert.doesNotThrow(()=>D.validateImportedProfile(profile));
  profile.preferences.appearanceIconMode='remote-url';
  assert.throws(()=>D.validateImportedProfile(profile),/visual/i);
  profile.preferences.appearanceIconMode='image';
  profile.preferences.appearanceIconColorsByMode.dark='url(data:text/plain,test)';
  assert.throws(()=>D.validateImportedProfile(profile),/colores de iconos/i);
  profile.preferences.appearanceIconColorsByMode.dark='';
  profile.preferences.appearanceCardStyle='unsafe';
  assert.throws(()=>D.validateImportedProfile(profile),/visual/i);
});
