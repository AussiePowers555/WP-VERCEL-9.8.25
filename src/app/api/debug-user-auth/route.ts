import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { hashPassword } from '@/lib/passwords';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Get user from database
    const userResult = await sql`
      SELECT id, email, password_hash, role, workspace_id, contact_id, status
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `;
    
    if (!userResult.rows[0]) {
      return NextResponse.json({ 
        error: 'User not found',
        email 
      });
    }
    
    const user = userResult.rows[0];
    const hashedInput = hashPassword(password);
    
    return NextResponse.json({
      user: {
        email: user.email,
        role: user.role,
        workspace_id: user.workspace_id,
        status: user.status
      },
      passwordMatch: hashedInput === user.password_hash,
      providedPassword: password,
      hashedProvided: hashedInput,
      storedHash: user.password_hash
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function GET() {
  try {
    // List all test users
    const result = await sql`
      SELECT email, role, workspace_id, status, created_at
      FROM users 
      WHERE email LIKE '%test%' OR email LIKE '%michaelalanwilson%'
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json({
      users: result.rows
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}