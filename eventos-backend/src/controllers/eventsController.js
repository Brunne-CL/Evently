const { pool, query } = require('../config/db')

// Un formateador por proceso. Crearlo dentro del ciclo reservaba miles de objetos
// y, con el catálogo completo, llevaba la API por encima de 500 ms y varios GB.
const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Mexico_City',
})
const formatoHora = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Mexico_City',
})

const PAGE_MAX = 50
const idempotencia = new Map()

function limitePagina(value) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) return PAGE_MAX
  return Math.min(n, PAGE_MAX)
}

function desplazamiento(value) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0) return 0
  return n
}

function recuperarIdempotencia(clave) {
  if (!clave) return null
  const previa = idempotencia.get(clave)
  if (!previa) return null
  if (previa.expira < Date.now()) {
    idempotencia.delete(clave)
    return null
  }
  return previa
}

function responder(res, status, body, clave) {
  if (clave) idempotencia.set(clave, { status, body, expira: Date.now() + 120000 })
  return res.status(status).json(body)
}

function serializeEvent(row) {
  const start = row.fecha_inicio instanceof Date ? row.fecha_inicio : new Date(row.fecha_inicio)
  return {
    id: row.id,
    title: row.titulo,
    description: row.descripcion,
    category: row.categoria,
    categoryId: row.categoria_id,
    date: formatoFecha.format(start).replace('.', ''),
    time: formatoHora.format(start),
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
    const limit = limitePagina(req.query.limit)
    const offset = desplazamiento(req.query.offset)
    const params = {}
    let filter = `WHERE e.estado = 'activo'`

    if (Number.isInteger(categoryId) && categoryId > 0) {
      filter += ' AND e.categoria_id = :categoryId'
      params.categoryId = categoryId
    }

    const rows = await query(
      `SELECT e.id, e.titulo, e.descripcion, e.categoria_id, e.fecha_inicio, e.ubicacion,
              e.cupos_totales, e.cupos_ocupados, e.imagen_url, e.es_destacado, e.es_gratuito, e.estado,
              c.nombre AS categoria
       FROM eventos e
       JOIN categorias c ON c.id = e.categoria_id
       ${filter}
       ORDER BY e.es_destacado DESC, e.fecha_inicio ASC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    )

    return res.json({
      ok: true,
      limit,
      offset,
      events: rows.map(serializeEvent),
    })
  } catch (err) {
    console.error('[events/list]', err.message)
    return res.status(500).json({ ok: false, error: 'Error al cargar eventos.' })
  }
}

async function reserveEvent(req, res) {
  const encabezado = typeof req.get === 'function' ? req.get('Idempotency-Key') : req.headers?.['idempotency-key']
  const clave = String(encabezado || '').trim()
  const previa = recuperarIdempotencia(clave)
  if (previa) return res.status(previa.status).json(previa.body)

  const eventId = Number(req.params.id)
  if (!Number.isInteger(eventId) || eventId < 1) {
    return responder(res, 400, { ok: false, error: 'Evento inválido.' }, clave)
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
      return responder(res, 404, { ok: false, error: 'Evento no disponible.' }, clave)
    }

    const [existing] = await conn.execute(
      'SELECT id, estado FROM reservas WHERE usuario_id = ? AND evento_id = ? LIMIT 1',
      [req.user.id, eventId]
    )
    if (existing.length && existing[0].estado === 'confirmada') {
      await conn.rollback()
      return responder(res, 200, { ok: true, confirmed: true, message: 'Tu asistencia ya estaba confirmada.' }, clave)
    }

    const event = events[0]
    if (event.cupos_ocupados >= event.cupos_totales) {
      await conn.rollback()
      return responder(res, 409, { ok: false, error: 'Este evento ya no tiene cupos.' }, clave)
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

    return responder(res, 201, {
      ok: true,
      confirmed: true,
      message: 'Asistencia confirmada.',
      spots: event.cupos_totales - event.cupos_ocupados - 1,
    }, clave)
  } catch (err) {
    await conn.rollback()
    console.error('[events/reserve]', err.message)
    return responder(res, 500, { ok: false, error: 'No se pudo confirmar la asistencia.' }, clave)
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
