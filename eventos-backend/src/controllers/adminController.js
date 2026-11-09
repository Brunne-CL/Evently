const { query } = require('../config/db')

async function overview(_req, res) {
  try {
    const [usersRow] = await query(
      `SELECT
         COUNT(*) AS users,
         SUM(rol = 'admin') AS admins,
         SUM(activo = 1) AS activeUsers
       FROM usuarios`
    )
    const [eventsRow] = await query(
      `SELECT
         COUNT(*) AS events,
         SUM(estado = 'activo') AS activeEvents,
         SUM(es_destacado = 1) AS featured,
         COALESCE(SUM(cupos_totales), 0) AS spots,
         COALESCE(SUM(cupos_ocupados), 0) AS taken
       FROM eventos`
    )
    const [reservationsRow] = await query(
      `SELECT
         COUNT(*) AS reservations,
         SUM(estado = 'confirmada') AS confirmed,
         SUM(estado = 'cancelada') AS cancelled
       FROM reservas`
    )
    const [favoritesRow] = await query('SELECT COUNT(*) AS favorites FROM favoritos')

    const categories = await query(
      `SELECT c.nombre AS name,
              COUNT(DISTINCT e.id) AS events,
              COUNT(DISTINCT r.id) AS reservations
       FROM categorias c
       LEFT JOIN eventos e ON e.categoria_id = c.id
       LEFT JOIN reservas r ON r.evento_id = e.id AND r.estado = 'confirmada'
       GROUP BY c.id, c.nombre
       ORDER BY reservations DESC, events DESC, c.nombre`
    )

    const events = await query(
      `SELECT e.id, e.titulo AS title, c.nombre AS category, e.fecha_inicio AS startsAt,
              e.ubicacion AS location, e.estado AS status, e.es_destacado AS featured,
              e.cupos_totales AS totalSpots, e.cupos_ocupados AS taken,
              (SELECT COUNT(*) FROM reservas r WHERE r.evento_id = e.id AND r.estado = 'confirmada') AS reservations,
              (SELECT COUNT(*) FROM favoritos f WHERE f.evento_id = e.id) AS favorites
       FROM eventos e
       JOIN categorias c ON c.id = e.categoria_id
       ORDER BY e.fecha_inicio ASC`
    )

    const users = await query(
      `SELECT u.id, u.nombre AS name, u.email, u.ciudad, u.telefono, u.rol AS role,
              u.activo AS active, u.creado_en AS createdAt, u.ultimo_acceso AS lastAccess,
              (SELECT COUNT(*) FROM reservas r WHERE r.usuario_id = u.id AND r.estado = 'confirmada') AS reservations
       FROM usuarios u
       ORDER BY u.creado_en DESC
       LIMIT 40`
    )

    const reservations = await query(
      `SELECT r.id, u.nombre AS user, u.email, e.titulo AS eventTitle,
              r.estado AS status, r.confirmado_en AS confirmedAt
       FROM reservas r
       JOIN usuarios u ON u.id = r.usuario_id
       JOIN eventos e ON e.id = r.evento_id
       ORDER BY r.confirmado_en DESC
       LIMIT 30`
    )

    const spots = Number(eventsRow.spots) || 0
    const taken = Number(eventsRow.taken) || 0

    return res.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      stats: {
        users: Number(usersRow.users) || 0,
        admins: Number(usersRow.admins) || 0,
        activeUsers: Number(usersRow.activeUsers) || 0,
        events: Number(eventsRow.events) || 0,
        activeEvents: Number(eventsRow.activeEvents) || 0,
        featured: Number(eventsRow.featured) || 0,
        reservations: Number(reservationsRow.reservations) || 0,
        confirmed: Number(reservationsRow.confirmed) || 0,
        cancelled: Number(reservationsRow.cancelled) || 0,
        favorites: Number(favoritesRow.favorites) || 0,
        occupancy: spots ? Math.round((taken / spots) * 100) : 0,
      },
      categories: categories.map((row) => ({
        name: row.name,
        events: Number(row.events) || 0,
        reservations: Number(row.reservations) || 0,
      })),
      events: events.map((row) => ({
        ...row,
        featured: Boolean(row.featured),
        totalSpots: Number(row.totalSpots) || 0,
        taken: Number(row.taken) || 0,
        reservations: Number(row.reservations) || 0,
        favorites: Number(row.favorites) || 0,
      })),
      users,
      reservations,
    })
  } catch (err) {
    console.error('[admin/overview]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo cargar el panel.' })
  }
}

module.exports = { overview }
