package com.oisym.app;
import android.app.*;
import android.content.*;
import android.media.*;
import android.media.session.*;
import android.os.*;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import org.json.*;
import java.io.*;
public class FocusService extends Service implements AudioManager.OnAudioFocusChangeListener {
 static volatile boolean running=false;
 private static volatile boolean musicPlaying=false,previewPlaying=false,alarmPlaying=false;
 private MediaPlayer music,preview,alarm;private MediaSession session;private AudioManager audioManager;
 private final Handler handler=new Handler(Looper.getMainLooper());
 private float musicVolume=.35f,alarmVolume=.7f;private String musicSrc="";private long alarmGeneration=0;
 private PowerManager.WakeLock alarmLock;
 private final Runnable previewEnd=()->stopPreview();
 private final BroadcastReceiver noisy=new BroadcastReceiver(){public void onReceive(Context c,Intent i){stopMusic();stopPreview();update();}};
 static JSObject state(){JSObject s=new JSObject();s.put("musicPlaying",musicPlaying);s.put("previewPlaying",previewPlaying);s.put("alarmPlaying",alarmPlaying);return s;}
 @Override public void onCreate(){
  super.onCreate();running=true;AlarmScheduler.channels(this);audioManager=(AudioManager)getSystemService(AUDIO_SERVICE);
  session=new MediaSession(this,"O-Isym Focus");session.setCallback(new MediaSession.Callback(){
   @Override public void onPause(){if(music!=null){music.pause();musicPlaying=false;update();}}
   @Override public void onPlay(){if(music!=null){music.start();musicPlaying=true;update();}}
   @Override public void onStop(){stopAll();update();}
  });session.setActive(true);
  ContextCompat.registerReceiver(this,noisy,new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY),ContextCompat.RECEIVER_NOT_EXPORTED);
 }
 @Override public IBinder onBind(Intent i){return null;}
 private PendingIntent command(String action){Intent i=new Intent(this,FocusService.class).setAction(action);return PendingIntent.getService(this,action.hashCode(),i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 private Notification notification(){
  String title=alarmPlaying?"Focus terminado":previewPlaying?"Vista previa":"Música de Focus";
  return new Notification.Builder(this,"playback").setSmallIcon(R.drawable.ic_stat_oisym).setContentTitle(title).setContentText("O-Isym · El temporizador conserva su estado").setOngoing(true).setContentIntent(AlarmScheduler.open(this,"focus",null)).addAction(new Notification.Action.Builder(R.drawable.ic_stat_oisym,alarmPlaying?"Detener alarma":"Detener audio",command("stopAll")).build()).setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken())).build();
 }
 private void foreground(){startForeground(201,notification());}
 @Override public int onStartCommand(Intent intent,int flags,int startId){
  if(intent==null){stopSelf();return START_NOT_STICKY;}
  foreground();
  String action=intent.getAction()==null?"":intent.getAction();
  try{
   JSONObject p=new JSONObject(intent.getStringExtra("payload")==null?"{}":intent.getStringExtra("payload"));
   switch(action){
    case "music":
     if(!activeSession())break;
     stopPreview();String src=p.getString("src");musicVolume=(float)p.optDouble("volume",.35);
     if(music!=null&&src.equals(musicSrc)){music.setVolume(musicVolume,musicVolume);if(!musicPlaying){music.start();musicPlaying=true;}break;}
     stopMusic();musicSrc=src;music=player(src,musicVolume,true,false);musicPlaying=true;break;
    case "preview":stopPreview();preview=player(p.getString("src"),(float)p.optDouble("volume",.35),false,false);previewPlaying=true;preview.setOnCompletionListener(mp->{stopPreview();update();});handler.postDelayed(previewEnd,Math.min(20000,p.optLong("durationMs",20000)));break;
    case "alarm":startAlarm(p.getString("src"),p);break;
    case "finish":
     stopMusic();stopPreview();
     if(p.optBoolean("alarmEnabled",true)&&!p.optBoolean("isBreak",false)){
      String tone=p.optString("alarmTone","clock");startAlarm("assets/audio/alarms/"+toneFile(tone),p);
     }break;
    case "stopMusic":stopMusic();break;
    case "stopPreview":stopPreview();break;
    case "stopAlarm":stopAlarm();break;
    case "stopAll":stopAll();break;
    case "volume":musicVolume=(float)p.optDouble("volume",.35);if(music!=null)music.setVolume(musicVolume,musicVolume);if(preview!=null)preview.setVolume(musicVolume,musicVolume);break;
    case "alarmVolume":alarmVolume=(float)p.optDouble("volume",.7);if(alarm!=null)alarm.setVolume(alarmVolume,alarmVolume);break;
   }
  }catch(Exception error){stopAll();}
  update();return START_NOT_STICKY;
 }
 private boolean activeSession(){
  try{JSONObject f=new JSONObject(AlarmScheduler.prefs(this).getString("focus","{}"));return f.has("dueElapsed")&&f.getLong("dueElapsed")>SystemClock.elapsedRealtime();}catch(Exception e){return false;}
 }
 private String toneFile(String tone){
  // Names are synchronized with the packaged alarm manifest during the web build.
  try(InputStream in=getAssets().open("public/android-alarm-tones.json")){
   ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[1024];int n;while((n=in.read(b))>0)out.write(b,0,n);
   return new JSONObject(out.toString("UTF-8")).optString(tone,"clock.mp3");
  }catch(Exception e){return "clock.mp3";}
 }
 private MediaPlayer player(String src,float volume,boolean loop,boolean isAlarm)throws Exception{
  if(!src.matches("assets/audio/(music|alarms)/[a-zA-Z0-9_.-]+"))throw new IOException("Ruta de audio no válida");
  AudioAttributes attributes=new AudioAttributes.Builder().setUsage(isAlarm?AudioAttributes.USAGE_ALARM:AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build();
  int focus=audioManager.requestAudioFocus(this,AudioManager.STREAM_MUSIC,isAlarm?AudioManager.AUDIOFOCUS_GAIN_TRANSIENT:AudioManager.AUDIOFOCUS_GAIN);
  if(focus!=AudioManager.AUDIOFOCUS_REQUEST_GRANTED)throw new IOException("Audio no disponible");
  MediaPlayer p=new MediaPlayer();p.setAudioAttributes(attributes);p.setWakeMode(this,PowerManager.PARTIAL_WAKE_LOCK);
  try(android.content.res.AssetFileDescriptor afd=getAssets().openFd("public/"+src)){p.setDataSource(afd.getFileDescriptor(),afd.getStartOffset(),afd.getLength());}
  catch(Exception compressed){
   File temp=new File(getCacheDir(),"audio-"+Integer.toHexString(src.hashCode()));
   try(InputStream in=getAssets().open("public/"+src);FileOutputStream out=new FileOutputStream(temp)){byte[] b=new byte[8192];int n;while((n=in.read(b))>0)out.write(b,0,n);}
   p.setDataSource(temp.getAbsolutePath());
  }
  p.setVolume(Math.max(0,Math.min(1,volume)),Math.max(0,Math.min(1,volume)));p.setLooping(loop);
  p.setOnErrorListener((mp,what,extra)->{stopAll();update();return true;});
  p.prepare();p.start();return p;
 }
 private void startAlarm(String src,JSONObject p)throws Exception{
  stopAlarm();stopMusic();stopPreview();alarmVolume=(float)p.optDouble("volume",.7);if(alarmVolume<=0)return;
  int count=Math.max(1,Math.min(10,p.optInt("plays",3))),gap=Math.max(1,Math.min(15,p.optInt("intervalSeconds",2)))*1000,max=Math.max(5,Math.min(120,p.optInt("maxSeconds",30)))*1000;
  long generation=alarmGeneration;alarmPlaying=true;
  alarmLock=((PowerManager)getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"O-Isym:alarm");alarmLock.acquire(max+1000L);
  handler.postDelayed(()->{if(generation==alarmGeneration){stopAlarm();update();}},max);
  repeat(src,count,gap,generation);
 }
 private void repeat(String src,int remaining,int gap,long generation){
  if(generation!=alarmGeneration||!alarmPlaying)return;
  try{
   release(alarm);alarm=player(src,alarmVolume,false,true);
   alarm.setOnCompletionListener(mp->{release(alarm);alarm=null;if(remaining<=1){stopAlarm();update();}else handler.postDelayed(()->repeat(src,remaining-1,gap,generation),gap);});
  }catch(Exception e){stopAlarm();update();}
 }
 private void release(MediaPlayer p){if(p!=null){try{p.setOnCompletionListener(null);p.stop();}catch(Exception ignored){}p.release();}}
 private void stopMusic(){release(music);music=null;musicSrc="";musicPlaying=false;}
 private void stopPreview(){handler.removeCallbacks(previewEnd);release(preview);preview=null;previewPlaying=false;}
 private void stopAlarm(){alarmGeneration++;release(alarm);alarm=null;alarmPlaying=false;if(alarmLock!=null&&alarmLock.isHeld())alarmLock.release();alarmLock=null;}
 private void stopAll(){stopMusic();stopPreview();stopAlarm();}
 private void update(){
  OIsymNativePlugin.emitAudio(this);
  long actions=PlaybackState.ACTION_PLAY|PlaybackState.ACTION_PAUSE|PlaybackState.ACTION_STOP;
  session.setPlaybackState(new PlaybackState.Builder().setActions(actions).setState(musicPlaying||previewPlaying||alarmPlaying?PlaybackState.STATE_PLAYING:PlaybackState.STATE_PAUSED,PlaybackState.PLAYBACK_POSITION_UNKNOWN,1).build());
  if(musicPlaying||previewPlaying||alarmPlaying)foreground();
  else if(music==null){audioManager.abandonAudioFocus(this);stopForeground(STOP_FOREGROUND_REMOVE);stopSelf();}
  else foreground();
 }
 @Override public void onAudioFocusChange(int change){
  if(change==AudioManager.AUDIOFOCUS_LOSS){stopAll();update();}
  else if(change==AudioManager.AUDIOFOCUS_LOSS_TRANSIENT){if(music!=null){music.pause();musicPlaying=false;}stopPreview();stopAlarm();update();}
  else if(change==AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK&&music!=null)music.setVolume(musicVolume*.2f,musicVolume*.2f);
  else if(change==AudioManager.AUDIOFOCUS_GAIN&&music!=null)music.setVolume(musicVolume,musicVolume);
 }
 @Override public void onDestroy(){stopAll();handler.removeCallbacksAndMessages(null);if(audioManager!=null)audioManager.abandonAudioFocus(this);try{unregisterReceiver(noisy);}catch(Exception ignored){}if(session!=null)session.release();running=false;OIsymNativePlugin.emitAudio(this);super.onDestroy();}
}
