package com.oisym.app;
import android.Manifest;
import android.app.*;
import android.content.*;
import android.os.*;
import android.provider.Settings;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import org.json.*;
import java.lang.ref.WeakReference;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
@CapacitorPlugin(name="OIsymNative",permissions={@Permission(alias="notifications",strings={Manifest.permission.POST_NOTIFICATIONS})})
public class OIsymNativePlugin extends Plugin {
 private static WeakReference<OIsymNativePlugin> instance=new WeakReference<>(null);
 @Override public void load(){instance=new WeakReference<>(this);AlarmScheduler.channels(getContext());}
 static void emitAudio(Context c){OIsymNativePlugin plugin=instance.get();if(plugin!=null)plugin.notifyListeners("audioState",FocusService.state(),true);}
 @Override protected void handleOnResume(){super.handleOnResume();notifyListeners("resumed",new JSObject());}
 private void fail(PluginCall call,Exception error){call.reject(error.getMessage(),error);}
 private JSObject statusValue(){
  boolean granted=Build.VERSION.SDK_INT<33||ContextCompat.checkSelfPermission(getContext(),Manifest.permission.POST_NOTIFICATIONS)==android.content.pm.PackageManager.PERMISSION_GRANTED;
  JSObject o=new JSObject();o.put("platform","android");o.put("supported",true);o.put("permission",granted?"granted":"denied");o.put("exactAlarms",AlarmScheduler.exact(getContext()));o.put("canManageLogin",false);o.put("launchAtLogin",false);return o;
 }
 @PluginMethod public void status(PluginCall call){call.resolve(statusValue());}
 @PluginMethod public void requestNotifications(PluginCall call){if(Build.VERSION.SDK_INT<33){call.resolve(statusValue());return;}requestPermissionForAlias("notifications",call,"notificationsResult");}
 @PermissionCallback private void notificationsResult(PluginCall call){call.resolve(statusValue());}
 @PluginMethod public void openExactSettings(PluginCall call){
  if(Build.VERSION.SDK_INT>=31)getActivity().startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,Uri.parse("package:"+getContext().getPackageName())));call.resolve();
 }
 @PluginMethod public void sendTest(PluginCall call){
  if(!"granted".equals(statusValue().getString("permission"))){call.reject("Activa los avisos desde el botón Android de O-Isym.");return;}
  AlarmScheduler.notify(getContext(),"test","Prueba de O-Isym","Las notificaciones están activadas.",true,null);call.resolve();
 }
 @PluginMethod public void read(PluginCall call){try{JSObject r=new JSObject();r.put("data",NativeStore.read(getContext()));call.resolve(r);}catch(Exception e){fail(call,e);}}
 @PluginMethod public void save(PluginCall call){try{String raw=call.getString("data");if(raw==null)throw new Exception("Faltan datos");JSObject r=new JSObject();r.put("data",NativeStore.save(getContext(),raw));call.resolve(r);}catch(Exception e){fail(call,e);}}
 @PluginMethod public void listBackups(PluginCall call){try{JSObject r=new JSObject();r.put("items",NativeStore.backups(getContext()));call.resolve(r);}catch(Exception e){fail(call,e);}}
 @PluginMethod public void overwrite(PluginCall call){try{JSObject r=new JSObject();r.put("backupName",NativeStore.overwrite(getContext()));call.resolve(r);}catch(Exception e){fail(call,e);}}
 @PluginMethod public void restore(PluginCall call){try{JSObject r=new JSObject();r.put("emergencyBackup",NativeStore.restore(getContext(),call.getString("name","")));call.resolve(r);}catch(Exception e){fail(call,e);}}
 @PluginMethod public void scheduleTasks(PluginCall call){try{AlarmScheduler.tasks(getContext(),call.getArray("items",new JSArray()));call.resolve();}catch(Exception e){fail(call,e);}}
 @PluginMethod public void scheduleFocus(PluginCall call){try{AlarmScheduler.focus(getContext(),new JSONObject(call.getData().toString()));call.resolve();}catch(Exception e){fail(call,e);}}
 @PluginMethod public void cancelFocus(PluginCall call){AlarmScheduler.cancelFocus(getContext());call.resolve();}
 @PluginMethod public void completeFocus(PluginCall call){AlarmScheduler.finish(getContext(),null);call.resolve();}
 @PluginMethod public void getAudioState(PluginCall call){call.resolve(FocusService.state());}\n @PluginMethod public void audio(PluginCall call){
  try{String action=call.getString("action","");Intent intent=new Intent(getContext(),FocusService.class).setAction(action).putExtra("payload",call.getData().toString());
   if(action.equals("music")||action.equals("preview")||action.equals("alarm"))ContextCompat.startForegroundService(getContext(),intent);
   else if(FocusService.running)getContext().startService(intent);
   call.resolve();
  }catch(Exception e){fail(call,e);}
 }
 @PluginMethod public void consumeOpenTask(PluginCall call){
  Intent i=getActivity().getIntent();String raw=i.getStringExtra("oisymReminder");JSObject result=new JSObject();
  if(raw!=null){try{result=new JSObject(raw);}catch(Exception ignored){}i.removeExtra("oisymReminder");}
  call.resolve(result);
 }
 @Override protected void handleOnNewIntent(Intent intent){
  super.handleOnNewIntent(intent);String raw=intent.getStringExtra("oisymReminder");
  if(raw!=null){try{notifyListeners("openTask",new JSObject(raw),true);intent.removeExtra("oisymReminder");}catch(Exception ignored){}}
 }
 @PluginMethod public void exportFile(PluginCall call){
  String name=call.getString("name","oisym.json").replaceAll("[^a-zA-Z0-9._-]","_");
  Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE,name);
  startActivityForResult(call,intent,"fileCreated");
 }
 @ActivityCallback private void fileCreated(PluginCall call,ActivityResult result){
  if(call==null)return;if(result.getResultCode()!=Activity.RESULT_OK||result.getData()==null){JSObject r=new JSObject();r.put("cancelled",true);call.resolve(r);return;}
  try(OutputStream out=getContext().getContentResolver().openOutputStream(result.getData().getData())){
   if(out==null)throw new Exception("No se pudo abrir el destino");out.write(call.getString("data","").getBytes(StandardCharsets.UTF_8));call.resolve();
  }catch(Exception e){fail(call,e);}
 }
}
