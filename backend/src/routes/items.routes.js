const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { listMine } = require('../controllers/items.controller');

router.get('/my/items', requireAuth, listMine);

module.exports = router;
