-- ============================================================
--  MIGRACIÓN 001 — Calendario de actualizaciones (MySQL)
--  Versión objetivo: 1.2.0
--  Depende de: schema-v1.0.0-mysql.sql  O  schema-mysql-auth.sql
-- ============================================================

USE evently_db;

CREATE TABLE IF NOT EXISTS esquema_versiones (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  version           VARCHAR(20) NOT NULL,
  nombre_migracion  VARCHAR(200) NOT NULL,
  descripcion       TEXT NULL,
  aplicada_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_esquema_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calendario_actualizaciones (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  version_objetivo  VARCHAR(20) NOT NULL,
  titulo            VARCHAR(200) NOT NULL,
  descripcion       TEXT NULL,
  tablas_afectadas  VARCHAR(500) NULL,
  tipo_cambio       ENUM('creacion','alteracion','indice','datos','rollback') NOT NULL,
  fecha_planificada DATE NOT NULL,
  fecha_aplicada    DATE NULL,
  responsable       VARCHAR(100) NULL,
  prioridad         ENUM('baja','media','alta','critica') NOT NULL DEFAULT 'media',
  estado            ENUM('pendiente','en_progreso','aplicada','cancelada','fallida')
                    NOT NULL DEFAULT 'pendiente',
  notas             TEXT NULL,
  creado_en         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_calendario_fecha (fecha_planificada),
  KEY idx_calendario_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de dispositivos enlazados (TV / watch) — preparación API pair
CREATE TABLE IF NOT EXISTS dispositivos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED NULL,
  device_id       VARCHAR(64) NOT NULL,
  device_type     ENUM('tv','watch','web','mobile') NOT NULL DEFAULT 'tv',
  alias           VARCHAR(100) NULL,
  ultimo_sync     DATETIME NULL,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_dispositivos_device (device_id),
  KEY idx_dispositivos_usuario (usuario_id),
  CONSTRAINT fk_dispositivos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO esquema_versiones (version, nombre_migracion, descripcion)
VALUES (
  '1.2.0',
  '001_calendario_actualizaciones.sql',
  'Calendario de esquema + tabla dispositivos para Smart TV / wearable'
)
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

UPDATE calendario_actualizaciones
SET estado = 'aplicada', fecha_aplicada = CURRENT_DATE
WHERE version_objetivo = '1.2.0'
  AND estado IN ('pendiente', 'en_progreso');
