import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

const sampleInteractions = [
  {
    case_number: 'WP-2024-001',
    case_id: 1,
    interaction_type: 'call',
    situation: 'Customer called regarding bike rental status after accident.',
    action_taken: 'Confirmed rental bike availability and scheduled delivery for tomorrow.',
    outcome: 'Customer satisfied with quick response. Bike will be delivered at 10 AM.',
    priority: 'high',
    status: 'completed',
    contact_name: 'John Smith',
    contact_phone: '0412-345-678',
    contact_email: 'john.smith@email.com',
    insurance_company: 'Suncorp',
    lawyer_assigned: 'Martin Lawyer',
    rental_company: 'City Rentals'
  },
  {
    case_number: 'WP-2024-002',
    case_id: 2,
    interaction_type: 'email',
    situation: 'Insurance company requested additional documentation for claim.',
    action_taken: 'Gathered police report and witness statements. Sent via secure email.',
    outcome: 'Documents received and acknowledged by insurance adjuster.',
    priority: 'urgent',
    status: 'completed',
    contact_name: 'Sarah Johnson',
    contact_email: 'claims@allianz.com.au',
    insurance_company: 'Allianz',
    lawyer_assigned: 'Smith & Associates',
    rental_company: 'Premium Bikes'
  },
  {
    case_number: 'WP-2024-003',
    case_id: 3,
    interaction_type: 'meeting',
    situation: 'Meeting with lawyer to discuss case progress and next steps.',
    action_taken: 'Reviewed all documentation, discussed strategy for insurance claim.',
    outcome: 'Agreed on approach. Lawyer will draft demand letter by end of week.',
    priority: 'medium',
    status: 'follow_up_required',
    contact_name: 'Michael Chen',
    contact_phone: '0423-456-789',
    insurance_company: 'AAMI',
    lawyer_assigned: 'Martin Lawyer',
    rental_company: 'City Rentals'
  },
  {
    case_number: 'WP-2024-001',
    case_id: 1,
    interaction_type: 'sms',
    situation: 'Quick update to customer about bike delivery.',
    action_taken: 'Sent SMS confirmation with delivery time and driver details.',
    outcome: 'Customer confirmed receipt of message.',
    priority: 'low',
    status: 'completed',
    contact_name: 'John Smith',
    contact_phone: '0412-345-678',
    insurance_company: 'Suncorp',
    lawyer_assigned: 'Martin Lawyer',
    rental_company: 'City Rentals'
  },
  {
    case_number: 'WP-2024-004',
    case_id: 4,
    interaction_type: 'call',
    situation: 'Rental company called about bike return process.',
    action_taken: 'Explained return procedure and inspection requirements.',
    outcome: 'Rental company will schedule pickup for next Monday.',
    priority: 'medium',
    status: 'pending',
    contact_name: 'Emma Wilson',
    contact_phone: '0434-567-890',
    insurance_company: 'QBE',
    lawyer_assigned: 'Legal Partners',
    rental_company: 'Express Rentals'
  },
  {
    case_number: 'WP-2024-002',
    case_id: 2,
    interaction_type: 'note',
    situation: 'Internal note about case status change.',
    action_taken: 'Updated case file with latest insurance correspondence.',
    outcome: 'Case file now complete and ready for review.',
    priority: 'low',
    status: 'completed',
    insurance_company: 'Allianz',
    lawyer_assigned: 'Smith & Associates',
    rental_company: 'Premium Bikes'
  },
  {
    case_number: 'WP-2024-005',
    case_id: 5,
    interaction_type: 'email',
    situation: 'Follow-up email from insurance regarding settlement offer.',
    action_taken: 'Reviewed offer with client and prepared counter-proposal.',
    outcome: 'Counter-offer sent. Awaiting response from insurance.',
    priority: 'high',
    status: 'in_progress',
    contact_name: 'David Brown',
    contact_email: 'david.brown@nrma.com.au',
    insurance_company: 'NRMA',
    lawyer_assigned: 'Martin Lawyer',
    rental_company: 'City Rentals'
  },
  {
    case_number: 'WP-2024-003',
    case_id: 3,
    interaction_type: 'call',
    situation: 'Customer called concerned about case timeline.',
    action_taken: 'Explained typical timeline and current status. Provided reassurance.',
    outcome: 'Customer understanding of process. Will follow up in one week.',
    priority: 'medium',
    status: 'follow_up_required',
    contact_name: 'Michael Chen',
    contact_phone: '0423-456-789',
    insurance_company: 'AAMI',
    lawyer_assigned: 'Martin Lawyer',
    rental_company: 'City Rentals'
  },
  {
    case_number: 'WP-2024-006',
    case_id: 6,
    interaction_type: 'document',
    situation: 'Received signed rental agreement from customer.',
    action_taken: 'Filed document in case folder and updated system.',
    outcome: 'Documentation complete. Case ready to proceed.',
    priority: 'medium',
    status: 'completed',
    contact_name: 'Lisa Zhang',
    contact_email: 'lisa.zhang@email.com',
    insurance_company: 'Suncorp',
    lawyer_assigned: 'Legal Aid',
    rental_company: 'Budget Bikes'
  },
  {
    case_number: 'WP-2024-001',
    case_id: 1,
    interaction_type: 'email',
    situation: 'Insurance company requesting medical report.',
    action_taken: 'Contacted client to obtain medical authorization. Forwarded request to doctor.',
    outcome: 'Medical report will be available within 5 business days.',
    priority: 'urgent',
    status: 'in_progress',
    contact_name: 'John Smith',
    contact_email: 'john.smith@email.com',
    insurance_company: 'Suncorp',
    lawyer_assigned: 'Martin Lawyer',
    rental_company: 'City Rentals'
  }
];

