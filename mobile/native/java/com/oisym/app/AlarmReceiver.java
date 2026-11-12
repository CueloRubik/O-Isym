package com.oisym.app;
import android.content.*;
public class AlarmReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c,Intent i){AlarmScheduler.fire(c,i.getStringExtra("key")==null?"":i.getStringExtra("key"));}
}
