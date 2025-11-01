const svc = require('../../services/listings.service');

exports.listPublic = async (req, res) => {
  try {
    // Force only active listings
    const q = { ...req.query, status: 'active' };
    const data = await svc.listListings(q);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list' });
  }
};
