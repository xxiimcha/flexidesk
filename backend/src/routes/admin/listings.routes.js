const express = require("express");
const { requireRole } = require("../../middleware/auth");
const ctrl = require("../../controllers/admin/listings.controller");

const router = express.Router();

router.post("/listings/:id/review", requireRole("admin"), ctrl.reviewListing);

module.exports = router;
