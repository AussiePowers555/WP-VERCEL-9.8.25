import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    // Execute migrations step by step
    const results = [];
    
    // Step 1: Create table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS interactions (
          id SERIAL PRIMARY KEY,
          case_number VARCHAR(50) NOT NULL,
          case_id INTEGER NOT NULL,
          interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('call', 'email', 'meeting', 'sms', 'note', 'document')),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          contact_name VARCHAR(255),
          contact_phone VARCHAR(50),
          contact_email VARCHAR(255),
          situation TEXT NOT NULL,
          action_taken TEXT NOT NULL,
          outcome TEXT NOT NULL,
          priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
          status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'follow_up_required')),
          tags TEXT[] DEFAULT ARRAY[]::TEXT[],
          attachments JSONB DEFAULT '[]'::jsonb,
          created_by INTEGER NOT NULL,
          updated_by INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          workspace_id INTEGER NOT NULL
      )`;
    
    await sql.query(createTableQuery);
    results.push('Table created');

    // Step 2: Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_interactions_case_timestamp ON interactions(case_number, timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_interactions_workspace_timestamp ON interactions(workspace_id, timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_interactions_case_id ON interactions(case_id)',
      'CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(interaction_type)',
      'CREATE INDEX IF NOT EXISTS idx_interactions_priority ON interactions(priority)',
      'CREATE INDEX IF NOT EXISTS idx_interactions_status ON interactions(status)',
      'CREATE INDEX IF NOT EXISTS idx_interactions_created_by ON interactions(created_by)',
    ];

    for (const indexQuery of indexes) {
      await sql.query(indexQuery);
    }
    results.push('Indexes created');

    // Step 3: Create full-text search index
    try {
      await sql.query(`
        CREATE INDEX IF NOT EXISTS idx_interactions_fulltext ON interactions 
        USING gin(to_tsvector('english', situation || ' ' || action_taken || ' ' || outcome))
      `);
      results.push('Full-text search index created');
    } catch (ftsError) {
      results.push('Full-text search index skipped: ' + (ftsError as Error).message);
    }

    // Step 4: Create tag index
    try {
      await sql.query(`CREATE INDEX IF NOT EXISTS idx_interactions_tags ON interactions USING gin(tags)`);
      results.push('Tag index created');
    } catch (tagError) {
      results.push('Tag index skipped: ' + (tagError as Error).message);
    }

    // Step 5: Create trigger function
    await sql.query(`
      CREATE OR REPLACE FUNCTION update_interactions_updated_at()
      RETURNS trigger AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    results.push('Trigger function created');

    // Step 6: Create trigger
    await sql.query(`DROP TRIGGER IF EXISTS trigger_interactions_updated_at ON interactions`);
    await sql.query(`
      CREATE TRIGGER trigger_interactions_updated_at
          BEFORE UPDATE ON interactions
          FOR EACH ROW
          EXECUTE FUNCTION update_interactions_updated_at()
    `);
    results.push('Trigger created');

    return NextResponse.json({
      success: true,
      message: 'Interactions table initialized successfully',
      details: results
    });
  } catch (error) {
    console.error('Failed to initialize interactions table:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Also allow POST requests for manual initialization
    return GET(request);
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}