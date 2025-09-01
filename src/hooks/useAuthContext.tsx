
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { handleRegisterUser } from '@/app/actions'; // We'll use the core logic here for self-healing.

export interface AppUser extends FirebaseAuthUser {
  profile?: UserProfile | null;
  isAdmin?: boolean;
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

async function handleSession(token: string | null) {
    const endpoint = token ? '/api/login' : '/api/logout';
    const options: RequestInit = {
        method: 'POST',
    };
    if (token) {
        options.headers = { 'Authorization': `Bearer ${token}` };
    }
    await fetch(endpoint, options);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFullUserData = useCallback(async (firebaseUser: FirebaseAuthUser) => {
    setIsLoading(true);
    try {
        const token = await firebaseUser.getIdToken();
        await handleSession(token);

        const idTokenResult = await firebaseUser.getIdTokenResult();
        const isAdmin = idTokenResult.claims.admin === true;
        
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        const profile = userDocSnap.exists() 
            ? { uid: firebaseUser.uid, ...userDocSnap.data() } as UserProfile
            : null;
        
        const appUser: AppUser = {
            ...firebaseUser,
            profile,
            isAdmin,
        };

        setUser(appUser);
    } catch (error) {
        console.error("Error fetching user data:", error);
        setUser({ ...firebaseUser, profile: null, isAdmin: false }); // Set user but with null profile
        await handleSession(null); // Clear session on error
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
          fetchFullUserData(firebaseUser);
      } else {
          setUser(null);
          setIsLoading(false);
          handleSession(null);
      }
    });

    return () => unsubscribe();
  }, [fetchFullUserData]);
  
  const refetchUserData = useCallback(() => {
      if(auth.currentUser) {
          fetchFullUserData(auth.currentUser);
      }
  }, [fetchFullUserData]);

  return (
    <AuthContext.Provider value={{ user, isLoading, refetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
