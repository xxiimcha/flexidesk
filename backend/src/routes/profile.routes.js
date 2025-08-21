const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const profile = require('../controllers/profile.controller');

router.post('/profile', requireAuth, profile.upsert);
router.get('/profile', requireAuth, profile.get);

module.exports = router;
