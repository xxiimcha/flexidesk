// services/listings.service.js
const { db, admin } = require('../config/firebase');
const COLLECTION = 'listings';

const SORT_WHITELIST = new Set([
  'updatedAt_asc', 'updatedAt_desc',
  'priceHourly_asc', 'priceHourly_desc',
  'capacity_asc', 'capacity_desc',
  'createdAt_asc', 'createdAt_desc',
]);

function parseListParams(q = {}) {
  const sort = SORT_WHITELIST.has(q.sort) ? q.sort : 'updatedAt_desc';
  const limit = Math.min(Math.max(parseInt(q.limit || '10', 10), 1), 50);
  return {
    status: q.status || 'all',
    type: q.type || 'all',
    sort,
    limit,
    cursor: q.cursor || null,        // we expect a doc ID
    search: (q.search || '').trim().toLowerCase(),
  };
}

async function listListings(params = {}, opt = {}) {
  const { status, type, sort, limit, cursor, search } = parseListParams(params);
  const [field, dirToken] = sort.split('_');
  const dir = dirToken === 'asc' ? 'asc' : 'desc';

  let ref = db.collection(COLLECTION);

  // Role/owner scoping (APPLY FIRST, but don't drop other filters)
  if (opt.ownerId) ref = ref.where('ownerId', '==', opt.ownerId);

  if (status !== 'all') ref = ref.where('status', '==', status);
  if (type !== 'all') ref = ref.where('type', '==', type);

  ref = ref.orderBy(field, dir).limit(limit);

  if (cursor) {
    // startAfter(documentSnapshot) ensures correct cursoring with the same orderBy
    const cursorSnap = await db.collection(COLLECTION).doc(cursor).get();
    if (cursorSnap.exists) {
      ref = ref.startAfter(cursorSnap);
    }
  }

  const snap = await ref.get();
  let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Optional post-filter search (note: may exclude matches beyond current page)
  if (search) {
    const hasTerm = v => v && String(v).toLowerCase().includes(search);
    items = items.filter(d =>
      hasTerm(d.name) || hasTerm(d.location) || hasTerm(d.city) || hasTerm(d.address)
    );
  }

  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;
  return { items, nextCursor };
}

async function createListing(payload, { ownerId } = {}) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const docRef = await db.collection(COLLECTION).add({
    ...payload,
    ...(ownerId ? { ownerId } : {}),
    createdAt: now,
    updatedAt: now,
  });
  const snap = await docRef.get();
  return { id: snap.id, ...snap.data() };
}

async function updateListing(id, payload) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.collection(COLLECTION).doc(id).update({
    ...payload,
    updatedAt: now,
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
