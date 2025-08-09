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
    const { newPassword, isFirstLogin, email } = body;

    let user: any;

    // For first login, allow password change with just email
    if (isFirstLogin && email) {
      // Direct email-based password change for first-login users
      console.log('First-login password change requested for email:', email);
      
      try {
        const dbUser = await DatabaseService.getUserByEmail(email.toLowerCase());
        if (dbUser && dbUser.first_login) {
          user = dbUser;
          console.log('First-login user found, allowing password change without auth');
        } else if (dbUser && !dbUser.first_login) {
          console.error('User is not in first-login state');
          return NextResponse.json(
            { error: 'This account has already set a password. Please use the regular password change process.' },
            { status: 400 }
          );
        }
      } catch (e) {
        console.error('Error fetching user for first-login:', e);
      }
    } else if (isFirstLogin) {
      // Fallback to cookie-based auth for first-login
      const firstLoginSession = request.cookies.get('first-login-session')?.value;
      
      if (firstLoginSession) {
        try {
          const session = JSON.parse(firstLoginSession);
          console.log('First-login session found:', session);
          
          // Verify the session is recent (within 30 minutes)
          if (session.timestamp && (Date.now() - session.timestamp) < 30 * 60 * 1000) {
            // Get user by email from the session
            const dbUser = await DatabaseService.getUserByEmail(session.email);
            if (dbUser && dbUser.first_login) {
              user = dbUser;
              console.log('User found for first-login password change:', user.email);
            }
          }
        } catch (e) {
          console.warn('Failed to parse first-login-session cookie', e);
        }
      }
      
      // Fallback: try other cookies if first-login-session doesn't work
      if (!user) {
        const legacyCookie = request.cookies.get('wpa_auth')?.value;
        const authToken = request.cookies.get('auth-token')?.value;
        
        if (legacyCookie) {
          try {
            const payload = JSON.parse(legacyCookie);
            if (payload?.email) {
              const dbUser = await DatabaseService.getUserByEmail(payload.email);
              if (dbUser) {
                user = dbUser;
                console.log('User found via wpa_auth cookie:', user.email);
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
              console.log('User found via JWT token:', user.email);
            }
          } catch (e) {
            console.warn('Failed to verify JWT during first login', e);
          }
        }
      }

      if (!user) {
        console.error('No valid session found for first-login password change');
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

        // Clear the first-login-session cookie since password has been changed
        res.cookies.delete('first-login-session');

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