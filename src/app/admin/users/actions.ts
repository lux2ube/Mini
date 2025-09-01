
'use server';

import * as admin from 'firebase-admin';
import { collection, getDocs, writeBatch, query, where, limit, getDoc, doc, Timestamp, startOfMonth } from 'firebase/firestore';
import type { UserProfile, UserStatus, ClientLevel } from '@/types';
import { db } from '@/lib/firebase/config'; // Keep client SDK for specific tasks if needed

const safeToDate = (timestamp: any): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return undefined;
};

function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }
    
    const serviceAccountJson = process.env.NEXT_PRIVATE_FIREBASE_ADMIN_JSON_B64;
    if (!serviceAccountJson) {
        throw new Error("CRITICAL: Firebase admin credentials (base64) are not set in environment variables.");
    }
    
    try {
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf-8'));
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch(e: any) {
        throw new Error(`Failed to parse or initialize Firebase Admin SDK: ${e.message}`);
    }
}

export async function getUsers(): Promise<UserProfile[]> {
  try {
    const adminApp = initializeAdminApp();
    const adminDb = adminApp.firestore();
    
    console.log("Attempting to fetch users with self-initialized adminDb...");
    const usersSnapshot = await adminDb.collection('users').get();
    
    if (usersSnapshot.empty) {
        console.log("adminDb query returned empty snapshot.");
        return [];
    }

    const users: UserProfile[] = [];
    usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt ? safeToDate(data.createdAt) : new Date();
        users.push({
            uid: doc.id,
            ...data,
            createdAt: createdAt,
        } as UserProfile);
    });
    
    console.log(`Successfully fetched ${users.length} users using self-initialized adminDb.`);
    return users;

  } catch (error) {
    console.error("CRITICAL: Failed to fetch users with adminDb.", error);
    // Return an empty array to prevent the page from crashing,
    // but the log will show the root cause.
    return [];
  }
}

export async function backfillUserStatuses(): Promise<{ success: boolean; message: string; }> {
    try {
        const adminApp = initializeAdminApp();
        const adminDb = adminApp.firestore();
        const usersRef = adminDb.collection('users');
        const usersSnapshot = await usersRef.get();
        const batch = adminDb.batch();
        let updatedCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data() as UserProfile;
            const userId = userDoc.id;

            if (user.status) { // Skip users who already have a status
                continue;
            }

            let newStatus: UserStatus = 'NEW';

            const cashbackQuery = query(collection(db, 'cashbackTransactions'), where('userId', '==', userId), limit(1));
            const cashbackSnap = await getDocs(cashbackQuery);

            if (!cashbackSnap.empty) {
                newStatus = 'Trader';
            } else {
                const accountsQuery = query(collection(db, 'tradingAccounts'), where('userId', '==', userId), where('status', '==', 'Approved'), limit(1));
                const accountsSnap = await getDocs(accountsQuery);
                if (!accountsSnap.empty) {
                    newStatus = 'Active';
                }
            }

            batch.update(userDoc.ref, { status: newStatus });
            updatedCount++;
        }

        if (updatedCount > 0) {
            await batch.commit();
            return { success: true, message: `Successfully updated ${updatedCount} users.` };
        } else {
            return { success: true, message: 'All users already have a status. No updates were needed.' };
        }
    } catch (error) {
        console.error("Error backfilling user statuses:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Failed to backfill statuses: ${errorMessage}` };
    }
}

export async function backfillUserLevels(): Promise<{ success: boolean; message: string; }> {
    try {
        const adminApp = initializeAdminApp();
        const adminDb = adminApp.firestore();
        const levels = await getClientLevels();
        if (levels.length === 0) {
            return { success: false, message: "No client levels configured. Please seed them first." };
        }
        levels.sort((a, b) => b.required_total - a.required_total);
        const lowestLevel = levels[levels.length - 1];

        const usersSnapshot = await adminDb.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() } as UserProfile & { id: string, ref: any }));
        
        const monthStart = startOfMonth(new Date());
        const cashbackQuery = query(collection(adminDb, 'cashbackTransactions'), where('date', '>=', monthStart));
        const cashbackSnap = await getDocs(cashbackQuery);

        const monthlyEarningsMap = new Map<string, number>();
        cashbackSnap.forEach(doc => {
            const tx = doc.data();
            const currentEarnings = monthlyEarningsMap.get(tx.userId) || 0;
            monthlyEarningsMap.set(tx.userId, currentEarnings + tx.cashbackAmount);
        });

        const batch = adminDb.batch();
        let updatedCount = 0;

        for (const user of users) {
            const monthlyEarnings = monthlyEarningsMap.get(user.id) || 0;
            const newLevel = levels.find(level => monthlyEarnings >= level.required_total) || lowestLevel;
            
            batch.update(user.ref, { level: newLevel.id, monthlyEarnings: monthlyEarnings });
            updatedCount++;
        }

        if (updatedCount > 0) {
            await batch.commit();
            return { success: true, message: `Successfully updated ${updatedCount} users with calculated levels and earnings.` };
        } else {
            return { success: true, message: 'No users to update.' };
        }

    } catch (error) {
        console.error("Error backfilling user levels:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, message: `Failed to backfill levels: ${errorMessage}` };
    }
}

export async function getClientLevels(): Promise<ClientLevel[]> {
    // This function can use the client 'db' as it reads from a public/semi-public collection
    const levelsCollection = collection(db, 'clientLevels');
    const snapshot = await getDocs(levelsCollection);
    if (snapshot.empty) {
        return []; 
    }
    const levelsArray = snapshot.docs.map(doc => ({
        id: parseInt(doc.id, 10),
        ...doc.data()
    } as ClientLevel));
    levelsArray.sort((a, b) => a.id - b.id);
    return levelsArray;
}
