-- ============================================================
--  EVENTLY — Esquema relacional v1.0.0
--  Base de datos: evently_db (PostgreSQL 15+)
--  Proyecto: Dispositivos Inteligentes — Práctica 10
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ────────────────────────────────────────────────────────────
-- TABLA: categorias
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(80) NOT NULL UNIQUE,
    icono       VARCHAR(50),
    color       VARCHAR(7) DEFAULT '#7B2CBF',
    activa      BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categorias (nombre, icono, color) VALUES
    ('Fiestas',       'PartyPopper',     '#C026D3'),
    ('Conciertos',    'Music',           '#7B2CBF'),
    ('Académicos',    'GraduationCap',   '#A855F7'),
    ('Negocios',      'Briefcase',       '#00F5FF'),
    ('Deportes',      'Trophy',          '#22C55E'),
    ('Arte y cultura','Palette',         '#F59E0B'),
    ('Gastronomía',   'Coffee',          '#EF4444'),
    ('Comunidad',     'HeartHandshake',  '#8B5CF6')
ON CONFLICT (nombre) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- TABLA: ubicaciones (Querétaro, México)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ubicaciones (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL,
    direccion   VARCHAR(300),
    ciudad      VARCHAR(80) NOT NULL DEFAULT 'Querétaro',
    estado      VARCHAR(80) NOT NULL DEFAULT 'Querétaro',
    latitud     DECIMAL(10, 7),
    longitud    DECIMAL(10, 7),
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ubicaciones (nombre, direccion, latitud, longitud) VALUES
    ('Centro Histórico',        'Centro, Santiago de Querétaro', 20.5888, -100.3899),
    ('Estadio Corregidora',     'Av. Pie de la Cuesta',           20.5569, -100.3656),
    ('Centro de Congresos',     'Blvd. Bernardo Quintana',      20.6177, -100.4419),
    ('Tequisquiapan Centro',    'Centro, Tequisquiapan',          20.5225, -99.8920),
    ('Acueducto de Querétaro',  'Av. Zaragoza',                   20.5947, -100.3781)
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- TABLA: usuarios
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    telefono        VARCHAR(20),
    ciudad          VARCHAR(80) DEFAULT 'Querétaro',
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TABLA: eventos
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos (
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
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT cupos_validos CHECK (cupos_ocupados <= cupos_totales)
);

CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio  ON eventos (fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_categoria     ON eventos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_eventos_destacado     ON eventos (es_destacado) WHERE es_destacado = TRUE;
CREATE INDEX IF NOT EXISTS idx_eventos_estado        ON eventos (estado);

-- ────────────────────────────────────────────────────────────
-- TABLA: reservas (confirmaciones de asistencia)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    evento_id       UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    estado          VARCHAR(20) NOT NULL DEFAULT 'confirmada'
                    CHECK (estado IN ('confirmada', 'cancelada', 'en_espera')),
    origen          VARCHAR(20) DEFAULT 'web'
                    CHECK (origen IN ('web', 'smartwatch', 'smart_tv', 'movil')),
    confirmada_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, evento_id)
);

CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas (usuario_id);
CREATE INDEX IF NOT EXISTS idx_reservas_evento  ON reservas (evento_id);

-- ────────────────────────────────────────────────────────────
-- TABLA: dispositivos (Smart TV, smartwatch, móvil)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dispositivos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo            VARCHAR(20) NOT NULL
                    CHECK (tipo IN ('smart_tv', 'smartwatch', 'movil', 'tablet')),
    nombre          VARCHAR(100),
    device_id       VARCHAR(255) UNIQUE NOT NULL,
    plataforma      VARCHAR(50),
    token_sesion    TEXT,
    token_expira    TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    emparejado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ultimo_ping     TIMESTAMPTZ,
    activo          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_dispositivos_usuario ON dispositivos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_dispositivos_tipo    ON dispositivos (tipo);

-- ────────────────────────────────────────────────────────────
-- TABLA: esquema_versiones (control de migraciones)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS esquema_versiones (
    id              SERIAL PRIMARY KEY,
    version         VARCHAR(20) NOT NULL UNIQUE,
    nombre_migracion VARCHAR(100) NOT NULL,
    descripcion     TEXT NOT NULL,
    aplicada_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    aplicada_por    VARCHAR(100) DEFAULT CURRENT_USER,
    checksum        VARCHAR(64),
    duracion_ms     INTEGER,
    estado          VARCHAR(20) NOT NULL DEFAULT 'aplicada'
                    CHECK (estado IN ('aplicada', 'revertida', 'fallida'))
);

