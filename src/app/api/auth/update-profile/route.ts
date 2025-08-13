import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { requireAuth } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { userId, fullName, phone } = await request.json();

    // Verify the user is updating their own profile
    if (authResult.user.id !== userId && authResult.user.role !== 'admin' && authResult.user.role !== 'developer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update user profile
    const updates: any = {};
    if (fullName) updates.full_name = fullName;
    if (phone) updates.phone = phone;

    if (Object.keys(updates).length > 0) {
      await DatabaseService.updateUserAccount(userId, updates);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}