import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { requireAuth } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const authResult = await requireAuth(request);
    if (!authResult || authResult instanceof Response) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId } = await request.json();

    // Verify the user is completing their own onboarding
    if (authResult.user.id !== userId && authResult.user.role !== 'admin' && authResult.user.role !== 'developer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Mark onboarding as complete
    await DatabaseService.updateUserAccount(userId, {
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully'
    });

  } catch (error) {
    console.error('Onboarding completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}