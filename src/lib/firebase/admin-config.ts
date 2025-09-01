import * as admin from 'firebase-admin';

// This function ensures that the Firebase Admin SDK is initialized only once.
// It uses a singleton pattern to avoid re-initialization errors in serverless environments.
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

  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    // Throw the error to make it clear that initialization failed.
    // This will prevent other parts of the app from trying to use a non-existent admin app.
    throw new Error('Failed to initialize Firebase Admin SDK.');
  }
}

let adminApp: admin.app.App;
let adminAuth: admin.auth.Auth;
let adminDb: admin.firestore.Firestore;

try {
    adminApp = getAdminApp();
    adminAuth = adminApp.auth();
    adminDb = adminApp.firestore();
} catch (e) {
    console.error("Could not initialize Firebase Admin services. Some admin features may not work.", e);
    // Assign dummy objects or handle the error gracefully
    // to prevent the entire application from crashing on import.
}


export { adminAuth, adminDb };
