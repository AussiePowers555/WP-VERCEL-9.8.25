import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { hashPassword, generateTempPassword } from '@/lib/passwords';

// keep legacy name used below
const generateRandomPassword = generateTempPassword;

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [GET /api/users] Starting to fetch users...');
    
    await ensureDatabaseInitialized();
    console.log('✅ [GET /api/users] Database initialized');
    
    const users = await DatabaseService.getAllUserAccounts();
    console.log(`✅ [GET /api/users] Found ${users.length} users`);
    
    return NextResponse.json({
      success: true,
      users: users.map((user: any) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        workspace_id: user.workspace_id,
        contact_id: user.contact_id,
        created_at: user.created_at,
        last_login: user.last_login
      }))
    });
  } catch (error) {
    console.error('❌ [GET /api/users] Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, role, workspace_id, contact_id, send_email } = await request.json();
    
    if (!email || !role) {
      return NextResponse.json(
        { success: false, error: 'Email and role are required' },
        { status: 400 }
      );
    }
    
    await ensureDatabaseInitialized();
    
    // Check if user already exists (also prevent duplicate contact email)
    const existingUser = await DatabaseService.getUserByEmail(email);
    const existingContact = (await DatabaseService.getAllContacts()).find((c: any) => c.email === email);
    if (existingUser || existingContact) {
      return NextResponse.json(
        { success: false, error: 'Email already exists in the system' },
        { status: 400 }
      );
    }
    
    // Generate random password
    const tempPassword = generateRandomPassword();
    
    // Create user
    const newUser = await DatabaseService.createUserAccount({
      email,
      password_hash: hashPassword(tempPassword),
      role,
      status: 'active',  // Changed from 'pending_password_change' to allow login
      contact_id: contact_id || null,
      workspace_id: workspace_id || null,
      first_login: true,  // Changed from false to true for first-time users
      remember_login: false
    });
    
    // Send email if requested
    let emailSent = false;
    if (send_email) {
      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/users/send-credentials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: tempPassword,
            role
          })
        });
        emailSent = emailResponse.ok;
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        workspace_id: newUser.workspace_id,
        contact_id: newUser.contact_id
      },
      credentials: send_email ? null : {
        email,
        password: tempPassword
      },
      email_sent: emailSent
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}