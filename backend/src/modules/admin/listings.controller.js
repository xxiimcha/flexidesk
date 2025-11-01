const svc = require('../../services/listings.service');

exports.list = async (req, res) => {
  try {
    const data = await svc.listListings(req.query);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list' });
  }
};

exports.create = async (req, res) => {
  try {
    const out = await svc.createListing(req.body);
    res.status(201).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Create failed' });
  }
};

exports.update = async (req, res) => {
  try {
    const out = await svc.updateListing(req.params.id, req.body);
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Update failed' });
  }
};

exports.remove = async (req, res) => {
  try {
    const out = await svc.deleteListing(req.params.id);
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: 'Delete failed' });
  }
};
