const { query } = require('../config/db')
const { hashPassword, verifyPassword, isValidPin } = require('../utils/password')
const { signAccessToken, revokeAccessToken } = require('../utils/tokens')

function publicUser(row) {
  return {
    id: row.id,
    name: row.nombre,
    email: row.email,
    ciudad: row.ciudad || 'Querétaro',
    telefono: row.telefono || '',
    hasPin: Boolean(row.pin_hash),
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * POST /api/auth/register
 * Crea usuario con password_hash (bcrypt). Nunca guarda texto plano.
 */
async function register(req, res) {
  try {
    const { name, email, password, confirmPassword, pin } = req.body || {}
    const nombre = typeof name === 'string' ? name.trim() : ''
    const mail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!nombre || nombre.length < 2) {
      return res.status(400).json({ ok: false, error: 'El nombre debe tener al menos 2 caracteres.' })
    }
    if (!isValidEmail(mail)) {
      return res.status(400).json({ ok: false, error: 'Ingresa un correo electrónico válido.' })
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' })
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ ok: false, error: 'Las contraseñas no coinciden.' })
    }
    if (pin != null && pin !== '' && !isValidPin(String(pin))) {
      return res.status(400).json({ ok: false, error: 'El PIN debe tener entre 4 y 6 dígitos.' })
    }

    const existing = await query('SELECT id FROM usuarios WHERE email = :email LIMIT 1', { email: mail })
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, error: 'Ya existe una cuenta con ese correo.' })
    }

    const password_hash = await hashPassword(password)
    const pin_hash = pin ? await hashPassword(String(pin)) : null

    const result = await query(
      `INSERT INTO usuarios (nombre, email, password_hash, pin_hash, ciudad)
       VALUES (:nombre, :email, :password_hash, :pin_hash, 'Querétaro')`,
      { nombre, email: mail, password_hash, pin_hash }
    )

    const rows = await query(
      'SELECT id, nombre, email, ciudad, telefono, pin_hash FROM usuarios WHERE id = :id LIMIT 1',
      { id: result.insertId }
    )
    const user = publicUser(rows[0])
    const token = signAccessToken(user)

    return res.status(201).json({
      ok: true,
      user,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    })
  } catch (err) {
    console.error('[auth/register]', err.message)
    return res.status(500).json({ ok: false, error: 'Error al registrar. Intenta de nuevo.' })
  }
}

/**
 * POST /api/auth/login
 * Autenticación con email + contraseña.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body || {}
    const mail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!isValidEmail(mail)) {
      return res.status(400).json({ ok: false, error: 'Ingresa un correo electrónico válido.' })
    }
    if (!password) {
      return res.status(400).json({ ok: false, error: 'Ingresa tu contraseña.' })
    }

    const rows = await query(
      `SELECT id, nombre, email, ciudad, telefono, password_hash, pin_hash, activo
       FROM usuarios WHERE email = :email LIMIT 1`,
      { email: mail }
    )

    // Mensaje genérico (no revelar si el email existe)
    if (rows.length === 0) {
      return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos.' })
    }

    const row = rows[0]
    if (!row.activo) {
      return res.status(403).json({ ok: false, error: 'Cuenta desactivada. Contacta soporte.' })
    }

    const valid = await verifyPassword(password, row.password_hash)
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos.' })
    }

    await query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = :id', { id: row.id })

    const user = publicUser(row)
    const token = signAccessToken(user)

    return res.json({
      ok: true,
      user,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    })
  } catch (err) {
    console.error('[auth/login]', err.message)
    return res.status(500).json({ ok: false, error: 'Error al iniciar sesión.' })
  }
}

/**
 * POST /api/auth/pin-login
 * Autenticación smartwatch: email + PIN 4–6 dígitos (hash bcrypt).
 */
async function pinLogin(req, res) {
  try {
    const { email, pin } = req.body || {}
    const mail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const pinStr = pin != null ? String(pin) : ''

    if (!isValidEmail(mail)) {
      return res.status(400).json({ ok: false, error: 'Correo inválido.' })
    }
    if (!isValidPin(pinStr)) {
      return res.status(400).json({ ok: false, error: 'El PIN debe tener entre 4 y 6 dígitos.' })
    }

    const rows = await query(
      `SELECT id, nombre, email, ciudad, telefono, pin_hash, activo
       FROM usuarios WHERE email = :email LIMIT 1`,
      { email: mail }
    )

    if (rows.length === 0 || !rows[0].pin_hash) {
      return res.status(401).json({ ok: false, error: 'PIN o correo incorrectos.' })
    }

    const row = rows[0]
    if (!row.activo) {
      return res.status(403).json({ ok: false, error: 'Cuenta desactivada.' })
    }

    const valid = await verifyPassword(pinStr, row.pin_hash)
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'PIN o correo incorrectos.' })
    }

    await query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = :id', { id: row.id })

    const user = publicUser(row)
    const token = signAccessToken(user)

    return res.json({
      ok: true,
      user,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      method: 'pin',
    })
  } catch (err) {
    console.error('[auth/pin-login]', err.message)
    return res.status(500).json({ ok: false, error: 'Error al autenticar con PIN.' })
  }
}

/**
 * POST /api/auth/set-pin  (protegido)
 * Configura o cambia el PIN del smartwatch.
 */
