import 'package:flutter/material.dart';
import '../widgets/stats_widget.dart';

/// Dashboard de tareas (Práctica 8) — Flutter Web embebido en React.
///
/// Reutiliza [StatsWidget] (mismo widget del wearable / catálogo Flutter).
/// Arranque: `flutter run -d chrome --dart-define=MODE=dashboard`
/// Build: `flutter build web --base-href=/flutter-dashboard/ --dart-define=MODE=dashboard`
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    this.totalEvents = 0,
    this.confirmed = 0,
    this.favorites = 0,
    this.pendingTasks = const [],
  });

  final int totalEvents;
  final int confirmed;
  final int favorites;
  final List<String> pendingTasks;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late List<_TaskItem> _tasks;

  @override
  void initState() {
    super.initState();
    final labels = widget.pendingTasks.isEmpty
        ? const [
            'Revisar eventos de la semana',
            'Confirmar asistencia desde el reloj',
            'Sincronizar favoritos con la web',
            'Publicar widget Smart TV',
          ]
        : widget.pendingTasks;
    _tasks = [
      for (var i = 0; i < labels.length; i++)
        _TaskItem(id: i, title: labels[i], done: false),
    ];
  }

  void _toggle(int id) {
    setState(() {
      final i = _tasks.indexWhere((t) => t.id == id);
      if (i >= 0) {
        _tasks[i] = _tasks[i].copyWith(done: !_tasks[i].done);
      }
    });
  }

  int get _doneCount => _tasks.where((t) => t.done).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F5F0),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        foregroundColor: Colors.white,
        title: const Text('Evently · Dashboard'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Estadísticas (StatsWidget)',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Mismo widget del wearable — catálogo Layout / Text / Basics',
            style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
          ),
          const SizedBox(height: 12),
          StatsWidget(
            totalEvents: widget.totalEvents,
            confirmed: widget.confirmed,
            favorites: widget.favorites,
            compact: false,
          ),
          const SizedBox(height: 28),
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Tareas',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF111827),
                  ),
                ),
              ),
              Text(
                '$_doneCount / ${_tasks.length}',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF3D5C48),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._tasks.map(
            (task) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: CheckboxListTile(
                value: task.done,
                onChanged: (_) => _toggle(task.id),
                secondary: Icon(
                  task.done ? Icons.check_circle : Icons.radio_button_unchecked,
                  color: task.done
                      ? const Color(0xFF10B981)
                      : const Color(0xFF94A3B8),
                ),
                title: Text(
                  task.title,
                  style: TextStyle(
                    decoration:
                        task.done ? TextDecoration.lineThrough : null,
                    color: task.done
                        ? const Color(0xFF94A3B8)
                        : const Color(0xFF111827),
                  ),
                ),
                controlAffinity: ListTileControlAffinity.trailing,
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Integración React + Flutter Web',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          const Text(
            'Este módulo se sirve desde /flutter-dashboard y se embebe '
            'en la app React en la ruta /dashboard (iframe).',
            style: TextStyle(color: Color(0xFF64748B), height: 1.4),
          ),
        ],
      ),
    );
  }
}

class _TaskItem {
  const _TaskItem({
    required this.id,
    required this.title,
    required this.done,
  });

  final int id;
  final String title;
  final bool done;

  _TaskItem copyWith({bool? done}) =>
      _TaskItem(id: id, title: title, done: done ?? this.done);
}
