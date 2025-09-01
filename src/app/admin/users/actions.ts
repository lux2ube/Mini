
'use server';

import * as admin from 'firebase-admin';
import type { UserProfile } from '@/types';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin-config';

const safeToDate = (timestamp: any): Date | undefined => {
    if (timestamp instanceof admin.firestore.Timestamp) {
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
            users.push({
                uid: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate() : undefined,
            } as UserProfile);
        });

        return users;

    } catch (error) {
        console.error("Error fetching users with Admin SDK:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch users: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching users.");
    }
}
