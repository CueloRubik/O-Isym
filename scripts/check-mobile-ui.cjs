'use strict';
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'mobile-ui-report');
fs.mkdirSync(output,{recursive:true});
const source=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(name==='/'){
  let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  html=html.replace('initial-scale=1','initial-scale=1, viewport-fit=cover').replace('</head>','<link rel="stylesheet" href="/src/styles/mobile.css"></head>');
  html=html.replace('</body>','<script src="/mobile/ui.js"></script></body>');
  res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);return;
 }
 if(name==='/src/app.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(source+'\nwindow.mobileTestApp={state,updateShell,flushIdeaChanges};');return;}
 const file=path.resolve(root,'.'+name);
 if(!file.startsWith(root+path.sep)||!/^\/(src|assets|mobile)\//.test(name)){res.writeHead(404).end();return;}
 fs.readFile(file,(err,data)=>{
  if(err){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(data);
 });
});
async function swipe(page,x,y,endY){
 const cdp=await page.context().newCDPSession(page);
 await page.evaluate(()=>{window.mobileLastScroll=performance.now();if(!window.mobileScrollObserver){window.addEventListener('scroll',()=>window.mobileLastScroll=performance.now(),true);window.mobileScrollObserver=true;}});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+(endY-y)*i/12}]});await page.waitForTimeout(20);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForTimeout(350);
 await page.waitForFunction(()=>performance.now()-window.mobileLastScroll>250,{},{polling:50,timeout:6000});await cdp.detach();
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 const errors=[];
 try{
  for(const width of [320,360,412,768]){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:true,hasTouch:true,deviceScaleFactor:1});
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    document.addEventListener('DOMContentLoaded',()=>document.documentElement.classList.add('oisym-android'),{once:true});
    let snapshot;
    const copy=x=>JSON.parse(JSON.stringify(x));
    window.oisym={platform:'android',storage:{
     read:async()=>{
      const D=window.OIsymDomain,p=D.createProfile('Prueba móvil');
      p.tasks=Array.from({length:12},(_,i)=>D.createTask({title:'Tarea '+i+' con un nombre suficientemente largo para revisar el espacio',scheduledDate:D.localDate()}));
      const b=D.createIdeaBoard({title:'Pizarrón móvil'});b.nodes=[D.createIdeaNode('note',{title:'Nota de prueba',x:0,y:0})];p.ideaBoards=[b];
      snapshot={schemaVersion:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),profiles:[p],activeProfileId:p.id};return copy(snapshot);
     },save:async value=>{snapshot=copy(value);return copy(snapshot);}
    },notifications:{getStatus:async()=>({supported:true,permission:'granted',exactAlarms:true}),setLaunchAtLogin:async()=>false,onOpenTask:()=>{},request:async()=>{},exact:async()=>{},sendTest:async()=>{}},
    focusAlarms:{schedule:async()=>{},cancel:async()=>{},complete:async()=>{}},onSaveBeforeClose:()=>{}};
   });
   await page.goto('http://127.0.0.1:'+server.address().port);
   await page.waitForSelector('.mobile-navigation');
   const select=async(view,section)=>{
    await page.evaluate(({view,section})=>{const a=window.mobileTestApp;a.state.view=view;if(section)a.state.settingsSection=section;a.updateShell();window.scrollTo(0,0);},{view,section});
    await page.waitForTimeout(80);
   };
   const check=async(label)=>{
    const bad=await page.evaluate(()=>{
     return [...document.querySelectorAll('#main-content button,#main-content input,#main-content select,#main-content textarea,#main-content .card,#main-content .settings-navigation')]
      .filter(e=>e.getClientRects().length&&!e.closest('.ideas-canvas-world'))
      .map(e=>({tag:e.tagName,cls:e.className,name:e.getAttribute('name'),left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}))
      .filter(e=>e.left < -1||e.right>window.innerWidth+1);
    });
    assert.deepEqual(bad,[],width+'px '+label+' controls fit the screen');
    const cramped=await page.evaluate(()=>[...document.querySelectorAll('.task-content')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect().width).filter(w=>w<120));
    assert.deepEqual(cramped,[],width+'px '+label+' task titles remain readable');
    const tiny=await page.evaluate(()=>[...document.querySelectorAll('#main-content .button')].filter(e=>e.getClientRects().length&&!e.closest('.ideas-canvas-world,.day-positioned-block')).map(e=>({text:e.textContent,height:e.getBoundingClientRect().height})).filter(e=>e.height<44));
    assert.deepEqual(tiny,[],width+'px '+label+' buttons have usable touch targets');
    await page.screenshot({path:path.join(output,width+'-'+label+'.png'),fullPage:true});
   };
   for(const view of ['today','tasks','activities','goals','calendar','focus','planner','insights','profiles']){await select(view);await check(view);}
   for(const section of ['profile','appearance','planning','notifications','focus','data','shortcuts']){await select('settings',section);await check('settings-'+section);}
   await select('focus');
   await page.locator('.mobile-focus-options summary').first().tap();
   await check('focus-music-open');
   await page.locator('.mobile-focus-options summary').last().tap();
   await check('focus-alarm-open');
   await select('settings','appearance');
   await page.locator('.mobile-settings-navigation summary').tap();
   await check('settings-menu-open');
   await select('today');
   await swipe(page,Math.round(width/2),700,250);
   assert.ok(await page.evaluate(()=>window.scrollY)>150,width+'px page scrolls with a finger');
   await page.locator('[data-mobile-more]').tap();
   assert.equal(await page.locator('.workspace-sidebar').getAttribute('aria-hidden'),'false');
   assert.equal(await page.locator('.workspace-sidebar .navigation-group-items').first().evaluate(e=>getComputedStyle(e).flexDirection),'column');
   await page.waitForFunction(()=>{const r=document.querySelector('.workspace-sidebar').getBoundingClientRect();return Math.abs(r.left)<1&&r.right>150;});
   await page.screenshot({path:path.join(output,width+'-menu.png')});
   await page.locator('.workspace-sidebar [data-view="tasks"]').tap();
   await page.waitForTimeout(120);
   assert.equal(await page.locator('.workspace-sidebar').getAttribute('aria-hidden'),'true');
   await page.locator('[data-action="quick-task"]').tap();
   await page.waitForSelector('[data-profile-modal]');
   await check('task-editor');
   const panel=page.locator('.task-editor-panel');
   const before=await panel.evaluate(e=>e.scrollTop);
   await swipe(page,Math.round(width/2),700,250);
   assert.ok(await panel.evaluate(e=>e.scrollTop)>before,width+'px editor scrolls with a finger');
   await page.evaluate(()=>window.dispatchEvent(new CustomEvent('oisym:android-back',{cancelable:true})));
   await page.waitForSelector('[data-profile-modal]',{state:'detached'});
   await page.evaluate(()=>{const a=window.mobileTestApp;a.state.view='planner';a.state.plannerSection='board';a.state.selectedIdeaBoardId=a.state.profile.ideaBoards[0].id;a.updateShell();});
   await check('board');
   await page.locator('.ideas-canvas-viewport').scrollIntoViewIfNeeded();
   let box=await page.locator('.ideas-canvas-viewport').boundingBox();
   const start=await page.evaluate(()=>window.scrollY);
   assert.ok(start>50,width+'px board starts below the page header');
   await swipe(page,Math.round(box.x+box.width-20),Math.max(110,box.y+30),Math.min(750,box.y+box.height-30));
   assert.ok(await page.evaluate(()=>window.scrollY)<start-50,width+'px board permits page scrolling');
   await context.close();
   console.log('Mobile UI '+width+'px: navigation, editors, touch scroll and screen bounds passed');
  }
  assert.deepEqual(errors,[],'No uncaught renderer errors');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
