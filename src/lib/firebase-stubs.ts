// Comprehensive Firebase stubs - all operations are no-ops
// This file prevents crashes when code imports from firebase/* modules

console.warn('⚠️ Firebase modules stubbed - all operations are no-ops');

// ============================================
// Firebase Storage
// ============================================
export const getStorage = (app?: any) => ({
  app: { name: '[DEFAULT]' },
  maxOperationRetryTime: 120000,
  maxUploadRetryTime: 600000,
});

export const ref = (storage: any, path?: string) => {
  console.warn(`Firebase Storage ref stubbed: ${path}`);
  return { 
    fullPath: path || '', 
    name: path?.split('/').pop() || '',
    bucket: 'stubbed-bucket',
    toString: () => path || ''
  };
};

export const uploadBytes = async (ref: any, data: any, metadata?: any) => {
  console.warn(`Firebase Storage uploadBytes stubbed: ${ref.fullPath || ref}`);
  return { 
    metadata: { 
      fullPath: ref.fullPath || ref,
      size: data?.size || 0,
      contentType: data?.type || 'application/octet-stream'
    }, 
    ref 
  };
};

export const uploadString = async (ref: any, data: string, format?: string) => {
  console.warn(`Firebase Storage uploadString stubbed: ${ref.fullPath || ref}`);
  return { metadata: { fullPath: ref.fullPath || ref }, ref };
};

export const getDownloadURL = async (ref: any) => {
  console.warn(`Firebase Storage getDownloadURL stubbed: ${ref.fullPath || ref}`);
  return `https://via.placeholder.com/400x300?text=Image+Upload+Disabled`;
};

export const deleteObject = async (ref: any) => {
  console.warn(`Firebase Storage deleteObject stubbed: ${ref.fullPath || ref}`);
  return Promise.resolve();
};

export const listAll = async (ref: any) => {
  console.warn(`Firebase Storage listAll stubbed: ${ref.fullPath || ref}`);
  return { items: [], prefixes: [] };
};

// ============================================
// Firebase Firestore
// ============================================
export const getFirestore = (app?: any) => ({
  app: { name: '[DEFAULT]' },
  type: 'firestore',
  toJSON: () => ({ app: { name: '[DEFAULT]' } })
});

export const collection = (db: any, ...pathSegments: string[]) => {
  const path = pathSegments.join('/');
  console.warn(`Firestore collection stubbed: ${path}`);
  return { 
    path,
    id: pathSegments[pathSegments.length - 1],
    type: 'collection'
  };
};

export const doc = (db: any, ...pathSegments: string[]) => {
  const path = pathSegments.join('/');
  console.warn(`Firestore doc stubbed: ${path}`);
  return { 
    path,
    id: pathSegments[pathSegments.length - 1],
    type: 'document'
  };
};

export const query = (collection: any, ...queryConstraints: any[]) => {
  console.warn('Firestore query stubbed');
  return { collection, queryConstraints, type: 'query' };
};

export const where = (field: string, op: string, value: any) => {
  return { field, op, value, type: 'where' };
};

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => {
  return { field, direction, type: 'orderBy' };
};

export const limit = (count: number) => {
  return { count, type: 'limit' };
};

export const limitToLast = (count: number) => {
  return { count, type: 'limitToLast' };
};

export const startAt = (...fieldValues: any[]) => {
  return { fieldValues, type: 'startAt' };
};

export const startAfter = (...fieldValues: any[]) => {
  return { fieldValues, type: 'startAfter' };
};

export const endAt = (...fieldValues: any[]) => {
  return { fieldValues, type: 'endAt' };
};

export const endBefore = (...fieldValues: any[]) => {
  return { fieldValues, type: 'endBefore' };
};

export const getDoc = async (docRef: any) => {
  console.warn(`Firestore getDoc stubbed: ${docRef.path}`);
  return {
    exists: () => false,
    data: () => ({}),
    id: docRef.path?.split('/').pop() || 'mock-id',
    ref: docRef,
    metadata: { fromCache: false, hasPendingWrites: false }
  };
};

export const getDocs = async (query: any) => {
  console.warn('Firestore getDocs stubbed - returning empty results');
  return {
    docs: [],
    empty: true,
    size: 0,
    forEach: () => {},
    metadata: { fromCache: false, hasPendingWrites: false }
  };
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  console.warn(`Firestore setDoc stubbed: ${docRef.path}`);
  return Promise.resolve();
};

export const addDoc = async (collectionRef: any, data: any) => {
  console.warn(`Firestore addDoc stubbed: ${collectionRef.path}`);
  const id = 'mock-' + Date.now();
  return {
    id,
    path: collectionRef.path + '/' + id,
  };
};

export const updateDoc = async (docRef: any, data: any) => {
  console.warn(`Firestore updateDoc stubbed: ${docRef.path}`);
  return Promise.resolve();
};

export const deleteDoc = async (docRef: any) => {
  console.warn(`Firestore deleteDoc stubbed: ${docRef.path}`);
  return Promise.resolve();
};

