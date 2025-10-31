const express = require("express");
const { requireRole } = require("../../middleware/auth");
const ctrl = require("../../controllers/admin/users.controller");

const router = express.Router();

router.get("/users", requireRole("admin"), ctrl.listUsers);
router.post("/users/:id/verify", requireRole("admin"), ctrl.verifyUserId);
router.post("/users/:id/account", requireRole("admin"), ctrl.setAccountStatus);
router.get("/users/:id/listings", requireRole("admin"), ctrl.getOwnerListings);

module.exports = router;
