'use strict';
function createFocusNotificationScheduler({Notification,powerMonitor,now=Date.now,setTimer=setTimeout,clearTimer=clearTimeout}){
 let active=null,timer=null;
 function cancel(){if(timer!==null)clearTimer(timer);timer=null;active=null;}
 function show(title,body){try{if(!Notification||(typeof Notification.isSupported==='function'&&!Notification.isSupported()))return;const n=new Notification({title,body,silent:true});n.on('failed',(_e,error)=>console.error('[O-Isym] Notificación fallida:',error));n.show();}catch(error){}}
 function check(){if(timer!==null)clearTimer(timer);timer=null;if(!active)return;const left=active.endsAt-now();if(left>0){timer=setTimer(check,Math.max(1,left));return;}const done=active;active=null;if(done.notificationsEnabled)show(done.isBreak?'Descanso terminado':'Focus terminado',done.isBreak?'Tu descanso terminó. Cuando quieras, puedes volver a concentrarte.':(done.taskTitle?'Terminaste tu sesión de '+done.taskTitle+'. Tómate un descanso.':'Terminaste tu sesión de concentración. Tómate un descanso.'));}
 function schedule(payload){cancel();if(!payload||typeof payload!=='object')return false;const endsAt=Date.parse(payload.endsAt);if(!Number.isFinite(endsAt))return false;active={endsAt,isBreak:payload.isBreak===true,taskTitle:typeof payload.taskTitle==='string'?payload.taskTitle.slice(0,140):'',notificationsEnabled:payload.notificationsEnabled!==false};check();return true;}
 function onResume(){check();}if(powerMonitor&&typeof powerMonitor.on==='function')powerMonitor.on('resume',onResume);
 function dispose(){cancel();if(powerMonitor&&typeof powerMonitor.removeListener==='function')powerMonitor.removeListener('resume',onResume);}
 return Object.freeze({schedule,cancel,dispose});
}
module.exports={createFocusNotificationScheduler};
