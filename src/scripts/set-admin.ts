
import admin from 'firebase-admin';
import { resolve } from 'path';

// Import the service account key, assuming it's at the root of the project
// Note: In a real project, be very careful with this key. Do not commit it to public repositories.
// The path is relative to the project root where you will run the script.
import serviceAccount from '../../serviceAccountKey.json';

// Initialize the Firebase Admin SDK
// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// The UID of the user you want to make an admin
const uid = "6yUTvF9JrBQo3GUEqxhUnfleVOE3";

async function setAdminClaim() {
  if (!uid) {
    console.error("❌ Error: No UID provided.");
    return;
  }

  try {
    // Set the custom claim { admin: true } for the specified user
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    
    // Verify the claim was set
    const userRecord = await admin.auth().getUser(uid);
    console.log("✅ Admin role granted successfully to user:", userRecord.email);
    console.log("Custom claims:", userRecord.customClaims);
    console.log("\n👉 Important: The user must log out and log back in for the changes to take effect.");
  } catch (error) {
    console.error("❌ Error setting admin role:", error);
  }
}

setAdminClaim().then(() => {
    console.log("Script finished.");
    process.exit(0);
}).catch(e => {
    console.error("Unhandled error in script execution:", e);
    process.exit(1);
});
