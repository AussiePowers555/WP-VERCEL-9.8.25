import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { requireAuth } from '@/lib/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { id } = await params;
    const contact = await (DatabaseService as any).getContactById?.(id) ?? await DatabaseService.getAllContacts().then(list => list.find((c: any) => c.id === id));
    
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { id } = await params;
    const updates = await request.json();
    
    const contact = await (DatabaseService as any).getContactById?.(id) ?? await DatabaseService.getAllContacts().then(list => list.find((c: any) => c.id === id));
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    await (DatabaseService as any).updateContact?.(id, updates);
    const updatedContact = await ((DatabaseService as any).getContactById?.(id) ?? DatabaseService.getAllContacts().then(list => list.find((c: any) => c.id === id)));
    
    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseInitialized();
    
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { id } = await params;
    
    const contact = await (DatabaseService as any).getContactById?.(id) ?? await DatabaseService.getAllContacts().then(list => list.find((c: any) => c.id === id));
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    await (DatabaseService as any).deleteContact?.(id);
    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 