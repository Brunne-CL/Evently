import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

/// Biometría opcional (huella / face) para desbloquear sesión ya autenticada.
/// Si el emulador o dispositivo no la soporta, se usa solo PIN.
class BiometricAuth {
  BiometricAuth._();
  static final BiometricAuth instance = BiometricAuth._();

  final LocalAuthentication _auth = LocalAuthentication();
  static const _storage = FlutterSecureStorage();
  static const _prefKey = 'evently_biometric_enabled';

  Future<bool> get isEnabled async {
    final v = await _storage.read(key: _prefKey);
    return v == '1';
  }

  Future<void> setEnabled(bool value) async {
    await _storage.write(key: _prefKey, value: value ? '1' : '0');
  }

  Future<bool> deviceSupportsBiometrics() async {
    try {
      final can = await _auth.canCheckBiometrics;
      final supported = await _auth.isDeviceSupported();
      if (!can && !supported) return false;
      final types = await _auth.getAvailableBiometrics();
      return types.isNotEmpty || supported;
    } on PlatformException {
      return false;
    } on LocalAuthException {
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Desbloquea la app con biometría / credencial del dispositivo.
  Future<bool> authenticate({
    String reason = 'Desbloquea Evently Watch',
  }) async {
    try {
      final ok = await deviceSupportsBiometrics();
      if (!ok) return false;
      return await _auth.authenticate(
        localizedReason: reason,
        biometricOnly: false,
        persistAcrossBackgrounding: true,
      );
    } on PlatformException {
      return false;
    } on LocalAuthException {
      return false;
    } catch (_) {
      return false;
    }
  }
}
