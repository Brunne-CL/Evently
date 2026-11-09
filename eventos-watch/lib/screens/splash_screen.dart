import 'package:flutter/material.dart';
import '../api/evently_api.dart';
import '../services/biometric_auth.dart';
import '../widgets/watch_shell.dart';
import 'login_screen.dart';
import 'watch_home_screen.dart';

/// Pantalla de arranque: exige sesión; biometría opcional si está activa.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fade;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _scale = Tween<double>(begin: 0.86, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
    _controller.forward();
    _goNext();
  }

  Future<void> _goNext() async {
    await Future<void>.delayed(const Duration(milliseconds: 1200));
    if (!mounted) return;

    final api = EventlyApi.instance;
    if (!api.isAuthenticated) {
      _navigate(const LoginScreen());
      return;
    }

    final bio = BiometricAuth.instance;
    final bioOn = await bio.isEnabled;
    final canBio = await bio.deviceSupportsBiometrics();

    if (bioOn && canBio) {
      final unlocked = await bio.authenticate(
        reason: 'Desbloquea Evently Watch',
      );
      if (!mounted) return;
      if (!unlocked) {
        // Sesión existe pero no desbloqueó → pedir PIN (sin borrar JWT)
        _navigate(const LoginScreen());
        return;
      }
    }

    if (!mounted) return;
    _navigate(const WatchHomeScreen());
  }

  void _navigate(Widget page) {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => page,
        transitionsBuilder: (_, animation, __, child) =>
            FadeTransition(opacity: animation, child: child),
        transitionDuration: const Duration(milliseconds: 350),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return WatchShell(
      insetFactor: 0.16,
      child: FadeTransition(
        opacity: _fade,
        child: ScaleTransition(
          scale: _scale,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              EventlyLogo(height: 28, compact: true),
              SizedBox(height: 8),
              Text(
                'EVENTLY',
                style: TextStyle(
                  color: kEventlyInk,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.4,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Watch',
                style: TextStyle(
                  color: kEventlyMuted,
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
