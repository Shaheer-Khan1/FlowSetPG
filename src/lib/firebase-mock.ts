// Mock Firebase implementation - Use this when you don't have Firebase configured
// This allows the app to run without Firebase while you migrate to PostgreSQL

// Create mock Firebase app
export const app = {
  name: '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false
} as any;

// Mock Auth
export const auth = {
  currentUser: null,
  onAuthStateChanged: (callback: any) => {
    // Simulate no user logged in
    setTimeout(() => callback(null), 0);
    return () => {}; // unsubscribe function
  },
  signInWithEmailAndPassword: async (email: string, password: string) => {
    throw new Error('Firebase Auth is disabled. Please implement PostgreSQL-based authentication.');
  },
  signOut: async () => {
    console.log('Mock sign out');
  },
} as any;

// Mock Firestore
export const db = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => ({ exists: false, data: () => null }),
      set: async () => console.warn('Firestore mock: set called'),
      update: async () => console.warn('Firestore mock: update called'),
    }),
    get: async () => ({ docs: [], empty: true }),
    add: async () => console.warn('Firestore mock: add called'),
  }),
} as any;

// Mock Storage  
export const storage = {
  ref: (path: string) => ({
    put: async () => console.warn('Storage mock: upload called'),
    getDownloadURL: async () => 'mock-url',
  }),
} as any;

console.warn('🚧 Using mock Firebase - Firebase features are disabled. Migrate to PostgreSQL authentication.');
