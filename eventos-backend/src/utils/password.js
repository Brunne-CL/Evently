const bcrypt = require('bcryptjs')

const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12

async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS)
}

async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false
  return bcrypt.compare(plain, hash)
}

/** PIN de 4–6 dígitos (smartwatch) */
function isValidPin(pin) {
  return typeof pin === 'string' && /^\d{4,6}$/.test(pin)
}

module.exports = { hashPassword, verifyPassword, isValidPin }
