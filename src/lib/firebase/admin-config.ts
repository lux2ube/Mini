import * as admin from 'firebase-admin';

// This is the recommended pattern for initializing the Firebase Admin SDK in a Next.js environment.
// It ensures that the SDK is initialized only once, preventing errors caused by re-initialization.

if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.NEXT_PRIVATE_FIREBASE_ADMIN_JSON_B64;
    if (!serviceAccountJson) {
      throw new Error("Firebase admin credentials (base64) are not set in environment variables.");
    }
    
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf-8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // We throw an error to make it clear that initialization failed.
    // This will prevent other parts of the app from trying to use a non-existent admin app.
    throw new Error('Failed to initialize Firebase Admin SDK.');
  }
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb };
