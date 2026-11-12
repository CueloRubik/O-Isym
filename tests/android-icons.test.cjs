'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {installAndroidIcon}=require('../scripts/android-icons.cjs');
const repository=path.resolve(__dirname,'..');
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'oisym-icon-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const target=path.join(root,'android/app/src/main');
 fs.mkdirSync(path.join(root,'assets/icons'),{recursive:true});
 fs.mkdirSync(path.join(target,'res/drawable-v24'),{recursive:true});
 fs.writeFileSync(path.join(target,'res/drawable-v24/ic_launcher_foreground.xml'),'<vector>template robot</vector>');
 return {root,target};
}
test('the Android launcher uses only a fresh copy of app.png even when the template v24 icon remains',t=>{
 const {root,target}=fixture(t);
 const png=Buffer.from([137,80,78,71,13,10,26,10,1,2,3]);
 const source=path.join(root,'assets/icons/app.png');fs.writeFileSync(source,png);
 const result=installAndroidIcon(root,target);
 assert.deepEqual(fs.readFileSync(result),png);
 fs.writeFileSync(source,Buffer.concat([png,Buffer.from([4])]));
 installAndroidIcon(root,target);
 assert.deepEqual(fs.readFileSync(result),fs.readFileSync(source),'every build uses the current source image');
 const manifest=fs.readFileSync(path.join(repository,'mobile/native/AndroidManifest.xml'),'utf8');
 assert.match(manifest,/android:icon="@mipmap\/oisym_launcher"/);
 assert.match(manifest,/android:roundIcon="@mipmap\/oisym_launcher_round"/);
 const foreground=fs.readFileSync(path.join(repository,'mobile/native/res/drawable/oisym_app_foreground.xml'),'utf8');
 assert.match(foreground,/@drawable\/oisym_app_icon/);
 for(const name of ['oisym_launcher','oisym_launcher_round']){
  const adaptive=fs.readFileSync(path.join(repository,'mobile/native/res/mipmap-anydpi-v26',name+'.xml'),'utf8');
  assert.match(adaptive,/@drawable\/oisym_app_foreground/);
  assert.doesNotMatch(adaptive,/ic_launcher_foreground|monochrome/);
  const legacy=fs.readFileSync(path.join(repository,'mobile/native/res/mipmap-anydpi',name+'.xml'),'utf8');
  assert.match(legacy,/@drawable\/oisym_app_icon/);
 }
 assert.equal(fs.existsSync(path.join(repository,'mobile/native/res/drawable-v24/oisym_app_foreground.xml')),false);
});
test('a missing official app.png produces an explicit build error instead of silently shipping a template icon',t=>{
 const {root,target}=fixture(t);
 assert.throws(()=>installAndroidIcon(root,target),/assets\/icons\/app.png/);
});
