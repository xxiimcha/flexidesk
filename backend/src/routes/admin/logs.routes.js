const express = require("express");
const { requireRole } = require("../../middleware/auth");
const ctrl = require("../../controllers/admin/logs.controller");

const router = express.Router();

router.get("/logs", requireRole("admin"), ctrl.getLogs);

module.exports = router;
