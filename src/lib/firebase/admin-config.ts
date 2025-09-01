
import * as admin from 'firebase-admin';
import { cookies } from 'next/headers';

// --- Singleton Pattern for Firebase Admin Initialization ---
// This ensures we only initialize the app once, preventing errors in serverless environments.

// A global symbol is used to store the admin app instance to avoid re-initialization
// across hot reloads in development.
const ADMIN_APP_NAME = "firebase-admin-app";
const globalWithAdmin = global as typeof global & {
  [ADMIN_APP_NAME]?: admin.app.App;
};

function getAdminApp() {
  if (globalWithAdmin[ADMIN_APP_NAME]) {
    return globalWithAdmin[ADMIN_APP_NAME];
  }

  const serviceAccountJson = process.env.NEXT_PRIVATE_FIREBASE_ADMIN_JSON_B64;
  if (!serviceAccountJson) {
    throw new Error("Firebase admin credentials (NEXT_PRIVATE_FIREBASE_ADMIN_JSON_B64) are not set in environment variables.");
  }
  
  try {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf-8'));
    
    globalWithAdmin[ADMIN_APP_NAME] = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    return globalWithAdmin[ADMIN_APP_NAME];

  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    throw new Error('Failed to initialize Firebase Admin SDK. Please check your credentials.');
  }
}

const adminApp = getAdminApp();
const adminAuth = admin.auth(adminApp);
const adminDb = admin.firestore(adminApp);

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
        const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        
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


export { adminAuth, adminDb };
