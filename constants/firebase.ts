/** Firebase Realtime Database (Expo — rasmiy web SDK) */
export const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ??
    'AIzaSyDfk7SoDgPAmBe9vBXytgOqTUV7pSbi4Qo',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    'gen-lang-client-0278975104.firebaseapp.com',
  databaseURL:
    process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ??
    'https://gen-lang-client-0278975104-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
    'gen-lang-client-0278975104',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    'gen-lang-client-0278975104.firebasestorage.app',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '168527512486',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ??
    '1:168527512486:web:4e562647ea8aa448884567',
  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-BBSLYGZQ9M',
};
