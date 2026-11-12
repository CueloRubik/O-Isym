'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {reminders}=require('../src/platform/android-reminders.js');
const {createAndroidBridge}=require('../mobile/bridge.js');
const domain=require('../src/domain.js');
function snapshot(){const p=domain.createProfile('Android');return {schemaVersion:1,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),activeProfileId:p.id,profiles:[p]};}
function nativeMock(){
 let raw=JSON.stringify(snapshot());const saved=[],listeners=new Map();
 return {saved,listeners,
  addListener:async(name,fn)=>{listeners.set(name,fn);},
  read:async()=>({data:raw}),
  save:async({data})=>{saved.push(data);raw=data;return {data:raw};},
  scheduleTasks:async()=>{},getAudioState:async()=>({}),
  consumeOpenTask:async()=>({}),cancelFocus:async()=>{},scheduleFocus:async p=>p,
  status:async()=>({platform:'android'}),audio:async()=>{},
  completeFocus:async()=>{}
 };
}
test('Android reminders filter by preferences and preserve full task identity',()=>{
 const s=snapshot(),p=s.profiles[0];
 p.preferences.taskNotificationLeadMinutes=15;
 p.tasks=[{id:'a',title:'Prueba',status:'pending',scheduledDate:'2030-02-01',startTime:'09:30',priority:'high'}, {id:'b',title:'Terminada',status:'completed',scheduledDate:'2030-02-01',startTime:'10:00'}];
 const results=reminders(s,new Date('2030-02-01T08:00:00').getTime());
 assert.equal(results.length,1);assert.equal(results[0].profileId,p.id);
 assert.equal(results[0].time,new Date('2030-02-01T09:15:00').getTime());
 p.preferences.taskNotificationsEnabled=false;assert.equal(reminders(s,0).length,0);
});
test('Android bridge validates snapshots before touching persistent storage',async()=>{
 const native=nativeMock(),bridge=createAndroidBridge(native,domain),s=await bridge.storage.read();
 assert.equal(s.schemaVersion,1);
 await assert.rejects(bridge.storage.save({...s,schemaVersion:99}));
 assert.equal(native.saved.length,0);
});
test('Android bridge captures queued snapshots without sharing mutable references',async()=>{
 const native=nativeMock(),bridge=createAndroidBridge(native,domain),s=await bridge.storage.read();
 s.profiles[0].name='Primero';const first=bridge.storage.save(s);
 s.profiles[0].name='Segundo';const second=bridge.storage.save(s);
 await Promise.all([first,second]);
 assert.equal(JSON.parse(native.saved[0]).profiles[0].name,'Primero');
 assert.equal(JSON.parse(native.saved[1]).profiles[0].name,'Segundo');
});
test('Android Focus includes session identity and configured alarm bounds',async()=>{
 const native=nativeMock();let scheduled;native.scheduleFocus=async p=>{scheduled=p;};
 const bridge=createAndroidBridge(native,domain),s=await bridge.storage.read(),p=s.profiles[0];
 p.activeFocus={startedAt:new Date().toISOString(),sessionStartedAt:new Date().toISOString(),pausedAt:null,durationSeconds:1500,elapsedBeforePause:0};
 p.preferences.focusAlarmMaxSeconds=20;await bridge.storage.save(s);
 await bridge.focusAlarms.schedule({endsAt:new Date(Date.now()+1500000).toISOString()});
 assert.ok(scheduled.sessionId.startsWith(p.id+':'));assert.equal(scheduled.maxSeconds,20);
 p.activeFocus.pausedAt=new Date().toISOString();await bridge.storage.save(s);
 let cancelled=false;native.cancelFocus=async()=>{cancelled=true;};await bridge.focusAlarms.schedule({});
 assert.equal(cancelled,true);
});
test('Android bootstrap excludes desktop code and provides a separate web directory',()=>{
 const fs=require('node:fs');const config=JSON.parse(fs.readFileSync('mobile/capacitor.config.json','utf8'));
 assert.equal(config.webDir,'../build/android-web');assert.equal(config.appId,'com.oisym.app');
 const script=fs.readFileSync('scripts/android.cjs','utf8');
 assert.ok(script.includes("['src','assets']"));assert.ok(!script.includes("['electron'"));
});
