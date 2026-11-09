import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../services/biometric_auth.dart';

/// Cliente API Evently para Wear OS.
///
/// Seguridad (prácticas 11–12):
/// - El PIN nunca se guarda en el dispositivo; solo viaja al backend (bcrypt allí).
/// - El JWT se guarda en [FlutterSecureStorage], no en texto plano en disco.
/// - Rutas de datos personales usan Bearer + `requireAuth` en el servidor.
class EventlyApi {
  EventlyApi._();
  static final EventlyApi instance = EventlyApi._();

  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'evently_jwt';
  static const _userKey = 'evently_user';

  String? _token;
  Map<String, dynamic>? _user;

  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;

  Future<void> loadSession() async {
    try {
      _token = await _storage.read(key: _tokenKey);
      final rawUser = await _storage.read(key: _userKey);
      if (rawUser != null && rawUser.isNotEmpty) {
        _user = jsonDecode(rawUser) as Map<String, dynamic>;
      } else {
        _user = null;
      }
    } catch (_) {
      _token = null;
      _user = null;
    }
  }

  Future<void> _persist() async {
    if (_token == null || _token!.isEmpty) {
      await _storage.delete(key: _tokenKey);
      await _storage.delete(key: _userKey);
      return;
    }
    await _storage.write(key: _tokenKey, value: _token);
    await _storage.write(
      key: _userKey,
      value: jsonEncode(_user ?? {}),
    );
  }

  Future<Map<String, dynamic>> _request(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? body,
    bool auth = false,
  }) async {
    final uri = Uri.parse('${AppConfig.apiBase}$path');
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (auth && _token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }

    late http.Response res;
    try {
      switch (method) {
        case 'POST':
          res = await http
              .post(uri, headers: headers, body: body == null ? null : jsonEncode(body))
              .timeout(const Duration(seconds: 12));
          break;
        case 'DELETE':
          res = await http
              .delete(uri, headers: headers)
              .timeout(const Duration(seconds: 12));
          break;
        default:
          res = await http
              .get(uri, headers: headers)
              .timeout(const Duration(seconds: 12));
      }
    } catch (_) {
      return {
        'ok': false,
        'error':
            'Sin conexión al servidor (${AppConfig.apiBase}). Revisa IP y Laragon.',
      };
    }

    Map<String, dynamic> data = {};
    try {
      data = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      data = {'ok': false, 'error': 'Respuesta inválida (${res.statusCode})'};
    }

    if (res.statusCode == 401 && auth) {
      // Sesión inválida / expirada → limpiar
      _token = null;
      _user = null;
      await _persist();
    }

    if (res.statusCode >= 400) {
      return {
        'ok': false,
        'error': data['error'] ?? 'Error ${res.statusCode}',
        'status': res.statusCode,
      };
    }
    return data;
  }

  Future<Map<String, dynamic>> pinLogin({
    required String telefono,
    required String pin,
  }) async {
    final pinStr = pin.trim();
    if (pinStr.length < 4 || pinStr.length > 6 || int.tryParse(pinStr) == null) {
      return {
        'ok': false,
        'error': 'El PIN debe tener entre 4 y 6 dígitos.',
      };
    }

    final data = await _request(
      '/api/auth/pin-login',
      method: 'POST',
      body: {
        'telefono': telefono.replaceAll(RegExp(r'\D'), ''),
        'pin': pinStr,
      },
    );
    if (data['ok'] == true && data['token'] != null) {
      _token = data['token'] as String;
      _user = data['user'] as Map<String, dynamic>?;
      await _persist();
    }
    return data;
  }

  Future<void> logout() async {
    try {
      await _request('/api/auth/logout', method: 'POST', auth: true);
    } catch (_) {}
    _token = null;
    _user = null;
    await _persist();
    await BiometricAuth.instance.setEnabled(false);
  }

  Future<Map<String, dynamic>> health() => _request('/api/health');

  Future<Map<String, dynamic>> events() => _request('/api/events');

  Future<Map<String, dynamic>> misEventos() =>
      _request('/api/auth/mis-eventos', auth: true);

  Future<Map<String, dynamic>> reserve(int eventId) => _request(
        '/api/events/$eventId/reservation',
        method: 'POST',
        auth: true,
      );

  Future<Map<String, dynamic>> cancelReservation(int eventId) => _request(
        '/api/events/$eventId/reservation',
        method: 'DELETE',
        auth: true,
      );
}
