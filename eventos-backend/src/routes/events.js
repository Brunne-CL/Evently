const { Router } = require('express')
const { requireAuth } = require('../middleware/auth')
const ctrl = require('../controllers/eventsController')

const router = Router()

router.get('/categories', ctrl.listCategories)
router.get('/events', ctrl.listEvents)
router.post('/events/:id/reservation', requireAuth, ctrl.reserveEvent)
router.delete('/events/:id/reservation', requireAuth, ctrl.cancelReservation)
router.post('/events/:id/favorite', requireAuth, ctrl.addFavorite)
router.delete('/events/:id/favorite', requireAuth, ctrl.removeFavorite)

module.exports = router
