const router = require('express').Router();
const { requireAuth, requireRole } = require('../../middleware/auth');
const ctrl = require('./listings.controller');

router.use(requireAuth, requireRole('owner'));

// /api/owner/listings
router.get('/listings', ctrl.listMine);
router.post('/listings', ctrl.createMine);
router.patch('/listings/:id', ctrl.updateMine);
router.delete('/listings/:id', ctrl.removeMine);

module.exports = router;
