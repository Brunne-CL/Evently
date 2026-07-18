# Práctica 10 — Base de datos estable para Evently

## 1. Objetivo

Documentar la implementación de una **base de datos relacional estable** para el sitio **Evently**, incluyendo:

- Esquema inicial versionado (`v1.0.0`).
- Sistema de **migraciones** incrementales.
- **Calendario de actualizaciones de esquema** con control de versiones.
- **Enlace seguro** entre el backend Express y PostgreSQL.
- Catálogo de **errores frecuentes** y sus soluciones.
- Procedimientos de **rollback** y respaldo.

---

## 2. Arquitectura de datos

```
┌────────────────────┐         HTTP/REST          ┌─────────────────────┐
│  eventos-frontend  │ ◄────────────────────────► │   eventos-backend   │
│  (React + Vite)    │    GET /api/eventos        │   (Express 5)       │
└────────────────────┘    POST /api/reservas       └──────────┬──────────┘
                                                              │
                                                     pg / connection pool
                                                              │
                                                              ▼
                                                   ┌─────────────────────┐
                                                   │    PostgreSQL 15    │
                                                   │  DB: evently_db     │
                                                   │  Esquema: public    │
                                                   └─────────────────────┘
```

### 2.1 Motor recomendado

| Motor | Versión | Justificación |
|-------|---------|---------------|
| **PostgreSQL** | 15+ | JSONB para metadatos de dispositivos, transacciones ACID, extensiones (`uuid-ossp`) |
| Alternativa | MySQL 8 | Compatible con el mismo esquema adaptando tipos `JSONB` → `JSON` |

---

## 3. Esquema relacional v1.0.0

El archivo SQL completo está en [`.docs/sql/schema-v1.0.0.sql`](./sql/schema-v1.0.0.sql).

### 3.1 Diagrama entidad-relación

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  categorias  │──1:N─►│   eventos    │──1:N─►│  reservas    │
└──────────────┘       └──────┬───────┘       └──────┬───────┘
                              │                      │
                              │                      │
                       ┌──────▼───────┐       ┌──────▼───────┐
                       │  ubicaciones │       │   usuarios   │
                       └──────────────┘       └──────┬───────┘
                                                     │
                                              ┌──────▼───────┐
                                              │ dispositivos │
                                              │ (TV/watch)   │
                                              └──────────────┘

┌────────────────────────┐    ┌─────────────────────────────┐
│ esquema_versiones        │    │ calendario_actualizaciones  │
│ (control de migraciones) │    │ (planificación de cambios)  │
└────────────────────────┘    └─────────────────────────────┘
```

### 3.2 Tablas principales

| Tabla | Descripción | Registros estimados |
|-------|-------------|---------------------|
| `categorias` | Tipos de evento (fiestas, conciertos, académicos…) | ~10 |
| `ubicaciones` | Lugares en Querétaro (Centro Histórico, Corregidora…) | ~50 |
| `eventos` | Eventos publicados en la plataforma | ~500/año |
| `usuarios` | Cuentas registradas | Creciente |
| `reservas` | Confirmaciones de asistencia | Alta frecuencia |
| `dispositivos` | Smart TV, smartwatch, móvil vinculados | Por usuario |
| `esquema_versiones` | Historial de migraciones aplicadas | 1 por migración |
| `calendario_actualizaciones` | Planificación futura de cambios al esquema | Por sprint |

### 3.3 Tabla `eventos` — definición

```sql
CREATE TABLE eventos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    categoria_id    INTEGER NOT NULL REFERENCES categorias(id),
    ubicacion_id    INTEGER REFERENCES ubicaciones(id),
    fecha_inicio    TIMESTAMPTZ NOT NULL,
    fecha_fin       TIMESTAMPTZ,
    cupos_totales   INTEGER NOT NULL DEFAULT 100 CHECK (cupos_totales >= 0),
    cupos_ocupados  INTEGER NOT NULL DEFAULT 0 CHECK (cupos_ocupados >= 0),
    imagen_url      VARCHAR(500),
    es_destacado    BOOLEAN NOT NULL DEFAULT FALSE,
    es_gratuito     BOOLEAN NOT NULL DEFAULT TRUE,
    estado          VARCHAR(20) NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('activo', 'cancelado', 'agotado', 'borrador')),
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.4 Tabla `dispositivos` — enlace con Smart TV y wearables

