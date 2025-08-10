import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
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
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
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

    // Check if email already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Generate IDs
    const workspaceId = uuidv4();
    const userId = uuidv4();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create workspace
    await sql`
      INSERT INTO workspaces (id, name, created_at, updated_at)
      VALUES (${workspaceId}, ${name}, NOW(), NOW())
    `;

    // Create user with workspace access
    await sql`
      INSERT INTO users (
        id, 
        email, 
        password_hash, 
        role, 
        workspace_id,
        created_at, 
        updated_at
      )
      VALUES (
        ${userId}, 
        ${email}, 
        ${hashedPassword}, 
        'workspace_user',
        ${workspaceId},
        NOW(), 
        NOW()
      )
    `;

    console.log('[Workspace Create] Created workspace:', {
      workspaceId,
      name,
      email,
      userId
    });

    return NextResponse.json({
      id: workspaceId,
      name,
      email,
      password, // Return the original password for display to the user
      message: 'Workspace created successfully'
    });

  } catch (error) {
    console.error('[Workspace Create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}