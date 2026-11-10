const { Router } = require('express')
const rateLimit = require('express-rate-limit')
const { optionalAuth } = require('../middleware/auth')
const ctrl = require('../controllers/supportController')

const router = Router()

/** El formulario es público: se limita para que no lo llenen de basura. */
const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Enviaste varios reportes seguidos. Espera unos minutos.' },
})

router.post('/', supportLimiter, optionalAuth, ctrl.createTicket)

module.exports = router
