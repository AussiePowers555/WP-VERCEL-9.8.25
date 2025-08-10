import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();
    
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    // Get user with workspace info
    const user = await DatabaseService.getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ 
        exists: false,
        message: `No user found with email: ${email}` 
      });
    }

    // Get workspace name if user has one
    let workspaceName = null;
    if (user.workspace_id) {
      const workspace = await DatabaseService.getWorkspaceById(user.workspace_id);
      workspaceName = workspace?.name || null;
    }

    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        workspace_id: user.workspace_id,
        status: user.status,
        workspace_name: workspaceName
      },
      message: `User found: ${email}`
    });

  } catch (error) {
    console.error('[Test User Exists] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    );
  }
}