// src/modules/admin/routes.js
const router = require('express').Router();
const { requireAuth, requireRole } = require('../../middleware/auth');
const ctrl = require('./listings.controller');
const auth = require('./auth.controller');

router.post('/login', auth.login);

router.use(requireAuth, requireRole('admin'));

// /api/admin/listings
router.get('/listings', ctrl.list);
router.post('/listings', ctrl.create);
router.patch('/listings/:id', ctrl.update);
router.delete('/listings/:id', ctrl.remove);

module.exports = router;