INSERT INTO esquema_versiones (version, nombre_migracion, descripcion) VALUES
    ('1.0.0', 'schema-v1.0.0.sql', 'Esquema inicial Evently: categorías, ubicaciones, eventos, usuarios, reservas, dispositivos')
ON CONFLICT (version) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- TABLA: calendario_actualizaciones (planificación de esquemas)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendario_actualizaciones (
    id              SERIAL PRIMARY KEY,
    version_objetivo VARCHAR(20) NOT NULL,
    titulo          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    tablas_afectadas TEXT[],
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

INSERT INTO calendario_actualizaciones
    (version_objetivo, titulo, descripcion, tablas_afectadas, tipo_cambio, fecha_planificada, responsable, prioridad, estado, fecha_aplicada)
VALUES
    ('1.0.0', 'Esquema inicial',
     'Creación de tablas base del sistema Evently.',
     ARRAY['categorias','ubicaciones','eventos','usuarios','reservas','dispositivos'],
     'creacion', '2026-05-15', 'Equipo Evently', 'alta', 'aplicada', '2026-05-15'),

    ('1.1.0', 'Tabla dispositivos Smart TV / wearables',
     'Soporte para emparejamiento de Smart TV y smartwatch con usuarios.',
     ARRAY['dispositivos'], 'creacion', '2026-06-15', 'Equipo Evently', 'alta', 'aplicada', '2026-06-15'),

    ('1.2.0', 'Control de migraciones y calendario',
     'Tablas esquema_versiones y calendario_actualizaciones para trazabilidad.',
     ARRAY['esquema_versiones','calendario_actualizaciones'],
     'creacion', '2026-07-01', 'Equipo Evently', 'alta', 'en_progreso', NULL),

    ('1.2.1', 'Trigger actualizado_en automático',
     'Actualizar campo actualizado_en en UPDATE de eventos y usuarios.',
     ARRAY['eventos','usuarios'], 'alteracion', '2026-07-10', 'Equipo Evently', 'media', 'pendiente', NULL),

    ('1.3.0', 'Tabla notificaciones push',
     'Notificaciones para wearables y Smart TV.',
     ARRAY['notificaciones'], 'creacion', '2026-08-01', 'Equipo Evently', 'media', 'pendiente', NULL)
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- DATOS DE EJEMPLO — eventos destacados (Querétaro)
-- ────────────────────────────────────────────────────────────
INSERT INTO eventos (titulo, descripcion, categoria_id, ubicacion_id, fecha_inicio, cupos_totales, es_destacado, imagen_url)
SELECT
    'Festival de Jazz Querétaro',
    'Noche de jazz en vivo con artistas locales e internacionales.',
    (SELECT id FROM categorias WHERE nombre = 'Conciertos'),
    (SELECT id FROM ubicaciones WHERE nombre = 'Centro Histórico'),
    '2026-08-15 20:00:00-06',
    500, TRUE,
    'https://images.unsplash.com/photo-1415201364774-f6f0ff35b28b'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE titulo = 'Festival de Jazz Querétaro');

INSERT INTO eventos (titulo, descripcion, categoria_id, ubicacion_id, fecha_inicio, cupos_totales, es_destacado)
SELECT
    'Feria de Tequisquiapan',
    'Artesanías, queso y vino en el corazón del Pueblo Mágico.',
    (SELECT id FROM categorias WHERE nombre = 'Gastronomía'),
    (SELECT id FROM ubicaciones WHERE nombre = 'Tequisquiapan Centro'),
    '2026-09-01 10:00:00-06',
    1000, TRUE
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE titulo = 'Feria de Tequisquiapan');

-- ────────────────────────────────────────────────────────────
-- FUNCIÓN: actualizar timestamp automáticamente
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_eventos_actualizado
    BEFORE UPDATE ON eventos
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE OR REPLACE TRIGGER trg_usuarios_actualizado
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

-- Fin del esquema v1.0.0
