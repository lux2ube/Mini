
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';

// The user object from the Auth Provider will now have two distinct properties
// to prevent stripping methods from the core firebase user object.
interface AuthContextType {
  firebaseUser: FirebaseAuthUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  refetchUserProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
    firebaseUser: null, 
    userProfile: null,
    isLoading: true,
    refetchUserProfile: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = useCallback(async (user: FirebaseAuthUser) => {
    if (!user) {
        setUserProfile(null);
        return;
    }
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        const profile = userDocSnap.exists() 
            ? { uid: user.uid, ...userDocSnap.data() } as UserProfile
            : null;
        setUserProfile(profile);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null); 
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      setFirebaseUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    const handleRefetch = () => {
        if(auth.currentUser) {
            fetchUserProfile(auth.currentUser);
        }
    };
    window.addEventListener('refetchUser', handleRefetch);

    return () => {
        unsubscribe();
        window.removeEventListener('refetchUser', handleRefetch);
    };
  }, [fetchUserProfile]);
  
  const refetchUserProfile = useCallback(() => {
      if(auth.currentUser) {
          setIsLoading(true);
          fetchUserProfile(auth.currentUser).finally(() => setIsLoading(false));
      }
  }, [fetchUserProfile]);

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, isLoading, refetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
