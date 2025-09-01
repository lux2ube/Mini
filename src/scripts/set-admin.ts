
import { adminAuth } from '@/lib/firebase/admin-config';

// The UID of the user you want to make an admin
const uid = "6yUTvF9JrBQo3GUEqxhUnfleVOE3";

async function setAdminClaim() {
  if (!uid) {
    console.error("❌ Error: No UID provided.");
    return;
  }

  try {
    // Set the custom claim { admin: true } for the specified user
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    
    // Verify the claim was set
    const userRecord = await adminAuth.getUser(uid);
    console.log("✅ Admin role granted successfully to user:", userRecord.email);
    console.log("Custom claims:", userRecord.customClaims);
    console.log("\n👉 Important: The user must log out and log back in for the changes to take effect.");
  } catch (error)_ {
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
