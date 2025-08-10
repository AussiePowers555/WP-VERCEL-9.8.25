import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from '@/lib/passwords';
import { v4 as uuidv4 } from 'uuid';

const getDb = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(databaseUrl);
};

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, email, password } = await request.json();

    if (!workspaceId || !email || !password) {
      return NextResponse.json(
        { error: 'Workspace ID, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Check if workspace exists
    const workspace = await sql`
      SELECT id, name FROM workspaces WHERE id = ${workspaceId}
    `;

    if (workspace.length === 0) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Check if email already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      // User exists - update their workspace access
      const userId = existingUser[0].id;
      
      // Update existing user's workspace
      await sql`
        UPDATE users 
        SET workspace_id = ${workspaceId},
            updated_at = NOW()
        WHERE id = ${userId}
      `;

      console.log('[Workspace Share] Updated existing user workspace access:', {
        userId,
        workspaceId,
        email
      });

      return NextResponse.json({
        workspaceId,
        workspaceName: workspace[0].name,
        email,
        message: 'User workspace access updated',
        isExistingUser: true
      });
    }

    // Create new user with workspace access
    const userId = uuidv4();
    const hashedPassword = hashPassword(password);

    await sql`
      INSERT INTO users (
        id, 
        email, 
        password_hash, 
        role, 
        workspace_id,
        status,
        created_at, 
        updated_at
      )
      VALUES (
        ${userId}, 
        ${email}, 
        ${hashedPassword}, 
        'workspace_user',
        ${workspaceId},
        'active',
        NOW(), 
        NOW()
      )
    `;

    console.log('[Workspace Share] Created new user with workspace access:', {
      userId,
      workspaceId,
      workspaceName: workspace[0].name,
      email
    });

    return NextResponse.json({
      workspaceId,
      workspaceName: workspace[0].name,
      email,
      password, // Return the original password for display
      message: 'User created with workspace access',
      isNewUser: true
    });

  } catch (error) {
    console.error('[Workspace Share] Error:', error);
    return NextResponse.json(
      { error: 'Failed to share workspace' },
      { status: 500 }
    );
  }
}