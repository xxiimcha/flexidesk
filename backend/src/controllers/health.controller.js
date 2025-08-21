exports.health = (_req, res) =>
  res.json({ ok: true, service: 'flexidesk-api', time: new Date().toISOString() });
