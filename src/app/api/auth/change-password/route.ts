import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { requireAuth, createToken } from '@/lib/server-auth';
import { hashPassword } from '@/lib/passwords';

export async function POST(request: NextRequest) {
  try {
    // Ensure DB initialized BEFORE auth, since auth verification reads DB
    await ensureDatabaseInitialized();

    // Get request body first to check if it's a first login
    const body = await request.json();
    const { newPassword, isFirstLogin } = body;

    let user: any;

    // For first login, check the session cookie directly instead of requireAuth
    if (isFirstLogin) {
      // Try to get user from cookies during first login
      const legacyCookie = request.cookies.get('wpa_auth')?.value;
      const authToken = request.cookies.get('auth-token')?.value;
      
      if (legacyCookie) {
        try {
          const payload = JSON.parse(legacyCookie);
          if (payload?.email) {
            const dbUser = await DatabaseService.getUserByEmail(payload.email);
            if (dbUser) {
              user = dbUser;
            }
          }
        } catch (e) {
          console.warn('Failed to parse wpa_auth cookie during first login', e);
        }
      }
      
      if (!user && authToken) {
        // Try JWT token as fallback
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'your-jwt-secret-key') as any;
          const dbUser = await DatabaseService.getUserByEmail(decoded.email);
          if (dbUser) {
            user = dbUser;
          }
        } catch (e) {
          console.warn('Failed to verify JWT during first login', e);
        }
      }

      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required - please login again' },
          { status: 401 }
        );
      }
    } else {
      // For non-first-login password changes, use regular auth
      const authResult = await requireAuth(request);
      if (authResult instanceof Response) {
        return authResult;
      }
      user = authResult.user;
    }

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
    const passwordHash = hashPassword(newPassword);

    // Update user's password and first_login status
    await ensureDatabaseInitialized();
    await DatabaseService.updateUserAccount(user.id, {
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