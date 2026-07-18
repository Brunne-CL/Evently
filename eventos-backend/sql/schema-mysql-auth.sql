-- ============================================================
--  EVENTLY — Esquema MySQL (Laragon) · Auth segura
--  Prácticas 11 y 12 — Dispositivos Inteligentes
--
--  Cómo aplicar en Laragon:
--  1. Abre HeidiSQL / phpMyAdmin
--  2. Ejecuta este script completo
--  3. Verifica: USE evently_db; SHOW TABLES;
-- ============================================================

CREATE DATABASE IF NOT EXISTS evently_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE evently_db;

-- ────────────────────────────────────────────────────────────
-- TABLA: usuarios
-- password_hash y pin_hash: NUNCA texto plano (bcrypt)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL COMMENT 'bcrypt — nunca texto plano',
  pin_hash        VARCHAR(255) NULL COMMENT 'PIN 4-6 dígitos hasheado (smartwatch)',
  telefono        VARCHAR(20) NULL,
  ciudad          VARCHAR(80) NOT NULL DEFAULT 'Querétaro',
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_acceso   DATETIME NULL,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuarios_email (email),
  KEY idx_usuarios_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- TABLA: categorias (mínimo para eventos)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(80) NOT NULL,
  icono       VARCHAR(50) NULL,
  color       VARCHAR(7) DEFAULT '#10B981',
  activa      TINYINT(1) NOT NULL DEFAULT 1,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_categorias_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO categorias (nombre, icono, color) VALUES
  ('Fiestas',        'PartyPopper',    '#10B981'),
  ('Festivales',     'Music',          '#10B981'),
  ('Académicos',     'GraduationCap',  '#10B981'),
  ('Networking',     'Briefcase',      '#10B981'),
  ('Deportes',       'Trophy',         '#10B981'),
  ('Culturales',     'Palette',        '#10B981'),
  ('Meetups',        'Coffee',         '#10B981'),
  ('Comunitarios',   'HeartHandshake', '#10B981');

-- ────────────────────────────────────────────────────────────
-- TABLA: eventos
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo          VARCHAR(200) NOT NULL,
  descripcion     TEXT NULL,
  categoria_id    INT UNSIGNED NOT NULL,
  fecha_inicio    DATETIME NOT NULL,
  fecha_fin       DATETIME NULL,
  ubicacion       VARCHAR(255) NULL,
  cupos_totales   INT NOT NULL DEFAULT 100,
  cupos_ocupados  INT NOT NULL DEFAULT 0,
  imagen_url      VARCHAR(500) NULL,
  es_destacado    TINYINT(1) NOT NULL DEFAULT 0,
  es_gratuito     TINYINT(1) NOT NULL DEFAULT 1,
  estado          ENUM('activo','cancelado','agotado','borrador') NOT NULL DEFAULT 'activo',
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_eventos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  UNIQUE KEY uq_eventos_titulo (titulo),
  KEY idx_eventos_fecha (fecha_inicio),
  KEY idx_eventos_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- TABLA: reservas (pantalla protegida "Mis eventos")
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservas (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED NOT NULL,
  evento_id       INT UNSIGNED NOT NULL,
  estado          ENUM('confirmada','cancelada','asistio') NOT NULL DEFAULT 'confirmada',
  confirmado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_reservas_evento  FOREIGN KEY (evento_id)  REFERENCES eventos(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_reserva_usuario_evento (usuario_id, evento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- TABLA: favoritos
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favoritos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id      INT UNSIGNED NOT NULL,
  evento_id       INT UNSIGNED NOT NULL,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_favoritos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_favoritos_evento  FOREIGN KEY (evento_id)  REFERENCES eventos(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_favorito_usuario_evento (usuario_id, evento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- Eventos iniciales consumidos por React mediante GET /api/events.
-- ON DUPLICATE KEY permite ejecutar el script varias veces sin duplicarlos.
-- ────────────────────────────────────────────────────────────
INSERT INTO eventos
  (titulo, descripcion, categoria_id, fecha_inicio, ubicacion,
   cupos_totales, cupos_ocupados, imagen_url, es_destacado)
VALUES
  (
    'Festival Universitario QRO 2026',
    'Música, arte y comunidad universitaria en el Centro Histórico.',
    (SELECT id FROM categorias WHERE nombre = 'Festivales'),
    '2026-06-15 18:00:00',
    'Plaza de Armas · Centro Histórico',
    850, 0,
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80&auto=format&fit=crop',
    1
  ),
  (
    'Charla: IA y el futuro del trabajo',
    'Una conversación abierta sobre inteligencia artificial y empleo.',
    (SELECT id FROM categorias WHERE nombre = 'Académicos'),
    '2026-07-22 17:00:00',
    'UAQ · Auditorio Fernando Díaz Ramírez',
    120, 0,
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80&auto=format&fit=crop',
    0
  ),
  (
    'Dev QRO · Meetup mensual',
    'Encuentro mensual para desarrolladores y profesionales de tecnología.',
    (SELECT id FROM categorias WHERE nombre = 'Networking'),
    '2026-08-08 19:30:00',
    'WeWork Centro Sur, QRO',
    60, 0,
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80&auto=format&fit=crop',
    0
  ),
  (
    'Fiesta de bienvenida estudiantil',
    'La bienvenida gratuita para la comunidad estudiantil de Querétaro.',
    (SELECT id FROM categorias WHERE nombre = 'Fiestas'),
    '2026-09-30 21:00:00',
    'Foro Imperial, Querétaro',
    450, 0,
    'https://images.unsplash.com/photo-1496024840928-4c417adf211d?w=1200&q=80&auto=format&fit=crop',
    0
  )
ON DUPLICATE KEY UPDATE
  descripcion = VALUES(descripcion),
  categoria_id = VALUES(categoria_id),
  fecha_inicio = VALUES(fecha_inicio),
  ubicacion = VALUES(ubicacion),
  cupos_totales = VALUES(cupos_totales),
  imagen_url = VALUES(imagen_url),
  es_destacado = VALUES(es_destacado);
