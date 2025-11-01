// src/app.js
const express = require('express');
const cors = require('cors');

const app = express();

// CORS
const origins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
// Example .env: CORS_ORIGINS=http://localhost:5173,http://localhost:3000
app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin / tools like curl (no Origin header)
      if (!origin) return cb(null, true);
      if (!origins.length) return cb(null, true);
      return cb(null, origins.includes(origin));
    },
    credentials: true,
    methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  })
);

// Helpful log
console.log('Allowed origins:', origins.length ? origins.join(', ') : '(any)');

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Health
app.get('/health', (_req, res) => res.json({ status: 'up' }));

// API
app.use('/api', require('./routes')); // mounts /admin, /owner, /client

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler (optional)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
