const router = require('express').Router();
const ctrl = require('./listings.controller');

// /api/app/listings (no auth needed for browsing)
router.get('/listings', ctrl.listPublic);

module.exports = router;
