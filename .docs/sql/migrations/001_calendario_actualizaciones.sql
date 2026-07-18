-- ============================================================
--  MIGRACIÓN 001 — Calendario de actualizaciones de esquema
--  Versión objetivo: 1.2.0
--  Depende de: schema-v1.0.0.sql
-- ============================================================

-- Verificar que la tabla base no exista antes de crearla
-- (idempotente para re-ejecuciones seguras)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'calendario_actualizaciones'
    ) THEN
        CREATE TABLE calendario_actualizaciones (
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
    END IF;
END $$;

-- Registrar migración
INSERT INTO esquema_versiones (version, nombre_migracion, descripcion)
VALUES (
    '1.2.0',
    '001_calendario_actualizaciones.sql',
    'Migración incremental: refuerzo de tabla calendario_actualizaciones e índice por fecha'
)
ON CONFLICT (version) DO NOTHING;

-- Índice para consultas del roadmap
CREATE INDEX IF NOT EXISTS idx_calendario_fecha
    ON calendario_actualizaciones (fecha_planificada);

CREATE INDEX IF NOT EXISTS idx_calendario_estado
    ON calendario_actualizaciones (estado);

-- Marcar entrada del calendario como aplicada
UPDATE calendario_actualizaciones
SET estado = 'aplicada', fecha_aplicada = CURRENT_DATE
WHERE version_objetivo = '1.2.0'
  AND estado = 'en_progreso';
