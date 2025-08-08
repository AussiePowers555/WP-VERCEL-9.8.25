import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabaseInitialized } from '@/lib/database';
import { createToken } from '@/lib/server-auth';
import { authenticateUser, initializeDeveloperAccounts } from '@/lib/user-auth';
import { verifyPassword } from '@/lib/passwords';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Ensure DB ready and dev accounts exist (idempotent)
    await ensureDatabaseInitialized();
    await initializeDeveloperAccounts();

    // Try DB-backed authentication first
    let auth = await authenticateUser(email, password);

    // Fallback to simple hardcoded auth (kept for dev resilience)
    if (!auth.success) {
      if (
        (email === 'whitepointer2016@gmail.com' || email === 'michaelalanwilson@gmail.com') &&
        password === 'Tr@ders84'
      ) {
        auth = {
          success: true,
          user: {
            // create stable dev ids matching seed for consistency if present
            id: email === 'whitepointer2016@gmail.com' ? 'user_admin_david' : 'user_admin_michael',
            email,
            role: 'developer',
            status: 'active',
            first_login: false,
            remember_login: true,
          } as any,
        };
      } else if ((email === 'admin' || email === 'admin@whitepointer.com') && verifyPassword(password, 'admin')) {
        auth = {
          success: true,
          user: {
            id: `admin-${Date.now()}`,
            email,
            role: 'admin',
            status: 'active',
            first_login: false,
            remember_login: true,
          } as any,
        };
      }
    }

    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if user needs to change password on first login
    const firstLogin = (auth.user as any).first_login;

    // Issue httpOnly cookie for middleware-based SSR gating
    const res = NextResponse.json({
      success: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        role: (auth.user as any).role,
        name: (auth.user as any).name ?? 'User',
      },
      firstLogin: firstLogin,
    });

    const cookiePayload = JSON.stringify({
      id: auth.user.id,
      email: auth.user.email,
      role: (auth.user as any).role,
    });

    // Legacy/dev session cookie
    res.cookies.set('wpa_auth', cookiePayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours
    });

    // Also issue JWT auth-token so API routes using requireAuth work uniformly
    const jwt = createToken({
      id: auth.user.id,
      email: auth.user.email,
      role: (auth.user as any).role,
      workspaceId: (auth.user as any).workspace_id,
    });
    res.cookies.set('auth-token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch (error) {
    console.error('Simple login error:', error);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}