'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.OIsymAndroidReminders=api;})(typeof window!=='undefined'?window:null,()=>{
 function reminders(snapshot,now=Date.now()){
  const p=snapshot.profiles.find(x=>x.id===snapshot.activeProfileId);
  if(!p||p.preferences?.taskNotificationsEnabled===false)return [];
  const prefs=p.preferences||{},lead=[0,5,10,15,30,60].includes(Number(prefs.taskNotificationLeadMinutes))?Number(prefs.taskNotificationLeadMinutes):0;
  return (p.tasks||[]).filter(t=>t.status==='pending'&&t.reminderEnabled!==false&&t.scheduledDate&&t.startTime).flatMap(t=>{
   const a=(p.activities||[]).find(x=>x.id===t.activityId&&!x.archived);
   if(prefs.taskNotificationScope==='high'&&t.priority!=='high'||prefs.taskNotificationScope==='activity'&&!a)return [];
   if(!/^\d{4}-\d{2}-\d{2}$/.test(t.scheduledDate)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(t.startTime))return [];
   const time=new Date(t.scheduledDate+'T'+t.startTime+':00').getTime()-lead*60000;
   if(!Number.isFinite(time)||time<now-60000)return [];
   return [{key:[p.id,t.id,t.scheduledDate,t.startTime].join(':'),taskId:t.id,profileId:p.id,scheduledDate:t.scheduledDate,time,title:String(a?.name||t.title).slice(0,100),body:String(t.title+' · '+t.startTime).slice(0,240),sound:prefs.taskNotificationSound!==false}];
  }).sort((a,b)=>a.time-b.time).slice(0,250);
 }
 return {reminders};
});
