'use strict';
const rem=require('../src/platform/android-reminders.js');
function createAndroidBridge(native,domain){
 const listeners=new Set();let last=null,focusReady=Promise.resolve(),saveQueue=Promise.resolve(),audioState={musicPlaying:false,previewPlaying:false,alarmPlaying:false};
 const validate=s=>{domain.validateSnapshot(s);s.profiles.forEach(domain.validateImportedProfile);if(JSON.stringify(s).length>5*1024*1024)throw Error('Los datos exceden 5 MB.');return s;};
 const parse=raw=>{try{return validate(JSON.parse(raw));}catch(cause){const e=Error('Los datos no son válidos: '+cause.message);e.code='OISYM_STORE_INVALID';throw e;}};
 const invoke=async(method,args={})=>{try{return await native[method](args);}catch(e){if(/OISYM_STORE_/.test(e.message||''))e.code=e.message.match(/OISYM_STORE_[A-Z]+/)[0];throw e;}};
 async function read(){const result=await invoke('read');last=parse(result.data);return last;}
 async function save(value){
  const text=JSON.stringify(validate(value));
  const operation=saveQueue.then(async()=>{
   const result=await invoke('save',{data:text});
   last=parse(result.data);
   try{await native.scheduleTasks({items:rem.reminders(last)});}catch(e){window.dispatchEvent(new CustomEvent('oisym:android-warning',{detail:e.message}));}
   return JSON.parse(JSON.stringify(last));
  });saveQueue=operation.catch(()=>{});return operation;
 }
 native.addListener('openTask',event=>listeners.forEach(fn=>fn(event)));
 native.addListener('audioState',s=>{audioState=s;window.dispatchEvent(new Event('oisym:audio-state'));});
 native.addListener('resumed',()=>{window.dispatchEvent(new Event('focus'));});
 const audio={
  createController(options={}){
   const notify=()=>options.onChange?.(audioState);
   window.addEventListener('oisym:audio-state',notify);
   native.getAudioState().then(s=>{audioState=s;notify();}).catch(()=>{});
   const command=(action,kind,...args)=>{
    const method=audio[action];method(...args).catch(()=>{options.onError?.(kind);});
    return true;
   };
   return Object.freeze({
    startMusic:(...args)=>command('startMusic','music',...args),
    stopMusic:()=>command('stopMusic','music'),
    previewMusic:(...args)=>command('previewMusic','music-preview',...args),
    stopPreview:()=>command('stopPreview','music-preview'),
    playAlarm:(...args)=>command('playAlarm','alarm',...args),
    stopAlarm:()=>command('stopAlarm','alarm'),
    stopAll:()=>command('stopAll','music'),
    setMusicVolume:value=>command('setMusicVolume','music',value),
    setAlarmVolume:value=>command('setAlarmVolume','alarm',value),
    isMusicPlaying:()=>Boolean(audioState.musicPlaying),
    isPreviewPlaying:()=>Boolean(audioState.previewPlaying),
    isAlarmPlaying:()=>Boolean(audioState.alarmPlaying)
   });
  },
  startMusic:(src,volume)=>focusReady.then(()=>invoke('audio',{action:'music',src,volume})),
  stopMusic:()=>invoke('audio',{action:'stopMusic'}),
  previewMusic:(src,volume,durationMs)=>invoke('audio',{action:'preview',src,volume,durationMs}),
  stopPreview:()=>invoke('audio',{action:'stopPreview'}),
  playAlarm:(src,config)=>invoke('audio',{action:'alarm',src,...config}),
  stopAlarm:()=>invoke('audio',{action:'stopAlarm'}),
  stopAll:()=>invoke('audio',{action:'stopAll'}),
  setMusicVolume:value=>invoke('audio',{action:'volume',volume:value}),
  setAlarmVolume:value=>invoke('audio',{action:'alarmVolume',volume:value}),
  status:()=>audioState
 };
 return {
  platform:'android',nativeAudio:audio,
  storage:{read,save,recovery:{
   listBackups:async()=>{const r=await invoke('listBackups');return r.items||[];},
   overwrite:async()=>invoke('overwrite'),
   restore:async name=>invoke('restore',{name})
  }},
  files:{export:async(name,data)=>invoke('exportFile',{name,data})},
  onSaveBeforeClose:callback=>{document.addEventListener('visibilitychange',()=>{if(document.hidden)void callback();});},
  notifications:{
   getStatus:()=>invoke('status'),setLaunchAtLogin:async()=>false,
   sendTest:()=>invoke('sendTest'),onOpenTask:callback=>{
    listeners.add(callback);void native.consumeOpenTask().then(r=>{if(r.taskId)callback(r);});return()=>listeners.delete(callback);
   },
   request:()=>invoke('requestNotifications'),exact:()=>invoke('openExactSettings')
  },
  focusAlarms:{
   schedule:async payload=>{
    const profile=last?.profiles.find(p=>p.id===last.activeProfileId),focus=profile?.activeFocus,prefs=profile?.preferences||{};
    if(!focus||focus.pausedAt)return invoke('cancelFocus');
    focusReady=invoke('scheduleFocus',{...payload,sessionId:profile.id+':'+(focus.sessionStartedAt||focus.startedAt),alarmEnabled:prefs.focusEndAlarmEnabled!==false&&!focus.isBreak,alarmTone:prefs.focusEndTone||'clock',volume:Number(prefs.focusAlarmVolume??70)/100,plays:Number(prefs.focusAlarmRepeats)||3,intervalSeconds:Number(prefs.focusAlarmIntervalSeconds)||2,maxSeconds:Number(prefs.focusAlarmMaxSeconds)||30});return focusReady;
   },
   complete:()=>invoke('completeFocus'),
   cancel:()=>invoke('cancelFocus')
  }
 };
}
module.exports={createAndroidBridge};
