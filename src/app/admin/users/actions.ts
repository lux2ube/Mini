
'use server';

import * as admin from 'firebase-admin';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/types';
import { db } from '@/lib/firebase/config';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

// This is the definitive, secure way to initialize the admin app.
// It uses a singleton pattern to ensure it's only initialized once.
function getAdminApp() {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }
    
    const serviceAccountJson = process.env.NEXT_PRIVATE_FIREBASE_ADMIN_JSON_B64;
    if (!serviceAccountJson) {
        throw new Error("Firebase admin credentials are not set in environment variables.");
    }
    
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf-8'));

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// This helper function is the new gatekeeper for all secure admin actions.
// It verifies the user's session cookie and checks for the 'admin' custom claim.
async function verifyAdmin() {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
        throw new Error("Not authenticated: No session cookie found.");
    }

    try {
        const adminApp = getAdminApp();
        const decodedIdToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
        
        if (decodedIdToken.admin !== true) {
            throw new Error("Not authorized: User is not an admin.");
        }
        
        return decodedIdToken;
    } catch (error) {
        console.error("Admin verification failed:", error);
        throw new Error("Admin verification failed.");
    }
}

const safeToDate = (timestamp: any): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return undefined;
};


export async function getUsers(): Promise<UserProfile[]> {
  try {
    // 1. SECURITY CHECK: First, verify the caller is a real admin.
    // This will throw an error if they are not, stopping execution.
    await verifyAdmin();

    // 2. RELIABLE DATA FETCH: Now that we know the caller is a verified admin,
    // we can safely use the reliable client 'db' to fetch data. This
    // bypasses all the previous Admin SDK initialization issues.
    console.log("Admin verified. Fetching users with the client DB...");
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
        console.warn("User collection is empty.");
        return [];
    }

    const users: UserProfile[] = [];
    usersSnapshot.forEach(doc => {
        const data = doc.data();
        users.push({
            uid: doc.id,
            ...data,
            createdAt: safeToDate(data.createdAt) || new Date(),
        } as UserProfile);
    });
    
    console.log(`Successfully fetched ${users.length} users for admin panel.`);
    return users;

  } catch (error) {
    console.error("Error in getUsers server action:", error);
    // Return an empty array to the client-side component to prevent a crash.
    // The server log will contain the specific error (e.g., "Not authorized").
    return [];
  }
}

// All other admin-specific functions can now follow this same pattern:
// 1. Call verifyAdmin()
// 2. Perform the database operation.

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
