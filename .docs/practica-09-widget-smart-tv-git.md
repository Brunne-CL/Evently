# Práctica 09 — Widget Smart TV y actualización del sitio vía Git

## 1. Objetivo

Documentar la integración del widget **`EventlyTVWidget`** dentro del flujo de versiones Git del sitio web **Evently**, permitiendo que una **Smart TV** (Samsung Tizen, LG webOS, Android TV / Google TV) se conecte al sitio para:

- Visualizar eventos destacados en pantalla grande.
- Recibir recordatorios de eventos próximos.
- Emparejar la TV con la cuenta del usuario mediante código QR o PIN.
- Sincronizar confirmaciones de asistencia iniciadas desde smartwatch o móvil.

---

## 2. Contexto del proyecto

El sitio actual (`eventos-frontend`) es una landing page en **React 18 + Vite** con secciones ya orientadas a dispositivos inteligentes (`SmartwatchCTA`, notificaciones en reloj). La Práctica 09 extiende esa arquitectura hacia **Smart TV**, manteniendo la paleta oficial Evently y el mismo backend REST.

| Componente actual | Ubicación | Rol |
|-------------------|-----------|-----|
| `LandingPage.jsx` | `eventos-frontend/src/` | UI principal del sitio |
| `SmartwatchCTA` | Dentro de `LandingPage.jsx` | CTA para wearables |
| `eventos-backend` | Raíz del monorepo | API REST (Express) |
| `index.html` | `eventos-frontend/` | Metadatos PWA y `<head>` |

---

## 3. Estructura Git recomendada

### 3.1 Inicialización del repositorio

```bash
cd "Dispositivos inteligentes"
git init
git branch -M main
```

### 3.2 Modelo de ramas (Git Flow simplificado)

```
main          → Producción estable (tag v1.x.x)
develop       → Integración continua de features
feature/*     → Desarrollo aislado por funcionalidad
hotfix/*      → Correcciones urgentes en producción
release/*     → Preparación de versión antes de merge a main
```

| Rama | Propósito | Ejemplo |
|------|-----------|---------|
| `main` | Código desplegado en producción | `v1.2.0` |
| `develop` | Rama de integración | Últimos merges de features |
| `feature/smart-tv-widget` | Desarrollo del widget TV | Esta práctica |
| `feature/tv-pairing-api` | Endpoint de emparejamiento en backend | Complemento |
| `release/v1.2.0` | QA y ajustes finales antes del tag | Pre-lanzamiento TV |

### 3.3 Versionado semántico (SemVer)

```
v MAJOR . MINOR . PATCH
  │       │       └── Corrección de bugs (hotfix)
  │       └────────── Nueva funcionalidad compatible (widget TV)
  └────────────────── Cambio incompatible (rediseño API v2)
```

**Historial de versiones documentado para Evently:**

| Versión | Fecha | Cambio principal |
|---------|-------|------------------|
| `v1.0.0` | May 2026 | Landing page inicial + smartwatch CTA |
| `v1.1.0` | Jun 2026 | Buscador interno + índice de secciones |
| `v1.2.0` | Jul 2026 | **Widget Smart TV + emparejamiento QR** |
| `v1.2.1` | Jul 2026 | Fix navegación espacial en webOS |

### 3.4 Archivo `.gitignore` recomendado (raíz del monorepo)

```gitignore
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
Thumbs.db
.vscode/
```

### 3.5 Convención de commits (Conventional Commits)

```
tipo(alcance): descripción breve

feat(tv-widget): añadir componente EventlyTVWidget con navegación espacial
fix(pairing): corregir expiración del código QR en 120 s
docs(practica-09): documentar flujo Git para despliegue en Smart TV
chore(deploy): actualizar workflow de GitHub Actions para build TV
```

---

## 4. Widget `EventlyTVWidget` — Diseño e implementación

### 4.1 Ubicación en el repositorio

```
eventos-frontend/
└── src/
    ├── LandingPage.jsx
    ├── widgets/
    │   ├── EventlyTVWidget.jsx       ← Widget principal Smart TV
    │   ├── TVPairingModal.jsx        ← Modal de emparejamiento QR/PIN
    │   └── hooks/
    │       ├── useTVDetection.js     ← Detecta user-agent de Smart TV
    │       └── useSpatialNav.js      ← Navegación con control remoto
    └── utils/
        └── tvBridge.js               ← Cliente WebSocket hacia el backend
```

### 4.2 Detección de Smart TV en el DOM

El widget se activa cuando el navegador del televisor es detectado. Se inyecta un atributo `data-device` en `<html>`:

