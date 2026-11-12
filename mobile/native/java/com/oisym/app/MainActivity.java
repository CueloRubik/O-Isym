package com.oisym.app;
import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
 @Override public void onCreate(Bundle state) {
  registerPlugin(OIsymNativePlugin.class);
  super.onCreate(state);
  getOnBackPressedDispatcher().addCallback(this,new OnBackPressedCallback(true) {
   @Override public void handleOnBackPressed() {
    if(getBridge()==null||getBridge().getWebView()==null){moveTaskToBack(true);return;}
    getBridge().getWebView().evaluateJavascript(
     "(function(){return !window.dispatchEvent(new CustomEvent('oisym:android-back',{cancelable:true}));})()",
     handled->{if(!"true".equals(handled))moveTaskToBack(true);}
    );
   }
  });
 }
}
