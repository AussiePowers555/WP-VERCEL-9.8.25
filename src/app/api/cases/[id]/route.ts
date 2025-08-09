import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, initializeDatabase } from '@/lib/database';
import { requireAuth, canAccessCase } from '@/lib/server-auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Initialize database if needed
    initializeDatabase();
    
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    
    const { user } = authResult;
    const params = await context.params;
    const { id } = params;
    
    // Try to get case by ID first, then by case number if not found
    let caseData = await DatabaseService.getCaseById(id);
    if (!caseData) {
      // Try by case number
      caseData = await DatabaseService.getCaseByCaseNumber(id);
    }
    
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Check if user can access this case
    if (!canAccessCase(user, (caseData as any).workspaceId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json(caseData);
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Initialize database if needed
    initializeDatabase();
    
    // Authenticate user
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    
    const { user } = authResult;
    const params = await context.params;
    const { id } = params;
    
    // First check if case exists and user can access it
    let caseData = await DatabaseService.getCaseById(id);
    if (!caseData) {
      // Try by case number
      caseData = await DatabaseService.getCaseByCaseNumber(id);
    }
    
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    if (!canAccessCase(user, (caseData as any).workspaceId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updates = await request.json();
    
    console.log(`[PUT /api/cases/${id}] Received updates:`, updates);
    console.log(`[PUT /api/cases/${id}] Case ID: ${(caseData as any).id}, Case Number: ${(caseData as any).caseNumber}`);
    
    // Prevent workspace users from changing workspace assignment 
    if (user.role === 'workspace_user' && updates.workspace_id && updates.workspace_id !== user.workspace_id) {
      return NextResponse.json({ error: 'Cannot modify workspace assignment' }, { status: 403 });
    }
    
    // Use the actual database ID for the update, not the parameter which might be case number
    const actualId = (caseData as any).id;
    console.log(`[PUT /api/cases/${id}] Updating case with ID: ${actualId}`);
    
    await DatabaseService.updateCase(actualId, updates);
    
    // Fetch updated case to confirm changes
    const updatedCase = await DatabaseService.getCaseById(actualId);
    console.log(`[PUT /api/cases/${id}] Updated case:`, {
      id: updatedCase?.id,
      caseNumber: updatedCase?.caseNumber,
      workspace_id: updatedCase?.workspace_id,
      assigned_lawyer_id: updatedCase?.assigned_lawyer_id,
      assigned_rental_company_id: updatedCase?.assigned_rental_company_id,
      at_fault_party_insurance_company: updatedCase?.at_fault_party_insurance_company
    });
    
    return NextResponse.json({ 
      success: true,
      updated: {
        workspace_id: updatedCase?.workspace_id,
        assigned_lawyer_id: updatedCase?.assigned_lawyer_id,
        assigned_rental_company_id: updatedCase?.assigned_rental_company_id
      }
    });
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Initialize database if needed
    initializeDatabase();
    
    // Authenticate user (require admin for deletion)
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult; // Return error response
    }
    
    const { user } = authResult;
    
    // Only admins can delete cases
    if (user.role !== 'admin' && user.role !== 'developer') {
      return NextResponse.json({ error: 'Admin access required for deletion' }, { status: 403 });
    }

    const params = await context.params;
    const { id } = params;
    
    // First check if case exists
    let caseData = await DatabaseService.getCaseById(id);
    if (!caseData) {
      // Try by case number
      caseData = await DatabaseService.getCaseByCaseNumber(id);
    }
    
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    await DatabaseService.deleteCase((caseData as any).id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting case:', error);
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
  }
}