import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Drop the existing interactions table
    await sql`DROP TABLE IF EXISTS interactions CASCADE`;
    
    // Recreate with proper types
    await sql`
      CREATE TABLE interactions (
        id SERIAL PRIMARY KEY,
        case_number VARCHAR(50) NOT NULL,
        case_id UUID,
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
        workspace_id VARCHAR(255)
      )
    `;
    
    // Create indexes
    await sql`CREATE INDEX idx_interactions_case_number ON interactions(case_number)`;
    await sql`CREATE INDEX idx_interactions_case_id ON interactions(case_id)`;
    await sql`CREATE INDEX idx_interactions_timestamp ON interactions(timestamp DESC)`;
    await sql`CREATE INDEX idx_interactions_workspace ON interactions(workspace_id)`;
    
    return NextResponse.json({
      success: true,
      message: 'Interactions table recreated with UUID case_id'
    });
    
  } catch (error) {
    console.error('Fix interactions table error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}