package com.oisym.app;
import android.content.*;
public class BootReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c,Intent i){AlarmScheduler.restore(c,Intent.ACTION_BOOT_COMPLETED.equals(i.getAction()));}
}
