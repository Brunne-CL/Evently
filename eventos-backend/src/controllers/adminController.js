const { query } = require('../config/db')
const { hashPassword } = require('../utils/password')

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
    const [supportRow] = await query(
      `SELECT COUNT(*) AS tickets, SUM(estado = 'pendiente') AS openTickets FROM soporte_tickets`
    )

    const categories = await query(
      `SELECT c.id, c.nombre AS name,
              COUNT(DISTINCT e.id) AS events,
              COUNT(DISTINCT r.id) AS reservations
       FROM categorias c
       LEFT JOIN eventos e ON e.categoria_id = c.id
       LEFT JOIN reservas r ON r.evento_id = e.id AND r.estado = 'confirmada'
       GROUP BY c.id, c.nombre
       ORDER BY reservations DESC, events DESC, c.nombre`
    )

    const events = await query(
      `SELECT e.id, e.titulo AS title, e.descripcion AS description,
              e.categoria_id AS categoryId, c.nombre AS category, e.fecha_inicio AS startsAt,
              DATE_FORMAT(e.fecha_inicio, '%Y-%m-%dT%H:%i') AS startsAtLocal,
              e.ubicacion AS location, e.imagen_url AS image, e.es_gratuito AS free,
              e.estado AS status, e.es_destacado AS featured,
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
       LIMIT 500`
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

    const support = await query(
      `SELECT id, usuario_id AS userId, nombre AS name, email, asunto AS subject,
              mensaje AS message, estado AS status, creado_en AS createdAt, resuelto_en AS solvedAt
       FROM soporte_tickets
       ORDER BY (estado = 'pendiente') DESC, creado_en DESC
       LIMIT 200`
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
        tickets: Number(supportRow.tickets) || 0,
        openTickets: Number(supportRow.openTickets) || 0,
      },
      categories: categories.map((row) => ({
        id: row.id,
        name: row.name,
        events: Number(row.events) || 0,
        reservations: Number(row.reservations) || 0,
      })),
      events: events.map((row) => ({
        ...row,
        featured: Boolean(row.featured),
        free: Boolean(row.free),
        totalSpots: Number(row.totalSpots) || 0,
        taken: Number(row.taken) || 0,
        reservations: Number(row.reservations) || 0,
        favorites: Number(row.favorites) || 0,
      })),
      users: users.map((row) => ({
        ...row,
        active: Number(row.active) === 1,
        reservations: Number(row.reservations) || 0,
      })),
      reservations,
      support,
    })
  } catch (err) {
    console.error('[admin/overview]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo cargar el panel.' })
  }
}

// ── Personas ────────────────────────────────────────────────

const ROLES = ['usuario', 'admin']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function parseId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function isDuplicate(err) {
  return err && err.code === 'ER_DUP_ENTRY'
}

/** Devuelve { error } o { values } con los campos de una persona ya limpios. */
function readUser(body, { passwordRequired }) {
  const name = clean(body.name)
  const email = clean(body.email).toLowerCase()
  const ciudad = clean(body.ciudad) || 'Querétaro'
  const phone = clean(body.telefono)
  const role = clean(body.role) || 'usuario'
  const password = typeof body.password === 'string' ? body.password : ''

  if (name.length < 2 || name.length > 100) return { error: 'El nombre debe tener entre 2 y 100 caracteres.' }
  if (!EMAIL_RE.test(email) || email.length > 255) return { error: 'Ingresa un correo electrónico válido.' }
  if (ciudad.length < 2 || ciudad.length > 80) return { error: 'Ingresa una ciudad válida.' }
  if (phone && !/^[\d\s+\-()]{7,20}$/.test(phone)) return { error: 'Teléfono inválido.' }
  if (!ROLES.includes(role)) return { error: 'Rol inválido.' }
  if (passwordRequired && !password) return { error: 'Asigna una contraseña.' }
  if (password && password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' }

  const phoneDigits = phone.replace(/\D/g, '')
  return {
    values: {
      name,
      email,
      ciudad,
      telefono: phoneDigits.length >= 7 ? phone : null,
      role,
      password,
    },
  }
}

async function createUser(req, res) {
  try {
    const { error, values } = readUser(req.body || {}, { passwordRequired: true })
    if (error) return res.status(400).json({ ok: false, error })

    const existing = await query('SELECT id FROM usuarios WHERE email = :email LIMIT 1', {
      email: values.email,
    })
    if (existing.length) {
      return res.status(409).json({ ok: false, error: 'Ya existe una cuenta con ese correo.' })
    }

    const password_hash = await hashPassword(values.password)
    const result = await query(
      `INSERT INTO usuarios (nombre, email, password_hash, ciudad, telefono, rol)
       VALUES (:name, :email, :password_hash, :ciudad, :telefono, :role)`,
      {
        name: values.name,
        email: values.email,
        password_hash,
        ciudad: values.ciudad,
        telefono: values.telefono,
        role: values.role,
      }
    )
    return res.status(201).json({ ok: true, id: result.insertId, message: 'Persona creada.' })
  } catch (err) {
    if (isDuplicate(err)) {
      return res.status(409).json({ ok: false, error: 'Ya existe una cuenta con ese correo.' })
    }
    console.error('[admin/users/create]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo crear la persona.' })
  }
}

