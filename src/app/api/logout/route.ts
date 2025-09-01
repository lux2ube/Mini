
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin-config';

export async function POST() {
  const sessionCookie = cookies().get('session')?.value;

  if (sessionCookie) {
    try {
      // Clear the session cookie
      cookies().set('session', '', { expires: new Date(0), path: '/' });
      
      // Optional: Revoke the session on Firebase side
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie).catch(() => null);
      if (decodedClaims) {
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if revoke fails, the cookie is cleared, so we can return success.
    }
  }

  return NextResponse.json({ status: 'success' }, { status: 200 });
}
