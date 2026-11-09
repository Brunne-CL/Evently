const { query } = require('../config/db')
const { hashPassword, verifyPassword, isValidPin } = require('../utils/password')
const { signAccessToken, revokeAccessToken } = require('../utils/tokens')
const { createQrSession, takeQrSession, peekQrSession, QR_CODE_RE } = require('../utils/qrSessions')

function publicUser(row) {
  return {
    id: row.id,
    name: row.nombre,
    email: row.email,
    ciudad: row.ciudad || 'Querétaro',
    telefono: row.telefono || '',
    hasPin: Boolean(row.pin_hash),
    role: row.rol === 'admin' ? 'admin' : 'usuario',
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
    const { name, email, password, confirmPassword, pin, telefono } = req.body || {}
    const nombre = typeof name === 'string' ? name.trim() : ''
    const mail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const phoneRaw = typeof telefono === 'string' ? telefono.trim() : ''
    const phoneDigits = phoneRaw.replace(/\D/g, '')
    const pinStr = pin != null && pin !== '' ? String(pin) : ''

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
    if (pinStr && !isValidPin(pinStr)) {
      return res.status(400).json({ ok: false, error: 'El PIN debe tener entre 4 y 6 dígitos.' })
    }
    if (pinStr && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
      return res.status(400).json({
        ok: false,
        error: 'Para configurar un PIN debes indicar un número de teléfono válido.',
      })
    }
    if (phoneRaw && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
      return res.status(400).json({ ok: false, error: 'Número de teléfono inválido.' })
    }

    const existing = await query('SELECT id FROM usuarios WHERE email = :email LIMIT 1', { email: mail })
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, error: 'Ya existe una cuenta con ese correo.' })
    }

    const password_hash = await hashPassword(password)
    const pin_hash = pinStr ? await hashPassword(pinStr) : null
    const telefonoVal = phoneDigits.length >= 7 ? phoneRaw : null

    const result = await query(
      `INSERT INTO usuarios (nombre, email, password_hash, pin_hash, ciudad, telefono)
       VALUES (:nombre, :email, :password_hash, :pin_hash, 'Querétaro', :telefono)`,
      { nombre, email: mail, password_hash, pin_hash, telefono: telefonoVal }
    )

    const rows = await query(
      'SELECT id, nombre, email, ciudad, telefono, pin_hash, rol FROM usuarios WHERE id = :id LIMIT 1',
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
      `SELECT id, nombre, email, ciudad, telefono, password_hash, pin_hash, rol, activo
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
 * Autenticación smartwatch: teléfono + PIN 4–6 dígitos (hash bcrypt).
 */
async function pinLogin(req, res) {
  try {
    const { telefono, phone, pin } = req.body || {}
    const rawPhone = typeof telefono === 'string' ? telefono : typeof phone === 'string' ? phone : ''
    const phoneDigits = String(rawPhone).replace(/\D/g, '')
    const pinStr = pin != null ? String(pin) : ''

    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      return res.status(400).json({ ok: false, error: 'Número de teléfono inválido.' })
    }
    if (!isValidPin(pinStr)) {
      return res.status(400).json({ ok: false, error: 'El PIN debe tener entre 4 y 6 dígitos.' })
    }

    const rows = await query(
      `SELECT id, nombre, email, ciudad, telefono, pin_hash, rol, activo
       FROM usuarios
       WHERE REGEXP_REPLACE(IFNULL(telefono, ''), '[^0-9]', '') = :phone
       LIMIT 1`,
      { phone: phoneDigits }
    )

    if (rows.length === 0 || !rows[0].pin_hash) {
      return res.status(401).json({
        ok: false,
        error: 'PIN o teléfono incorrectos. Guarda tu teléfono en el perfil web.',
      })
    }

    const row = rows[0]
    if (!row.activo) {
      return res.status(403).json({ ok: false, error: 'Cuenta desactivada.' })
    }

    const valid = await verifyPassword(pinStr, row.pin_hash)
    if (!valid) {
      return res.status(401).json({
        ok: false,
        error: 'PIN o teléfono incorrectos. Guarda tu teléfono en el perfil web.',
      })
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
      'SELECT id, password_hash, telefono FROM usuarios WHERE id = :id LIMIT 1',
      { id: req.user.id }
    )
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' })
    }

    const phoneDigits = String(rows[0].telefono || '').replace(/\D/g, '')
    if (phoneDigits.length < 7) {
      return res.status(400).json({
        ok: false,
        error: 'Primero guarda un número de teléfono en tu perfil para poder configurar el PIN.',
        code: 'PHONE_REQUIRED',
      })
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
      `SELECT id, nombre, email, ciudad, telefono, pin_hash, rol FROM usuarios WHERE id = :id LIMIT 1`,
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

    const phoneDigits = phone.replace(/\D/g, '')
    const current = await query(
      'SELECT pin_hash, rol FROM usuarios WHERE id = :id LIMIT 1',
      { id: req.user.id }
    )
    if (current[0]?.pin_hash && phoneDigits.length < 7) {
      return res.status(400).json({
        ok: false,
        error: 'No puedes quitar el teléfono mientras tengas un PIN. Borra o cambia el PIN primero, o deja un teléfono válido.',
        code: 'PHONE_REQUIRED_FOR_PIN',
      })
    }

    await query(
      `UPDATE usuarios
       SET nombre = :nombre, ciudad = :ciudad, telefono = :telefono
       WHERE id = :id`,
      {
        nombre,
        ciudad: city,
        telefono: phoneDigits.length >= 7 ? phone : null,
        id: req.user.id,
      }
    )

    const rows = await query(
      `SELECT id, nombre, email, ciudad, telefono, pin_hash, rol, activo
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
      `SELECT id, nombre, email, ciudad, telefono, pin_hash, rol, activo
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
  await revokeAccessToken(req.user.tokenPayload)
  return res.json({ ok: true, message: 'Sesión cerrada correctamente.' })
}

/**
 * GET /api/auth/mis-eventos  (protegido)
 * Pantalla protegida: requiere autenticación.
 */
async function misEventos(req, res) {
  try {
    const rows = await query(
      `SELECT e.*, c.nombre AS categoria, r.confirmado_en
       FROM reservas r
       JOIN eventos e ON e.id = r.evento_id
       JOIN categorias c ON c.id = e.categoria_id
       WHERE r.usuario_id = :uid AND r.estado = 'confirmada'
       ORDER BY e.fecha_inicio ASC
       LIMIT 50`,
      { uid: req.user.id }
    )

    const events = (rows || []).map((row) => {
      const start = new Date(row.fecha_inicio)
      const date = new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'America/Mexico_City',
      })
        .format(start)
        .replace('.', '')
      const time = new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Mexico_City',
      }).format(start)

      const cleanText = (value) =>
        String(value || '')
          .replace(/\u00b7|┬À|Â·/g, ' - ')
          .replace(/\s+-\s+/g, ' - ')
          .trim()

      const title = cleanText(row.titulo)
      const location = cleanText(row.ubicacion)

      return {
        id: row.id,
        title,
        titulo: title,
        description: row.descripcion,
        category: row.categoria,
        categoria: row.categoria,
        date,
        time,
        fecha_inicio: row.fecha_inicio,
        location,
        ubicacion: location,
        confirmed: true,
        confirmedAt: row.confirmado_en,
        confirmado_en: row.confirmado_en,
        estado: 'confirmada',
      }
    })

    return res.json({
      ok: true,
      user: req.user,
      events,
      eventos: events,
    })
  } catch (err) {
    console.error('[auth/mis-eventos]', err.message)
    return res.status(500).json({ ok: false, error: 'Error al cargar tus eventos.' })
  }
}

/**
 * POST /api/auth/qr-login  (protegido)
 * Crea un código de un solo uso para que el teléfono entre con la sesión web.
 * El QR lleva el código, no la contraseña ni el token.
 */
async function createQrLogin(req, res) {
  const ticket = await createQrSession(req.user.id)
  return res.json({
    ok: true,
    code: ticket.code,
    expiresAt: ticket.expiresAt,
    ttlSeconds: ticket.ttlSeconds,
  })
}

/**
 * GET /api/auth/qr-login/:code  (protegido)
 * La web consulta si el teléfono ya canjeó su código.
 */
async function qrLoginStatus(req, res) {
  const code = typeof req.params.code === 'string' ? req.params.code : ''
  if (!QR_CODE_RE.test(code)) {
    return res.json({ ok: true, status: 'expired' })
  }
  return res.json({ ok: true, status: await peekQrSession(code, req.user.id) })
}

/**
 * POST /api/auth/qr-login/redeem
 * El teléfono cambia el código por una sesión. El código queda usado.
 */
async function redeemQrLogin(req, res) {
  try {
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : ''
    if (!QR_CODE_RE.test(code)) {
      return res.status(400).json({ ok: false, error: 'Código QR inválido.' })
    }

    const taken = await takeQrSession(code)
    if (taken.error === 'used') {
      return res.status(401).json({
        ok: false,
        error: 'Ese código ya se usó. Genera otro desde la web.',
      })
    }
    if (taken.error) {
      return res.status(401).json({
        ok: false,
        error: 'Ese código ya no es válido. Genera otro desde la web.',
      })
    }

    const rows = await query(
      `SELECT id, nombre, email, ciudad, telefono, pin_hash, rol, activo
       FROM usuarios WHERE id = :id LIMIT 1`,
      { id: taken.userId }
    )
    if (rows.length === 0 || !rows[0].activo) {
      return res.status(401).json({
        ok: false,
        error: 'No se pudo iniciar la sesión con ese código.',
      })
    }

    await query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = :id', { id: rows[0].id })

    const user = publicUser(rows[0])
    const token = signAccessToken(user)

    return res.json({
      ok: true,
      user,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      method: 'qr',
    })
  } catch (err) {
    console.error('[auth/qr-login]', err.message)
    return res.status(500).json({ ok: false, error: 'Error al iniciar sesión con el código QR.' })
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
  createQrLogin,
  qrLoginStatus,
  redeemQrLogin,
}
