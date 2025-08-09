import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { requireAdmin } from '@/lib/server-auth';

export async function GET() {
  try {
    await ensureDatabaseInitialized();
    const contacts = await DatabaseService.getAllContacts();
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin access for creating contacts
    const auth = await requireAdmin(request);
    if (auth instanceof Response) return auth;
    
    await ensureDatabaseInitialized();
    const contactData = await request.json();

    // Enforce unique email if provided
    if (contactData.email) {
      const existing = await (DatabaseService as any).getUserByEmail?.(contactData.email) ||
                       (await DatabaseService.getAllContacts()).find((c: any) => c.email === contactData.email);
      if (existing) {
        return NextResponse.json({ error: 'A contact or user with this email already exists' }, { status: 409 });
      }
    }
    
    // Create the contact
    const newContact = await DatabaseService.createContact(contactData);
    
    // Provision workspace and user if explicitly requested
    let workspace = null;
    let user = null;
    let tempPassword = null;
    
    if (contactData.createWorkspaceAccess && contactData.email) {
      try {
        const provisionResult = await (DatabaseService as any).provisionWorkspaceAndUser?.(newContact);
        if (provisionResult) {
          workspace = provisionResult.workspace;
          user = provisionResult.user;
          tempPassword = provisionResult.tempPassword;
        }
        
        console.log(`✅ Provisioned workspace and user for ${newContact.name}`);
      } catch (error) {
        console.error('Failed to provision workspace/user:', error);
        // Continue - contact creation succeeded even if provisioning failed
      }
    }
    
    return NextResponse.json({
      contact: newContact,
      workspace,
      user: user ? { ...user, password_hash: undefined } : null, // Don't send password hash
      tempPassword
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}