const router = require('express').Router();

router.use('/admin', require('../modules/admin/routes'));
router.use('/owner', require('../modules/owner/routes'));
router.use('/app', require('../modules/client/routes'));

module.exports = router;
