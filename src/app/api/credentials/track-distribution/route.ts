import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const body = await request.json();
    const {
      userId,
      workspaceId,
      recipientEmail,
      recipientName,
      distributionMethod,
      distributionNotes,
      credentialsData
    } = body;

    // Validate required fields
    if (!userId || !distributionMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and distributionMethod are required' },
        { status: 400 }
      );
    }
    
    // Create the distribution record
    const distribution = await DatabaseService.createCredentialDistribution({
      user_id: userId,
      workspace_id: workspaceId || null,
      distribution_method: distributionMethod,
      distributed_by: null, // Will be set when actually distributed, not at creation
      recipient_email: recipientEmail || null,
      recipient_name: recipientName || null,
      distributed_at: null, // Will be set when marked as distributed
      distribution_notes: distributionNotes || null,
      credentials_data: credentialsData || null,
      is_distributed: false // Initially not distributed
    });

    return NextResponse.json({
      success: true,
      distribution,
      message: `Credentials distribution tracked successfully via ${distributionMethod}`
    });

  } catch (error) {
    console.error('Error tracking credential distribution:', error);
    return NextResponse.json(
      { error: 'Failed to track credential distribution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDatabaseInitialized();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const workspaceId = searchParams.get('workspaceId');
    const distributionMethod = searchParams.get('method');
    
    // Build filter object
    const filter: any = {};
    if (userId) filter.user_id = userId;
    if (workspaceId) filter.workspace_id = workspaceId;
    if (distributionMethod) filter.distribution_method = distributionMethod;
    
    const distributions = await DatabaseService.getCredentialDistributions(filter);

    return NextResponse.json({
      success: true,
      distributions,
      count: distributions.length
    });

  } catch (error) {
    console.error('Error fetching credential distributions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credential distributions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}