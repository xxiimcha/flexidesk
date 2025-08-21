const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { me } = require('../controllers/me.controller');

router.get('/me', requireAuth, me);

module.exports = router;
