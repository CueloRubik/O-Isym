'use strict';
const fs=require('node:fs');
const path=require('node:path');
function installAndroidIcon(root,target){
 const source=path.join(root,'assets','icons','app.png');
 if(!fs.existsSync(source))throw Error('Falta assets/icons/app.png: es la única imagen del ícono de O-Isym.');
 const destination=path.join(target,'res','drawable-nodpi','oisym_app_icon.png');
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 fs.copyFileSync(source,destination);
 return destination;
}
module.exports={installAndroidIcon};
