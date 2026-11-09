const { query } = require('./db')
const { hashPassword } = require('../utils/password')

async function ensureRoleColumn() {
  try {
    await query(
      `ALTER TABLE usuarios
       ADD COLUMN rol ENUM('usuario','admin') NOT NULL DEFAULT 'usuario' AFTER ciudad`
    )
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || /Duplicate column/i.test(err.message || '')) return
    throw err
  }
}

async function ensureAdmin() {
  await ensureRoleColumn()

  const email = (process.env.ADMIN_EMAIL || 'admin@evently.mx').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || 'EventlyAdmin2026'
  const existing = await query(
    'SELECT id, rol FROM usuarios WHERE email = :email LIMIT 1',
    { email }
  )

  if (!existing.length) {
    const password_hash = await hashPassword(password)
    await query(
      `INSERT INTO usuarios (nombre, email, password_hash, ciudad, rol)
       VALUES ('Administrador', :email, :password_hash, 'Querétaro', 'admin')`,
      { email, password_hash }
    )
    console.log(`Administrador creado: ${email}`)
    return
  }

  if (existing[0].rol !== 'admin') {
    await query(`UPDATE usuarios SET rol = 'admin' WHERE id = :id`, { id: existing[0].id })
    console.log(`Administrador actualizado: ${email}`)
  }
}

module.exports = { ensureAdmin }
