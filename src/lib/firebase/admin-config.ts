import * as admin from 'firebase-admin';

// This is the recommended pattern for initializing the Firebase Admin SDK in a Next.js environment.
// It ensures that the SDK is initialized only once, preventing errors caused by re-initialization.

function getAdminApp() {
  // If the app is already initialized, return it.
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Otherwise, initialize it.
  try {
    const serviceAccountB64 = process.env.NEXT_PRIVATE_FIREBASE_ADMIN_JSON_B64;

    if (!serviceAccountB64) {
      throw new Error("Firebase admin credentials (base64) are not set in environment variables.");
    }
    
    // Decode the Base64 string to get the JSON string
    const serviceAccountJson = Buffer.from(serviceAccountB64, 'base64').toString('utf8');

    // Parse the JSON string into an object
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Initialize the app with the service account credentials
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Throw the error to make it clear that initialization failed.
    // This will prevent other parts of the app from trying to use a non-existent admin app.
    throw new Error('Failed to initialize Firebase Admin SDK.');
  }
}

// Export the initialized admin app and its services.
const adminApp = getAdminApp();
const adminAuth = admin.auth(adminApp);
const adminDb = admin.firestore(adminApp);

export { adminAuth, adminDb };
