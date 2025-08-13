import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server-auth';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { checkPasswordExpiry } from '@/lib/password-generator';

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    // Get user's password expiry date from database
    const users = await DatabaseService.getAllUserAccounts();
    const user = users.find((u: any) => u.id === authResult.user.id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if password is expired or expiring soon
    const passwordExpiryDate = (user as any).password_expires_at || 
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Default to 90 days from now if not set
    
    const expiryStatus = checkPasswordExpiry(passwordExpiryDate, 7); // Warn 7 days before expiry

    return NextResponse.json({
      ...expiryStatus,
      expiryDate: passwordExpiryDate
    });

  } catch (error) {
    console.error('Password expiry check error:', error);
    return NextResponse.json(
      { error: 'Failed to check password expiry' },
      { status: 500 }
    );
  }
}