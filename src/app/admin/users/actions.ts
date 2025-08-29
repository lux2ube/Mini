
'use server';

import { db } from '@/lib/firebase/config';
import { collection, getDocs, writeBatch, query, where, limit, startOfMonth } from 'firebase/firestore';
import type { UserProfile, UserStatus, ClientLevel } from '@/types';

const safeToDate = (timestamp: any): Date | undefined => {
    if (timestamp instanceof Date) {
        return timestamp;
    }
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    return undefined;
};

// User Management
export async function getUsers(): Promise<UserProfile[]> {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users: UserProfile[] = [];
  usersSnapshot.docs.forEach(doc => {
      try {
          const data = doc.data();
          users.push({
              uid: doc.id,
              ...data,
              createdAt: safeToDate(data.createdAt) || new Date(),
          } as UserProfile);
      } catch (error) {
          console.error(`Error processing user ${doc.id}:`, error);
      }
  });
  return users;
}

// Admin migration script for user statuses
export async function backfillUserStatuses(): Promise<{ success: boolean; message: string; }> {
    try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const batch = writeBatch(db);
        let updatedCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data() as UserProfile;
            const userId = userDoc.id;

            if (user.status) { // Skip users who already have a status
                continue;
            }

            let newStatus: UserStatus = 'NEW';

            // Check if they are a trader
            const cashbackQuery = query(collection(db, 'cashbackTransactions'), where('userId', '==', userId), limit(1));
            const cashbackSnap = await getDocs(cashbackQuery);

            if (!cashbackSnap.empty) {
                newStatus = 'Trader';
            } else {
                // Check if they are active
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

export async function getClientLevels(): Promise<ClientLevel[]> {
    const levelsCollection = collection(db, 'clientLevels');
    const snapshot = await getDocs(levelsCollection);
    if (snapshot.empty) {
        return []; // Return empty array if no levels are seeded
    }
    const levelsArray = snapshot.docs.map(doc => ({
        id: parseInt(doc.id, 10),
        ...doc.data()
    } as ClientLevel));
    levelsArray.sort((a, b) => a.id - b.id);
    return levelsArray;
}


export async function backfillUserLevels(): Promise<{ success: boolean; message: string; }> {
    try {
        const levels = await getClientLevels();
        if (levels.length === 0) {
            return { success: false, message: "No client levels configured. Please seed them first." };
        }
        levels.sort((a, b) => b.required_total - a.required_total);

        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const batch = writeBatch(db);
        let updatedCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data() as UserProfile;
            
            const now = new Date();
            const monthStart = startOfMonth(now);
            const cashbackQuery = query(
                collection(db, 'cashbackTransactions'),
                where('userId', '==', userDoc.id),
                where('date', '>=', monthStart)
            );
            const cashbackSnap = await getDocs(cashbackQuery);
            const monthlyEarnings = cashbackSnap.docs.reduce((sum, doc) => sum + doc.data().cashbackAmount, 0);

            let newLevel = 1;
            for (const level of levels) {
                if (monthlyEarnings >= level.required_total) {
                    newLevel = level.id;
                    break;
                }
            }

            batch.update(userDoc.ref, { level: newLevel, monthlyEarnings: monthlyEarnings });
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
