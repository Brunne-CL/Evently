const jwt = require('jsonwebtoken')
const { randomUUID } = require('crypto')

const SECRET = process.env.JWT_SECRET || 'evently_dev_secret'
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'
const revokedTokens = new Map()

function cleanExpiredRevocations() {
  const now = Math.floor(Date.now() / 1000)
  for (const [jti, exp] of revokedTokens) {
    if (exp <= now) revokedTokens.delete(jti)
  }
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.nombre || user.name,
      jti: randomUUID(),
    },
    SECRET,
    { expiresIn: EXPIRES_IN }
  )
}

function verifyAccessToken(token) {
  return jwt.verify(token, SECRET)
}

function revokeAccessToken(payload) {
  if (!payload?.jti || !payload?.exp) return
  cleanExpiredRevocations()
  revokedTokens.set(payload.jti, payload.exp)
}

function isAccessTokenRevoked(payload) {
  cleanExpiredRevocations()
  return Boolean(payload?.jti && revokedTokens.has(payload.jti))
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  revokeAccessToken,
  isAccessTokenRevoked,
}
