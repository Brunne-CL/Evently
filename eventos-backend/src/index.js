require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { ping } = require('./config/db')
const { initRedis, getRedis } = require('./config/redis')
const authRoutes = require('./routes/auth')
const eventsRoutes = require('./routes/events')
const adminRoutes = require('./routes/admin')
const supportRoutes = require('./routes/support')
const { ensureAdmin } = require('./config/ensureAdmin')
const { ensureSchema } = require('./config/ensureSchema')

const app = express()
const PORT = Number(process.env.PORT) || 4000
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

// Un solo Nginx delante. Así el rate limit ve la IP real del visitante.
app.set('trust proxy', 1)
app.use(helmet())

// CORS_ORIGIN puede ser uno o varios (separados por coma), p. ej.:
// https://evently-qro.vercel.app,http://localhost:5173
const corsOrigins = String(CORS_ORIGIN)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      // Permitir tools sin Origin (curl, emulador, health checks)
      if (!origin) return callback(null, true)
      if (corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(null, false)
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '100kb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/api/health', async (_req, res) => {
  let dbState = 'down'
  let redisState = (process.env.REDIS_URL || '').trim() ? 'down' : 'memory'
  try {
    await ping()
    dbState = 'up'
    if ((process.env.REDIS_URL || '').trim()) {
      const redis = getRedis()
      if (!redis) throw new Error('redis down')
      await redis.ping()
      redisState = 'up'
    }
    res.json({
      ok: true,
      service: 'evently-api',
      db: dbState,
      redis: redisState,
      time: new Date().toISOString(),
    })
  } catch (err) {
    res.status(503).json({
      ok: false,
      service: 'evently-api',
      db: dbState,
      redis: redisState,
      error: err.message,
    })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/support', supportRoutes)
app.use('/api', eventsRoutes)

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada.' })
})

app.use((err, _req, res, _next) => {
  console.error('[unhandled]', err)
  res.status(500).json({ ok: false, error: 'Error interno del servidor.' })
})

async function main() {
  await ensureAdmin()
  await ensureSchema()

  if ((process.env.REDIS_URL || '').trim()) {
    await initRedis()
  } else {
    console.log('Redis no configurado: QR y cierre de sesión quedan en memoria.')
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Evently API → http://0.0.0.0:${PORT}`)
    console.log(`Health      → http://localhost:${PORT}/api/health`)
    console.log(`CORS origin → ${CORS_ORIGIN}`)
  })
}

main().catch((err) => {
  console.error('[startup]', err)
  process.exit(1)
})
