require('dotenv').config();          // load .env first
require('./config/firebase');        // initialize Firebase once

const app = require('./app');
const { PORT, ORIGINS } = require('./config/env');

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Allowed origins: ${ORIGINS.join(', ')}`);
});
