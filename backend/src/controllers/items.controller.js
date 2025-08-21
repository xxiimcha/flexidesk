const { db } = require('../config/firebase');

exports.listMine = async (req, res, next) => {
  try {
    const q = await db.collection('items').where('ownerUid', '==', req.user.uid).get();
    const items = q.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ items });
  } catch (e) {
    next(e);
  }
};