async function setPin(req, res) {
  try {
    const { pin, password } = req.body || {}
    const pinStr = pin != null ? String(pin) : ''

    if (!isValidPin(pinStr)) {
      return res.status(400).json({ ok: false, error: 'El PIN debe tener entre 4 y 6 dígitos.' })
    }
    if (!password) {
      return res.status(400).json({ ok: false, error: 'Confirma tu contraseña para cambiar el PIN.' })
    }

    const rows = await query(
      'SELECT id, password_hash FROM usuarios WHERE id = :id LIMIT 1',
      { id: req.user.id }
    )
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
    }

    const okPass = await verifyPassword(password, rows[0].password_hash)
    if (!okPass) {
      return res.status(401).json({ ok: false, error: 'Contraseña incorrecta.' })
    }

    const pin_hash = await hashPassword(pinStr)
    await query('UPDATE usuarios SET pin_hash = :pin_hash WHERE id = :id', {
      pin_hash,
      id: req.user.id,
    })

    const updated = await query(
      `SELECT id, nombre, email, ciudad, telefono, pin_hash FROM usuarios WHERE id = :id LIMIT 1`,
      { id: req.user.id }
    )

    return res.json({
      ok: true,
      message: 'PIN configurado correctamente.',
      user: publicUser(updated[0]),
    })
  } catch (err) {
    console.error('[auth/set-pin]', err.message)
    return res.status(500).json({ ok: false, error: 'Error al guardar el PIN.' })
  }
}

/**
 * PATCH /api/auth/profile  (protegido)
 * Actualiza datos del perfil: nombre, ciudad, teléfono.
 */
async function updateProfile(req, res) {
  try {
    const { name, ciudad, telefono } = req.body || {}
    const nombre = typeof name === 'string' ? name.trim() : ''
    const city = typeof ciudad === 'string' ? ciudad.trim() : ''
    const phone = typeof telefono === 'string' ? telefono.trim() : ''

    if (!nombre || nombre.length < 2) {
      return res.status(400).json({ ok: false, error: 'El nombre debe tener al menos 2 caracteres.' })
    }
    if (!city || city.length < 2) {
      return res.status(400).json({ ok: false, error: 'Ingresa una ciudad válida.' })
    }
    if (phone && !/^[\d\s+\-()]{7,20}$/.test(phone)) {
      return res.status(400).json({ ok: false, error: 'Teléfono inválido.' })
    }

    await query(
      `UPDATE usuarios
       SET nombre = :nombre, ciudad = :ciudad, telefono = :telefono
       WHERE id = :id`,
      {
        nombre,
        ciudad: city,
        telefono: phone || null,
        id: req.user.id,
      }
    )

    const rows = await query(
      `SELECT id, nombre, email, ciudad, telefono, pin_hash, activo
       FROM usuarios WHERE id = :id LIMIT 1`,
      { id: req.user.id }
    )
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
    }

    return res.json({
      ok: true,
      message: 'Perfil actualizado.',
      user: publicUser(rows[0]),
    })
  } catch (err) {
    console.error('[auth/profile]', err.message)
    return res.status(500).json({ ok: false, error: 'Error al actualizar el perfil.' })
  }
}

/**
 * GET /api/auth/me  (protegido)
 */
async function me(req, res) {
  try {
    const rows = await query(
      `SELECT id, nombre, email, ciudad, telefono, pin_hash, activo
       FROM usuarios WHERE id = :id LIMIT 1`,
      { id: req.user.id }
    )
    if (rows.length === 0 || !rows[0].activo) {
      return res.status(401).json({ ok: false, error: 'Sesión inválida.', code: 'UNAUTHORIZED' })
    }
    return res.json({ ok: true, user: publicUser(rows[0]) })
  } catch (err) {
    console.error('[auth/me]', err.message)
    return res.status(500).json({ ok: false, error: 'Error al obtener el perfil.' })
  }
}

/**
 * POST /api/auth/logout
 * Con JWT el cliente elimina el token; aquí registramos el cierre.
 */
async function logout(req, res) {
  revokeAccessToken(req.user.tokenPayload)
  return res.json({ ok: true, message: 'Sesión cerrada correctamente.' })
}

/**
 * GET /api/auth/mis-eventos  (protegido)
 * Pantalla protegida: requiere autenticación.
 */
async function misEventos(req, res) {
  try {
    const rows = await query(
      `SELECT r.id AS reserva_id, r.estado, r.confirmado_en,
              e.id, e.titulo, e.fecha_inicio, e.imagen_url,
              e.ubicacion, c.nombre AS categoria
       FROM reservas r
       JOIN eventos e ON e.id = r.evento_id
       JOIN categorias c ON c.id = e.categoria_id
       WHERE r.usuario_id = :uid AND r.estado = 'confirmada'
       ORDER BY e.fecha_inicio ASC
       LIMIT 50`,
      { uid: req.user.id }
    )

    return res.json({
      ok: true,
      user: req.user,
      eventos: rows || [],
    })
  } catch (err) {
    console.error('[auth/mis-eventos]', err.message)
    return res.status(500).json({ ok: false, error: 'Error al cargar tus eventos.' })
  }
}

module.exports = {
  register,
  login,
  pinLogin,
  setPin,
  updateProfile,
  me,
  logout,
  misEventos,
}
