
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db, initializeClientApp } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  // Ensure Firebase is initialized only on the client
  useEffect(() => {
    initializeClientApp();
  }, []);

  const fetchFullUserDataAndRedirect = useCallback(async (firebaseUser: FirebaseAuthUser) => {
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
        
        // Redirect after setting user state
        if (isAdmin) {
            router.push('/admin/dashboard');
        } else {
            // Check if profile exists and phone number is missing
            if (profile && !profile.phoneNumber) {
                router.push(`/phone-verification?userId=${firebaseUser.uid}`);
            } else {
                router.push('/dashboard');
            }
        }

    } catch (error) {
        console.error("Error fetching user data:", error);
        setUser({ ...firebaseUser, profile: null, isAdmin: false }); // Set user but with null profile
        await handleSession(null); // Clear session on error
    } finally {
        setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
          // User is logged in, but we don't redirect here.
          // We let the login page handle the initial redirect.
          // This listener is mainly for keeping the session alive across reloads.
          fetchFullUserDataAndRedirect(firebaseUser).catch(console.error);
      } else {
          setUser(null);
          setIsLoading(false);
          handleSession(null);
      }
    });

    return () => unsubscribe();
  }, [fetchFullUserDataAndRedirect]);
  
  const refetchUserData = useCallback(() => {
      if(auth.currentUser) {
          // This refetch should not redirect, just update data.
          const fetchOnly = async (fbUser: FirebaseAuthUser) => {
              const token = await fbUser.getIdToken();
              await handleSession(token);
              const idTokenResult = await fbUser.getIdTokenResult();
              const isAdmin = idTokenResult.claims.admin === true;
              const userDocRef = doc(db, 'users', fbUser.uid);
              const userDocSnap = await getDoc(userDocRef);
              const profile = userDocSnap.exists() 
                  ? { uid: fbUser.uid, ...userDocSnap.data() } as UserProfile
                  : null;
              setUser({ ...fbUser, profile, isAdmin });
          }
          fetchOnly(auth.currentUser).catch(console.error);
      }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
