import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { requireAuth, createToken } from '@/lib/server-auth';
import CryptoJS from 'crypto-js';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { user } = authResult;

    // Get request body
    const { newPassword, isFirstLogin } = await request.json();

    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = CryptoJS.SHA256(newPassword + 'salt_pbr_2024').toString();

    // Update user's password and first_login status
    await ensureDatabaseInitialized();
    DatabaseService.updateUserAccount(user.id, {
      password_hash: passwordHash,
      first_login: false,
      updated_at: new Date() as any,
    });

    // If this was a first login, update the auth cookie
    if (isFirstLogin) {
      const updatedUser = await DatabaseService.getUserByEmail(user.email);
      if (updatedUser) {
        const cookiePayload = JSON.stringify({
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
        });

        const res = NextResponse.json({
          success: true,
          message: 'Password changed successfully',
        });

        // Update the auth cookie
        res.cookies.set('wpa_auth', cookiePayload, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 12, // 12 hours
        });

        // Also refresh JWT so protected APIs work immediately after change
        const jwt = createToken({
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          workspaceId: (updatedUser as any).workspace_id,
        });
        res.cookies.set('auth-token', jwt, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 12,
        });

        return res;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}