package com.oisym.app;
import android.app.*;
import android.content.*;
import android.os.*;
import android.net.Uri;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import org.json.*;
import java.util.*;
final class AlarmScheduler {
 static android.content.SharedPreferences prefs(Context c){return c.getSharedPreferences("oisym-native",Context.MODE_PRIVATE);}
 static AlarmManager manager(Context c){return (AlarmManager)c.getSystemService(Context.ALARM_SERVICE);}
 static boolean exact(Context c){return Build.VERSION.SDK_INT<31||manager(c).canScheduleExactAlarms();}
 static void channels(Context c){
  NotificationManager n=c.getSystemService(NotificationManager.class);
  for(String id:new String[]{"tasks","tasks-silent","focus","focus-silent","playback"}){
   NotificationChannel ch=new NotificationChannel(id,id.startsWith("tasks")?"Tareas":id.equals("playback")?"Audio de Focus":"Fin de Focus",id.equals("playback")?NotificationManager.IMPORTANCE_LOW:NotificationManager.IMPORTANCE_HIGH);
   if(id.endsWith("silent")||id.equals("playback"))ch.setSound(null,null);
   n.createNotificationChannel(ch);
  }
 }
 static PendingIntent alarmIntent(Context c,String key){
  Intent i=new Intent(c,AlarmReceiver.class).setData(Uri.parse("oisym://alarm/"+Uri.encode(key))).putExtra("key",key);
  return PendingIntent.getBroadcast(c,key.hashCode(),i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
 }
 static void schedule(Context c,String key,long time,boolean elapsed){
  AlarmManager a=manager(c);int type=elapsed?AlarmManager.ELAPSED_REALTIME_WAKEUP:AlarmManager.RTC_WAKEUP;
  PendingIntent p=alarmIntent(c,key);
  if(exact(c))a.setExactAndAllowWhileIdle(type,Math.max(1,time),p);else a.setAndAllowWhileIdle(type,Math.max(1,time),p);
 }
 static PendingIntent open(Context c,String key,JSONObject payload){
  Intent i=new Intent(c,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
  if(payload!=null)i.putExtra("oisymReminder",payload.toString());
  i.setData(Uri.parse("oisym://open/"+Uri.encode(key)));
  return PendingIntent.getActivity(c,key.hashCode(),i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
 }
 static boolean notify(Context c,String key,String title,String body,boolean sound,JSONObject payload){
  channels(c);
  if(Build.VERSION.SDK_INT>=33&&ContextCompat.checkSelfPermission(c,android.Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED)return false;
  String channel=key.startsWith("focus")?"focus":"tasks";
  NotificationCompat.Builder b=new NotificationCompat.Builder(c,channel+(sound?"":"-silent")).setSmallIcon(R.drawable.ic_stat_oisym).setContentTitle(title).setContentText(body).setStyle(new NotificationCompat.BigTextStyle().bigText(body)).setAutoCancel(true).setContentIntent(open(c,key,payload));
  c.getSystemService(NotificationManager.class).notify(key,1,b.build());return true;
 }
 static synchronized void tasks(Context c,JSONArray items)throws Exception{
  JSONArray old=new JSONArray(prefs(c).getString("tasks","[]"));
  for(int i=0;i<old.length();i++)manager(c).cancel(alarmIntent(c,"task:"+old.getJSONObject(i).getString("key")));
  JSONArray next=new JSONArray();JSONObject sent=new JSONObject(prefs(c).getString("sent","{}"));
  for(int i=0;i<items.length()&&i<250;i++){JSONObject item=items.getJSONObject(i);if(!sent.has(item.getString("key")))next.put(item);}
  if(!prefs(c).edit().putString("tasks",next.toString()).commit())throw new Exception("No se pudo guardar la programación");
  for(int i=0;i<next.length();i++){JSONObject item=next.getJSONObject(i);schedule(c,"task:"+item.getString("key"),item.getLong("time"),false);}
 }
 static synchronized void focus(Context c,JSONObject item)throws Exception{
  String token=item.getString("sessionId")+":"+item.getString("endsAt");
  JSONObject previous=new JSONObject(prefs(c).getString("focus","{}"));
  if(token.equals(prefs(c).getString("focusDone",""))||token.equals(previous.optString("token")))return;
  manager(c).cancel(alarmIntent(c,"focus"));
  long at=java.time.Instant.parse(item.getString("endsAt")).toEpochMilli();
  item.put("token",token).put("dueElapsed",SystemClock.elapsedRealtime()+Math.max(0,at-System.currentTimeMillis()));
  if(!prefs(c).edit().putString("focus",item.toString()).commit())throw new Exception("No se pudo guardar Focus");
  schedule(c,"focus",item.getLong("dueElapsed"),true);
 }
 static synchronized void cancelFocus(Context c){
  manager(c).cancel(alarmIntent(c,"focus"));prefs(c).edit().remove("focus").commit();
 }
 static synchronized void finish(Context c,String token){
  try{
   JSONObject focus=new JSONObject(prefs(c).getString("focus","{}"));
   if(!focus.has("token")||token!=null&&!token.equals(focus.getString("token")))return;
   if(focus.getLong("dueElapsed")>SystemClock.elapsedRealtime()+100)return;
   String key=focus.getString("token");
   if(key.equals(prefs(c).getString("focusDone","")))return;
   if(!prefs(c).edit().putString("focusDone",key).remove("focus").commit())return;
   manager(c).cancel(alarmIntent(c,"focus"));
   boolean wantsSound=focus.optBoolean("alarmEnabled",true)&&focus.optDouble("volume",0.7)>0;
   boolean nativeAudio=false;
   try{
    if(FocusService.running||wantsSound){Intent i=new Intent(c,FocusService.class).setAction("finish").putExtra("payload",focus.toString());
     if(wantsSound)ContextCompat.startForegroundService(c,i);else c.startService(i);nativeAudio=true;}
   }catch(Exception ignored){}
   if(focus.optBoolean("notificationsEnabled",true))notify(c,"focus:"+key,focus.optBoolean("isBreak")?"Descanso terminado":"Focus terminado",focus.optString("taskTitle","Terminaste tu sesión"),!nativeAudio&&wantsSound,null);
  }catch(Exception ignored){}
 }
 static synchronized void fire(Context c,String key){
  if(key.equals("focus")){finish(c,null);return;}
  try{
   JSONArray items=new JSONArray(prefs(c).getString("tasks","[]"));JSONObject sent=new JSONObject(prefs(c).getString("sent","{}"));
   for(int i=0;i<items.length();i++){
    JSONObject item=items.getJSONObject(i);String id=item.getString("key");
    if(!key.equals("task:"+id)||sent.has(id))continue;
    if(item.getLong("time")>System.currentTimeMillis()+1000)return;
    if(System.currentTimeMillis()-item.getLong("time")>12*60*60*1000L)return;
    if(notify(c,key,item.optString("title","O-Isym"),item.optString("body",""),item.optBoolean("sound",true),item)){
     sent.put(id,System.currentTimeMillis());
     if(sent.length()>500){Iterator<String> it=sent.keys();while(sent.length()>500&&it.hasNext())sent.remove(it.next());}
     prefs(c).edit().putString("sent",sent.toString()).commit();
    }
   }
  }catch(Exception ignored){}
 }
 static void restore(Context c,boolean boot){
  try{
   if(boot){prefs(c).edit().putBoolean("focusInterrupted",prefs(c).contains("focus")).remove("focus").commit();}
   JSONArray items=new JSONArray(prefs(c).getString("tasks","[]"));
   for(int i=0;i<items.length();i++){JSONObject item=items.getJSONObject(i);if(item.optLong("time")>System.currentTimeMillis())schedule(c,"task:"+item.getString("key"),item.getLong("time"),false);}
   if(!boot){JSONObject focus=new JSONObject(prefs(c).getString("focus","{}"));if(focus.has("dueElapsed"))schedule(c,"focus",focus.getLong("dueElapsed"),true);}
  }catch(Exception ignored){}
 }
}
