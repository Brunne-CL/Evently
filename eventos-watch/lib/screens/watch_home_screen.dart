import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api/evently_api.dart';
import '../widgets/stats_widget.dart';
import '../widgets/watch_shell.dart';
import 'event_detail_screen.dart';
import 'login_screen.dart';

/// Normaliza la respuesta de eventos (ES o EN) a un mapa estable.
Map<String, dynamic> normalizeWatchEvent(
  Map<String, dynamic> raw, {
  bool? confirmed,
}) {
  String clean(dynamic value) {
    return (value ?? '')
        .toString()
        .replaceAll('┬À', ' - ')
        .replaceAll('Â·', ' - ')
        .replaceAll('·', ' - ')
        .replaceAll(RegExp(r'\s+-\s+'), ' - ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  final title = clean(raw['title'] ?? raw['titulo']);
  final location = clean(raw['location'] ?? raw['ubicacion']);

  String date = (raw['date'] ?? '').toString().trim();
  String time = (raw['time'] ?? '').toString().trim();

  final startsAt = raw['fecha_inicio'] ?? raw['startsAt'];
  if ((date.isEmpty || time.isEmpty) && startsAt != null) {
    final parsed = DateTime.tryParse(startsAt.toString())?.toLocal();
    if (parsed != null) {
      if (date.isEmpty) {
        date = DateFormat('d MMM yyyy', 'es_MX').format(parsed);
      }
      if (time.isEmpty) {
        time = DateFormat('HH:mm').format(parsed);
      }
    }
  }

  final isConfirmed = confirmed ??
      (raw['confirmed'] == true ||
          raw['estado']?.toString().toLowerCase() == 'confirmada');

  return {
    ...raw,
    'id': raw['id'],
    'title': title.isEmpty ? 'Evento' : title,
    'location': location.isEmpty ? 'Sin dirección' : location,
    'date': date,
    'time': time.isEmpty ? '—' : time,
    'confirmed': isConfirmed,
  };
}

class WatchHomeScreen extends StatefulWidget {
  const WatchHomeScreen({super.key});

  @override
  State<WatchHomeScreen> createState() => _WatchHomeScreenState();
}

class _WatchHomeScreenState extends State<WatchHomeScreen> {
  final _api = EventlyApi.instance;
  List<Map<String, dynamic>> _mine = [];
  List<Map<String, dynamic>> _latest = [];
  int _catalogTotal = 0;
  bool _loading = true;
  String? _error;
  int _tab = 0; // 0 = mis eventos, 1 = eventos
  late Timer _clock;
  DateTime _now = DateTime.now();
  Duration _clockSkew = Duration.zero;
  bool _sessionGateOk = false;

  @override
  void initState() {
    super.initState();
    if (!EventlyApi.instance.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      });
      return;
    }
    _sessionGateOk = true;
    _clock = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = _mexicoNow());
    });
    _load();
  }

  @override
  void dispose() {
    if (_sessionGateOk) _clock.cancel();
    super.dispose();
  }

  /// Hora de Ciudad de México (UTC-6, sin DST).
  DateTime _mexicoNow() {
    return DateTime.now().toUtc().add(_clockSkew).subtract(const Duration(hours: 6));
  }

  Future<void> _syncClock() async {
    try {
      final health = await _api.health();
      final raw = health['time']?.toString();
      if (raw == null || raw.isEmpty) return;
      final serverUtc = DateTime.parse(raw).toUtc();
      _clockSkew = serverUtc.difference(DateTime.now().toUtc());
    } catch (_) {
      /* si falla, usamos el reloj del dispositivo */
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    await _syncClock();

    final results = await Future.wait([
      _api.misEventos(),
      _api.events(),
    ]);
    if (!mounted) return;

    final mineRes = results[0];
    final catalogRes = results[1];

    if (mineRes['ok'] != true && catalogRes['ok'] != true) {
      setState(() {
        _loading = false;
        _error = mineRes['error']?.toString() ??
            catalogRes['error']?.toString() ??
            'Error al cargar';
        _now = _mexicoNow();
      });
      return;
    }

    final mineRaw =
        (mineRes['events'] as List?) ?? (mineRes['eventos'] as List?) ?? [];
    final mine = mineRaw
        .map(
          (e) => normalizeWatchEvent(
            Map<String, dynamic>.from(e as Map),
            confirmed: true,
          ),
        )
        .toList();

    final catalogRaw = (catalogRes['events'] as List?) ?? [];
    final catalog = catalogRaw
        .map(
          (e) => normalizeWatchEvent(
            Map<String, dynamic>.from(e as Map),
            confirmed: false,
          ),
        )
        .toList();

    // Últimos 5 publicados: id más alto = más reciente
    catalog.sort((a, b) {
      final ai = int.tryParse('${a['id']}') ?? 0;
      final bi = int.tryParse('${b['id']}') ?? 0;
      return bi.compareTo(ai);
    });
    final latest = catalog.take(5).toList();

    // Marcar confirmados en el catálogo si también están en "mis eventos"
    final mineIds = mine.map((e) => e['id']).toSet();
    for (final ev in latest) {
      if (mineIds.contains(ev['id'])) {
        ev['confirmed'] = true;
      }
    }

    setState(() {
      _mine = mine;
      _latest = latest;
      _catalogTotal = catalog.length;
      _loading = false;
      _error = null;
      _now = _mexicoNow();
    });
  }

  Future<void> _logout() async {
    await _api.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  List<Map<String, dynamic>> get _visible => _tab == 0 ? _mine : _latest;

  String get _emptyMessage => _tab == 0
      ? 'Sin eventos confirmados.\nReserva desde la web.'
      : 'No hay eventos publicados.';

  String get _subtitle {
    final name = _api.user?['name']?.toString().split(' ').first ?? 'tú';
    if (_tab == 0) {
      return 'Hola, $name · ${_mine.length} confirmado${_mine.length == 1 ? '' : 's'}';
    }
    return 'Últimos ${_latest.length} publicados';
  }

  @override
  Widget build(BuildContext context) {
    final time = DateFormat('HH:mm').format(_now);

    return WatchShell(
      insetFactor: 0.12,
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  time,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    height: 1,
                  ),
                ),
              ),
              GestureDetector(
                onTap: _logout,
                child: const Icon(Icons.logout, size: 12, color: Colors.white38),
              ),
            ],
          ),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              _subtitle,
              style: const TextStyle(color: Colors.white54, fontSize: 8),
            ),
          ),
          const SizedBox(height: 3),
          // StatsWidget (catálogo Layout/Text) — enlace wearable ↔ dashboard web
          StatsWidget(
            totalEvents: _catalogTotal,
            confirmed: _mine.length,
            favorites: {
              ..._mine.where((e) => e['liked'] == true).map((e) => e['id']),
              ..._latest.where((e) => e['liked'] == true).map((e) => e['id']),
            }.length,
            compact: true,
          ),
          const SizedBox(height: 3),
          _WatchTabs(
            index: _tab,
            onChanged: (i) => setState(() => _tab = i),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: _loading
                ? const Center(
                    child: SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : _error != null
                    ? Center(
                        child: Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.redAccent,
                            fontSize: 8,
                          ),
                        ),
                      )
                    : _visible.isEmpty
                        ? Center(
                            child: Text(
                              _emptyMessage,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white38,
                                fontSize: 9,
                                height: 1.35,
                              ),
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: EdgeInsets.zero,
                              itemCount: _visible.length,
                              itemBuilder: (context, index) {
                                final event = _visible[index];
                                final confirmed = event['confirmed'] == true;
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: Material(
                                    color: const Color(0xFF161C19),
                                    borderRadius: BorderRadius.circular(999),
                                    child: InkWell(
                                      onTap: () async {
                                        final changed = await Navigator.of(context)
                                            .push<bool>(
                                          MaterialPageRoute(
                                            builder: (_) =>
                                                EventDetailScreen(event: event),
                                          ),
                                        );
                                        if (changed == true && mounted) {
                                          await _load();
                                        }
                                      },
                                      borderRadius: BorderRadius.circular(999),
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 6,
                                        ),
                                        child: Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                event['title']?.toString() ??
                                                    'Evento',
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.w700,
                                                  height: 1.15,
                                                ),
                                              ),
                                            ),
                                            Icon(
                                              confirmed
                                                  ? Icons.check_circle
                                                  : Icons.chevron_right,
                                              size: 11,
                                              color: confirmed
                                                  ? const Color(0xFF34D399)
                                                  : Colors.white38,
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}

class _WatchTabs extends StatelessWidget {
  const _WatchTabs({required this.index, required this.onChanged});

  final int index;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 22,
      decoration: BoxDecoration(
        color: const Color(0xFF0F1412),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        children: [
          _TabChip(
            label: 'Mis eventos',
            selected: index == 0,
            onTap: () => onChanged(0),
          ),
          _TabChip(
            label: 'Eventos',
            selected: index == 1,
            onTap: () => onChanged(1),
          ),
        ],
      ),
    );
  }
}

class _TabChip extends StatelessWidget {
  const _TabChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? const Color(0xFF10B981) : Colors.transparent,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: selected ? Colors.black : Colors.white60,
              fontSize: 7.5,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ),
    );
  }
}
