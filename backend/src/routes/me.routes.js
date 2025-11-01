// src/routes/me.routes.js
const { Router } = require("express");
const { getMe }  = require("../controllers/me.controller");

const router = Router();

// pass a FUNCTION, not an object
router.get("/me", getMe);

module.exports = router;