export async function GET() {
  try {
    // Check if interactions table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'interactions'
      );
    `;
    
    if (!tableCheck.rows[0]?.exists) {
      return NextResponse.json({
        success: false,
        error: 'Interactions table does not exist'
      }, { status: 400 });
    }
    
    // Get existing cases to link interactions
    const casesResult = await sql`
      SELECT id, case_number
      FROM cases 
      LIMIT 10
    `;
    
    const cases = casesResult.rows;
    
    if (cases.length === 0) {
      // If no cases exist, create sample interactions without case links
      for (const interaction of sampleInteractions) {
        // Generate timestamps for the last 7 days
        const daysAgo = Math.floor(Math.random() * 7);
        const hoursAgo = Math.floor(Math.random() * 24);
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - daysAgo);
        timestamp.setHours(timestamp.getHours() - hoursAgo);
        
        await sql`
          INSERT INTO interactions (
            case_number, interaction_type, timestamp,
            situation, action_taken, outcome,
            priority, status,
            contact_name, contact_phone, contact_email,
            created_at, updated_at
          ) VALUES (
            ${interaction.case_number},
            ${interaction.interaction_type},
            ${timestamp.toISOString()},
            ${interaction.situation},
            ${interaction.action_taken},
            ${interaction.outcome},
            ${interaction.priority},
            ${interaction.status},
            ${interaction.contact_name || null},
            ${interaction.contact_phone || null},
            ${interaction.contact_email || null},
            NOW(), NOW()
          )
        `;
      }
    } else {
      // Link interactions to existing cases
      for (let i = 0; i < sampleInteractions.length; i++) {
        const interaction = sampleInteractions[i];
        const caseRecord = cases[i % cases.length]; // Cycle through available cases
        
        // Generate timestamps for the last 7 days
        const daysAgo = Math.floor(Math.random() * 7);
        const hoursAgo = Math.floor(Math.random() * 24);
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - daysAgo);
        timestamp.setHours(timestamp.getHours() - hoursAgo);
        
        await sql`
          INSERT INTO interactions (
            case_number, case_id, interaction_type, timestamp,
            situation, action_taken, outcome,
            priority, status,
            contact_name, contact_phone, contact_email,
            created_at, updated_at
          ) VALUES (
            ${caseRecord.case_number},
            ${caseRecord.id},
            ${interaction.interaction_type},
            ${timestamp.toISOString()},
            ${interaction.situation},
            ${interaction.action_taken},
            ${interaction.outcome},
            ${interaction.priority},
            ${interaction.status},
            ${interaction.contact_name || null},
            ${interaction.contact_phone || null},
            ${interaction.contact_email || null},
            NOW(), NOW()
          )
        `;
      }
    }
    
    // Get count of interactions
    const countResult = await sql`SELECT COUNT(*) as count FROM interactions`;
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${sampleInteractions.length} interactions`,
      totalInteractions: countResult.rows[0]?.count || 0
    });
    
  } catch (error) {
    console.error('Seed interactions error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}