```sql
CREATE TABLE dispositivos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo            VARCHAR(20) NOT NULL
                    CHECK (tipo IN ('smart_tv', 'smartwatch', 'movil', 'tablet')),
    nombre          VARCHAR(100),
    device_id       VARCHAR(255) UNIQUE NOT NULL,  -- UUID del hardware
    plataforma      VARCHAR(50),   -- 'tizen', 'webos', 'wear_os', 'watchos'
    token_sesion    TEXT,
    token_expira    TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',  -- { "resolucion": "1920x1080", "modelo": "..." }
    emparejado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ultimo_ping     TIMESTAMPTZ,
    activo          BOOLEAN NOT NULL DEFAULT TRUE
);
```

### 3.5 Tabla `esquema_versiones` — control de migraciones

```sql
CREATE TABLE esquema_versiones (
    id              SERIAL PRIMARY KEY,
    version         VARCHAR(20) NOT NULL UNIQUE,  -- '1.0.0', '1.1.0'
    nombre_migracion VARCHAR(100) NOT NULL,        -- '001_calendario_actualizaciones'
    descripcion     TEXT NOT NULL,
    aplicada_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    aplicada_por    VARCHAR(100) DEFAULT CURRENT_USER,
    checksum        VARCHAR(64),                   -- SHA-256 del archivo SQL
    duracion_ms     INTEGER,
    estado          VARCHAR(20) NOT NULL DEFAULT 'aplicada'
                    CHECK (estado IN ('aplicada', 'revertida', 'fallida'))
);
```

### 3.6 Tabla `calendario_actualizaciones` — planificación de esquemas

```sql
CREATE TABLE calendario_actualizaciones (
    id              SERIAL PRIMARY KEY,
    version_objetivo VARCHAR(20) NOT NULL,         -- Versión SemVer del esquema
    titulo          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    tablas_afectadas TEXT[],                       -- ARRAY['eventos', 'dispositivos']
    tipo_cambio     VARCHAR(20) NOT NULL
                    CHECK (tipo_cambio IN ('creacion', 'alteracion', 'indice', 'datos', 'rollback')),
    fecha_planificada DATE NOT NULL,
    fecha_aplicada  DATE,
    responsable     VARCHAR(100),
    prioridad       VARCHAR(10) NOT NULL DEFAULT 'media'
                    CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
    estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'en_progreso', 'aplicada', 'cancelada', 'fallida')),
    notas           TEXT,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. Calendario de actualizaciones de esquema

### 4.1 Roadmap documentado

| Versión esquema | Fecha planificada | Cambio | Tablas afectadas | Estado |
|-----------------|-------------------|--------|------------------|--------|
| `1.0.0` | 15 May 2026 | Esquema inicial (categorías, eventos, usuarios) | Todas base | ✅ Aplicada |
| `1.0.1` | 01 Jun 2026 | Índices de rendimiento en `eventos.fecha_inicio` | `eventos` | ✅ Aplicada |
| `1.1.0` | 15 Jun 2026 | Tabla `dispositivos` + emparejamiento TV/watch | `dispositivos` | ✅ Aplicada |
| `1.1.1` | 20 Jun 2026 | Campo `metadata JSONB` en dispositivos | `dispositivos` | ✅ Aplicada |
| `1.2.0` | 01 Jul 2026 | Tabla `calendario_actualizaciones` + `esquema_versiones` | Nuevas | 🔄 En progreso |
| `1.2.1` | 10 Jul 2026 | Trigger `actualizado_en` automático | `eventos`, `usuarios` | ⏳ Pendiente |
| `1.3.0` | 01 Ago 2026 | Tabla `notificaciones` para push a wearables | `notificaciones` | ⏳ Pendiente |
| `2.0.0` | 01 Sep 2026 | Particionado de `reservas` por mes | `reservas` | ⏳ Pendiente |

### 4.2 Registro en `calendario_actualizaciones` (ejemplo)

```sql
INSERT INTO calendario_actualizaciones
    (version_objetivo, titulo, descripcion, tablas_afectadas, tipo_cambio, fecha_planificada, responsable, prioridad)
