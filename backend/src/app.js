const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { ORIGINS } = require('./config/env');

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cors({ origin: ORIGINS, optionsSuccessStatus: 200 }));

// mount all routes under /api
app.use('/api', routes);

// 404
app.use((req, res) => res.status(404).json({ error: 'not_found' }));

// centralized error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'server_error', details: err.message });
});

module.exports = app;
