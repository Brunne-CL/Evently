import 'package:flutter/material.dart';
import '../api/evently_api.dart';
import '../widgets/watch_shell.dart';

/// Detalle de evento: hora, dirección y confirmación de asistencia.
class EventDetailScreen extends StatefulWidget {
  const EventDetailScreen({super.key, required this.event});

  final Map<String, dynamic> event;

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  late bool _confirmed;
  bool _busy = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    _confirmed = widget.event['confirmed'] == true;
  }

  Future<void> _confirm() async {
    final id = int.tryParse('${widget.event['id']}');
    if (id == null || _busy || _confirmed) return;

    setState(() {
      _busy = true;
      _message = null;
    });

    final result = await EventlyApi.instance.reserve(id);
    if (!mounted) return;

    if (result['ok'] == true) {
      setState(() {
        _confirmed = true;
        _busy = false;
        _message = result['message']?.toString() ?? 'Asistencia confirmada';
      });
      await Future<void>.delayed(const Duration(milliseconds: 700));
      if (mounted) Navigator.pop(context, true);
      return;
    }

    setState(() {
      _busy = false;
      _message = result['error']?.toString() ?? 'No se pudo confirmar';
    });
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.event['title']?.toString() ?? 'Evento';
    final time = widget.event['time']?.toString() ?? '—';
    final date = widget.event['date']?.toString() ?? '';
    final location = widget.event['location']?.toString() ?? 'Sin dirección';

    return WatchShell(
      insetFactor: 0.12,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: GestureDetector(
              onTap: () => Navigator.pop(context, _confirmed),
              child: const Icon(Icons.arrow_back, color: Colors.white70, size: 16),
            ),
          ),
          const SizedBox(height: 2),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                _InfoRow(
                  icon: Icons.access_time_rounded,
                  label: 'Hora',
                  value: date.isEmpty ? time : '$date · $time',
                ),
                const SizedBox(height: 6),
                _InfoRow(
                  icon: Icons.place_outlined,
                  label: 'Dirección',
                  value: location,
                ),
                const SizedBox(height: 8),
                if (_confirmed)
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle, size: 12, color: Color(0xFF34D399)),
                        SizedBox(width: 6),
                        Text(
                          'Asistencia confirmada',
                          style: TextStyle(
                            color: Color(0xFF34D399),
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  SizedBox(
                    height: 30,
                    child: ElevatedButton(
                      onPressed: _busy ? null : _confirm,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.black,
                        disabledBackgroundColor: const Color(0xFF10B981).withValues(alpha: 0.4),
                        elevation: 0,
                        padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                      child: _busy
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.black54,
                              ),
                            )
                          : const Text(
                              'Confirmar asistencia',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                    ),
                  ),
                if (_message != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    _message!,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _confirmed ? const Color(0xFF34D399) : Colors.redAccent,
                      fontSize: 8,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFF161C19),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 13, color: const Color(0xFF34D399)),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white38,
                    fontSize: 7.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
