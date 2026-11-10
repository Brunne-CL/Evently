const { Router } = require('express')
const { requireAuth } = require('../middleware/auth')
const { query } = require('../config/db')
const ctrl = require('../controllers/adminController')

const router = Router()

async function requireAdmin(req, res, next) {
  try {
    const rows = await query(
      'SELECT rol, activo FROM usuarios WHERE id = :id LIMIT 1',
      { id: req.user.id }
    )
    if (!rows.length || Number(rows[0].activo) !== 1 || rows[0].rol !== 'admin') {
      return res.status(403).json({ ok: false, error: 'No tienes acceso de administrador.' })
    }
    return next()
  } catch (err) {
    console.error('[admin/guard]', err.message)
    return res.status(500).json({ ok: false, error: 'No se pudo validar el acceso.' })
  }
}

router.use(requireAuth, requireAdmin)

router.get('/overview', ctrl.overview)

router.post('/users', ctrl.createUser)
router.patch('/users/:id', ctrl.updateUser)
router.patch('/users/:id/active', ctrl.setUserActive)

router.post('/events', ctrl.createEvent)
router.patch('/events/:id', ctrl.updateEvent)

router.patch('/support/:id', ctrl.setTicketSolved)

module.exports = router
