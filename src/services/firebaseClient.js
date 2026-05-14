import { initializeApp, getApp, getApps } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence, signInAnonymously } from 'firebase/auth';
import { doc, enableIndexedDbPersistence, getDoc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '../config/runtimeConfig';

let firebaseReadyPromise = null;
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

function getWebConfig() {
  return firebaseConfig?.webConfig || null;
}

function getStateDocPath() {
  return [firebaseConfig?.stateCollection || 'appState', firebaseConfig?.stateDocument || 'current'];
}

export function isFirebaseConfigured() {
  const webConfig = getWebConfig();
  return Boolean(webConfig?.apiKey && webConfig?.projectId && webConfig?.appId);
}

async function initFirebase() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase não configurado');
  }

  if (!firebaseApp) {
    const existingApp = getApps()[0];
    firebaseApp = existingApp || initializeApp(getWebConfig());
  }

  if (!firebaseAuth) {
    firebaseAuth = getAuth(firebaseApp);
    try {
      await setPersistence(firebaseAuth, browserLocalPersistence);
    } catch {
      // Ignore persistence failures and keep the session in-memory.
    }

    if (!firebaseAuth.currentUser && firebaseConfig?.anonymousAuth !== false) {
      try {
        await signInAnonymously(firebaseAuth);
      } catch {
        // Anonymous auth is optional in the free-tier setup.
      }
    }
  }

  if (!firebaseDb) {
    firebaseDb = getFirestore(firebaseApp);
    if (firebaseConfig?.enableIndexedDbPersistence !== false) {
      enableIndexedDbPersistence(firebaseDb).catch(() => undefined);
    }
  }

  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firebaseDb,
  };
}

export async function ensureFirebaseClient() {
  if (!firebaseReadyPromise) {
    firebaseReadyPromise = initFirebase();
  }

  return firebaseReadyPromise;
}

export async function getStateDocRef() {
  const { db } = await ensureFirebaseClient();
  return doc(db, ...getStateDocPath());
}

export async function readRemoteDatabase() {
  const ref = await getStateDocRef();
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function writeRemoteDatabase(database) {
  const ref = await getStateDocRef();
  await setDoc(ref, database, { merge: false });
  return database;
}

export async function subscribeRemoteDatabase(onChange) {
  const ref = await getStateDocRef();

  return onSnapshot(
    ref,
    (snapshot) => {
      onChange(snapshot.exists() ? snapshot.data() : null, null);
    },
    (error) => {
      onChange(null, error);
    },
  );
}
