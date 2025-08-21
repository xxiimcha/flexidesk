const PORT = process.env.PORT || 4000;

const ORIGINS = (process.env.ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

module.exports = { PORT, ORIGINS };
