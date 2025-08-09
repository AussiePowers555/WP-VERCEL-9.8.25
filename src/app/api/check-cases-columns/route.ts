import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Get column names from cases table
    const columnsResult = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cases'
      ORDER BY ordinal_position
    `;
    
    // Get a sample case
    const sampleResult = await sql`
      SELECT * FROM cases LIMIT 1
    `;
    
    return NextResponse.json({
      success: true,
      columns: columnsResult.rows,
      sampleCase: sampleResult.rows[0] || null
    });
    
  } catch (error) {
    console.error('Check cases columns error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}