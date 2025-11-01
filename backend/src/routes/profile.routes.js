const router = require('express').Router();
const requireAuth = require('../middleware/auth');
const { upsert, get } = require('../controllers/profile.controller');

// Use just '/' since this file is mounted at '/api/profile'
router.post('/', requireAuth, upsert);
router.get('/', requireAuth, get);

module.exports = router;
