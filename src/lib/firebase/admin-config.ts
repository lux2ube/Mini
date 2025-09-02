
import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { cookies } from 'next/headers';
import serviceAccount from '../../../serviceAccountKey.json';

// Type assertion for the service account key
const serviceAccountKey = serviceAccount as admin.ServiceAccount;

/**
 * A lazy-loaded, singleton instance of the Firebase Admin SDK.
 */
function getAdminApp(): admin.app.App {
    if (getApps().length > 0) {
        return admin.app();
    }

    try {
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error:', error.message);
      throw new Error('Failed to initialize Firebase Admin SDK. Please check your credentials.');
    }
}

/**
 * Verifies the session cookie from the request and checks for admin claims.
 * Throws an error if the user is not an authenticated admin.
 * @returns The decoded ID token if the user is an admin.
 */
export async function verifyAdmin() {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
        throw new Error("Not authenticated: No session cookie found.");
    }

    try {
        const decodedIdToken = await getAdminApp().auth().verifySessionCookie(sessionCookie, true);
        
        if (decodedIdToken.admin !== true) {
            throw new Error("Not authorized: User is not an admin.");
        }
        
        return decodedIdToken;
    } catch (error) {
        // This will catch expired cookies, invalid cookies, etc.
        console.error("Admin verification failed:", error);
        throw new Error("Admin verification failed. Please log in again.");
    }
}

// For direct use in other files that need the DB or Auth instance.
export const adminDb = getAdminApp().firestore();
export const adminAuth = getAdminApp().auth();
