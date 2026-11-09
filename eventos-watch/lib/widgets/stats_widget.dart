import 'package:flutter/material.dart';
import 'evently_mark.dart';

/// StatsWidget — estadísticas Evently para wearable y dashboard web.
///
/// Enlace wearable ↔ catálogo Flutter
/// ([docs.flutter.dev/ui/widgets](https://docs.flutter.dev/ui/widgets)):
///
/// | Widget del catálogo | Uso en este componente |
/// |---------------------|------------------------|
/// | [Row](https://api.flutter.dev/flutter/widgets/Row-class.html) (Layout) | Tres métricas en horizontal, apto para cara redonda Wear OS |
/// | [Column](https://api.flutter.dev/flutter/widgets/Column-class.html) (Layout) | Valor + etiqueta por celda |
/// | [Expanded](https://api.flutter.dev/flutter/widgets/Expanded-class.html) (Layout) | Reparte el ancho en el reloj |
/// | [Container](https://api.flutter.dev/flutter/widgets/Container-class.html) (Basics) | Cápsula con borde y padding |
/// | [Text](https://api.flutter.dev/flutter/widgets/Text-class.html) (Text) | Números y labels compactos |
///
/// Se usa en:
/// - Wear OS: [WatchHomeScreen] (modo `compact`)
/// - Dashboard React+Flutter Web: [DashboardScreen] (modo expandido)
class StatsWidget extends StatelessWidget {
  const StatsWidget({
    super.key,
    required this.totalEvents,
    required this.confirmed,
    required this.favorites,
    this.compact = true,
  });

  final int totalEvents;
  final int confirmed;
  final int favorites;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final items = compact
        ? [
            _Stat('Ev', totalEvents, kEventlyInk),
            _Stat('Ok', confirmed, kEventlyGreen),
            _Stat('Fav', favorites, kEventlyInk),
          ]
        : [
            _Stat('Eventos', totalEvents, kEventlyInk),
            _Stat('Confirmados', confirmed, kEventlyGreen),
            _Stat('Favoritos', favorites, kEventlyInk),
          ];

    return Semantics(
      label:
          'Estadísticas: $totalEvents eventos, $confirmed confirmados, $favorites favoritos',
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 6 : 16,
          vertical: compact ? 4 : 12,
        ),
        decoration: BoxDecoration(
          color: kEventlyCard,
          borderRadius: BorderRadius.circular(compact ? 12 : 16),
          border: Border.all(color: kEventlyLine),
        ),
        child: Row(
          children: [
            for (var i = 0; i < items.length; i++) ...[
              if (i > 0) const SizedBox(width: 4),
              Expanded(child: _StatCell(stat: items[i], compact: compact)),
            ],
          ],
        ),
      ),
    );
  }
}

class _Stat {
  const _Stat(this.label, this.value, this.color);
  final String label;
  final int value;
  final Color color;
}

class _StatCell extends StatelessWidget {
  const _StatCell({required this.stat, required this.compact});
  final _Stat stat;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '${stat.value}',
          style: TextStyle(
            color: stat.color,
            fontWeight: FontWeight.w900,
            fontSize: compact ? 12 : 22,
            height: 1,
          ),
        ),
        Text(
          stat.label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: kEventlyMuted,
            fontSize: compact ? 7 : 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
