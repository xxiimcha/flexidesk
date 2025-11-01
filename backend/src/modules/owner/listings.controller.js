const svc = require('../../services/listings.service');

exports.listMine = async (req, res) => {
  try {
    const data = await svc.listListings(req.query, { ownerId: req.user.uid });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list' });
  }
};

exports.createMine = async (req, res) => {
  try {
    const out = await svc.createListing({ ...req.body, ownerId: req.user.uid, status: 'draft' });
    res.status(201).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Create failed' });
  }
};

exports.updateMine = async (req, res) => {
  try {
    const out = await svc.updateListing(req.params.id, { ...req.body, ownerId: req.user.uid });
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Update failed' });
  }
};

exports.removeMine = async (req, res) => {
  try {
    // Optionally verify doc.ownerId === req.user.uid before delete (fetch, check, then delete)
    const out = await svc.deleteListing(req.params.id);
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: 'Delete failed' });
  }
};
