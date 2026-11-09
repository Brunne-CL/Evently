-- ============================================================
--  EVENTLY — Esquema MySQL estable v1.0.0 (Práctica 10)
--  Motor: MySQL 8 / MariaDB 10 (Laragon)
--  BD: evently_db
--
--  Incluye tablas de dominio + control de esquema
--  (esquema_versiones, calendario_actualizaciones).
--  Auth / reservas / favoritos: alineado con schema-mysql-auth.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS evently_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE evently_db;

-- ─── Control de versiones de esquema ─────────────────────────
CREATE TABLE IF NOT EXISTS esquema_versiones (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  version           VARCHAR(20) NOT NULL,
  nombre_migracion  VARCHAR(200) NOT NULL,
  descripcion       TEXT NULL,
  aplicada_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_esquema_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Calendario esquelético de actualizaciones ───────────────
CREATE TABLE IF NOT EXISTS calendario_actualizaciones (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  version_objetivo  VARCHAR(20) NOT NULL,
  titulo            VARCHAR(200) NOT NULL,
  descripcion       TEXT NULL,
  tablas_afectadas  VARCHAR(500) NULL COMMENT 'Lista CSV de tablas',
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

-- Seed del roadmap (esqueleto)
INSERT INTO calendario_actualizaciones
  (version_objetivo, titulo, descripcion, tablas_afectadas, tipo_cambio,
   fecha_planificada, responsable, prioridad, estado)
VALUES
  ('1.0.0', 'Esquema base estable',
   'Tablas usuarios, categorias, eventos, reservas, favoritos + control de versión',
   'usuarios,categorias,eventos,reservas,favoritos,esquema_versiones,calendario_actualizaciones',
   'creacion', '2026-05-01', 'Equipo Evently', 'alta', 'aplicada'),
  ('1.1.0', 'Índices de rendimiento en eventos',
   'Refuerzo idx_eventos_fecha / estado para listados del sitio y TV',
   'eventos', 'indice', '2026-06-15', 'Backend', 'media', 'aplicada'),
  ('1.2.0', 'Soporte dispositivos (TV / watch)',
   'Preparar tabla dispositivos y puente API de emparejamiento',
   'dispositivos', 'creacion', '2026-07-20', 'Frontend+Backend', 'alta', 'en_progreso'),
  ('1.3.0', 'Auditoría de reservas desde Smart TV',
   'Columna origen_dispositivo en reservas (web|tv|watch)',
   'reservas', 'alteracion', '2026-08-30', 'Backend', 'media', 'pendiente')
ON DUPLICATE KEY UPDATE titulo = VALUES(titulo);

-- Registrar versión base
INSERT INTO esquema_versiones (version, nombre_migracion, descripcion)
VALUES (
  '1.0.0',
  'schema-v1.0.0-mysql.sql',
  'Base estable MySQL: dominio Evently + calendario de actualizaciones'
)
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);
