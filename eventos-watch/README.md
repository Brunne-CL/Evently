# Evently Watch — Flutter Wear OS (app real)

App **funcional** para smartwatch Wear OS. Conecta a tu API Evently
(login PIN, eventos, confirmar asistencia). Ya no uses el simulador web.

## 1. Instalar herramientas (una vez)

Flutter ya quedó en `%USERPROFILE%\flutter`. Añádelo al PATH:

```powershell
$env:Path = "$env:USERPROFILE\flutter\bin;" + $env:Path
flutter doctor
```

Instala **Android Studio** → SDK + emulador **Wear OS** (o conecta un reloj
Wear OS con depuración ADB).

## 2. Arrancar la API

```powershell
cd eventos-backend
npm run dev
```

En el reloj, `localhost` **no** es tu PC:

| Dispositivo | `API_BASE` |
|-------------|------------|
| Emulador Android / Wear (mismo host) | `http://10.0.2.2:4000` |
| Reloj físico (misma Wi‑Fi) | `http://TU_IP_LAN:4000` (ej. `192.168.1.20:4000`) |

Edita `lib/config.dart` o pasa:

```powershell
flutter run --dart-define=API_BASE=http://192.168.1.20:4000
```

## 3. Correr en el reloj

```powershell
cd eventos-watch
flutter pub get
flutter devices
flutter run -d <id_del_wear>
```

Login: email + PIN configurado en la web Evently (`set-pin`).

## Seguridad (prácticas 11–12)

| Requisito | Implementación |
|-----------|----------------|
| Login con PIN 4–6 | `LoginScreen` → `POST /api/auth/pin-login` |
| Biometría (opcional) | `local_auth` al arrancar / tras login si el dispositivo lo permite |
| Pantalla protegida | `WatchHomeScreen` redirige a login sin JWT |
| Cierre de sesión | Borra JWT seguro + desactiva biometría |
| Credenciales no en texto plano | PIN solo en tránsito; en BD `pin_hash` bcrypt; JWT en `FlutterSecureStorage` |
| Sesión | JWT Bearer con expiración; 401 limpia sesión local |

## Qué incluye (prácticas 7–8)

| Archivo | Rol |
|---------|-----|
| `lib/widgets/stats_widget.dart` | `StatsWidget` documentado (catálogo Layout/Text/Basics) |
| `lib/screens/watch_home_screen.dart` | Wearable que muestra `StatsWidget` |
| `lib/screens/dashboard_screen.dart` | Dashboard de tareas (checkboxes) |
| `android/.../AndroidManifest.xml` | `android.hardware.type.watch` + standalone |

Dashboard embebible en React (`/dashboard`):

```powershell
flutter create . --platforms=web
flutter build web --base-href=/flutter-dashboard/ --dart-define=MODE=dashboard --dart-define=API_BASE=http://localhost:4000
Remove-Item -Recurse -Force ..\eventos-frontend\public\flutter-dashboard -ErrorAction SilentlyContinue
Copy-Item -Recurse build\web ..\eventos-frontend\public\flutter-dashboard
```

Luego en el frontend: `npm run dev` → abre `http://localhost:5173/dashboard`

## Catálogo Flutter ↔ wearable

Documentación del widget: comentarios en `stats_widget.dart` con enlace a
https://docs.flutter.dev/ui/widgets

- Plataforma: **Android Wear OS** (`android.hardware.type.watch`)
- Enlace con el sitio: mismo backend REST + JWT
- Widgets del catálogo: `Row`, `Column`, `Expanded`, `Container`, `Text` + `StatsWidget` propio
- El mismo `StatsWidget` corre en el reloj (compact) y en el dashboard web (expandido)