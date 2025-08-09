import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { getUserFromRequest } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();

    // Best-effort auth to avoid early-hydration 401s. If no user yet, return empty list
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json([]); // let UI render gracefully
    }

    let cases;

    // If user is workspace-restricted, filter cases
    if (user.workspaceId) {
      cases = await DatabaseService.getCasesForUser(user.id);
    } else {
      // Admin users see all cases
      cases = await DatabaseService.getAllCases();
    }

    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureDatabaseInitialized();

    // Get authenticated user (strict for creating)
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const caseData = await request.json();

    // If user is workspace-restricted, assign their workspace
    if (user.workspaceId) {
      caseData.workspaceId = user.workspaceId;
    }

    const newCase = await DatabaseService.createCase(caseData);

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      { error: 'Failed to create case', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}