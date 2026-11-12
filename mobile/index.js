import {Capacitor,registerPlugin} from '@capacitor/core';
import {createAndroidBridge} from './bridge.js';
import './ui.js';
if(Capacitor.getPlatform()==='android'){
 const native=registerPlugin('OIsymNative');
 window.oisym=createAndroidBridge(native,window.OIsymDomain,window.OIsymAndroidReminders);
 document.documentElement.classList.add('oisym-android');
}
