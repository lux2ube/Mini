import * as admin from 'firebase-admin';

// Ensure the SDK is initialized only once
if (!admin.apps.length) {
  try {
    const serviceAccountB64 = process.env.FIREBASE_ADMIN_JSON_B64;

    if (!serviceAccountB64) {
      throw new Error("Firebase admin credentials (base64) are not set in environment variables.");
    }
    
    // Decode the Base64 string to get the JSON string
    const serviceAccountJson = Buffer.from(serviceAccountB64, 'base64').toString('utf8');

    // Parse the JSON string into an object
    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb };
