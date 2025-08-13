import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const workspaceId = '550e8400-e29b-41d4-a716-446655440101';
    const workspaceName = 'David - Not At Fault Workspace';
    
    // Get cases for David's workspace
    const casesResult = await sql`
      SELECT id, case_number 
      FROM cases 
      WHERE workspace_id = ${workspaceId}
      LIMIT 5
    `;
    
    if (casesResult.rows.length === 0) {
      return NextResponse.json({ 
        message: 'No cases found for David workspace' 
      });
    }

    const insertedInteractions = [];
    
    for (const caseItem of casesResult.rows) {
      const interactions = [
        {
          case_number: caseItem.case_number,
          case_id: caseItem.id,
          interaction_type: 'call',
          contact_name: 'David Client',
          contact_phone: '+61 400 222 333',
          contact_email: 'client@davidworkspace.com',
          situation: `Client called about case ${caseItem.case_number} - needs urgent bike rental for medical appointments`,
          action_taken: 'Arranged immediate bike delivery, coordinated with insurance company',
          outcome: 'Bike delivered within 2 hours, client satisfied with quick response',
          priority: 'urgent',
          status: 'completed',
          workspace_id: workspaceId,
          created_by: 'david_admin',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          case_number: caseItem.case_number,
          case_id: caseItem.id,
          interaction_type: 'email',
          contact_name: 'NRMA Insurance',
          contact_phone: '+61 2 9292 9292',
          contact_email: 'claims@nrma.com.au',
          situation: `Insurance inquiry for ${caseItem.case_number} - requesting rental agreement documentation`,
          action_taken: 'Sent signed rental agreement, photos of bike, and medical appointment confirmations',
          outcome: 'Insurance approved rental coverage for 4 weeks',
          priority: 'high',
          status: 'completed',
          workspace_id: workspaceId,
          created_by: 'david_admin',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          case_number: caseItem.case_number,
          case_id: caseItem.id,
          interaction_type: 'meeting',
          contact_name: 'Lawyer Johnson & Associates',
          contact_phone: '+61 2 8888 9999',
          contact_email: 'mjohnson@johnsonlaw.com.au',
          situation: `Legal meeting about ${caseItem.case_number} - discussing liability and compensation`,
          action_taken: 'Reviewed accident details, provided rental documentation, discussed ongoing medical needs',
          outcome: 'Lawyer confirmed not-at-fault status, proceeding with compensation claim',
          priority: 'high',
          status: 'follow_up_required',
          workspace_id: workspaceId,
          created_by: 'david_admin',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
        }
      ];

      for (const interaction of interactions) {
        try {
          const result = await sql`
            INSERT INTO interactions (
              case_number, case_id, interaction_type, contact_name, contact_phone,
              contact_email, situation, action_taken, outcome, priority, status,
              workspace_id, created_by, timestamp
            ) VALUES (
              ${interaction.case_number},
              ${interaction.case_id},
              ${interaction.interaction_type},
              ${interaction.contact_name},
              ${interaction.contact_phone},
              ${interaction.contact_email},
              ${interaction.situation},
              ${interaction.action_taken},
              ${interaction.outcome},
              ${interaction.priority},
              ${interaction.status},
              ${interaction.workspace_id},
              ${interaction.created_by},
              ${interaction.timestamp.toISOString()}
            )
            RETURNING id, case_number, workspace_id
          `;
          
          insertedInteractions.push({
            id: result.rows[0].id,
            case_number: result.rows[0].case_number,
            workspace_id: result.rows[0].workspace_id,
            workspace_name: workspaceName
          });
        } catch (error) {
          console.error('Error inserting interaction:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${insertedInteractions.length} test interactions for David's workspace`,
      interactions: insertedInteractions
    });

  } catch (error) {
    console.error('Error seeding David workspace interactions:', error);
    return NextResponse.json(
      { error: 'Failed to seed David workspace interactions' },
      { status: 500 }
    );
  }
}