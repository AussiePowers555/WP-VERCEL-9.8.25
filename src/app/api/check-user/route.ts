import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const url = new URL(request.url);
    const email = url.searchParams.get('email') || 'meehansoftwaredev555@gmail.com';
    
    const user = await DatabaseService.getUserByEmail(email);
    
    if (user) {
      let workspace = null;
      if (user.workspace_id) {
        workspace = await DatabaseService.getWorkspaceById(user.workspace_id);
      }
      
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          workspace_id: user.workspace_id,
          contact_id: user.contact_id,
          first_login: user.first_login,
          created_at: user.created_at,
        },
        workspace: workspace,
        derivedRole: user.role === 'admin' || user.role === 'developer' ? 'admin' : 'workspace'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}