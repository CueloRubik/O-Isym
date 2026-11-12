'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
function scan(folder) {
  return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(folder,entry.name);
    return entry.isDirectory()?scan(full):[full];
  });
}
test('all bundled UI icons are real PNG files, including every reference from the renderer',()=>{
  const src=fs.readFileSync(path.join(base,'src/app.js'),'utf8');
  const referenced=new Set();
  for(const match of src.matchAll(/['"]([\w/.-]+\.png)['"]/g)){
    const literal=match[1];
    if(literal.startsWith('assets/icons/'))referenced.add(literal);
    else if(/^(ideas|actions|navigation|interface|tasks|notifications|focus)\//.test(literal))
      referenced.add('assets/icons/'+literal);
    else if(/^[\w-]+\.png$/.test(literal))
      referenced.add('assets/icons/actions/'+literal);
  }
  for(const name of referenced){
    const full=path.join(base,name);
    assert.ok(fs.existsSync(full),'Missing referenced icon: '+name);
  }
  const files=scan(path.join(base,'assets/icons')).filter(file=>file.endsWith('.png'));
  assert.ok(files.length>=35);
  for(const file of files){
    const data=fs.readFileSync(file);
    assert.ok(data.length>32,'Empty/truncated icon '+file);
    assert.deepEqual(data.subarray(0,8),signature,'Invalid PNG signature '+file);
  }
});
test('all eighteen avatar images are shipped with the desktop app',()=>{
  const files=scan(path.join(base,'assets/avatars')).filter(file=>file.endsWith('.png'));
  assert.equal(files.length,18);
  for(const file of files)assert.deepEqual(fs.readFileSync(file).subarray(0,8),signature,'Invalid avatar '+file);
});
