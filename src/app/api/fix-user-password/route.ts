import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { hashPassword } from '@/lib/passwords';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }
    
    // Hash the password
    const hashedPassword = hashPassword(password);
    
    // Check if user exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `;
    
    if (existingUser.rows.length > 0) {
      // Update existing user's password
      await sql`
        UPDATE users 
        SET password_hash = ${hashedPassword},
            first_login = false,
            updated_at = NOW()
        WHERE email = ${email}
      `;
      
      return NextResponse.json({ 
        success: true,
        message: 'Password updated successfully',
        email
      });
    } else {
      // Create new user with the provided password
      const userId = `user_${Date.now()}`;
      await sql`
        INSERT INTO users (
          id, email, password_hash, role, status, 
          first_login, workspace_id, created_at
        ) VALUES (
          ${userId},
          ${email},
          ${hashedPassword},
          'workspace_user',
          'active',
          false,
          'ws-david',
          NOW()
        )
      `;
      
      return NextResponse.json({ 
        success: true,
        message: 'User created successfully',
        email,
        workspaceId: 'ws-david'
      });
    }
  } catch (error) {
    console.error('Error fixing user password:', error);
    return NextResponse.json({ 
      error: 'Failed to fix user password',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}