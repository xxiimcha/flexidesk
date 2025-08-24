const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { create, listMine, getOne, updateStatus } = require('../controllers/items.controller');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/items', requireAuth, wrap(create));       // -> POST /api/items
router.get('/items/mine', requireAuth, wrap(listMine)); // -> GET  /api/items/mine
router.get('/my/items', requireAuth, wrap(listMine));   // optional alias

router.get('/items/:id', requireAuth, wrap(getOne));
router.patch('/items/:id/status', requireAuth, wrap(updateStatus));

module.exports = router;
