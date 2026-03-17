// STUB: Firebase replaced with custom auth + PostgreSQL
// This file exists only for compatibility with existing code
// All Firebase calls are stubbed to prevent crashes

console.warn('⚠️ Firebase is stubbed out - using custom auth + PostgreSQL instead');

// Create a mock Firebase app object
const mockApp = {
  name: '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false,
} as any;

// Stub exports to prevent crashes
export const app = mockApp;

export const auth = {
  app: mockApp,
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    // Call with null user initially
    setTimeout(() => callback(null), 0);
    return () => {}; // Return unsubscribe function
  },
  signOut: async () => console.warn('Auth stubbed: signOut called'),
  signInWithEmailAndPassword: async () => {
    console.warn('Auth stubbed: signInWithEmailAndPassword called');
    throw new Error('Authentication is disabled in development mode');
  },
} as any;

export const db = {
  app: mockApp,
  type: 'firestore',
} as any;

export const storage = {
  app: mockApp,
  maxOperationRetryTime: 120000,
  maxUploadRetryTime: 600000,
} as any;

// Export Firebase functions as stubs
export const getStorage = () => {
  console.warn('Firebase Storage is stubbed - file operations disabled');
  return storage;
};
export const getAuth = () => auth;
export const getFirestore = () => db;
export const initializeApp = () => mockApp;
