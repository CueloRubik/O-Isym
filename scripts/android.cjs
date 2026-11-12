'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root=path.resolve(__dirname,'..'), mobile=path.join(root,'mobile');
const mode=process.argv[2]||'debug';
function run(exe,args,cwd=mobile){
 const result=spawnSync(exe,args,{cwd,stdio:'inherit',env:process.env});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
}
function node(script,args=[]){run(process.execPath,[script,...args]);}
function javaHome(){
 const roots=process.platform==='win32'
  ? [path.join(process.env.ProgramFiles||'C:/Program Files','Eclipse Adoptium'),path.join(process.env.LOCALAPPDATA||'','Programs','Eclipse Adoptium')]
  : [];
 const candidates=[process.env.JAVA_HOME];
 for(const directory of roots)if(fs.existsSync(directory))for(const item of fs.readdirSync(directory))if(item.startsWith('jdk-21'))candidates.push(path.join(directory,item));
 if(process.platform==='win32')candidates.push(path.join(process.env.ProgramFiles||'C:/Program Files','Android','Android Studio','jbr'));
 for(const candidate of candidates.filter(Boolean)){
  const executable=path.join(candidate,'bin',process.platform==='win32'?'java.exe':'java');
  if(!fs.existsSync(executable))continue;
  const check=spawnSync(executable,['-version'],{encoding:'utf8'});
  const match=((check.stderr||'')+(check.stdout||'')).match(/version "([0-9]+)/);
  if(match && Number(match[1])===21){process.env.JAVA_HOME=candidate;return true;}
 }
 if(process.platform!=='win32'){
  const check=spawnSync('java',['-version'],{encoding:'utf8'});
  if(/version "21[."]/.test((check.stderr||'')+(check.stdout||'')))return true;
 }
 return false;
}
function copy(from,to){fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);}
async function buildWeb(){
 const out=path.join(root,'build','android-web');
 fs.mkdirSync(out,{recursive:true});
 for(const directory of ['src','assets'])if(fs.existsSync(path.join(root,directory)))fs.cpSync(path.join(root,directory),path.join(out,directory),{recursive:true});
 const esbuild=require(path.join(mobile,'node_modules','esbuild'));
 await esbuild.build({entryPoints:[path.join(mobile,'index.js')],bundle:true,format:'iife',target:'chrome89',outfile:path.join(out,'android-bridge.js')});
 let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 html=html.replace('width=device-width, initial-scale=1','width=device-width, initial-scale=1, viewport-fit=cover');
 html=html.replace("connect-src 'none'","connect-src 'self'");
 html=html.replace('</head>','<link rel="stylesheet" href="src/styles/mobile.css"></head>');
 html=html.replace('<script src="src/focus-audio.js"></script>','<script src="android-bridge.js"></script>\n  <script src="src/focus-audio.js"></script>');
 fs.writeFileSync(path.join(out,'index.html'),html);
 fs.writeFileSync(path.join(out,'android-alarm-tones.json'),JSON.stringify(Object.fromEntries(['clock','digital','funny','ringtone1','ringtone2','ringtone3','ringtone4','ringtone5','ringtone6','tititi'].map(id=>[id,id+'.mp3']))));
 console.log('Android web assets: '+out);
}
function installNative(){
 const target=path.join(mobile,'android','app','src','main');
 fs.cpSync(path.join(mobile,'native'),target,{recursive:true});
 const variables=path.join(mobile,'android','variables.gradle');
 fs.writeFileSync(variables,fs.readFileSync(variables,'utf8').replace(/minSdkVersion\s*=\s*\d+/,'minSdkVersion = 26'));
 const appGradle=path.join(mobile,'android','app','build.gradle');
 let gradle=fs.readFileSync(appGradle,'utf8');
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
  gradle=gradle.replace(/versionCode\s*(?:=\s*)?\d+/,'versionCode 11002').replace(/versionName\s*(?:=\s*)?"[^"]+"/,'versionName "'+version+'"');
 fs.writeFileSync(appGradle,gradle);
}
(async()=>{
 if(!['web','sync','open','debug','install','doctor'].includes(mode))throw Error('Modo Android desconocido.');
 const javaReady=javaHome();
 if(mode==='doctor'){
  console.log('Node: '+process.version);
  console.log('Java 21: '+(javaReady?(process.env.JAVA_HOME||'disponible en PATH'):'no encontrado; instala Temurin 21 antes de compilar'));
  console.log('SDK: '+(process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT||(process.env.LOCALAPPDATA?path.join(process.env.LOCALAPPDATA,'Android','Sdk'):'sin configurar')));
  console.log('Capacitor: '+(fs.existsSync(path.join(mobile,'node_modules','@capacitor','cli'))?'instalado':'ejecuta npm.cmd --prefix mobile install'));
  return;
 }
 if(!javaReady&&mode!=='web')throw Error('Se necesita JDK 21. En Windows instala EclipseAdoptium.Temurin.21.JDK y vuelve a ejecutar el comando. El JBR 25 de Android Studio no es compatible con este Gradle.');
 await buildWeb();if(mode==='web')return;
 const cli=path.join(mobile,'node_modules','@capacitor','cli','bin','capacitor');
 if(!fs.existsSync(path.join(mobile,'android','gradlew')))node(cli,['add','android']);
 installNative();node(cli,['sync','android']);
 const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT||(process.env.LOCALAPPDATA?path.join(process.env.LOCALAPPDATA,'Android','Sdk'):null);
 if(sdk && fs.existsSync(sdk))fs.writeFileSync(path.join(mobile,'android','local.properties'),'sdk.dir='+sdk.replace(/\\/g,'/')+'\n');
 if(mode==='sync')return;
 if(mode==='open'){node(cli,['open','android']);return;}
 const android=path.join(mobile,'android');
 if(process.platform==='win32')run(process.env.ComSpec||'cmd.exe',['/d','/c','gradlew.bat',mode==='install'?'installDebug':'assembleDebug','--console=plain'],android);
 else run('sh',['gradlew',mode==='install'?'installDebug':'assembleDebug','--console=plain'],android);
 const apk=path.join(android,'app','build','outputs','apk','debug','app-debug.apk');
 if(fs.existsSync(apk)){const dest=path.join(root,'dist-android','O-Isym-'+JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version+'-Android-debug.apk');copy(apk,dest);console.log('APK: '+dest);}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
