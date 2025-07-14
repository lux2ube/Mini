
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';

// Extend the user object to include the profile data from Firestore
export interface AppUser extends FirebaseAuthUser {
    profile?: UserProfile;
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userProfile = { uid: firebaseUser.uid, ...userDoc.data() } as UserProfile;
          setUser({ ...firebaseUser, profile: userProfile });
        } else {
           setUser(firebaseUser); // User exists in Auth, but not in Firestore yet
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Listen for custom event to refetch user data, e.g., after profile update
    const handleRefetchUser = async () => {
        if (auth.currentUser) {
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);
             if (userDoc.exists()) {
                const userProfile = { uid: auth.currentUser.uid, ...userDoc.data() } as UserProfile;
                setUser({ ...auth.currentUser, profile: userProfile });
            }
        }
    };

    window.addEventListener('refetchUser', handleRefetchUser);

    return () => {
        unsubscribe();
        window.removeEventListener('refetchUser', handleRefetchUser);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
