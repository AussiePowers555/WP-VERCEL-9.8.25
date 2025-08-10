import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const getDb = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(databaseUrl);
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const sql = getDb();
    
    const users = await sql`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.workspace_id,
        u.status,
        w.name as workspace_name
      FROM users u
      LEFT JOIN workspaces w ON u.workspace_id = w.id
      WHERE u.email = ${email}
    `;

    if (users.length === 0) {
      return NextResponse.json({ 
        exists: false,
        message: `No user found with email: ${email}` 
      });
    }

    return NextResponse.json({
      exists: true,
      user: users[0],
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