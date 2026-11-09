import 'dart:math' as math;
import 'package:flutter/material.dart';

const Color kEventlyGreen = Color(0xFF2F4A3C);
const Color kEventlyGreenDeep = Color(0xFF2F4A3C);
const Color kEventlyInk = Color(0xFF161616);
const Color kEventlyPaper = Color(0xFFF6F5F2);
const Color kEventlyMuted = Color(0xFF6E6E68);
const Color kEventlyLine = Color(0xFFE4E2DC);
const Color kEventlyCard = Color(0xFFFFFFFF);

/// Logo Evently vectorial (nítido en Wear; no usa PNG pixelado).
class EventlyLogo extends StatelessWidget {
  const EventlyLogo({
    super.key,
    this.height = 22,
    this.showWordmark = true,
    this.compact = false,
  });

  final double height;
  final bool showWordmark;
  /// Solo el isotipo (útil en home del reloj).
  final bool compact;

  @override
  Widget build(BuildContext context) {
    if (compact || !showWordmark) {
      return SizedBox(
        height: height,
        width: height,
        child: CustomPaint(painter: _EventlyMarkPainter()),
      );
    }

    return SizedBox(
      height: height,
      child: FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.centerLeft,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              height: height * 0.92,
              width: height * 0.92,
              child: CustomPaint(painter: _EventlyMarkPainter()),
            ),
            SizedBox(width: height * 0.22),
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: 'E',
                    style: TextStyle(
                      color: kEventlyGreen,
                      fontWeight: FontWeight.w900,
                      fontSize: height * 0.72,
                      height: 1,
                      letterSpacing: height * 0.02,
                    ),
                  ),
                  TextSpan(
                    text: 'VENTLY',
                    style: TextStyle(
                      color: kEventlyInk,
                      fontWeight: FontWeight.w900,
                      fontSize: height * 0.72,
                      height: 1,
                      letterSpacing: height * 0.02,
                    ),
                  ),
                ],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

/// Isotipo: bloque geométrico + chispa (inspirado en la marca Evently).
class _EventlyMarkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final s = math.min(size.width, size.height);
    final paint = Paint()
      ..color = kEventlyGreen
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    // Escala a un lienzo 24x24 lógico
    canvas.save();
    canvas.translate((size.width - s) / 2, (size.height - s) / 2);
    canvas.scale(s / 24);

    // Chispas superiores
    final spark = Paint()
      ..color = kEventlyGreen
      ..strokeWidth = 1.7
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke
      ..isAntiAlias = true;

    canvas.drawLine(const Offset(5.2, 3.2), const Offset(7.0, 5.8), spark);
    canvas.drawLine(const Offset(9.5, 2.2), const Offset(9.5, 5.4), spark);
    canvas.drawLine(const Offset(13.8, 3.2), const Offset(12.0, 5.8), spark);

    // Cuerpo tipo ticket / E angular
    final body = Path()
      ..moveTo(4.5, 7.5)
      ..lineTo(14.5, 7.5)
      ..lineTo(14.5, 11.2)
      ..lineTo(10.8, 11.2)
      ..lineTo(10.8, 12.6)
      ..lineTo(14.5, 12.6)
      ..lineTo(14.5, 20.5)
      ..lineTo(4.5, 20.5)
      ..close();

    // Hueco interno (efecto trazo grueso)
    final hole = Path()
      ..moveTo(7.2, 10.0)
      ..lineTo(11.8, 10.0)
      ..lineTo(11.8, 11.8)
      ..lineTo(7.2, 11.8)
      ..close();

    final hole2 = Path()
      ..moveTo(7.2, 14.4)
      ..lineTo(11.8, 14.4)
      ..lineTo(11.8, 17.8)
      ..lineTo(7.2, 17.8)
      ..close();

    final mark = Path.combine(PathOperation.difference, body, hole);
    final mark2 = Path.combine(PathOperation.difference, mark, hole2);
    canvas.drawPath(mark2, paint);

    // Acento diagonal
    final accent = Paint()
      ..color = kEventlyGreen
      ..strokeWidth = 1.8
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke
      ..isAntiAlias = true;
    canvas.drawLine(const Offset(15.5, 9.0), const Offset(19.2, 14.5), accent);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
