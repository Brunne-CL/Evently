import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'api/evently_api.dart';
import 'screens/dashboard_screen.dart';
import 'screens/splash_screen.dart';

/// `flutter run` → reloj
/// `flutter run -d chrome --dart-define=MODE=dashboard` → dashboard prácticas 7–8
const String kAppMode = String.fromEnvironment('MODE', defaultValue: 'watch');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('es_MX');
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);
  await EventlyApi.instance.loadSession();
  runApp(const EventlyWatchApp());
}

class EventlyWatchApp extends StatelessWidget {
  const EventlyWatchApp({super.key});

  @override
  Widget build(BuildContext context) {
    const isDashboard = kAppMode == 'dashboard';

    return MaterialApp(
      title: isDashboard ? 'Evently Dashboard' : 'Evently Watch',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: isDashboard ? Brightness.light : Brightness.dark,
        colorSchemeSeed: const Color(0xFF2F4A3C),
        scaffoldBackgroundColor: const Color(0xFFF6F5F2),
        useMaterial3: true,
      ),
      home: isDashboard ? const _DashboardLoader() : const SplashScreen(),
    );
  }
}

class _DashboardLoader extends StatefulWidget {
  const _DashboardLoader();

  @override
  State<_DashboardLoader> createState() => _DashboardLoaderState();
}

class _DashboardLoaderState extends State<_DashboardLoader> {
  int total = 0;
  int confirmed = 0;
  int favorites = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res = await EventlyApi.instance.events();
    if (!mounted || res['ok'] != true) return;
    final events = List<Map<String, dynamic>>.from(
      (res['events'] as List? ?? []).map((e) => Map<String, dynamic>.from(e as Map)),
    );
    setState(() {
      total = events.length;
      confirmed = events.where((e) => e['confirmed'] == true).length;
      favorites = events.where((e) => e['liked'] == true).length;
    });
  }

  @override
  Widget build(BuildContext context) {
    return DashboardScreen(
      totalEvents: total,
      confirmed: confirmed,
      favorites: favorites,
    );
  }
}
