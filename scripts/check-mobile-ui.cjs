'use strict';
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const output=process.env.MOBILE_UI_OUTPUT||path.join(root,'mobile-ui-report');
fs.mkdirSync(output,{recursive:true});
const source=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(name==='/'){
  let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  html=html.replace('initial-scale=1','initial-scale=1, viewport-fit=cover').replace('</head>','<link rel="stylesheet" href="/src/styles/mobile.css"></head>');
  html=html.replace('</body>','<script src="/mobile/color-math.js"></script><script src="/mobile/color-picker.js"></script><script src="/mobile/screens.js"></script><script src="/mobile/ui.js"></script></body>');
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
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 const errors=[];let currentPage;
 try{
  for(const width of [320,360,412,768]){
   const context=await browser.newContext({viewport:{width,height:900},isMobile:true,hasTouch:true,deviceScaleFactor:1});
   const page=await context.newPage();currentPage=page;
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
   await page.addInitScript(()=>{
    document.addEventListener('DOMContentLoaded',()=>document.documentElement.classList.add('oisym-android'),{once:true});
    let snapshot;
    const copy=x=>JSON.parse(JSON.stringify(x));
    window.oisym={platform:'android',storage:{
     read:async()=>{
      const D=window.OIsymDomain,p=D.createProfile('Prueba móvil');
      p.tasks=Array.from({length:12},(_,i)=>D.createTask({title:'Tarea '+i+' con un nombre suficientemente largo para revisar el espacio',scheduledDate:D.localDate(),...(i<3?{startTime:String(9+i).padStart(2,'0')+':00',endTime:String(9+i).padStart(2,'0')+':30'}:{})}));
      const b=D.createIdeaBoard({title:'Pizarrón móvil'});b.nodes=[D.createIdeaNode('note',{title:'Nota de prueba',x:0,y:0})];p.ideaBoards=[b];
      snapshot={schemaVersion:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),profiles:[p],activeProfileId:p.id};return copy(snapshot);
     },save:async value=>{snapshot=copy(value);return copy(snapshot);}
    },notifications:{getStatus:async()=>({supported:true,permission:'granted',exactAlarms:true}),setLaunchAtLogin:async()=>false,onOpenTask:()=>{},request:async()=>{},exact:async()=>{},sendTest:async()=>{}},
    focusAlarms:{schedule:async()=>{},cancel:async()=>{},complete:async()=>{}},onSaveBeforeClose:()=>{}};
   });
   await page.goto('http://127.0.0.1:'+server.address().port);
   await page.waitForSelector('.mobile-navigation');
   const select=async(view,section)=>{
    await page.evaluate(({view,section})=>{const a=window.mobileTestApp;a.state.view=view;if(section)a.state.settingsSection=section;a.updateShell();document.querySelector('#main-content').scrollTop=0;},{view,section});
    await page.waitForTimeout(90);
   };
   const tab=async(name)=>{await page.locator('[data-mobile-tab="'+name+'"]:visible').tap();await page.waitForTimeout(60);};
   const check=async(label)=>{
    const bad=await page.evaluate(()=>{
     const nodes=[...document.querySelectorAll('#main-content button,#main-content input,#main-content select,#main-content textarea,#main-content .card,dialog[open] button,dialog[open] input')];
     return nodes.filter(e=>e.getClientRects().length&&!e.closest('.ideas-canvas-world')&&!e.classList.contains('mobile-native-color'))
      .map(e=>({tag:e.tagName,cls:e.className,name:e.getAttribute('name'),text:e.textContent?.slice(0,40),left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}))
      .filter(e=>e.left < -1||e.right>window.innerWidth+1);
    });
    assert.deepEqual(bad,[],width+'px '+label+' controls fit');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'No sideways page scroll');
    assert.ok(await page.evaluate(()=>window.scrollY===0),'The page stays fixed while the active screen scrolls');
    await page.screenshot({path:path.join(output,width+'-'+label+'.png')});
   };
   await check('home-summary');
   assert.equal(await page.locator('[data-mobile-panel="day"]').getAttribute('hidden'),'');
   await tab('day');await check('home-day');
   const listBefore=await page.locator('#main-content').evaluate(e=>e.scrollTop);
   await swipe(page,Math.round(width/2),700,250);
   assert.ok(await page.locator('#main-content').evaluate(e=>e.scrollTop)>listBefore+80,'The current task screen scrolls with a finger');
   await tab('progress');await check('home-progress');
   for(const view of ['tasks','activities','goals','calendar','focus','planner','insights','profiles']){await select(view);await check(view);}
   await select('focus');await page.setViewportSize({width,height:640});await page.waitForTimeout(100);
   const startButton=await page.locator('[data-action="focus-start"]').boundingBox(),nav=await page.locator('.mobile-navigation').boundingBox();
   assert.ok(startButton.y>=0&&startButton.y+startButton.height<=nav.y+1,width+'px start remains visible on a short phone');
   await check('focus-short-screen');await page.setViewportSize({width,height:900});
   await tab('sound');await check('focus-music');await tab('alarm');await check('focus-alarm');await tab('history');await check('focus-history');
   await select('calendar');await tab('pending');await check('calendar-pending');await tab('planning');await check('calendar-planning');
   await select('settings');await check('settings-hub');
   for(const section of ['profile','appearance','planning','notifications','focus','data','shortcuts']){
    await page.locator('.settings-navigation [data-section="'+section+'"]').tap();await page.waitForTimeout(100);await check('settings-'+section);
    if(section==='appearance'){
     await tab('colors');await check('appearance-colors');
     const trigger=page.locator('input[name="appearance-accent"] + .mobile-color-trigger');
     await trigger.tap();await page.waitForSelector('.mobile-color-dialog');
     await page.getByRole('textbox',{name:'Color hexadecimal'}).fill('#5469de');
     await check('color-picker');
     await page.getByRole('button',{name:'Aplicar color',exact:true}).tap();
     await page.waitForSelector('.mobile-color-dialog',{state:'detached'});
     assert.equal(await page.locator('input[name="appearance-accent"]').inputValue(),'#5469de');
     assert.equal(await page.evaluate(()=>window.mobileTestApp.state.profile.preferences.appearanceColorsByMode.light.accent),'#5469de');
     await trigger.tap();await page.getByRole('textbox',{name:'Color hexadecimal'}).fill('#ff0000');
     await page.getByRole('button',{name:'Cancelar',exact:true}).tap();
     assert.equal(await page.locator('input[name="appearance-accent"]').inputValue(),'#5469de');
     await tab('style');await check('appearance-style');
    }
    await page.locator('.mobile-back-button').tap();
   }
   await page.locator('[data-mobile-more]').tap();
   await page.waitForFunction(()=>{const r=document.querySelector('.workspace-sidebar').getBoundingClientRect();return Math.abs(r.top)<1&&r.bottom>400;});
   await check('space-menu');
   await page.locator('.workspace-sidebar [data-view="tasks"]').tap();await page.waitForTimeout(120);
   await page.locator('[data-action="quick-task"]').tap();await page.waitForSelector('[data-profile-modal]');
   await check('task-editor');
   const panel=page.locator('.task-editor-panel');
   await page.locator('.task-editor-panel input[name="title"]').focus();await page.setViewportSize({width,height:480});
   await page.waitForFunction(()=>document.body.classList.contains('mobile-keyboard-open'));
   assert.equal(await page.locator('.mobile-navigation').evaluate(e=>getComputedStyle(e).display),'none');
   await check('editor-keyboard');await page.setViewportSize({width,height:900});await page.locator('.task-editor-panel input[name="title"]').blur();
   const before=await panel.evaluate(e=>e.scrollTop);await swipe(page,Math.round(width/2),700,250);
   assert.ok(await panel.evaluate(e=>e.scrollTop)>before,'Editor scrolls independently');
   await page.evaluate(()=>window.dispatchEvent(new CustomEvent('oisym:android-back',{cancelable:true})));
   await page.waitForSelector('[data-profile-modal]',{state:'detached'});
   await page.evaluate(()=>{const a=window.mobileTestApp;a.state.view='planner';a.state.plannerSection='board';a.state.selectedIdeaBoardId=a.state.profile.ideaBoards[0].id;a.updateShell();});
   await check('board-workspace');
   const canvas=page.locator('.ideas-canvas-viewport'),box=await canvas.boundingBox();
   assert.ok(box.height>300,'Board uses the remaining screen height');
   await page.getByRole('button',{name:'Herramientas',exact:true}).tap();await page.waitForSelector('dialog.mobile-sheet[open]');
   await check('board-tools');
   await page.locator('.mobile-sheet-close').tap();await page.waitForSelector('dialog.mobile-sheet',{state:'detached'});
   assert.equal(await canvas.getAttribute('data-mobile-interaction'),'board');
   await context.close();
   console.log('Mobile redesign '+width+'px: separated screens, custom colors, touch scrolling, keyboard and board workspace passed');
  }
  assert.deepEqual(errors,[],'No uncaught renderer errors');
 }catch(error){if(currentPage&&!currentPage.isClosed())await currentPage.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});throw error;}
 finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
