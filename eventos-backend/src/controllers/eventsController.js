const { pool, query } = require('../config/db')

function serializeEvent(row) {
  const start = new Date(row.fecha_inicio)
  return {
    id: row.id,
    title: row.titulo,
    description: row.descripcion,
    category: row.categoria,
    categoryId: row.categoria_id,
    date: new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Mexico_City',
    }).format(start).replace('.', ''),
    time: new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Mexico_City',
    }).format(start),
    startsAt: row.fecha_inicio,
    location: row.ubicacion,
    spots: Math.max(0, row.cupos_totales - row.cupos_ocupados),
    totalSpots: row.cupos_totales,
    image: row.imagen_url,
    featured: Boolean(row.es_destacado),
    free: Boolean(row.es_gratuito),
    status: row.estado,
  }
}

async function listCategories(_req, res) {
  try {
    const rows = await query(
      `SELECT c.id, c.nombre, c.icono, c.color, COUNT(e.id) AS event_count
       FROM categorias c
       LEFT JOIN eventos e ON e.categoria_id = c.id AND e.estado = 'activo'
       WHERE c.activa = 1
       GROUP BY c.id, c.nombre, c.icono, c.color
       ORDER BY c.id`
    )

    return res.json({
      ok: true,
      categories: rows.map((row) => ({
        id: row.id,
        name: row.nombre,
        icon: row.icono,
        color: row.color,
        count: Number(row.event_count),
      })),
    })
  } catch (err) {
    console.error('[categories/list]', err.message)
    return res.status(500).json({ ok: false, error: 'Error al cargar categorías.' })
  }
}

async function listEvents(req, res) {
  try {
    const categoryId = Number(req.query.categoryId)
    const params = {}
    let filter = `WHERE e.estado = 'activo'`

    if (Number.isInteger(categoryId) && categoryId > 0) {
      filter += ' AND e.categoria_id = :categoryId'
      params.categoryId = categoryId
    }

    const rows = await query(
      `SELECT e.*, c.nombre AS categoria
       FROM eventos e
       JOIN categorias c ON c.id = e.categoria_id
       ${filter}
       ORDER BY e.es_destacado DESC, e.fecha_inicio ASC`,
      params
    )

    return res.json({ ok: true, events: rows.map(serializeEvent) })
  } catch (err) {
    console.error('[events/list]', err.message)
    return res.status(500).json({ ok: false, error: 'Error al cargar eventos.' })
  }
}

async function reserveEvent(req, res) {
  const eventId = Number(req.params.id)
  if (!Number.isInteger(eventId) || eventId < 1) {
    return res.status(400).json({ ok: false, error: 'Evento inválido.' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    const [events] = await conn.execute(
      `SELECT id, cupos_totales, cupos_ocupados, estado
       FROM eventos WHERE id = ? FOR UPDATE`,
      [eventId]
    )
    if (!events.length || events[0].estado !== 'activo') {
      await conn.rollback()
      return res.status(404).json({ ok: false, error: 'Evento no disponible.' })
    }

    const [existing] = await conn.execute(
      'SELECT id, estado FROM reservas WHERE usuario_id = ? AND evento_id = ? LIMIT 1',
      [req.user.id, eventId]
    )
    if (existing.length && existing[0].estado === 'confirmada') {
      await conn.rollback()
      return res.json({ ok: true, confirmed: true, message: 'Tu asistencia ya estaba confirmada.' })
    }

    const event = events[0]
    if (event.cupos_ocupados >= event.cupos_totales) {
      await conn.rollback()
      return res.status(409).json({ ok: false, error: 'Este evento ya no tiene cupos.' })
    }

    if (existing.length) {
      await conn.execute(
        `UPDATE reservas
         SET estado = 'confirmada', confirmado_en = NOW()
         WHERE id = ?`,
        [existing[0].id]
      )
    } else {
      await conn.execute(
        `INSERT INTO reservas (usuario_id, evento_id, estado)
         VALUES (?, ?, 'confirmada')`,
        [req.user.id, eventId]
      )
    }

    await conn.execute(
      'UPDATE eventos SET cupos_ocupados = cupos_ocupados + 1 WHERE id = ?',
      [eventId]
    )
    await conn.commit()

    return res.status(201).json({
      ok: true,
      confirmed: true,
      message: 'Asistencia confirmada.',
      spots: event.cupos_totales - event.cupos_ocupados - 1,
    })
  } catch (err) {
    await conn.rollback()
    console.error('[events/reserve]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo confirmar la asistencia.' })
  } finally {
    conn.release()
  }
}

async function cancelReservation(req, res) {
  const eventId = Number(req.params.id)
  if (!Number.isInteger(eventId) || eventId < 1) {
    return res.status(400).json({ ok: false, error: 'Evento inválido.' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [rows] = await conn.execute(
      `SELECT id, estado FROM reservas
       WHERE usuario_id = ? AND evento_id = ? FOR UPDATE`,
      [req.user.id, eventId]
    )

    if (!rows.length || rows[0].estado !== 'confirmada') {
      await conn.rollback()
      return res.status(404).json({ ok: false, error: 'No existe una reserva activa.' })
    }

    await conn.execute(
      `UPDATE reservas SET estado = 'cancelada' WHERE id = ?`,
      [rows[0].id]
    )
    await conn.execute(
      `UPDATE eventos SET cupos_ocupados = GREATEST(cupos_ocupados - 1, 0) WHERE id = ?`,
      [eventId]
    )
    await conn.commit()

    return res.json({ ok: true, confirmed: false, message: 'Reserva cancelada.' })
  } catch (err) {
    await conn.rollback()
    console.error('[events/cancel]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo cancelar la reserva.' })
  } finally {
    conn.release()
  }
}

async function addFavorite(req, res) {
  const eventId = Number(req.params.id)
  if (!Number.isInteger(eventId) || eventId < 1) {
    return res.status(400).json({ ok: false, error: 'Evento inválido.' })
  }

  try {
    const events = await query(
      `SELECT id FROM eventos WHERE id = :id AND estado = 'activo' LIMIT 1`,
      { id: eventId }
    )
    if (!events.length) {
      return res.status(404).json({ ok: false, error: 'Evento no disponible.' })
    }

    await query(
      `INSERT IGNORE INTO favoritos (usuario_id, evento_id)
       VALUES (:userId, :eventId)`,
      { userId: req.user.id, eventId }
    )
    return res.status(201).json({ ok: true, favorite: true })
  } catch (err) {
    console.error('[events/favorite]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo guardar el favorito.' })
  }
}

async function removeFavorite(req, res) {
  const eventId = Number(req.params.id)
  if (!Number.isInteger(eventId) || eventId < 1) {
    return res.status(400).json({ ok: false, error: 'Evento inválido.' })
  }

  try {
    await query(
      'DELETE FROM favoritos WHERE usuario_id = :userId AND evento_id = :eventId',
      { userId: req.user.id, eventId }
    )
    return res.json({ ok: true, favorite: false })
  } catch (err) {
    console.error('[events/unfavorite]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo quitar el favorito.' })
  }
}

module.exports = {
  listCategories,
  listEvents,
  reserveEvent,
  cancelReservation,
  addFavorite,
  removeFavorite,
}