```javascript
// useTVDetection.js
const TV_PATTERNS = [
  /SmartTV/i,
  /Tizen/i,
  /Web0S/i,       // LG webOS
  /WebOS/i,
  /BRAVIA/i,      // Sony Android TV
  /Android TV/i,
  /GoogleTV/i,
  /HbbTV/i,
]

export function useTVDetection() {
  const ua = navigator.userAgent
  const isTV = TV_PATTERNS.some((p) => p.test(ua))
    || window.screen.width >= 1920 && !('ontouchstart' in window)

  useEffect(() => {
    if (isTV) {
      document.documentElement.dataset.device = 'smart-tv'
      document.documentElement.classList.add('tv-mode')
    }
  }, [isTV])

  return { isTV }
}
```

**Efecto en el DOM:**

```html
<html lang="es" data-device="smart-tv" class="tv-mode">
```

### 4.3 Estructura DOM del widget

```jsx
/**
 * EventlyTVWidget — Widget embebible para Smart TV
 * Se monta condicionalmente cuando data-device="smart-tv"
 */
export function EventlyTVWidget({ eventos, onPair, paired }) {
  return (
    <section
      id="evently-tv-widget"
      role="region"
      aria-label="Evently en tu Smart TV"
      data-widget="evently-tv"
      data-version="1.2.0"
      tabIndex={0}
    >
      {/* Barra de estado de conexión */}
      <header data-tv-focusable="true" data-tv-order="1">
        <span data-connection-status={paired ? 'connected' : 'idle'}>
          {paired ? 'TV vinculada' : 'Emparejar dispositivo'}
        </span>
      </header>

      {/* Carrusel de eventos optimizado para 10-foot UI */}
      <div
        className="tv-event-carousel"
        data-tv-focusable="true"
        data-tv-order="2"
      >
        {eventos.map((ev) => (
          <article
            key={ev.id}
            data-event-id={ev.id}
            data-tv-focusable="true"
          >
            <h2>{ev.title}</h2>
            <time dateTime={ev.dateISO}>{ev.date}</time>
            <p>{ev.location}</p>
          </article>
        ))}
      </div>

      {/* Botón de emparejamiento */}
      <button
        type="button"
        data-action="pair-tv"
        data-tv-focusable="true"
        data-tv-order="3"
        onClick={onPair}
      >
        Conectar con mi cuenta
      </button>
    </section>
  )
}
```

### 4.4 Navegación espacial (control remoto)

Las Smart TV no usan cursor de ratón; el widget implementa **navegación por foco** con las teclas del control:

| Tecla remoto | Código | Acción en el widget |
|--------------|--------|---------------------|
| ↑ ↓ ← → | `Arrow*` | Mover foco entre `[data-tv-focusable]` |
| OK / Enter | `Enter` | Activar elemento enfocado |
| Regresar | `Backspace` / `Escape` | Cerrar modal / volver |
| Play/Pause | `MediaPlayPause` | Pausar carrusel automático |

```javascript
// useSpatialNav.js — resumen
const FOCUSABLE = '[data-tv-focusable="true"]'

function moveFocus(direction) {
  const nodes = [...document.querySelectorAll(FOCUSABLE)]
  const current = document.activeElement
  const idx = nodes.indexOf(current)
  // Lógica de vecinos según data-tv-order y dirección
}
```

### 4.5 Protocolo de conexión TV ↔ Sitio

```
┌─────────────┐    1. Escanea QR     ┌──────────────┐
│  Smart TV   │ ──────────────────► │  Móvil/Web   │
│  (widget)   │                     │  (usuario)   │
└──────┬──────┘                     └──────┬───────┘
       │                                   │
       │  2. POST /api/tv/pair             │ Confirma PIN
       │     { pin, deviceId }             │
       ▼                                   ▼
┌──────────────────────────────────────────────────┐
│              eventos-backend (Express)            │
│  Almacena sesión TV en memoria / Redis            │
│  Emite token JWT de sesión TV (TTL 24 h)          │
└──────────────────────┬───────────────────────────┘
                       │ 3. WebSocket /api/tv/ws
                       ▼
              ┌─────────────────┐
              │  Smart TV recibe │
              │  eventos en vivo │
              └─────────────────┘
```

**Tipos de datos transferidos:**

| Dato | Dirección | Formato | Propósito |
|------|-----------|---------|-----------|
| `pairingPin` | TV → Backend | `string` 6 dígitos | Emparejamiento inicial |
| `deviceId` | TV → Backend | `UUID` | Identificar el televisor |
| `accessToken` | Backend → TV | `JWT` | Autenticar sesión |
| `eventos[]` | Backend → TV | `JSON Array` | Listado de eventos destacados |
| `confirmacion` | TV → Backend | `{ eventoId, userId }` | Confirmar asistencia |
| `heartbeat` | TV ↔ Backend | `{ ts, status }` | Mantener conexión activa |

