'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const color=require('../mobile/color-math.js');
test('custom colors accept exact HEX and shorthand, and reject malformed values',()=>{
 assert.equal(color.normalize(' 12aBcF '),'#12abcf');assert.equal(color.normalize('#abc'),'#aabbcc');
 for(const value of ['#abcd','#gg1234','',null,'red','#12345678'])assert.equal(color.normalize(value),null);
});
test('the complete HSV range round trips RGB colors without palette restrictions',()=>{
 for(const value of ['#000000','#ffffff','#ff0000','#00ff00','#0000ff','#156af3','#b92467','#39ab8c']){
  const {h,s,v}=color.hsv(value);assert.equal(color.fromHsv(h,s,v),value);
 }
 assert.equal(color.fromHsv(180,1,1),'#00ffff');
 assert.equal(color.fromHsv(300,1,1),'#ff00ff');
 assert.equal(color.fromHsv(40,0,.5),'#808080');
});
