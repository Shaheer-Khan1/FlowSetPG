import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import type { UserProfile } from './types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  tenantId: string; // PostgreSQL tenant ID
  userId: string; // PostgreSQL user ID
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// TEMPORARY: Mock user for development without auth
// These IDs match the sample data in init-db/11-sample-data.sql
const MOCK_USER: User = {
  uid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // PostgreSQL user ID
  email: 'admin@saudi.gov.sa',
  displayName: 'Ahmed Hassan',
  emailVerified: true,
} as User;

const MOCK_PROFILE: UserProfile = {
  uid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  email: 'admin@saudi.gov.sa',
  displayName: 'Ahmed Hassan',
  isAdmin: true, // Give admin access for development
  role: 'admin',
};

// Sample data tenant IDs:
// Saudi Arabia: 11111111-1111-1111-1111-111111111111
// Egypt: 22222222-2222-2222-2222-222222222222
const MOCK_TENANT_ID = '11111111-1111-1111-1111-111111111111'; // Saudi Arabia tenant
const MOCK_USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // Ahmed Hassan (admin)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    console.log('✅ Mock profile loaded - auth bypassed for development');
  };

  useEffect(() => {
    // Simulate async loading
    setTimeout(() => {
      setUser(MOCK_USER);
      setUserProfile(MOCK_PROFILE);
      setLoading(false);
      console.log('✅ Development mode: Auth bypassed, using mock user');
    }, 100);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      refreshProfile,
      tenantId: MOCK_TENANT_ID,
      userId: MOCK_USER_ID
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

