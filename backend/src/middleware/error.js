// src/middleware/error.js
const { v4: uuid } = require("uuid");

function scrub(body) {
  try {
    const copy = JSON.parse(JSON.stringify(body || {}));
    // Remove potentially huge/noisy fields
    if (copy.longDesc && String(copy.longDesc).length > 400) copy.longDesc = copy.longDesc.slice(0, 400) + "…";
    if (copy.photos) delete copy.photos;
    if (copy.photosMeta && copy.photosMeta.length > 5) copy.photosMeta = copy.photosMeta.slice(0, 5);
    return copy;
  } catch {
    return {};
  }
}

module.exports = function errorHandler(err, req, res, _next) {
  const requestId = req.id || uuid();
  const status = err.status || 500;

  const payload = {
    error: err.code || "INTERNAL_ERROR",
    message: err.message || "Unexpected server error",
    requestId,
  };

  // Helpful details in non-prod
  if (process.env.NODE_ENV !== "production") {
    payload.details = err.details || null;
    payload.stack = err.stack;
    payload.context = {
      method: req.method,
      path: req.originalUrl,
      uid: req.user?.uid || null,
      body: scrub(req.body),
      params: req.params,
      query: req.query,
    };
  }

  // One structured server log
  console.error(`[${requestId}] ${req.method} ${req.originalUrl} -> ${status}`, {
    code: payload.error,
    message: payload.message,
    details: payload.details,
  });

  res.setHeader("X-Request-Id", requestId);
  res.status(status).json(payload);
};
