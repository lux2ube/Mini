
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
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

  const fetchUserData = useCallback(async (firebaseUser: FirebaseAuthUser | null) => {
    if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        await handleSession(null);
        return;
    }

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
        
        const appUser = {
            ...firebaseUser,
            profile,
            isAdmin,
        };

        setUser(appUser);
        
        // Redirect after setting user state
        if (isAdmin) {
            router.push('/admin/dashboard');
        } else {
            router.push('/dashboard');
        }

    } catch (error) {
        console.error("Error fetching user data:", error);
        setUser({ ...firebaseUser, profile: null, isAdmin: false });
        await handleSession(null);
    } finally {
        setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
          fetchUserData(firebaseUser);
      } else {
          // If no user, just set loading to false and clear session
          setUser(null);
          setIsLoading(false);
          handleSession(null);
      }
    });

    const handleRefetch = () => {
      if(auth.currentUser) {
          // A lighter refetch, no redirect needed
           getDoc(doc(db, 'users', auth.currentUser.uid)).then(userDocSnap => {
               const profile = userDocSnap.exists() ? { uid: auth.currentUser!.uid, ...userDocSnap.data() } as UserProfile : null;
               setUser(prevUser => prevUser ? {...prevUser, profile} : null);
           });
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
          getDoc(doc(db, 'users', auth.currentUser.uid)).then(userDocSnap => {
               const profile = userDocSnap.exists() ? { uid: auth.currentUser!.uid, ...userDocSnap.data() } as UserProfile : null;
               setUser(prevUser => prevUser ? {...prevUser, profile} : null);
               setIsLoading(false);
           });
      }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