async function updateUser(req, res) {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ ok: false, error: 'Persona inválida.' })

    const { error, values } = readUser(req.body || {}, { passwordRequired: false })
    if (error) return res.status(400).json({ ok: false, error })

    const current = await query('SELECT id, pin_hash FROM usuarios WHERE id = :id LIMIT 1', { id })
    if (!current.length) return res.status(404).json({ ok: false, error: 'Persona no encontrada.' })

    if (id === Number(req.user.id) && values.role !== 'admin') {
      return res.status(400).json({ ok: false, error: 'No puedes quitarte tu propio rol de administrador.' })
    }
    if (current[0].pin_hash && !values.telefono) {
      return res.status(400).json({
        ok: false,
        error: 'Esta persona tiene un PIN para el reloj y necesita un teléfono válido.',
      })
    }

    const taken = await query('SELECT id FROM usuarios WHERE email = :email AND id <> :id LIMIT 1', {
      email: values.email,
      id,
    })
    if (taken.length) {
      return res.status(409).json({ ok: false, error: 'Ya existe una cuenta con ese correo.' })
    }

    await query(
      `UPDATE usuarios
       SET nombre = :name, email = :email, ciudad = :ciudad, telefono = :telefono, rol = :role
       WHERE id = :id`,
      {
        name: values.name,
        email: values.email,
        ciudad: values.ciudad,
        telefono: values.telefono,
        role: values.role,
        id,
      }
    )
    if (values.password) {
      const password_hash = await hashPassword(values.password)
      await query('UPDATE usuarios SET password_hash = :password_hash WHERE id = :id', {
        password_hash,
        id,
      })
    }
    return res.json({ ok: true, id, message: 'Persona actualizada.' })
  } catch (err) {
    if (isDuplicate(err)) {
      return res.status(409).json({ ok: false, error: 'Ya existe una cuenta con ese correo.' })
    }
    console.error('[admin/users/update]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo guardar la persona.' })
  }
}

/** Baja lógica: la cuenta y su historial se conservan, pero ya no puede entrar. */
async function setUserActive(req, res) {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ ok: false, error: 'Persona inválida.' })
    if (typeof req.body?.active !== 'boolean') {
      return res.status(400).json({ ok: false, error: 'Indica si la cuenta queda activa.' })
    }
    const active = req.body.active

    if (!active && id === Number(req.user.id)) {
      return res.status(400).json({ ok: false, error: 'No puedes dar de baja tu propia cuenta.' })
    }

    const result = await query('UPDATE usuarios SET activo = :active WHERE id = :id', {
      active: active ? 1 : 0,
      id,
    })
    if (!result.affectedRows) {
      return res.status(404).json({ ok: false, error: 'Persona no encontrada.' })
    }
    return res.json({
      ok: true,
      id,
      active,
      message: active ? 'Cuenta reactivada.' : 'Cuenta dada de baja.',
    })
  } catch (err) {
    console.error('[admin/users/active]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo cambiar el estado de la cuenta.' })
  }
}

// ── Eventos ─────────────────────────────────────────────────

const EVENT_STATES = ['activo', 'borrador', 'agotado', 'cancelado']
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2})?$/

