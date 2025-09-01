
import admin from 'firebase-admin';

// The type assertion is necessary because the default import might not be what tsx expects.
const serviceAccount = require('../../serviceAccountKey.json') as admin.ServiceAccount;

// Initialize the Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function listAdminUsers() {
  const adminUsers: { uid: string, email?: string }[] = [];
  try {
    console.log('Fetching all users to check for admin claims...');
    let nextPageToken;
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      listUsersResult.users.forEach((userRecord) => {
        if (userRecord.customClaims && userRecord.customClaims['admin'] === true) {
          adminUsers.push({ uid: userRecord.uid, email: userRecord.email });
        }
      });
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    if (adminUsers.length > 0) {
      console.log('✅ Found the following admin users:');
      adminUsers.forEach(admin => {
        console.log(`   - UID: ${admin.uid}, Email: ${admin.email || 'No email available'}`);
      });
    } else {
      console.log('ℹ️ No users with the admin role were found.');
    }

  } catch (error) {
    console.error('❌ Error listing admin users:', error);
  }
}

listAdminUsers().then(() => {
    console.log("Script finished.");
    process.exit(0);
}).catch(e => {
    console.error("Unhandled error in script execution:", e);
    process.exit(1);
});
