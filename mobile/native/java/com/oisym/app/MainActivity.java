package com.oisym.app;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
 @Override public void onCreate(Bundle state) { registerPlugin(OIsymNativePlugin.class); super.onCreate(state); }
}
