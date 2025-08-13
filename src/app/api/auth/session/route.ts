import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ user: null });
    }

    // Verify and decode token
    const decoded = await verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ user: null });
    }

    // Return user data from token
    return NextResponse.json({
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        workspaceId: decoded.workspaceId,
        firstLogin: (decoded as any).firstLogin || false,
        needsOnboarding: (decoded as any).needsOnboarding || false
      }
    });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null });
  }
}