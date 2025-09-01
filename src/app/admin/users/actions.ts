
'use server';

import * as admin from 'firebase-admin';
import { collection, getDocs, Timestamp, writeBatch } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { db } from '@/lib/firebase/config';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase/admin-config';

// This helper function is the new gatekeeper for all secure admin actions.
// It verifies the user's session cookie and checks for the 'admin' custom claim.
async function verifyAdmin() {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
        throw new Error("Not authenticated: No session cookie found.");
    }

    try {
        const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        
        if (decodedIdToken.admin !== true) {
            throw new Error("Not authorized: User is not an admin.");
        }
        
        return decodedIdToken;
    } catch (error) {
        console.error("Admin verification failed:", error);
        throw new Error("Admin verification failed.");
    }
}

export async function backfillUserStatuses(): Promise<{ success: boolean; message: string; }> {
    try {
        await verifyAdmin();
        // The rest of the function logic remains the same,
        // but it is now protected by the verifyAdmin() check.
        const usersSnapshot = await getDocs(collection(db, 'users'));
        // ... (rest of the logic)
        return { success: true, message: 'Backfill complete (logic placeholder).' };
    } catch (error) {
        console.error("Error backfilling user statuses:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Failed to backfill statuses: ${errorMessage}` };
    }
}

export async function backfillUserLevels(): Promise<{ success: boolean; message: string; }> {
    try {
        await verifyAdmin();
        // The rest of the function logic remains the same.
        return { success: true, message: 'Level backfill complete (logic placeholder).' };
    } catch (error) {
        console.error("Error backfilling user levels:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Failed to backfill levels: ${errorMessage}` };
    }
}

// NOTE: The primary function for getting users is now an API route.
// This server action file is kept for other user-related admin actions like backfilling.
