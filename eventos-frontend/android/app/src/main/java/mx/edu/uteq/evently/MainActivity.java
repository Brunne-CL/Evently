package mx.edu.uteq.evently;

import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

/**
 * Un enlace evently://login?qr=... abre esta app (no Chrome)
 * y carga la sesión dentro del WebView de Evently.
 */
public class MainActivity extends BridgeActivity {
    private static final String CODE_PATTERN = "[A-Za-z0-9_-]{20,128}";

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        openLoginInApp(intent);
    }

    private void openLoginInApp(Intent intent) {
        if (intent == null || intent.getData() == null) return;
        Uri data = intent.getData();
        if (data == null || !"evently".equals(data.getScheme())) return;

        String code = data.getQueryParameter("qr");
        if (code == null || !code.matches(CODE_PATTERN)) return;

        Bridge bridge = getBridge();
        if (bridge == null || bridge.getWebView() == null) return;

        String base = bridge.getServerUrl();
        if (base == null || base.isEmpty()) base = "http://34.200.232.137";
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);

        String target = base + "/?qr=" + Uri.encode(code);
        bridge.getWebView().post(() -> bridge.getWebView().loadUrl(target));
        intent.setData(null);
    }
}
