#!/usr/bin/env node
// scripts/createAdmin.js
require('dotenv').config({ path: './.env' });

const admin = require('firebase-admin');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

/** Initialize Firebase Admin using ONLY service-account creds (no ADC). */
function initAdmin() {
  if (admin.apps.length) return;

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_SERVICE_ACCOUNT_JSON,      // optional (stringified JSON)
    GOOGLE_APPLICATION_CREDENTIALS,     // optional (path to json)
  } = process.env;

  if (FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.log('Using FIREBASE_SERVICE_ACCOUNT_JSON from .env');
    const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    return;
  }

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    console.log('Using FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY from .env');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    return;
  }

  if (GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Using GOOGLE_APPLICATION_CREDENTIALS file path:', GOOGLE_APPLICATION_CREDENTIALS);
    const sa = require(require('path').resolve(GOOGLE_APPLICATION_CREDENTIALS));
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    return;
  }

  throw new Error(
    'Missing Firebase Admin credentials. Provide one of: ' +
    'FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY, ' +
    'or GOOGLE_APPLICATION_CREDENTIALS (file path).'
  );
}

async function upsertAdmin({ email, password, displayName, createProfile }) {
  const auth = admin.auth();
  const db = admin.firestore();

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`✔ Found existing user: ${userRecord.uid}`);
    const update = {};
    if (displayName && userRecord.displayName !== displayName) update.displayName = displayName;
    if (password) update.password = password;
    if (Object.keys(update).length) {
      await auth.updateUser(userRecord.uid, update);
      console.log('✔ Updated user fields');
    }
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: true,
        disabled: false,
      });
      console.log(`✔ Created user: ${userRecord.uid}`);
    } else {
      throw e;
    }
  }

  // Set RBAC claim
  await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
  console.log("✔ Set custom claims: { role: 'admin' }");

  // Common payload for Firestore docs
  const nowFields = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const baseDoc = {
    uid: userRecord.uid,
    email: userRecord.email,
    displayName: displayName || userRecord.displayName || 'Administrator',
    role: 'admin',
    status: 'active',
  };

  // 🔹 Upsert to profiles/{uid}
  if (createProfile) {
    await db.collection('profiles').doc(userRecord.uid).set(
      { ...baseDoc, ...nowFields },
      { merge: true }
    );
    console.log('✔ Upserted Firestore profile document');
  }

  // 🔹 Upsert to users/{uid}  <-- ADDED
  await db.collection('users').doc(userRecord.uid).set(
    {
      ...baseDoc,
      // add any extra fields you want to standardize in `users`:
      provider: userRecord.providerData?.[0]?.providerId || 'password',
      photoURL: userRecord.photoURL || null,
      phoneNumber: userRecord.phoneNumber || null,
      ...nowFields,
    },
    { merge: true }
  );
  console.log('✔ Upserted Firestore users document');

  // Ensure new claims are picked up next sign-in
  await auth.revokeRefreshTokens(userRecord.uid);
  console.log('✔ Revoked refresh tokens');

  return userRecord;
}

async function main() {
  console.log('Has PRIVATE_KEY?', !!process.env.FIREBASE_PRIVATE_KEY, '| Has JSON?', !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  initAdmin();

  const argv = yargs(hideBin(process.argv))
    .option('email', { type: 'string', demandOption: true })
    .option('password', { type: 'string', demandOption: true })
    .option('name', { type: 'string', default: 'Administrator' })
    .option('profile', { type: 'boolean', default: true })
    .strict()
    .help().argv;

  try {
    const user = await upsertAdmin({
      email: argv.email,
      password: argv.password,
      displayName: argv.name,
      createProfile: argv.profile,
    });

    console.log('\n=== Admin User Summary ===');
    console.log(`UID   : ${user.uid}`);
    console.log(`Email : ${user.email}`);
    console.log(`Name  : ${user.displayName}`);
    console.log("Claims: { role: 'admin' }");
    console.log('==========================\n');
    process.exit(0);
  } catch (err) {
    console.error('✖ Failed to create/update admin:', err?.message || err);
    process.exit(1);
  }
}

main();
