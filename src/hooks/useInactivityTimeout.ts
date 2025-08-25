
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

const INACTIVITY_CHECK_INTERVAL = 5000; // 5 seconds
const LAST_ACTIVE_STORAGE_KEY = 'last_active_timestamp';

/**
 * A custom hook to detect user inactivity across multiple browser tabs.
 * @param onIdle - Callback function to execute when the user becomes idle.
 * @param timeout - The inactivity timeout duration in milliseconds.
 * @returns An object with `isIdle` state and methods to `startTimer` and `resetTimer`.
 */
export function useInactivityTimeout(onIdle: () => void, timeout: number) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLastActiveTimestamp = useCallback(() => {
    try {
        localStorage.setItem(LAST_ACTIVE_STORAGE_KEY, Date.now().toString());
    } catch(e) {
        console.error("Could not write to localStorage:", e);
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLastActiveTimestamp();
    setIsIdle(false);

    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      onIdle();
    }, timeout);
  }, [timeout, onIdle, setLastActiveTimestamp]);

  const startTimer = useCallback(() => {
    resetTimer();
  }, [resetTimer]);
  
  // Listen for activity events to reset the timer
  useEffect(() => {
    const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
        resetTimer();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);

  // Multi-tab synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVE_STORAGE_KEY) {
        // Another tab has updated the activity timestamp, so reset this tab's timer
        resetTimer();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [resetTimer]);

  // Check on interval for cases where storage event might not fire (e.g., in the same tab)
  useEffect(() => {
      const intervalId = setInterval(() => {
          try {
            const lastActive = parseInt(localStorage.getItem(LAST_ACTIVE_STORAGE_KEY) || '0');
            const isInactive = Date.now() - lastActive > timeout;

            if(isInactive && !isIdle) {
                setIsIdle(true);
                onIdle();
            }
          } catch(e) {
              console.error("Could not read from localStorage:", e);
          }
      }, INACTIVITY_CHECK_INTERVAL);

      return () => clearInterval(intervalId);
  }, [timeout, onIdle, isIdle]);

  return { isIdle, startTimer, resetTimer };
}

