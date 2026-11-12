(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root.document)root.OIsymColor=api;})(typeof globalThis!=='undefined'?globalThis:window,function(){
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
 function normalize(value){
  const text=String(value||'').trim().replace(/^#/,'');
  if(/^[0-9a-f]{3}$/i.test(text))return '#'+[...text].map(c=>c+c).join('').toLowerCase();
  return /^[0-9a-f]{6}$/i.test(text)?'#'+text.toLowerCase():null;
 }
 function rgb(hex){const value=normalize(hex);if(!value)return null;return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16));}
 function hex(values){return '#'+values.map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('');}
 function hsv(value){
  const channels=rgb(value);if(!channels)return null;
  const [r,g,b]=channels.map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
  let h=0;if(delta){if(max===r)h=((g-b)/delta)%6;else if(max===g)h=(b-r)/delta+2;else h=(r-g)/delta+4;h=((h*60)%360+360)%360;}
  return {h,s:max?delta/max:0,v:max};
 }
 function fromHsv(h,s,v){
  h=((Number(h)||0)%360+360)%360;s=clamp(s,0,1);v=clamp(v,0,1);
  const c=v*s,x=c*(1-Math.abs(h/60%2-1)),m=v-c;
  const channels=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return hex(channels.map(channel=>(channel+m)*255));
 }
 return {normalize,rgb,hex,hsv,fromHsv,clamp};
});
