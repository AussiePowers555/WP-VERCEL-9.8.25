import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Get cases that have workspace assignments
    const casesResult = await sql`
      SELECT c.id, c.case_number, c.workspace_id, w.name as workspace_name
      FROM cases c
      LEFT JOIN workspaces w ON c.workspace_id = w.id
      WHERE c.workspace_id IS NOT NULL 
      AND c.workspace_id != ''
      LIMIT 4
    `;
    
    if (casesResult.rows.length === 0) {
      // If no cases with workspace, get any cases
      const anyCasesResult = await sql`
        SELECT id, case_number, workspace_id
        FROM cases 
        LIMIT 4
      `;
      
      if (anyCasesResult.rows.length === 0) {
        return NextResponse.json({ 
          message: 'No cases found to seed interactions for' 
        });
      }
      
      casesResult.rows = anyCasesResult.rows.map(c => ({
        ...c,
        workspace_name: c.workspace_id || 'Default'
      }));
    }

    const insertedInteractions = [];

    for (const caseItem of casesResult.rows) {
      const workspaceId = caseItem.workspace_id || 'MAIN';
      const workspaceName = caseItem.workspace_name || 'Main';

      const interactions = [
        {
          case_number: caseItem.case_number,
          case_id: caseItem.id,
          interaction_type: 'call',
          contact_name: `${workspaceName} Customer`,
          contact_phone: '+61 400 111 222',
          contact_email: `customer@${workspaceName.toLowerCase().replace(/\s+/g, '')}.com`,
          situation: `Initial call from ${workspaceName} customer regarding bike rental for case ${caseItem.case_number}`,
          action_taken: 'Discussed rental requirements, explained pricing, and scheduled bike pickup',
          outcome: 'Customer confirmed rental period, agreed to terms, pickup scheduled for tomorrow',
          priority: 'high',
          status: 'completed',
          workspace_id: workspaceId,
          created_by: 'system',
        },
        {
          case_number: caseItem.case_number,
          case_id: caseItem.id,
          interaction_type: 'email',
          contact_name: `${workspaceName} Insurance`,
          contact_phone: '+61 400 333 444',
          contact_email: `insurance@${workspaceName.toLowerCase().replace(/\s+/g, '')}.com`,
          situation: `Insurance company inquiry about rental documentation for ${caseItem.case_number}`,
          action_taken: 'Sent rental agreement, photos of bike condition, and confirmed rental period',
          outcome: 'Insurance company acknowledged receipt, approved rental coverage',
          priority: 'medium',
          status: 'completed',
          workspace_id: workspaceId,
          created_by: 'system',
        },
        {
          case_number: caseItem.case_number,
          case_id: caseItem.id,
          interaction_type: 'meeting',
          contact_name: `${workspaceName} Lawyer`,
          contact_phone: '+61 400 555 666',
          contact_email: `lawyer@${workspaceName.toLowerCase().replace(/\s+/g, '')}.com`,
          situation: `Meeting with lawyer to discuss liability and rental terms for ${caseItem.case_number}`,
          action_taken: 'Reviewed rental agreement, discussed liability clauses, confirmed insurance coverage',
          outcome: 'Lawyer approved rental terms, suggested minor amendments to agreement',
          priority: 'high',
          status: 'follow_up_required',
          workspace_id: workspaceId,
          created_by: 'system',
        }
      ];

      for (const interaction of interactions) {
        try {
          // Generate a random timestamp within the last 48 hours
          const hoursAgo = Math.floor(Math.random() * 48);
          const timestamp = new Date();
          timestamp.setHours(timestamp.getHours() - hoursAgo);
          
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
              ${timestamp}
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
      message: `Created ${insertedInteractions.length} test interactions for workspaces`,
      interactions: insertedInteractions
    });

  } catch (error) {
    console.error('Error seeding workspace interactions:', error);
    return NextResponse.json(
      { error: 'Failed to seed workspace interactions' },
      { status: 500 }
    );
  }
}