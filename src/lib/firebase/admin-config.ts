import * as admin from 'firebase-admin';

// This function ensures that the Firebase Admin SDK is initialized only once.
function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  try {
    const serviceAccountJson = process.env.NEXT_PRIVATE_FIREBASE_ADMIN_JSON_B64;
    if (!serviceAccountJson) {
      throw new Error("Firebase admin credentials (base64) are not set in environment variables.");
    }
    
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf-8'));

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    return app;

  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Throw the error to make it clear that initialization failed.
    // This will prevent other parts of the app from trying to use a non-existent admin app.
    throw new Error('Failed to initialize Firebase Admin SDK.');
  }
}

const adminApp = getAdminApp();
const adminAuth = adminApp.auth();
const adminDb = adminApp.firestore();

export { adminAuth, adminDb };