/** "2026-06-15T18:00" → "2026-06-15 18:00:00" (hora local del evento) o null si no es una fecha real. */
function toSqlDateTime(value) {
  const match = DATE_RE.exec(clean(value))
  if (!match) return null
  const [year, month, day, hour, minute] = match.slice(1).map(Number)
  const check = new Date(Date.UTC(year, month - 1, day, hour, minute))
  const real =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day &&
    check.getUTCHours() === hour &&
    check.getUTCMinutes() === minute
  if (!real) return null
  return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:00`
}

/** Devuelve { error } o { values } con los campos de un evento ya limpios. */
async function readEvent(body) {
  const title = clean(body.title)
  const description = clean(body.description)
  const location = clean(body.location)
  const image = clean(body.image)
  const status = clean(body.status) || 'activo'
  const categoryId = parseId(body.categoryId)
  const startsAt = toSqlDateTime(body.startsAt)
  const totalSpots = Number(body.totalSpots)

  if (title.length < 3 || title.length > 200) return { error: 'El título debe tener entre 3 y 200 caracteres.' }
  if (description.length > 2000) return { error: 'La descripción admite hasta 2000 caracteres.' }
  if (!categoryId) return { error: 'Elige una categoría.' }
  if (!startsAt) return { error: 'Indica la fecha y la hora del evento.' }
  if (location.length > 255) return { error: 'El lugar admite hasta 255 caracteres.' }
  if (!Number.isInteger(totalSpots) || totalSpots < 1 || totalSpots > 100000) {
    return { error: 'El cupo debe ser un número entre 1 y 100000.' }
  }
  if (image && (image.length > 500 || !/^https?:\/\/\S+$/i.test(image))) {
    return { error: 'La imagen debe ser un enlace que empiece con http:// o https://.' }
  }
  if (!EVENT_STATES.includes(status)) return { error: 'Estado inválido.' }

  const category = await query('SELECT id FROM categorias WHERE id = :id LIMIT 1', { id: categoryId })
  if (!category.length) return { error: 'Esa categoría no existe.' }

  return {
    values: {
      title,
      description: description || null,
      categoryId,
      startsAt,
      location: location || null,
      totalSpots,
      image: image || null,
      featured: body.featured ? 1 : 0,
      free: body.free === false ? 0 : 1,
      status,
    },
  }
}

async function createEvent(req, res) {
  try {
    const { error, values } = await readEvent(req.body || {})
    if (error) return res.status(400).json({ ok: false, error })

    const result = await query(
      `INSERT INTO eventos
         (titulo, descripcion, categoria_id, fecha_inicio, ubicacion, cupos_totales,
          imagen_url, es_destacado, es_gratuito, estado)
       VALUES
         (:title, :description, :categoryId, :startsAt, :location, :totalSpots,
          :image, :featured, :free, :status)`,
      values
    )
    return res.status(201).json({ ok: true, id: result.insertId, message: 'Evento creado.' })
  } catch (err) {
    if (isDuplicate(err)) {
      return res.status(409).json({ ok: false, error: 'Ya existe un evento con ese título.' })
    }
    console.error('[admin/events/create]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo crear el evento.' })
  }
}

async function updateEvent(req, res) {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ ok: false, error: 'Evento inválido.' })

    const { error, values } = await readEvent(req.body || {})
    if (error) return res.status(400).json({ ok: false, error })

    const current = await query('SELECT cupos_ocupados FROM eventos WHERE id = :id LIMIT 1', { id })
    if (!current.length) return res.status(404).json({ ok: false, error: 'Evento no encontrado.' })
    if (values.totalSpots < Number(current[0].cupos_ocupados)) {
      return res.status(400).json({
        ok: false,
        error: `El cupo no puede ser menor a los ${current[0].cupos_ocupados} lugares ya reservados.`,
      })
    }

    await query(
      `UPDATE eventos
       SET titulo = :title, descripcion = :description, categoria_id = :categoryId,
           fecha_inicio = :startsAt, ubicacion = :location, cupos_totales = :totalSpots,
           imagen_url = :image, es_destacado = :featured, es_gratuito = :free, estado = :status
       WHERE id = :id`,
      { ...values, id }
    )
    return res.json({ ok: true, id, message: 'Evento actualizado.' })
  } catch (err) {
    if (isDuplicate(err)) {
      return res.status(409).json({ ok: false, error: 'Ya existe un evento con ese título.' })
    }
    console.error('[admin/events/update]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo guardar el evento.' })
  }
}

// ── Soporte ─────────────────────────────────────────────────

async function setTicketSolved(req, res) {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ ok: false, error: 'Reporte inválido.' })
    if (typeof req.body?.solved !== 'boolean') {
      return res.status(400).json({ ok: false, error: 'Indica si el reporte quedó solucionado.' })
    }
    const solved = req.body.solved

    const result = await query(
      `UPDATE soporte_tickets
       SET estado = :status, resuelto_en = ${solved ? 'NOW()' : 'NULL'}
       WHERE id = :id`,
      { status: solved ? 'solucionado' : 'pendiente', id }
    )
    if (!result.affectedRows) {
      return res.status(404).json({ ok: false, error: 'Reporte no encontrado.' })
    }
    return res.json({
      ok: true,
      id,
      status: solved ? 'solucionado' : 'pendiente',
      message: solved ? 'Reporte marcado como solucionado.' : 'Reporte marcado como pendiente.',
    })
  } catch (err) {
    console.error('[admin/support/update]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo actualizar el reporte.' })
  }
}

module.exports = {
  overview,
  createUser,
  updateUser,
  setUserActive,
  createEvent,
  updateEvent,
  setTicketSolved,
}
