const { db, admin } = require('../config/firebase');
const COLLECTION = 'listings';

function parseListParams(q = {}) {
  const out = {
    status: q.status || 'all',
    type: q.type || 'all',
    sort: q.sort || 'updatedAt_desc',
    limit: Math.min(parseInt(q.limit || '10', 10), 50),
    cursor: q.cursor || null,      
    search: (q.search || '').trim().toLowerCase(),
  };
  return out;
}

async function listListings(params = {}, opt = {}) {
  const { status, type, sort, limit, cursor, search } = parseListParams(params);
  const [field, dir] = sort.split('_');
  let ref = db.collection(COLLECTION);

  if (status !== 'all') ref = ref.where('status', '==', status);
  if (type !== 'all') ref = ref.where('type', '==', type);

  ref = ref.orderBy(field, dir === 'desc' ? 'desc' : 'asc').limit(limit);

  if (cursor) {
    const cursorSnap = await db.collection(COLLECTION).doc(cursor).get();
    if (cursorSnap.exists) ref = ref.startAfter(cursorSnap);
  }

  // Owner scoping (optional)
  if (opt.ownerId) {
    ref = db.collection(COLLECTION)
      .where('ownerId', '==', opt.ownerId)
      .orderBy(field, dir === 'desc' ? 'desc' : 'asc')
      .limit(limit);
  }

  const snap = await ref.get();
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (search) {
    items = items.filter(d =>
      [d.name, d.location, d.city, d.address]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(search))
    );
  }

  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;
  return { items, nextCursor };
}

async function createListing(payload) {
  const docRef = await db.collection(COLLECTION).add({
    ...payload,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

async function updateListing(id, payload) {
  await db.collection(COLLECTION).doc(id).update({
    ...payload,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) throw new Error('Not found');
  return { id: snap.id, ...snap.data() };
}

async function deleteListing(id) {
  await db.collection(COLLECTION).doc(id).delete();
  return { ok: true };
}

module.exports = {
  listListings,
  createListing,
  updateListing,
  deleteListing,
};