VALUES
    ('1.2.0',
     'Control de migraciones y calendario',
     'Añadir tablas esquema_versiones y calendario_actualizaciones para trazabilidad de cambios al esquema.',
     ARRAY['esquema_versiones', 'calendario_actualizaciones'],
     'creacion',
     '2026-07-01',
     'Equipo Evently',
     'alta');
```

---

## 5. Enlace a la base de datos (backend)

### 5.1 Variables de entorno

Archivo: `eventos-backend/.env` (nunca commitear — incluir en `.gitignore`)

```env
# Base de datos
DATABASE_URL=postgresql://evently_user:TU_PASSWORD@localhost:5432/evently_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evently_db
DB_USER=evently_user
DB_PASSWORD=TU_PASSWORD
DB_SSL=false

# Pool de conexiones
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT_MS=30000

# Aplicación
PORT=3001
NODE_ENV=development
JWT_SECRET=genera_un_secreto_largo_y_aleatorio
CORS_ORIGIN=http://localhost:5173
```

### 5.2 Módulo de conexión

Archivo: `eventos-backend/src/db/pool.js`

```javascript
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  min:      parseInt(process.env.DB_POOL_MIN || '2', 10),
  max:      parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
})

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en el pool:', err.message)
})

async function query(text, params) {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] ${duration}ms — ${text.slice(0, 80)}`)
    }
    return result
  } catch (err) {
    console.error('[DB] Query fallida:', err.message)
    throw err
  }
}

async function healthCheck() {
  const { rows } = await query('SELECT NOW() AS server_time, current_database() AS db')
  return rows[0]
}

module.exports = { pool, query, healthCheck }
```

### 5.3 Endpoint de salud

```javascript
// eventos-backend/src/routes/health.js
const { healthCheck } = require('../db/pool')

router.get('/api/health', async (req, res) => {
  try {
    const db = await healthCheck()
    res.json({ status: 'ok', database: db, version: '1.2.0' })
  } catch (err) {
    res.status(503).json({ status: 'error', message: 'Base de datos no disponible' })
  }
})
```

### 5.4 Dependencia requerida

```bash
cd eventos-backend
npm install pg
```

---

## 6. Sistema de migraciones

### 6.1 Estructura de carpetas

```
eventos-backend/
└── migrations/
    ├── 001_esquema_inicial.sql
    ├── 002_indices_eventos.sql
    ├── 003_tabla_dispositivos.sql
    └── 004_calendario_actualizaciones.sql
```

### 6.2 Script de migración

Archivo: `eventos-backend/scripts/migrate.js`

```javascript
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { query } = require('../src/db/pool')

const MIGRATIONS_DIR = path.join(__dirname, '../migrations')

async function getAppliedVersions() {
  const { rows } = await query(
    'SELECT version FROM esquema_versiones WHERE estado = $1 ORDER BY id',
    ['aplicada']
  )
  return new Set(rows.map((r) => r.version))
}

async function applyMigration(file) {
  const filePath = path.join(MIGRATIONS_DIR, file)
  const sql = fs.readFileSync(filePath, 'utf8')
  const checksum = crypto.createHash('sha256').update(sql).digest('hex')
  const version = file.match(/^(\d+)/)?.[1] // Extraer número

  const start = Date.now()
  const client = await require('../src/db/pool').pool.connect()

  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query(
      `INSERT INTO esquema_versiones (version, nombre_migracion, descripcion, checksum, duracion_ms)
       VALUES ($1, $2, $3, $4, $5)`,
      [version, file, `Migración automática: ${file}`, checksum, Date.now() - start]
    )
    await client.query('COMMIT')
    console.log(`✓ Migración aplicada: ${file}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(`✗ Error en ${file}:`, err.message)
    throw err
  } finally {
    client.release()
  }
}

async function migrate() {
  const applied = await getAppliedVersions()
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const version = file.match(/^(\d+)/)?.[1]
    if (!applied.has(version)) {
      await applyMigration(file)
    } else {
      console.log(`— Omitida (ya aplicada): ${file}`)
    }
  }
  console.log('Migraciones completadas.')
}

migrate().catch(() => process.exit(1))
```

### 6.3 Ejecutar migraciones

```bash
# 1. Crear base de datos
psql -U postgres -c "CREATE DATABASE evently_db;"
psql -U postgres -c "CREATE USER evently_user WITH PASSWORD 'TU_PASSWORD';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE evently_db TO evently_user;"

