import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../api/evently_api.dart';
import '../services/biometric_auth.dart';
import '../widgets/watch_shell.dart';
import 'watch_home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phone = TextEditingController();
  final _pin = TextEditingController();
  bool _busy = false;
  bool _bioAvailable = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _checkBio();
  }

  Future<void> _checkBio() async {
    final ok = await BiometricAuth.instance.deviceSupportsBiometrics();
    if (mounted) setState(() => _bioAvailable = ok);
  }

  @override
  void dispose() {
    _phone.dispose();
    _pin.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final pin = _pin.text.trim();
    if (pin.length < 4 || pin.length > 6) {
      setState(() => _error = 'PIN de 4 a 6 dígitos');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });
    final result = await EventlyApi.instance.pinLogin(
      telefono: _phone.text,
      pin: pin,
    );
    if (!mounted) return;
    setState(() => _busy = false);

    if (result['ok'] != true) {
      setState(() => _error = result['error']?.toString() ?? 'Login fallido');
      return;
    }

    // Ofrecer biometría si el hardware lo permite (opcional).
    if (_bioAvailable) {
      final enable = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: kEventlyPaper,
          title: const Text('¿Usar biometría?', style: TextStyle(fontSize: 14)),
          content: const Text(
            'Desbloquear Evently sin volver a escribir el PIN. El PIN nunca se guarda en el reloj.',
            style: TextStyle(fontSize: 11, color: kEventlyMuted),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('No', style: TextStyle(fontSize: 12)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Sí', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
      );
      if (enable == true) {
        final unlocked = await BiometricAuth.instance.authenticate(
          reason: 'Confirma para activar biometría en Evently',
        );
        await BiometricAuth.instance.setEnabled(unlocked);
      } else {
        await BiometricAuth.instance.setEnabled(false);
      }
    }

    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const WatchHomeScreen()),
    );
  }

  Future<void> _tryBiometricUnlock() async {
    if (!EventlyApi.instance.isAuthenticated) {
      setState(() => _error = 'Entra primero con PIN');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final ok = await BiometricAuth.instance.authenticate();
    if (!mounted) return;
    setState(() => _busy = false);
    if (!ok) {
      setState(() => _error = 'Biometría cancelada o no disponible');
      return;
    }
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const WatchHomeScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return WatchShell(
      insetFactor: 0.13,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 2),
          const Center(child: EventlyLogo(height: 22)),
          const SizedBox(height: 4),
          const Text(
            'Teléfono + PIN',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: kEventlyMuted,
              fontSize: 8,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 8),
          WatchField(
            controller: _phone,
            hint: 'Teléfono',
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(15),
            ],
          ),
          const SizedBox(height: 7),
          WatchField(
            controller: _pin,
            hint: 'PIN 4–6',
            keyboardType: TextInputType.number,
            obscure: true,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(6),
            ],
          ),
          if (_error != null) ...[
            const SizedBox(height: 4),
            Text(
              _error!,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.redAccent, fontSize: 7.5),
            ),
          ],
          const Spacer(),
          if (_bioAvailable && EventlyApi.instance.isAuthenticated) ...[
            Center(
              child: GestureDetector(
                onTap: _busy ? null : _tryBiometricUnlock,
                child: const Icon(Icons.fingerprint, size: 18, color: kEventlyInk),
              ),
            ),
            const SizedBox(height: 6),
          ],
          Center(
            child: SizedBox(
              width: 88,
              height: 24,
              child: FilledButton(
                onPressed: _busy ? null : _submit,
                style: FilledButton.styleFrom(
                  backgroundColor: kEventlyInk,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.zero,
                  shape: const StadiumBorder(),
                ),
                child: _busy
                    ? const SizedBox(
                        width: 12,
                        height: 12,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text(
                        'Entrar',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 10),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
