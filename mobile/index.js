import {Capacitor,registerPlugin} from '@capacitor/core';
import {createAndroidBridge} from './bridge.js';
import './color-math.js';
import './color-picker.js';
import './screens.js';
import './ui.js';
if(Capacitor.getPlatform()==='android'){
 const native=registerPlugin('OIsymNative');
 window.oisym=createAndroidBridge(native,window.OIsymDomain,window.OIsymAndroidReminders);
 document.documentElement.classList.add('oisym-android');
}
