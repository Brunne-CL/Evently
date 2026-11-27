package mx.edu.uteq.evently;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Guarda el evento confirmado más cercano para el widget de la pantalla de inicio.
 */
public final class WidgetDataStore {
    public static final String PREFS = "EventlyWidget";
    public static final String KEY_TITLE = "title";
    public static final String KEY_DATE = "date";
    public static final String KEY_TIME = "time";
    public static final String KEY_LOCATION = "location";
    public static final String KEY_HAS_EVENT = "has_event";

    private WidgetDataStore() {}

    public static SharedPreferences prefs(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static void save(
            Context context, String title, String date, String time, String location) {
        prefs(context)
                .edit()
                .putBoolean(KEY_HAS_EVENT, true)
                .putString(KEY_TITLE, title == null ? "" : title)
                .putString(KEY_DATE, date == null ? "" : date)
                .putString(KEY_TIME, time == null ? "" : time)
                .putString(KEY_LOCATION, location == null ? "" : location)
                .apply();
    }

    public static void clear(Context context) {
        prefs(context)
                .edit()
                .putBoolean(KEY_HAS_EVENT, false)
                .remove(KEY_TITLE)
                .remove(KEY_DATE)
                .remove(KEY_TIME)
                .remove(KEY_LOCATION)
                .apply();
    }
}
