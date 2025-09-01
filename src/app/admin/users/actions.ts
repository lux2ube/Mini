
'use server';

import * as admin from 'firebase-admin';
import type { UserProfile } from '@/types';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin-config';

const safeToDate = (timestamp: any): Date | undefined => {
    if (timestamp instanceof admin.firestore.Timestamp) {
        return timestamp.toDate();
    }
    // This handles client-side Timestamps if they ever slip in, though less likely in admin actions
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
        return timestamp;
    }
    return undefined;
};


async function verifyAdmin() {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) {
        throw new Error("Not authenticated: No session cookie found.");
    }

    try {
        const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        
        if (decodedIdToken.admin !== true) {
            throw new Error("Not authorized: User is not an admin.");
        }
        
        return decodedIdToken;
    } catch (error) {
        console.error("Admin verification failed:", error);
        throw new Error("Admin verification failed. Please log in again.");
    }
}


export async function getUsers(): Promise<UserProfile[]> {
    try {
        await verifyAdmin();

        const usersSnapshot = await adminDb.collection('users').get();
        if (usersSnapshot.empty) {
            return [];
        }
        
        const users: UserProfile[] = [];
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            
            // Convert any Timestamps to serializable Dates
            const kycData = data.kycData ? { ...data.kycData, submittedAt: safeToDate(data.kycData.submittedAt) } : undefined;
            const addressData = data.addressData ? { ...data.addressData, submittedAt: safeToDate(data.addressData.submittedAt) } : undefined;
            
            users.push({
                uid: doc.id,
                ...data,
                createdAt: safeToDate(data.createdAt),
                kycData,
                addressData,
            } as UserProfile);
        });

        return users;

    } catch (error) {
        console.error("Error fetching users with Admin SDK:", error);
        // Throw the error so the frontend knows something went wrong.
        if (error instanceof Error) {
            throw new Error(`Failed to fetch users: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching users.");
    }
}
