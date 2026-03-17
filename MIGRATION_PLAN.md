# 🔄 Firebase to PostgreSQL Migration Plan

## Current State

Your application is **heavily integrated with Firebase**:

### Frontend (React/TypeScript)
- ✅ Uses Firebase Auth for user authentication
- ✅ Uses Firestore for real-time data
- ✅ Uses Firebase Storage for images/videos

### Backend (Node.js/Express)
- ✅ Uses Firebase Admin SDK
- ✅ Uses Firestore for data storage:
  - `installations` collection
  - `teams` collection  
  - `devices` collection
  - `locations` collection
  - User profiles

## Your Goal: Custom Auth + PostgreSQL

You want to:
1. ❌ Remove Firebase Auth → Use custom login/signup
2. ❌ Remove Firestore → Use PostgreSQL
3. ❌ Remove Firebase Storage → Use local storage or S3

---

## 🚀 Migration Steps

### Phase 1: Stub Firebase (Done!)

✅ Created stub `firebase.ts` so frontend doesn't crash

### Phase 2: Create Custom Auth API

You need to create:

```javascript
// backend/routes/auth.js
POST /api/auth/register  - Create new user
POST /api/auth/login     - Login user, return JWT token
POST /api/auth/logout    - Logout user
GET  /api/auth/me        - Get current user info
```

**Database Schema:**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    team_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 3: Migrate Data Schema to PostgreSQL

Create tables for all Firebase collections:

```sql
-- Installations table
CREATE TABLE installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) NOT NULL,
    team_id UUID REFERENCES teams(id),
    location_id UUID REFERENCES locations(id),
    status VARCHAR(50) DEFAULT 'pending',
    installer_name VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    user_reading DECIMAL,
    server_reading DECIMAL,
    image_urls TEXT[],
    video_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    system_pre_verified BOOLEAN DEFAULT false
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Devices table  
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    municipality_name VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Phase 4: Update Backend API

Replace all Firestore calls with PostgreSQL:

**Before (Firestore):**
```javascript
const snapshot = await db.collection('installations').get();
const installations = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

**After (PostgreSQL):**
```javascript
import { query } from './db.js';
const result = await query('SELECT * FROM installations');
const installations = result.rows;
```

### Phase 5: Update Frontend

Replace Firebase auth with custom auth:

**Before (Firebase):**
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './lib/firebase';

await signInWithEmailAndPassword(auth, email, password);
```

**After (Custom API):**
```typescript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token, user } = await response.json();
localStorage.setItem('auth_token', token);
```

---

## 🎯 Quick Start Option

Do you want me to:

### Option A: Create Basic Auth System
- Create login/signup API endpoints
- Create PostgreSQL user table  
- Create JWT authentication
- Update frontend to use custom auth

### Option B: Keep Firebase, Just Fix The Error
- Fix your Firebase config
- Keep using Firebase for now
- Migrate to PostgreSQL later

### Option C: Make Firebase Optional
- App works without Firebase
- You can add custom auth gradually
- No crashes if Firebase not configured

---

## 📊 Current Setup

✅ PostgreSQL is running and ready
✅ Backend has database connection (`db.js`)
✅ Node.js and dependencies installed
⚠️ Frontend still expects Firebase
⚠️ Backend uses Firestore for data

---

## What would you like to do?

Let me know which option you prefer, and I'll help you implement it!
