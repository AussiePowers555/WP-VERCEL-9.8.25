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

    // Update last login
    await DatabaseService.updateUserAccount(user.id, {
      last_login: new Date().toISOString()
    });

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
        workspaceId: user.workspace_id,
        firstLogin: user.first_login
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
      role: user.role
    });
    
    response.cookies.set('wpa_auth', cookiePayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}