### 4.6 Integración en `LandingPage.jsx`

```jsx
import { EventlyTVWidget } from './widgets/EventlyTVWidget'
import { useTVDetection } from './widgets/hooks/useTVDetection'

export default function LandingPage() {
  const { isTV } = useTVDetection()

  return (
    <main>
      {/* Secciones existentes del sitio */}
      <Navbar />
      <Hero />
      {/* ... */}

      {/* Widget TV: solo visible en Smart TV o modo demo */}
      {isTV && (
        <EventlyTVWidget
          eventos={FEATURED_EVENTS}
          onPair={() => setPairingOpen(true)}
          paired={tvSession?.active}
        />
      )}
    </main>
  )
}
```

---

## 5. Flujo de actualización del sitio vía Git

### 5.1 Diagrama del ciclo de vida

```
Desarrollador                Git / GitHub              Producción
     │                            │                        │
     │  git checkout -b           │                        │
     │  feature/smart-tv-widget   │                        │
     ├───────────────────────────►│                        │
     │  commits + push            │                        │
     ├───────────────────────────►│  Pull Request          │
     │                            ├──────► Revisión        │
     │                            │        CI (build+test) │
     │                            │◄────── Merge develop   │
     │                            │                        │
     │  git checkout release/v1.2.0                        │
     ├───────────────────────────►│  Tag v1.2.0            │
     │                            ├───────────────────────►│ Deploy
     │                            │                        │ Smart TV
```

### 5.2 Pasos detallados para aplicar la actualización del widget

#### Paso 1 — Crear rama de feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/smart-tv-widget
```

#### Paso 2 — Añadir archivos del widget

```bash
# Crear estructura
mkdir -p eventos-frontend/src/widgets/hooks
mkdir -p eventos-frontend/src/utils

# Añadir componentes (EventlyTVWidget.jsx, hooks, tvBridge.js)
git add eventos-frontend/src/widgets/
git add eventos-frontend/src/utils/tvBridge.js
git commit -m "feat(tv-widget): añadir EventlyTVWidget y navegación espacial"
```

#### Paso 3 — Actualizar metadatos para TV en `index.html`

```html
<!-- Añadir en <head> -->
<meta name="viewport" content="width=1920, user-scalable=no" />
<meta name="tv-app-capable" content="yes" />
<link rel="manifest" href="/manifest.webmanifest" />
```

```bash
git add eventos-frontend/index.html
git commit -m "feat(tv): metadatos y manifest para Smart TV"
```

#### Paso 4 — Endpoint de emparejamiento en backend

```bash
git add eventos-backend/src/routes/tv.js
git add eventos-backend/src/services/tvPairing.js
git commit -m "feat(api): endpoints POST /api/tv/pair y WS /api/tv/ws"
```

#### Paso 5 — Pruebas locales

```bash
# Terminal 1 — Backend
cd eventos-backend && npm run dev

# Terminal 2 — Frontend
cd eventos-frontend && npm run dev

# Simular Smart TV en Chrome DevTools:
# → More tools → Network conditions → Custom UA: "SmartTV Tizen 6.0"
```

#### Paso 6 — Pull Request y merge

```bash
git push -u origin feature/smart-tv-widget
# Crear PR en GitHub: feature/smart-tv-widget → develop
# Revisar checklist CI (ver sección 5.3)
# Merge tras aprobación
```

#### Paso 7 — Release y despliegue

```bash
git checkout develop
git pull
git checkout -b release/v1.2.0
# Ajustes finales de versión en package.json
git commit -m "chore(release): preparar v1.2.0 con widget Smart TV"
git checkout main
git merge release/v1.2.0
git tag -a v1.2.0 -m "Evently v1.2.0 — Widget Smart TV"
git push origin main --tags
```

### 5.3 GitHub Actions — CI/CD

Archivo: `.github/workflows/deploy-evently.yml`

```yaml
name: Build & Deploy Evently

on:
  push:
    branches: [main, develop]
    tags: ['v*']
  pull_request:
    branches: [develop]

