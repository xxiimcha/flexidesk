// src/routes/listings.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/listings.controller");

// Optional auth should not break public routes
let requireAuthOptional = (req, _res, next) => next();
try {
  const mw = require("../middlewares/auth");
  if (typeof mw.requireAuthOptional === "function") {
    requireAuthOptional = mw.requireAuthOptional;
  }
} catch (_) { /* middleware not present – ok */ }

// ✅ Use the exact exported names from your controller
router.get("/published", requireAuthOptional, ctrl.listPublished);
router.get("/public/:id", ctrl.getPublic);

module.exports = router;
