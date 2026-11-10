const { verifyAccessToken, isAccessTokenRevoked } = require('../utils/tokens')
const { query } = require('../config/db')

/**
 * Exige Authorization: Bearer <token>
 * Sin token válido → 401 (pantalla/API inaccesible sin autenticación)
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      ok: false,
      error: 'No autenticado. Inicia sesión para continuar.',
      code: 'UNAUTHORIZED',
    })
  }

  let payload
  try {
    payload = verifyAccessToken(token)
    if (await isAccessTokenRevoked(payload)) {
      return res.status(401).json({
        ok: false,
        error: 'La sesión fue cerrada. Vuelve a iniciar sesión.',
        code: 'TOKEN_REVOKED',
      })
    }
  } catch {
    return res.status(401).json({
      ok: false,
      error: 'Sesión inválida o expirada. Vuelve a iniciar sesión.',
      code: 'TOKEN_INVALID',
    })
  }

  // Una baja desde el panel corta también las sesiones que ya estaban abiertas.
  try {
    if (!(await isActiveUser(payload.sub))) {
      return res.status(401).json({
        ok: false,
        error: 'Tu cuenta está desactivada. Escríbenos desde Soporte.',
        code: 'ACCOUNT_DISABLED',
      })
    }
  } catch (err) {
    console.error('[auth/guard]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo validar la sesión.' })
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    tokenPayload: payload,
  }
  return next()
}

async function isActiveUser(id) {
  const rows = await query('SELECT activo FROM usuarios WHERE id = :id LIMIT 1', { id })
  return rows.length > 0 && Number(rows[0].activo) === 1
}

/**
 * Para rutas abiertas que aprovechan la sesión si existe (formulario de soporte).
 * Nunca rechaza: sin sesión válida sigue con req.user = null.
 */
async function optionalAuth(req, _res, next) {
  req.user = null
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) return next()

  try {
    const payload = verifyAccessToken(token)
    if (!(await isAccessTokenRevoked(payload)) && (await isActiveUser(payload.sub))) {
      req.user = { id: payload.sub, email: payload.email, name: payload.name, tokenPayload: payload }
    }
  } catch {
    // Se trata como visitante.
  }
  return next()
}

module.exports = { requireAuth, optionalAuth }
