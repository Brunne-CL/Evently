const { verifyAccessToken, isAccessTokenRevoked } = require('../utils/tokens')

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

  try {
    const payload = verifyAccessToken(token)
    if (await isAccessTokenRevoked(payload)) {
      return res.status(401).json({
        ok: false,
        error: 'La sesión fue cerrada. Vuelve a iniciar sesión.',
        code: 'TOKEN_REVOKED',
      })
    }
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      tokenPayload: payload,
    }
    return next()
  } catch {
    return res.status(401).json({
      ok: false,
      error: 'Sesión inválida o expirada. Vuelve a iniciar sesión.',
      code: 'TOKEN_INVALID',
    })
  }
}

module.exports = { requireAuth }
