import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

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
      // Create the interactions table
      await sql`
        CREATE TABLE IF NOT EXISTS interactions (
          id SERIAL PRIMARY KEY,
          case_number VARCHAR(50) NOT NULL,
          case_id INTEGER,
          interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('call', 'email', 'meeting', 'sms', 'note', 'document')),
          timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          contact_name VARCHAR(255),
          contact_phone VARCHAR(50),
          contact_email VARCHAR(255),
          situation TEXT NOT NULL,
          action_taken TEXT NOT NULL,
          outcome TEXT NOT NULL,
          priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'follow_up_required')),
          tags TEXT[] DEFAULT '{}',
          attachments JSONB DEFAULT '[]'::jsonb,
          created_by VARCHAR(255),
          updated_by VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          workspace_id VARCHAR(255),
          
          -- Additional fields for filtering
          insurance_company VARCHAR(255),
          lawyer_assigned VARCHAR(255),
          rental_company VARCHAR(255)
        );
      `;
      
      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_interactions_case_number ON interactions(case_number);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON interactions(timestamp DESC);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_interactions_workspace ON interactions(workspace_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_interactions_insurance ON interactions(insurance_company);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_interactions_lawyer ON interactions(lawyer_assigned);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_interactions_rental ON interactions(rental_company);`;
    }
    
    // Get count of interactions
    const countResult = await sql`SELECT COUNT(*) as count FROM interactions`;
    
    // Get sample interactions
    const sampleResult = await sql`
      SELECT * FROM interactions 
      ORDER BY timestamp DESC 
      LIMIT 5
    `;
    
    return NextResponse.json({
      success: true,
      tableExists: true,
      interactionCount: countResult.rows[0]?.count || 0,
      sampleInteractions: sampleResult.rows
    });
    
  } catch (error) {
    console.error('Test interactions error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}