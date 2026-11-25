const { Router } = require('express')
const { query } = require('../config/db')
const { verifyAccessToken, isAccessTokenRevoked } = require('../utils/tokens')
const { subscribe } = require('../live/hub')

const router = Router()

async function viewerFromToken(token) {
  if (!token) return null
  try {
    const payload = verifyAccessToken(token)
    if (await isAccessTokenRevoked(payload)) return null
    const rows = await query(
      'SELECT id, rol, activo FROM usuarios WHERE id = :id LIMIT 1',
      { id: payload.sub }
    )
    if (!rows.length || Number(rows[0].activo) !== 1) return null
    return { id: Number(rows[0].id), admin: rows[0].rol === 'admin' }
  } catch {
    return null
  }
}

function scopesFor(change, viewer) {
  const scopes = []
  if (change.catalog) scopes.push('catalog')
  if (change.admin && viewer?.admin) scopes.push('admin')
  if (change.userId && viewer && Number(change.userId) === Number(viewer.id)) {
    scopes.push('user')
  }
  return scopes
}

router.get('/', async (req, res) => {
  const viewer = await viewerFromToken(String(req.query.token || ''))

  res.status(200)
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  if (typeof res.flushHeaders === 'function') res.flushHeaders()
  res.write('retry: 2000\n\n')

  const unsubscribe = subscribe((change) => {
    const scopes = scopesFor(change, viewer)
    if (!scopes.length) return
    res.write(`data: ${JSON.stringify({ scopes })}\n\n`)
  })

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n')
  }, 20000)

  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
})

module.exports = router
