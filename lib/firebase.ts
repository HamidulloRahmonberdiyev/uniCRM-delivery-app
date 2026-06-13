import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

import { firebaseConfig } from '@/constants/firebase';

let database: Database | null = null;

function getFirebaseApp() {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseDatabase(): Database {
  if (!database) {
    database = getDatabase(getFirebaseApp());
  }
  return database;
}
