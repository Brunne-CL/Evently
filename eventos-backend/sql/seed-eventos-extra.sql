-- ============================================================
--  EVENTLY — Seed extra de eventos (MySQL / Laragon)
--  categoria_id: 1 Fiestas · 2 Festivales · 3 Académicos · 4 Networking
--                5 Deportes · 6 Culturales · 7 Meetups · 8 Comunitarios
-- ============================================================

-- Sin esto el cliente del contenedor lee el archivo como latin1 y rompe los acentos.
SET NAMES utf8mb4;

USE evently_db;

INSERT INTO eventos
  (titulo, descripcion, categoria_id, fecha_inicio, ubicacion,
   cupos_totales, cupos_ocupados, imagen_url, es_destacado)
VALUES
  ('Noche neón · After party QRO', 'DJ sets, luces y ambiente universitario. Entrada gratuita con registro.', 1, '2026-08-22 22:00:00', 'Alameda Hidalgo, Querétaro', 300, 0, 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80&auto=format&fit=crop', 1),
  ('Sunset rooftop social', 'Música en vivo y networking informal al atardecer.', 1, '2026-10-11 18:30:00', 'Azotea Centro Sur, QRO', 180, 0, 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80&auto=format&fit=crop', 0),
  ('Feria del Arte Independiente', 'Stands, murales y performances de artistas locales.', 2, '2026-09-05 11:00:00', 'Jardín Zenea · Centro Histórico', 1200, 0, 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80&auto=format&fit=crop', 1),
  ('QRO Food & Music Fest', 'Gastronomía local, food trucks y escenarios abiertos.', 2, '2026-11-14 12:00:00', 'Parque Bicentenario, Querétaro', 2000, 0, 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80&auto=format&fit=crop', 0),
  ('Taller: diseño de APIs REST', 'Hands-on con Express, autenticación JWT y buenas prácticas.', 3, '2026-08-01 10:00:00', 'ITESM Campus Querétaro · Lab 3', 80, 0, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80&auto=format&fit=crop', 0),
  ('Seminario de ciberseguridad IoT', 'Amenazas, riesgos y recomendaciones para dispositivos inteligentes.', 3, '2026-09-18 16:00:00', 'UAQ · Facultad de Informática', 150, 0, 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80&auto=format&fit=crop', 1),
  ('Open day · Ciencia de datos', 'Charlas cortas y demos con datasets de Querétaro.', 3, '2026-10-03 09:30:00', 'UPQ · Auditorio principal', 200, 0, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&auto=format&fit=crop', 0),
  ('Founders brunch QRO', 'Desayuno de founders, freelancers y product managers.', 4, '2026-07-25 09:00:00', 'Café del Jardín, Centro', 40, 0, 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1200&q=80&auto=format&fit=crop', 0),
  ('Women in Tech Querétaro', 'Panel y networking para mujeres en tecnología.', 4, '2026-09-12 18:00:00', 'Impact Hub Querétaro', 90, 0, 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80&auto=format&fit=crop', 1),
  ('Carrera 5K Evently Night Run', 'Carrera nocturna gratuita. Kit digital en app y smartwatch.', 5, '2026-08-16 19:00:00', 'Parque Querétaro 2000', 500, 0, 'https://images.unsplash.com/photo-1452626038306-a296f5703b94?w=1200&q=80&auto=format&fit=crop', 1),
  ('Yoga al aire libre · Amanecer', 'Sesión guiada para todos los niveles. Trae mat.', 5, '2026-07-28 07:00:00', 'Mirador de los Arcos', 75, 0, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80&auto=format&fit=crop', 0),
  ('Torneo relámpago de vóley playa', 'Inscripción por equipos de 4. Premios simbólicos.', 5, '2026-10-17 08:00:00', 'Club Deportivo Juriquilla', 64, 0, 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80&auto=format&fit=crop', 0),
  ('Cine al parque · Cortos mexicanos', 'Proyección al aire libre con cineastas invitados.', 6, '2026-08-09 20:00:00', 'Parque Alcanfores', 350, 0, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80&auto=format&fit=crop', 0),
  ('Exposición: Querétaro en píxeles', 'Fotografía urbana contemporánea de artistas locales.', 6, '2026-09-01 10:00:00', 'Museo de Arte de Querétaro', 220, 0, 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&q=80&auto=format&fit=crop', 1),
  ('Lectura en voz alta · Poesía viva', 'Open mic de poesía y narrativa breve.', 6, '2026-10-24 17:30:00', 'Biblioteca Central, Centro', 60, 0, 'https://images.unsplash.com/photo-1456513080800-b6bbe3b0c5d6?w=1200&q=80&auto=format&fit=crop', 0),
  ('React + Wearables meetup', 'Demos de apps web conectadas a smartwatch y Wear OS.', 7, '2026-08-20 19:00:00', 'Cowork Jurica', 55, 0, 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80&auto=format&fit=crop', 1),
  ('Coffee & Code · Sábados', 'Sesión informal para codear juntos y resolver dudas.', 7, '2026-07-26 10:00:00', 'Café Toscano, Centro Sur', 25, 0, 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80&auto=format&fit=crop', 0),
  ('UX Sketch night', 'Wireframes en papel, critique amigable y pizza.', 7, '2026-09-26 18:30:00', 'FabLab Querétaro', 35, 0, 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=1200&q=80&auto=format&fit=crop', 0),
  ('Jornada de reforestación periurbana', 'Siembra comunitaria. Herramientas y agua incluidas.', 8, '2026-08-02 08:00:00', 'Cerro del Pueblito · Acceso norte', 100, 0, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&q=80&auto=format&fit=crop', 0),
  ('Mercado de trueque estudiantil', 'Intercambia libros, ropa y gadgets. Sin dinero en efectivo.', 8, '2026-09-20 11:00:00', 'Plaza de Armas · Lateral', 250, 0, 'https://images.unsplash.com/photo-1488459716781-31f655e75f91?w=1200&q=80&auto=format&fit=crop', 1),
  ('Taller de primeros auxilios comunitarios', 'Capacitación básica con Cruz Roja Querétaro.', 8, '2026-10-10 09:00:00', 'Casa de la Cultura, Centro', 45, 0, 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80&auto=format&fit=crop', 0)
ON DUPLICATE KEY UPDATE
  descripcion = VALUES(descripcion),
  categoria_id = VALUES(categoria_id),
  fecha_inicio = VALUES(fecha_inicio),
  ubicacion = VALUES(ubicacion),
  cupos_totales = VALUES(cupos_totales),
  imagen_url = VALUES(imagen_url),
  es_destacado = VALUES(es_destacado);
