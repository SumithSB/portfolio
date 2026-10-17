import 'dart:ui' show Size;
import 'package:flutter_test/flutter_test.dart';

import 'package:personal_portfolio/main.dart';

void main() {
  testWidgets('Portfolio renders hero and nav', (WidgetTester tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(const MyApp());
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.text('View Projects'), findsOneWidget);
    expect(find.text('Backend CV'), findsOneWidget);
    expect(find.text('Platform CV'), findsOneWidget);
    expect(find.text('Blog'), findsNothing);
  });
}
