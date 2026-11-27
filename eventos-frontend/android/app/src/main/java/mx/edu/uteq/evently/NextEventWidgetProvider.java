package mx.edu.uteq.evently;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

/**
 * Widget de información: el evento confirmado más próximo, sin botones ni lista.
 */
public class NextEventWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateWidget(context, manager, id);
        }
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids =
                manager.getAppWidgetIds(new ComponentName(context, NextEventWidgetProvider.class));
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_next_event);
        SharedPreferences prefs = WidgetDataStore.prefs(context);
        boolean hasEvent = prefs.getBoolean(WidgetDataStore.KEY_HAS_EVENT, false);

        if (hasEvent) {
            String title = prefs.getString(WidgetDataStore.KEY_TITLE, "");
            String date = prefs.getString(WidgetDataStore.KEY_DATE, "");
            String time = prefs.getString(WidgetDataStore.KEY_TIME, "");
            String location = prefs.getString(WidgetDataStore.KEY_LOCATION, "");
            String when = joinWhen(date, time);

            views.setTextViewText(R.id.widget_label, context.getString(R.string.widget_label));
            views.setTextViewText(R.id.widget_title, title);
            views.setTextViewText(R.id.widget_when, when);
            views.setTextViewText(R.id.widget_where, location);
            views.setViewVisibility(R.id.widget_meta, View.VISIBLE);
        } else {
            views.setTextViewText(R.id.widget_label, context.getString(R.string.widget_label));
            views.setTextViewText(R.id.widget_title, context.getString(R.string.widget_empty_title));
            views.setViewVisibility(R.id.widget_meta, View.GONE);
        }

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pending =
                PendingIntent.getActivity(
                        context,
                        appWidgetId,
                        open,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, pending);

        manager.updateAppWidget(appWidgetId, views);
    }

    private static String joinWhen(String date, String time) {
        String d = date == null ? "" : date.trim();
        String t = time == null ? "" : time.trim();
        if (!d.isEmpty() && !t.isEmpty()) return d + " · " + t;
        if (!d.isEmpty()) return d;
        return t;
    }
}
