import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { createToken } from '@/lib/server-auth';
import { hashPassword } from '@/lib/passwords';

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user from PostgreSQL database
    const user = await DatabaseService.getUserByEmail(email.toLowerCase());

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const hashedPassword = hashPassword(password);
    if (user.password_hash !== hashedPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 401 }
      );
    }

    // Track first login if applicable
    const isFirstLogin = user.first_login;
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    
    // Update last login and first_login status
    await DatabaseService.updateUserAccount(user.id, {
      last_login: new Date().toISOString(),
      first_login: false // Mark as no longer first login after successful login
    });
    
    // Track first login in credential distributions
    if (isFirstLogin) {
      await DatabaseService.trackFirstLogin(user.id, ipAddress || undefined, userAgent || undefined);
    }

    // Create JWT token
    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspace_id
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        workspaceId: user.workspace_id || null,
        contactId: user.contact_id || null,
        firstLogin: isFirstLogin,
        needsOnboarding: isFirstLogin
      },
      token
    });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    // Also set legacy wpa_auth cookie for first-login compatibility
    const cookiePayload = JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspace_id || null
    });
    
    response.cookies.set('wpa_auth', cookiePayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    // Set special first-login session if this is a first login
    if (user.first_login) {
      response.cookies.set('first-login-session', JSON.stringify({
        userId: user.id,
        email: user.email,
        timestamp: Date.now()
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 30 // 30 minutes for password change
      });
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}