jobs:
  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: eventos-frontend/package-lock.json

      - name: Instalar y compilar
        working-directory: eventos-frontend
        run: |
          npm ci
          npm run build

      - name: Verificar widget TV en build
        run: |
          grep -r "evently-tv-widget" eventos-frontend/dist/ \
            && echo "✓ Widget TV incluido en bundle" \
            || echo "⚠ Widget TV no encontrado"

      - name: Desplegar a GitHub Pages
        if: startsWith(github.ref, 'refs/tags/v')
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: eventos-frontend/dist
```

### 5.4 Checklist de actualización (antes de cada release)

- [ ] `npm run build` sin errores en frontend y backend
- [ ] Widget visible con user-agent de Smart TV simulado
- [ ] Navegación con teclas ↑↓←→ funcional
- [ ] Emparejamiento QR/PIN completa el flujo en < 120 s
- [ ] WebSocket reconecta tras pérdida de red
- [ ] Paleta Evently respetada en modo `tv-mode`
- [ ] Tag SemVer creado y pusheado
- [ ] Notas de release documentadas en GitHub Releases

---

## 6. Estilos CSS para modo TV (`tv-mode`)

```css
/* index.css — añadir al final */
html.tv-mode {
  font-size: 22px;           /* 10-foot UI: texto legible a 3 m */
  cursor: none;
}

html.tv-mode [data-tv-focusable]:focus {
  outline: 3px solid #00F5FF; /* evently-accent */
  outline-offset: 4px;
  box-shadow: 0 0 30px rgba(0, 245, 255, 0.45);
}

html.tv-mode .tv-event-carousel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

html.tv-mode #evently-tv-widget {
  min-height: 100vh;
  background: #0A0A0A;
}
```

---

## 7. Errores comunes y soluciones (widget + Git)

| Error | Causa | Solución |
|-------|-------|----------|
| Widget no aparece en TV | User-agent no detectado | Ampliar patrones en `useTVDetection.js`; añadir query `?tv=1` para forzar modo demo |
| Foco atrapado en un elemento | Orden `data-tv-order` incorrecto | Revisar secuencia numérica sin saltos |
| QR expira antes de escanear | TTL muy corto | Aumentar a 120 s; mostrar cuenta regresiva en pantalla TV |
| `WebSocket connection failed` | Backend no expone WS o CORS bloquea | Habilitar `ws` en Express con `ws` package; configurar `cors` para origen del frontend |
| Build de GitHub Actions falla | `node_modules` no cacheado | Usar `npm ci` con `cache-dependency-path` correcto |
| Merge conflict en `LandingPage.jsx` | Ediciones paralelas en develop | Resolver manualmente; priorizar imports del widget al final de la sección de imports |
| TV muestra versión antigua | CDN/Pages con caché | Invalidar caché tras tag; añadir `?v=1.2.0` al manifest |

---

## 8. Elementos resueltos en esta actualización

| # | Problema previo | Solución aplicada |
|---|-----------------|-------------------|
| 1 | Sitio solo optimizado para móvil/desktop | Modo `tv-mode` con tipografía 10-foot UI |
| 2 | Sin interacción con control remoto | Hook `useSpatialNav` con `data-tv-focusable` |
| 3 | Smartwatch integrado pero no TV | Widget dedicado `EventlyTVWidget` |
| 4 | Despliegue manual sin trazabilidad | Git Flow + GitHub Actions + tags SemVer |
| 5 | Sin protocolo de emparejamiento | QR/PIN + JWT de sesión TV (24 h) |
| 6 | Eventos estáticos en frontend | Bridge WebSocket hacia API REST |

---

## 9. Pruebas de aceptación

| ID | Escenario | Resultado esperado |
|----|-----------|-------------------|
| TV-01 | Abrir sitio en Samsung Tizen Browser | `data-device="smart-tv"` en `<html>` |
| TV-02 | Navegar carrusel con control remoto | Foco visible con borde cyan `#00F5FF` |
| TV-03 | Emparejar con QR desde móvil | Estado `connected` en barra del widget |
| TV-04 | Confirmar asistencia desde TV | POST exitoso; toast en smartwatch (futuro) |
| TV-05 | Desconexión de red 10 s | WebSocket reconecta automáticamente |
| GIT-01 | PR con tests CI verdes | Merge permitido a `develop` |
| GIT-02 | Tag `v1.2.0` en `main` | Deploy automático a GitHub Pages |

---

## 10. Referencias

- [Samsung Tizen Web Device API](https://developer.samsung.com/smarttv/develop/api-references/tizen-web-device-api-references.html)
- [LG webOS TV Developer Guide](https://webostv.developer.lge.com/)
- [W3C Spatial Navigation](https://www.w3.org/TR/css-spatial-navigation-1/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning 2.0.0](https://semver.org/)

---

**Versión del documento:** 1.0  
**Proyecto:** Evently — Dispositivos Inteligentes  
**Rama Git asociada:** `feature/smart-tv-widget` → `release/v1.2.0`
