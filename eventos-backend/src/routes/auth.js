const { Router } = require('express')
const rateLimit = require('express-rate-limit')
const { requireAuth } = require('../middleware/auth')
const ctrl = require('../controllers/authController')

const router = Router()

/** Limita fuerza bruta en login / PIN */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados intentos. Espera 15 minutos.' },
})

router.post('/register', authLimiter, ctrl.register)
router.post('/login', authLimiter, ctrl.login)
router.post('/pin-login', authLimiter, ctrl.pinLogin)
router.post('/qr-login', requireAuth, ctrl.createQrLogin)
router.post('/qr-login/redeem', authLimiter, ctrl.redeemQrLogin)
router.get('/qr-login/:code', requireAuth, ctrl.qrLoginStatus)
router.post('/logout', requireAuth, ctrl.logout)

router.get('/me', requireAuth, ctrl.me)
router.patch('/profile', requireAuth, ctrl.updateProfile)
router.post('/set-pin', requireAuth, ctrl.setPin)
router.get('/mis-eventos', requireAuth, ctrl.misEventos)

module.exports = router
