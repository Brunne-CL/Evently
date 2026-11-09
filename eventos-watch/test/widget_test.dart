import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:evently_watch/widgets/stats_widget.dart';

void main() {
  testWidgets('StatsWidget muestra contadores', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: StatsWidget(
            totalEvents: 5,
            confirmed: 2,
            favorites: 1,
            compact: false,
          ),
        ),
      ),
    );
    expect(find.text('5'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
    expect(find.text('Eventos'), findsOneWidget);
  });
}
