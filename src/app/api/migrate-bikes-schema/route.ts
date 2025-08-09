import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting bikes table schema migration...');
    
    // Add missing columns to existing bikes table
    const migrations = [
      {
        name: 'service_center_contact_id',
        sql: 'ALTER TABLE bikes ADD COLUMN IF NOT EXISTS service_center_contact_id UUID;'
      },
      {
        name: 'daily_rate_a',
        sql: 'ALTER TABLE bikes ADD COLUMN IF NOT EXISTS daily_rate_a DECIMAL(10,2) DEFAULT 85.00;'
      },
      {
        name: 'daily_rate_b', 
        sql: 'ALTER TABLE bikes ADD COLUMN IF NOT EXISTS daily_rate_b DECIMAL(10,2) DEFAULT 95.00;'
      },
      {
        name: 'assigned_case_id',
        sql: 'ALTER TABLE bikes ADD COLUMN IF NOT EXISTS assigned_case_id VARCHAR(255);'
      },
      {
        name: 'assignment_start_date',
        sql: 'ALTER TABLE bikes ADD COLUMN IF NOT EXISTS assignment_start_date DATE;'
      },
      {
        name: 'assignment_end_date',
        sql: 'ALTER TABLE bikes ADD COLUMN IF NOT EXISTS assignment_end_date DATE;'
      }
    ];

    const results = [];

    for (const migration of migrations) {
      try {
        console.log(`🔧 Adding column: ${migration.name}`);
        await sql.query(migration.sql);
        results.push(`✅ ${migration.name}: Added successfully`);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          results.push(`ℹ️ ${migration.name}: Already exists, skipped`);
        } else {
          console.error(`❌ Error adding ${migration.name}:`, error);
          results.push(`❌ ${migration.name}: Failed - ${error.message}`);
        }
      }
    }

    console.log('✅ Bikes table schema migration completed');

    return NextResponse.json({
      success: true,
      message: 'Bikes table schema migration completed',
      results: results
    });

  } catch (error) {
    console.error('❌ Bikes schema migration failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Also allow POST requests for manual migration
    return GET(request);
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}