# 2. Aplicar esquema inicial
psql -U evently_user -d evently_db -f .docs/sql/schema-v1.0.0.sql

# 3. Ejecutar migraciones incrementales
node eventos-backend/scripts/migrate.js
```

---

## 7. Catálogo de errores y soluciones

### 7.1 Errores de conexión

| Código / Mensaje | Causa probable | Solución |
|------------------|----------------|----------|
| `ECONNREFUSED` | PostgreSQL no está corriendo | `sudo systemctl start postgresql` o iniciar servicio en Windows |
| `28P01` auth failed | Usuario/contraseña incorrectos | Verificar `.env`; resetear password: `ALTER USER evently_user PASSWORD '...'` |
| `3D000` database does not exist | BD no creada | `CREATE DATABASE evently_db;` |
| `ENOTFOUND` | Host incorrecto en `DB_HOST` | Usar `localhost` en dev; IP/hostname en producción |
| `ETIMEDOUT` | Firewall bloquea puerto 5432 | Abrir puerto en firewall; verificar reglas de cloud (AWS SG, etc.) |
| `SSL connection required` | Servidor exige SSL | Establecer `DB_SSL=true` en `.env` |

### 7.2 Errores de esquema y migraciones

| Código / Mensaje | Causa probable | Solución |
|------------------|----------------|----------|
| `42P01` relation does not exist | Tabla no creada o nombre incorrecto | Ejecutar `schema-v1.0.0.sql`; verificar nombre de tabla |
| `42701` duplicate column | Migración ya aplicada parcialmente | Revisar `esquema_versiones`; aplicar rollback manual |
| `23505` unique violation | Registro duplicado en INSERT | Usar `ON CONFLICT DO NOTHING` o validar antes de insertar |
| `23503` foreign key violation | Referencia a ID inexistente | Verificar integridad referencial; insertar padre primero |
| `23514` check violation | Valor fuera de CHECK constraint | Validar en backend antes de INSERT (ej. `estado` válido) |
| `40P01` deadlock detected | Transacciones concurrentes | Reintentar con backoff; reducir tiempo de transacción |
| Checksum mismatch | Archivo SQL modificado tras aplicarse | No editar migraciones aplicadas; crear nueva migración |

### 7.3 Errores de aplicación (backend)

| Síntoma | Causa | Solución |
|---------|-------|----------|
| `503` en `/api/health` | Pool agotado o BD caída | Aumentar `DB_POOL_MAX`; reiniciar PostgreSQL |
| Respuestas lentas (> 2 s) | Sin índices en consultas frecuentes | Aplicar migración `002_indices_eventos.sql` |
| `cupos_ocupados > cupos_totales` | Race condition en reservas | Usar `SELECT ... FOR UPDATE` en transacción |
| Token TV expirado | `token_expira` pasado | Renovar con nuevo emparejamiento QR |
| Datos no aparecen en frontend | CORS o URL de API incorrecta | Verificar `CORS_ORIGIN` y variable `VITE_API_URL` |

### 7.4 Procedimiento ante error crítico

```
1. Identificar error en logs (morgan + console.error)
2. Consultar esquema_versiones → última migración aplicada
3. Si migración falló a medias:
   a. ROLLBACK manual de la transacción
   b. Marcar estado = 'fallida' en esquema_versiones
   c. Corregir SQL y crear nueva migración (no editar la fallida)
4. Si datos corruptos:
   a. Restaurar desde backup (ver sección 8)
5. Actualizar calendario_actualizaciones.estado = 'fallida'
6. Documentar incidente en notas del calendario
```

---

## 8. Respaldo y rollback

### 8.1 Respaldo automático (cron diario)

```bash
# /etc/cron.d/evently-backup
0 3 * * * postgres pg_dump -U evently_user -d evently_db -F c \
  -f /backups/evently_$(date +\%Y\%m\%d).dump
```

### 8.2 Restaurar desde backup

```bash
pg_restore -U evently_user -d evently_db --clean /backups/evently_20260701.dump
```

### 8.3 Rollback de migración

```sql
-- Solo si existe script de rollback documentado
-- Ejemplo: revertir 004_calendario_actualizaciones.sql

