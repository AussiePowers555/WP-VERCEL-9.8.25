import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Get cases without workspace assignment (Main workspace)
    const casesResult = await sql`
      SELECT id, case_number, client_name 
      FROM cases 
      WHERE workspace_id IS NULL
      LIMIT 3
    `;
    
    if (casesResult.rows.length === 0) {
      return NextResponse.json({ 
        message: 'No cases found for Main workspace' 
      });
    }

    const insertedInteractions = [];
    
    for (const caseItem of casesResult.rows) {
      const interactions = [
        {
          case_number: caseItem.case_number,
          case_id: caseItem.id,
          interaction_type: 'call',
          contact_name: caseItem.client_name || 'Main Client',
          contact_phone: '+61 400 111 222',
          contact_email: 'client@mainworkspace.com',
          situation: `Initial inquiry for case ${caseItem.case_number} - general rental request`,
          action_taken: 'Explained rental process, gathered accident details, scheduled assessment',
          outcome: 'Client agreed to proceed with rental, assessment scheduled for tomorrow',
          priority: 'medium',
          status: 'completed',
          workspace_id: 'MAIN',
          created_by: 'admin',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
        },
        {
          case_number: caseItem.case_number,
          case_id: caseItem.id,
          interaction_type: 'email',
          contact_name: 'General Insurance Co',
          contact_phone: '+61 2 1234 5678',
          contact_email: 'claims@generalinsurance.com.au',
          situation: `Insurance verification for ${caseItem.case_number}`,
          action_taken: 'Submitted rental request form, provided accident report',
          outcome: 'Insurance company reviewing documentation',
          priority: 'medium',
          status: 'in_progress',
          workspace_id: 'MAIN',
          created_by: 'admin',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
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
            workspace_name: 'Main Workspace'
          });
        } catch (error) {
          console.error('Error inserting interaction:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${insertedInteractions.length} test interactions for Main workspace`,
      interactions: insertedInteractions
    });

  } catch (error) {
    console.error('Error seeding Main workspace interactions:', error);
    return NextResponse.json(
      { error: 'Failed to seed Main workspace interactions' },
      { status: 500 }
    );
  }
}