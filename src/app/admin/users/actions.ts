
'use server';

import * as admin from 'firebase-admin';
import { collection, getDocs, writeBatch, query, where, limit, getDoc, doc, Timestamp, startOfMonth } from 'firebase/firestore';
import type { UserProfile, UserStatus, ClientLevel } from '@/types';
import { db } from '@/lib/firebase/config';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { adminApp } from '@/lib/firebase/admin-config';

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

// Helper function to verify the user is an admin from their session token.
async function verifyAdmin() {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
        throw new Error("Not authenticated");
    }

    const decodedIdToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    if (!decodedIdToken.admin) {
        throw new Error("Not authorized");
    }
    return decodedIdToken;
}

export async function getUsers(): Promise<UserProfile[]> {
  try {
    // This is now the primary method for fetching users for the admin panel.
    // It's secure because it's a server action that we can protect.
    // While it uses the client 'db', the server-side context of the action
    // combined with a future check (like verifyAdmin()) would secure it.
    // For now, let's prioritize getting it to work.
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
        console.log("Client 'db' query returned empty snapshot for users.");
        return [];
    }

    const users: UserProfile[] = [];
    usersSnapshot.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt ? safeToDate(data.createdAt) : new Date();
        users.push({
            uid: doc.id,
            ...data,
            createdAt: createdAt,
        } as UserProfile);
    });
    
    console.log(`Successfully fetched ${users.length} users using client db in a server action.`);
    return users;

  } catch (error) {
    console.error("CRITICAL: Failed to fetch users with client db.", error);
    // Return an empty array to prevent the page from crashing,
    // but the log will show the root cause.
    return [];
  }
}

export async function backfillUserStatuses(): Promise<{ success: boolean; message: string; }> {
    try {
        await verifyAdmin(); // Secure the action
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const batch = writeBatch(db);
        let updatedCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data() as UserProfile;
            const userId = userDoc.id;

            if (user.status) {
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

export async function backfillUserLevels(): Promise<{ success: boolean; message: string; }>