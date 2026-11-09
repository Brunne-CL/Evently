/// Configuración de la API Evently para el reloj.
///
/// Producción: la EC2 en el puerto 80. Nginx reenvía /api a Express.
/// Emulador local contra tu PC: --dart-define=API_BASE=http://10.0.2.2:4000
class AppConfig {
  static const String apiBase = String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://34.200.232.137',
  );
}
