
'use server';

import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { Withdrawal } from '@/types';

export async function getWalletHistory(userId: string): Promise<{ withdrawals: Withdrawal[] }> {
    try {
        const withdrawalsQuery = query(collection(db, 'withdrawals'), where('userId', '==', userId));
        const withdrawalsSnap = await getDocs(withdrawalsQuery);

        const withdrawals = withdrawalsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                requestedAt: (data.requestedAt as Timestamp).toDate(),
                completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
            } as Withdrawal;
        });

        // Sort descending by request date
        withdrawals.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

        // In the future, you can also query a 'deposits' collection here
        const deposits = [];

        return { withdrawals };

    } catch (error) {
        console.error("Error fetching wallet history:", error);
        return { withdrawals: [] };
    }
}
