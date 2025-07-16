
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile, UserPaymentMethod } from '@/types';
import { getUserPaymentMethods } from '@/app/admin/actions';

// Extend the user object to include the profile and payment methods
export interface AppUser extends FirebaseAuthUser {
    profile?: UserProfile;
    paymentMethods?: UserPaymentMethod[];
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
        setIsLoading(false);
        return;
    }
    try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        const userProfile = userDocSnap.exists() 
            ? { uid: firebaseUser.uid, ...userDocSnap.data() } as UserProfile
            : undefined;

        const userPaymentMethods = await getUserPaymentMethods(firebaseUser.uid);

        setUser({ 
            ...firebaseUser, 
            profile: userProfile,
            paymentMethods: userPaymentMethods,
        });

    } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(firebaseUser); // Fallback to just firebase user
    } finally {
        setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        fetchUserData(firebaseUser);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Custom event to trigger a refetch
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
          fetchUserData(auth.currentUser);
      }
  }, [fetchUserData]);

  return (
    <AuthContext.Provider value={{ user, isLoading, refetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
