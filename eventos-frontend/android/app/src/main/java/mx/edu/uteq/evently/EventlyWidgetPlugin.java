package mx.edu.uteq.evently;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * La web guarda el próximo evento confirmado y refresca el widget al instante.
 */
@CapacitorPlugin(name = "EventlyWidget")
public class EventlyWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateNextEvent(PluginCall call) {
        Boolean clear = call.getBoolean("clear", false);
        if (Boolean.TRUE.equals(clear)) {
            WidgetDataStore.clear(getContext());
            NextEventWidgetProvider.updateAll(getContext());
            JSObject result = new JSObject();
            result.put("ok", true);
            call.resolve(result);
            return;
        }

        String title = call.getString("title", "");
        if (title == null || title.trim().isEmpty()) {
            call.reject("Falta el título del evento.");
            return;
        }

        WidgetDataStore.save(
                getContext(),
                title.trim(),
                call.getString("date", ""),
                call.getString("time", ""),
                call.getString("location", ""));
        NextEventWidgetProvider.updateAll(getContext());

        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }
}
