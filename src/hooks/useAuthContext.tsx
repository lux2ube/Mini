
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';

// The user object from the Auth Provider will now have a 'profile' property
// containing the user's data from the Firestore 'users' collection.
export interface AppUser extends FirebaseAuthUser {
  profile?: UserProfile | null;
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  refetchUserData: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    isLoading: true,
    refetchUserData: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async (firebaseUser: FirebaseAuthUser) => {
    if (!firebaseUser) {
        setUser(null);
        return;
    }
    try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        const profile = userDocSnap.exists() 
            ? { uid: firebaseUser.uid, ...userDocSnap.data() } as UserProfile
            : null;

        setUser({
            ...firebaseUser,
            profile: profile,
        });

    } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser({ ...firebaseUser, profile: null });
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    const handleRefetch = () => {
        if(auth.currentUser) {
            fetchUserData(auth.currentUser);
        }
    };
    window.addEventListener('refetchUser', handleRefetch);

    return () => {
        unsubscribe();
        window.removeEventListener('refetchUser', handleRefetch);
    };
  }, [fetchUserData]);
  
  const refetchUserData = useCallback(() => {
      if(auth.currentUser) {
          setIsLoading(true);
          fetchUserData(auth.currentUser).finally(() => setIsLoading(false));
      }
  }, [fetchUserData]);

  return (
    <AuthContext.Provider value={{ user, isLoading, refetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
