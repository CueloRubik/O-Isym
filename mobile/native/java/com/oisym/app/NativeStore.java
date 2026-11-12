package com.oisym.app;
import android.content.Context;
import android.util.AtomicFile;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
final class NativeStore {
 static final int LIMIT=5*1024*1024;
 static File file(Context c){return new File(c.getFilesDir(),"oisym-data.json");}
 static JSONObject validate(String raw)throws Exception{
  if(raw.getBytes(StandardCharsets.UTF_8).length>LIMIT)throw new IOException("Datos mayores de 5 MB");
  JSONObject s=new JSONObject(raw);if(s.optInt("schemaVersion")!=1)throw new IOException("OISYM_STORE_INVALID: versión de datos");
  JSONArray profiles=s.getJSONArray("profiles");if(profiles.length()>50)throw new IOException("OISYM_STORE_INVALID: perfiles");
  Set<String> ids=new HashSet<>();
  for(int i=0;i<profiles.length();i++){JSONObject p=profiles.getJSONObject(i);String id=p.getString("id");if(id.isEmpty()||!ids.add(id)||p.optString("name").trim().isEmpty())throw new IOException("OISYM_STORE_INVALID: perfil");}
  if(!s.isNull("activeProfileId")&&!ids.contains(s.optString("activeProfileId")))throw new IOException("OISYM_STORE_INVALID: perfil activo");
  return s;
 }
 static String readRaw(Context c)throws Exception{
  try(InputStream in=new AtomicFile(file(c)).openRead()){
   ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;
   while((n=in.read(b))!=-1){out.write(b,0,n);if(out.size()>LIMIT)throw new IOException("OISYM_STORE_INVALID: tamaño");}
   return out.toString("UTF-8");
  }
 }
 static String initial()throws Exception{
  String now=java.time.Instant.now().toString();
  return new JSONObject().put("schemaVersion",1).put("createdAt",now).put("updatedAt",now).put("activeProfileId",JSONObject.NULL).put("profiles",new JSONArray()).toString();
 }
 static synchronized String read(Context c)throws Exception{
  if(!file(c).exists()&&!new File(file(c)+".bak").exists()){String raw=initial();write(c,raw);return raw;}
  String raw=readRaw(c);JSONObject snapshot;
  try{snapshot=validate(raw);}catch(Exception e){throw new IOException("OISYM_STORE_INVALID: "+e.getMessage());}
  if(AlarmScheduler.prefs(c).getBoolean("focusInterrupted",false)){
   JSONArray profiles=snapshot.getJSONArray("profiles");String now=java.time.Instant.now().toString();
   for(int i=0;i<profiles.length();i++){JSONObject focus=profiles.getJSONObject(i).optJSONObject("activeFocus");if(focus!=null&&focus.isNull("pausedAt")){focus.put("pausedAt",now).put("startedAt",now);}}
   backup(c,"oisym-data");raw=snapshot.toString();write(c,raw);AlarmScheduler.prefs(c).edit().remove("focusInterrupted").commit();
  }
  return raw;
 }
 static void write(Context c,String raw)throws Exception{
  validate(raw);AtomicFile atomic=new AtomicFile(file(c));FileOutputStream out=null;
  try{out=atomic.startWrite();out.write(raw.getBytes(StandardCharsets.UTF_8));atomic.finishWrite(out);}
  catch(Exception e){atomic.failWrite(out);throw e;}
 }
 static String backup(Context c,String prefix)throws Exception{
  if(!file(c).exists())return null;
  File dir=new File(c.getFilesDir(),"backups");if(!dir.exists()&&!dir.mkdirs())throw new IOException("No se pudo crear el respaldo");
  String name=prefix+"-"+System.currentTimeMillis()+"-"+UUID.randomUUID()+".json";
  String raw=readRaw(c);
  try(FileOutputStream out=new FileOutputStream(new File(dir,name))){out.write(raw.getBytes(StandardCharsets.UTF_8));out.getFD().sync();}
  if(prefix.equals("oisym-data")){
   File[] files=dir.listFiles((d,n)->n.startsWith("oisym-data-")&&n.endsWith(".json"));
   if(files!=null){Arrays.sort(files,Comparator.comparing(File::getName).reversed());for(int i=5;i<files.length;i++)files[i].delete();}
  }
  return name;
 }
 static synchronized String save(Context c,String raw)throws Exception{
  validate(raw);if(file(c).exists()){try{validate(readRaw(c));}catch(Exception e){throw new IOException("OISYM_STORE_PROTECTED: usa recuperación antes de guardar");}backup(c,"oisym-data");}
  write(c,raw);return raw;
 }
 static synchronized JSONArray backups(Context c)throws Exception{
  JSONArray result=new JSONArray();File dir=new File(c.getFilesDir(),"backups");File[] files=dir.listFiles((d,n)->n.startsWith("oisym-data-")&&n.endsWith(".json"));if(files==null)return result;
  Arrays.sort(files,Comparator.comparing(File::getName).reversed());
  for(File item:files){try{String raw=new String(java.nio.file.Files.readAllBytes(item.toPath()),StandardCharsets.UTF_8);JSONObject s=validate(raw);result.put(new JSONObject().put("name",item.getName()).put("updatedAt",s.optString("updatedAt")).put("profiles",s.getJSONArray("profiles").length()));}catch(Exception ignored){}}
  return result;
 }
 static synchronized String overwrite(Context c)throws Exception{String name=backup(c,"oisym-recovery");write(c,initial());AlarmScheduler.cancelFocus(c);AlarmScheduler.tasks(c,new JSONArray());return name;}
 static synchronized String restore(Context c,String name)throws Exception{
  if(!name.matches("oisym-data-[a-zA-Z0-9.-]+\\.json"))throw new IOException("Copia no válida");
  String raw=new String(java.nio.file.Files.readAllBytes(new File(new File(c.getFilesDir(),"backups"),name).toPath()),StandardCharsets.UTF_8);validate(raw);
  String backup=backup(c,"oisym-recovery");write(c,raw);AlarmScheduler.cancelFocus(c);AlarmScheduler.tasks(c,new JSONArray());return backup;
 }
}
