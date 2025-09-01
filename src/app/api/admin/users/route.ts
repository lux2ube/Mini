
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as admin from 'firebase-admin';
import { adminDb, adminAuth } from '@/lib/firebase/admin-config';
import type { UserProfile } from '@/types';

// Helper function to safely convert Firestore Timestamps to serializable strings
const safeToISOString = (timestamp: any): string | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof admin.firestore.Timestamp) {
        return timestamp.toDate().toISOString();
    }
    if (timestamp instanceof Date) {
        return timestamp.toISOString();
    }
    // Attempt to parse if it's a different format, otherwise return as is
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date.toISOString();
    }
    return undefined;
};


export async function GET(request: Request) {
    try {
        // 1. Verify the session cookie from the request
        const sessionCookie = cookies().get('session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized: No session cookie found.' }, { status: 401 });
        }
        
        const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);

        // 2. Check for the 'admin' custom claim
        if (decodedIdToken.admin !== true) {
            return NextResponse.json({ error: 'Forbidden: User is not an admin.' }, { status: 403 });
        }

        // 3. If verification passes, fetch users from Firestore using the Admin SDK
        const usersSnapshot = await adminDb.collection('users').get();
        
        if (usersSnapshot.empty) {
            return NextResponse.json({ users: [] });
        }
        
        const users: Omit<UserProfile, 'createdAt'>[] & { createdAt?: string } = [];
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            users.push({
                uid: doc.id,
                ...data,
                // Ensure timestamps are converted to ISO strings for JSON serialization
                createdAt: safeToISOString(data.createdAt),
            } as Omit<UserProfile, 'createdAt'> & { createdAt?: string });
        });

        return NextResponse.json({ users });

    } catch (error) {
        console.error("Error in /api/admin/users:", error);
        // Distinguish between auth errors and other errors
        if (error instanceof Error && (error.message.includes('permission-denied') || error.message.includes('Unauthorized'))) {
            return NextResponse.json({ error: 'Authentication error.' }, { status: 401 });
        }
        return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
    }
}