export const onSnapshot = (target: any, ...args: any[]) => {
  console.warn('Firestore onSnapshot stubbed - returning empty results');
  const callback = args.find(arg => typeof arg === 'function');
  
  setTimeout(() => {
    if (callback) {
      callback({
        docs: [],
        empty: true,
        size: 0,
        forEach: () => {},
        docChanges: () => [],
        metadata: { fromCache: false, hasPendingWrites: false }
      });
    }
  }, 100);
  
  return () => {}; // Unsubscribe function
};

export const writeBatch = (db: any) => {
  console.warn('Firestore writeBatch stubbed');
  return {
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: async () => Promise.resolve(),
  };
};

export const runTransaction = async (db: any, updateFunction: Function) => {
  console.warn('Firestore runTransaction stubbed');
  return Promise.resolve();
};

// Field values
export const serverTimestamp = () => new Date();
export const increment = (n: number) => ({ _type: 'increment', _value: n });
export const arrayUnion = (...elements: any[]) => ({ _type: 'arrayUnion', _elements: elements });
export const arrayRemove = (...elements: any[]) => ({ _type: 'arrayRemove', _elements: elements });
export const deleteField = () => ({ _type: 'deleteField' });

// Timestamp
export const Timestamp = {
  now: () => new Date(),
  fromDate: (date: Date) => date,
  fromMillis: (ms: number) => new Date(ms),
};

// ============================================
// Firebase Auth
// ============================================
export const getAuth = (app?: any) => ({
  app: { name: '[DEFAULT]' },
  currentUser: null,
  languageCode: 'en',
  onAuthStateChanged: (callback: any) => {
    setTimeout(() => callback(null), 0);
    return () => {};
  },
  onIdTokenChanged: (callback: any) => {
    setTimeout(() => callback(null), 0);
    return () => {};
  },
});

export const onAuthStateChanged = (auth: any, callback: Function, errorCallback?: Function, completedCallback?: Function) => {
  console.warn('Firebase onAuthStateChanged stubbed');
  setTimeout(() => callback(null), 0);
  return () => {}; // Unsubscribe function
};

export const signOut = async (auth?: any) => {
  console.warn('Firebase signOut stubbed');
  return Promise.resolve();
};

export const signInWithEmailAndPassword = async (auth: any, email: string, password: string) => {
  console.warn('Firebase signInWithEmailAndPassword stubbed');
  throw new Error('Authentication is disabled in development mode');
};

export const createUserWithEmailAndPassword = async (auth: any, email: string, password: string) => {
  console.warn('Firebase createUserWithEmailAndPassword stubbed');
  throw new Error('Authentication is disabled in development mode');
};

export const sendPasswordResetEmail = async (auth: any, email: string) => {
  console.warn('Firebase sendPasswordResetEmail stubbed');
  return Promise.resolve();
};

export const updateProfile = async (user: any, profile: any) => {
  console.warn('Firebase updateProfile stubbed');
  return Promise.resolve();
};

export const updateEmail = async (user: any, email: string) => {
  console.warn('Firebase updateEmail stubbed');
  return Promise.resolve();
};

export const updatePassword = async (user: any, password: string) => {
  console.warn('Firebase updatePassword stubbed');
  return Promise.resolve();
};

export const sendEmailVerification = async (user: any) => {
  console.warn('Firebase sendEmailVerification stubbed');
  return Promise.resolve();
};

export const signInWithPopup = async (auth: any, provider: any) => {
  console.warn('Firebase signInWithPopup stubbed');
  throw new Error('Authentication is disabled in development mode');
};

export const signInWithRedirect = async (auth: any, provider: any) => {
  console.warn('Firebase signInWithRedirect stubbed');
  throw new Error('Authentication is disabled in development mode');
};

// Auth providers
export const GoogleAuthProvider = class {
  static credential() { return {}; }
};

export const FacebookAuthProvider = class {
  static credential() { return {}; }
};

export const TwitterAuthProvider = class {
  static credential() { return {}; }
};

export const GithubAuthProvider = class {
  static credential() { return {}; }
};

// ============================================
// Firebase App
// ============================================
export const initializeApp = (config: any, name?: string) => {
  console.warn('Firebase initializeApp stubbed');
  return {
    name: name || '[DEFAULT]',
    options: config,
    automaticDataCollectionEnabled: false,
  };
};

export const getApp = (name?: string) => ({
  name: name || '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false,
});

export const getApps = () => [];

// ============================================
// Firebase Analytics (if needed)
// ============================================
export const getAnalytics = (app?: any) => ({
  app: { name: '[DEFAULT]' },
});

export const logEvent = (analytics: any, eventName: string, eventParams?: any) => {
  console.warn(`Firebase Analytics logEvent stubbed: ${eventName}`);
};

// ============================================
// Additional commonly used functions
// ============================================
export const connectFirestoreEmulator = (firestore: any, host: string, port: number) => {
  console.warn('Firestore emulator connection stubbed');
};

export const connectAuthEmulator = (auth: any, url: string) => {
  console.warn('Auth emulator connection stubbed');
};

export const connectStorageEmulator = (storage: any, host: string, port: number) => {
  console.warn('Storage emulator connection stubbed');
};

// Default export for compatibility
export default {
  getStorage,
  getFirestore,
  getAuth,
  initializeApp,
  getApp,
  getApps,
};