BEGIN;
  DROP TABLE IF EXISTS calendario_actualizaciones;
  UPDATE esquema_versiones SET estado = 'revertida' WHERE nombre_migracion = '004_calendario_actualizaciones.sql';
  UPDATE calendario_actualizaciones SET estado = 'cancelada' WHERE version_objetivo = '1.2.0';
COMMIT;
```

---

## 9. Elementos resueltos con la base estable

| # | Problema anterior | Solución implementada |
|---|-------------------|----------------------|
| 1 | Eventos hardcodeados en `LandingPage.jsx` | Tabla `eventos` con API `GET /api/eventos` |
| 2 | Sin persistencia de usuarios | Tabla `usuarios` con hash de contraseña |
| 3 | Emparejamiento TV sin registro | Tabla `dispositivos` con `device_id` único |
| 4 | Cambios de esquema sin control | Tabla `esquema_versiones` + script `migrate.js` |
| 5 | Sin planificación de cambios | Tabla `calendario_actualizaciones` |
| 6 | Credenciales en código fuente | Variables en `.env` con `dotenv` |
| 7 | Sin verificación de salud del sistema | Endpoint `GET /api/health` |
| 8 | Consultas sin índices | Índices en `fecha_inicio`, `categoria_id`, `es_destacado` |

---

## 10. Consultas frecuentes del frontend

### 10.1 Eventos destacados (equivalente a `FEATURED_EVENTS` en React)

```sql
SELECT e.id, e.titulo, e.descripcion,
       e.fecha_inicio, e.cupos_totales - e.cupos_ocupados AS cupos,
       c.nombre AS categoria, u.nombre AS ubicacion
FROM eventos e
JOIN categorias c ON c.id = e.categoria_id
LEFT JOIN ubicaciones u ON u.id = e.ubicacion_id
WHERE e.es_destacado = TRUE
  AND e.estado = 'activo'
  AND e.fecha_inicio >= NOW()
ORDER BY e.fecha_inicio ASC
LIMIT 6;
```

### 10.2 Dispositivos activos de un usuario

```sql
SELECT id, tipo, plataforma, nombre, ultimo_ping
FROM dispositivos
WHERE usuario_id = $1 AND activo = TRUE
ORDER BY ultimo_ping DESC NULLS LAST;
```

### 10.3 Próximas actualizaciones de esquema

```sql
SELECT version_objetivo, titulo, fecha_planificada, prioridad, estado
FROM calendario_actualizaciones
WHERE estado IN ('pendiente', 'en_progreso')
ORDER BY fecha_planificada ASC;
```

---

## 11. Integración Git para cambios de esquema

| Acción | Comando / Proceso |
|--------|-------------------|
| Nueva migración | Crear `migrations/00X_descripcion.sql` en rama `feature/db-00X` |
| PR con migración | Incluir en descripción: tablas afectadas, rollback, impacto |
| Aplicar en staging | `node scripts/migrate.js` en servidor de pruebas |
| Verificar | `SELECT * FROM esquema_versiones ORDER BY id DESC LIMIT 1` |
| Merge a main | Solo tras QA exitoso en staging |
| Producción | Backup → migrate → health check → actualizar calendario |

---

## 12. Checklist de estabilidad de la base

- [ ] `.env` configurado y excluido de Git
- [ ] `schema-v1.0.0.sql` aplicado sin errores
- [ ] Todas las migraciones en `esquema_versiones` con estado `aplicada`
- [ ] `GET /api/health` retorna `200` con `server_time`
- [ ] Índices creados en columnas de consulta frecuente
- [ ] Backup diario configurado y probado (restore test)
- [ ] `calendario_actualizaciones` refleja roadmap actual
- [ ] Constraints CHECK validados con datos de prueba
- [ ] Pool de conexiones no agota bajo carga simulada (10 req/s)

---

## 13. Referencias

- [PostgreSQL 15 Documentation](https://www.postgresql.org/docs/15/)
- [node-postgres (pg)](https://node-postgres.com/)
- [dotenv — variables de entorno](https://github.com/motdotla/dotenv)
- [Flyway-style migrations pattern](https://documentation.red-gate.com/fd)

---

**Versión del documento:** 1.0  
**Esquema de BD asociado:** `v1.2.0`  
**Archivo SQL:** [schema-v1.0.0.sql](./sql/schema-v1.0.0.sql)
