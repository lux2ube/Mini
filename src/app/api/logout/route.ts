
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin-config';

export async function POST() {
  const sessionCookie = cookies().get('session')?.value;

  if (sessionCookie) {
    try {
      cookies().set('session', '', { expires: new Date(0), path: '/' });
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie).catch(() => null);
      if (decodedClaims) {
        await adminAuth.revokeRefreshTokens(decodedClaims.sub);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  return NextResponse.json({ status: 'success' }, { status: 200 });
}
