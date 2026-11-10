const { query } = require('../config/db')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * POST /api/support
 * Cualquier persona puede reportar un problema. Con sesión se usan los datos de la cuenta;
 * sin sesión (por ejemplo, una cuenta desactivada) se piden nombre y correo.
 */
async function createTicket(req, res) {
  try {
    const subject = clean(req.body?.subject)
    const message = clean(req.body?.message)
    let name = clean(req.body?.name)
    let email = clean(req.body?.email).toLowerCase()
    let userId = null

    if (req.user) {
      const rows = await query('SELECT id, nombre, email FROM usuarios WHERE id = :id LIMIT 1', {
        id: req.user.id,
      })
      if (rows.length) {
        userId = rows[0].id
        name = rows[0].nombre
        email = rows[0].email
      }
    }

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ ok: false, error: 'Escribe tu nombre.' })
    }
    if (!EMAIL_RE.test(email) || email.length > 255) {
      return res.status(400).json({ ok: false, error: 'Ingresa un correo electrónico válido.' })
    }
    if (subject.length < 3 || subject.length > 150) {
      return res.status(400).json({ ok: false, error: 'El asunto debe tener entre 3 y 150 caracteres.' })
    }
    if (message.length < 10 || message.length > 2000) {
      return res.status(400).json({
        ok: false,
        error: 'Cuéntanos el problema con al menos 10 caracteres (máximo 2000).',
      })
    }

    const result = await query(
      `INSERT INTO soporte_tickets (usuario_id, nombre, email, asunto, mensaje)
       VALUES (:userId, :name, :email, :subject, :message)`,
      { userId, name, email, subject, message }
    )

    return res.status(201).json({
      ok: true,
      message: 'Recibimos tu reporte. Lo revisaremos pronto.',
      ticket: { id: result.insertId, status: 'pendiente' },
    })
  } catch (err) {
    console.error('[support/create]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo enviar el reporte.' })
  }
}

module.exports = { createTicket }
