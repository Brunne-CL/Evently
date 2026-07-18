require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { ping } = require('./config/db')
const authRoutes = require('./routes/auth')
const eventsRoutes = require('./routes/events')

const app = express()
const PORT = Number(process.env.PORT) || 4000
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(helmet())
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
)
app.use(express.json({ limit: '100kb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/api/health', async (_req, res) => {
  try {
    await ping()
    res.json({ ok: true, service: 'evently-api', db: 'up', time: new Date().toISOString() })
  } catch (err) {
    res.status(503).json({
      ok: false,
      service: 'evently-api',
      db: 'down',
      error: err.message,
    })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api', eventsRoutes)

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada.' })
})

app.use((err, _req, res, _next) => {
  console.error('[unhandled]', err)
  res.status(500).json({ ok: false, error: 'Error interno del servidor.' })
})

app.listen(PORT, () => {
  console.log(`Evently API → http://localhost:${PORT}`)
  console.log(`Health      → http://localhost:${PORT}/api/health`)
  console.log(`CORS origin → ${CORS_ORIGIN}`)
})
