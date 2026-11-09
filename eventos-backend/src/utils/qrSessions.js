const { randomBytes } = require('crypto')
const { getRedis } = require('../config/redis')

/** Un código vive 3 minutos y solo se canjea una vez. */
const TTL_MS = 3 * 60 * 1000
const KEEP_AFTER_MS = 60 * 1000
const KEEP_SEC = Math.ceil((TTL_MS + KEEP_AFTER_MS) / 1000)

/** code -> { userId, expiresAt, used } */
const sessions = new Map()

const TAKE_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 'missing' end
local row = cjson.decode(raw)
if row.used then return 'used' end
if tonumber(row.expiresAt) <= tonumber(ARGV[1]) then return 'expired' end
row.used = true
local ttl = redis.call('TTL', KEYS[1])
if ttl < 1 then ttl = 60 end
redis.call('SET', KEYS[1], cjson.encode(row), 'EX', ttl)
return tostring(row.userId)
`

function clean() {
  const now = Date.now()
  for (const [code, row] of sessions) {
    if (now > row.expiresAt + KEEP_AFTER_MS) sessions.delete(code)
  }
}

async function createQrSession(userId) {
  const owner = String(userId)
  const code = randomBytes(24).toString('base64url')
  const expiresAt = Date.now() + TTL_MS
  const redis = getRedis()

  if (redis) {
    const previous = await redis.get(`evently:qr-user:${owner}`)
    if (previous) await redis.del(`evently:qr:${previous}`)
    await redis.set(
      `evently:qr:${code}`,
      JSON.stringify({ userId: owner, expiresAt, used: false }),
      { EX: KEEP_SEC }
    )
    await redis.set(`evently:qr-user:${owner}`, code, { EX: KEEP_SEC })
    return { code, expiresAt, ttlSeconds: TTL_MS / 1000 }
  }

  clean()
  for (const [existing, row] of sessions) {
    if (row.userId === owner) sessions.delete(existing)
  }
  sessions.set(code, { userId: owner, expiresAt, used: false })
  return { code, expiresAt, ttlSeconds: TTL_MS / 1000 }
}

/**
 * Marca el código como usado y devuelve el id de usuario.
 * error: 'missing' | 'used' | 'expired'
 */
async function takeQrSession(code) {
  const redis = getRedis()
  if (redis) {
    const result = await redis.eval(TAKE_SCRIPT, {
      keys: [`evently:qr:${code}`],
      arguments: [String(Date.now())],
    })
    if (result === 'missing' || result === 'used' || result === 'expired') {
      return { error: result }
    }
    return { userId: String(result) }
  }

  clean()
  const row = sessions.get(code)
  if (!row) return { error: 'missing' }
  if (row.used) return { error: 'used' }
  if (row.expiresAt <= Date.now()) return { error: 'expired' }
  row.used = true
  return { userId: row.userId }
}

/** pending | used | expired. Si el código no es de este usuario, expired. */
async function peekQrSession(code, userId) {
  const redis = getRedis()
  if (redis) {
    const raw = await redis.get(`evently:qr:${code}`)
    if (!raw) return 'expired'
    const row = JSON.parse(raw)
    if (row.userId !== String(userId)) return 'expired'
    if (row.used) return 'used'
    if (row.expiresAt <= Date.now()) return 'expired'
    return 'pending'
  }

  clean()
  const row = sessions.get(code)
  if (!row || row.userId !== String(userId)) return 'expired'
  if (row.used) return 'used'
  if (row.expiresAt <= Date.now()) return 'expired'
  return 'pending'
}

module.exports = {
  createQrSession,
  takeQrSession,
  peekQrSession,
  QR_CODE_RE: /^[A-Za-z0-9_-]{20,128}$/,
}
