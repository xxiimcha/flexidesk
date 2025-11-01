const express = require('express');
const cors = require('cors');

const app = express();

const origins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'up' }));

app.use('/api', require('./routes')); // mounts /admin, /owner, /app

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = app;
