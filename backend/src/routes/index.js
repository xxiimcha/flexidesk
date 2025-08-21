// backend/src/routes/index.js
const router = require('express').Router();

router.use('/', require('./health.routes'));
router.use('/', require('./me.routes'));
router.use('/', require('./profile.routes'));
router.use('/', require('./items.routes'));

module.exports = router; // <-- fix: exports
