
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { useInactivityTimeout } from './useInactivityTimeout';
import { SessionTimeoutDialog } from '@/components/user/SessionTimeoutDialog';
import { handleLogout } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';


// Extend the user object to include the profile
export interface AppUser extends FirebaseAuthUser {
    profile?: UserProfile;
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
  const router = useRouter();
  const { toast } = useToast();

  const logout = useCallback(async (isTimeout = false) => {
    const { success, error } = await handleLogout();
    if (success) {
      if (isTimeout) {
        toast({
          title: "Session Expired",
          description: "You have been logged out due to inactivity.",
          type: 'info'
        });
      } else {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
          type: 'success'
        });
      }
      router.push('/login');
    } else {
      toast({
        title: "Logout Failed",
        description: error,
        variant: 'destructive',
      });
    }
  }, [router, toast]);
  
  const { isIdle, startTimer, resetTimer } = useInactivityTimeout(() => logout(true), 10 * 60 * 1000);
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);

  useEffect(() => {
    let warningTimer: NodeJS.Timeout;
    if (isIdle) {
      // Set a timer to show the warning dialog 1 minute before the final logout
      warningTimer = setTimeout(() => {
        setShowTimeoutDialog(true);
      }, (10 * 60 * 1000) - (1 * 60 * 1000));
    } else {
      setShowTimeoutDialog(false);
    }
    
    return () => clearTimeout(warningTimer);
  }, [isIdle]);
  
  const handleStayLoggedIn = () => {
    setShowTimeoutDialog(false);
    resetTimer();
  };

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

        setUser({ 
            ...firebaseUser, 
            profile: userProfile,
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
        startTimer();
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
  }, [fetchUserData, startTimer]);
  
  const refetchUserData = useCallback(() => {
      if(auth.currentUser) {
          setIsLoading(true);
          fetchUserData(auth.currentUser);
      }
  }, [fetchUserData]);

  return (
    <AuthContext.Provider value={{ user, isLoading, refetchUserData }}>
      {children}
      {user && (
          <SessionTimeoutDialog
            isOpen={showTimeoutDialog}
            onStayLoggedIn={handleStayLoggedIn}
            onLogout={() => logout(false)}
          />
      )}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

