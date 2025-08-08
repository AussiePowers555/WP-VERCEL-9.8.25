import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { hashPassword, generateTempPassword as genTemp } from '@/lib/passwords';

// Utility to generate a reasonably strong temp password
const generateTempPassword = () => genTemp(12);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const updates = await request.json();
    
    await ensureDatabaseInitialized();
    
    // If password is being updated, hash it
    if (updates.password) {
      updates.password_hash = hashPassword(updates.password);
      delete updates.password;
    }
    
    await DatabaseService.updateUserAccount(id, updates);
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // POST /api/users/{id} with body { action: "generate-temp-password" }
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json().catch(() => ({}));
    const action = body?.action;

    if (action !== 'generate-temp-password') {
      return NextResponse.json(
        { success: false, error: 'Unsupported action' },
        { status: 400 }
      );
    }

    await ensureDatabaseInitialized();

    // Generate and hash new temp password, set status to pending_password_change
    const tempPassword = generateTempPassword();
    const password_hash = hashPassword(tempPassword);

    await DatabaseService.updateUserAccount(id, {
      password_hash,
      status: 'active',  // Keep active so user can login
      updated_at: new Date() as any,
      first_login: 0  // Set to 0 - no forced password change
    });

    return NextResponse.json({
      success: true,
      tempPassword
    });
  } catch (error) {
    console.error('Error generating temp password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate temporary password' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    await ensureDatabaseInitialized();
    
    await DatabaseService.updateUserAccount(id, {
      status: 'deleted',
      updated_at: new Date() as any
    });
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}