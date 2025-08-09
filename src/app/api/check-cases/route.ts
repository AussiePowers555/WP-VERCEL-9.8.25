import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Get sample cases
    const casesResult = await sql`
      SELECT id, case_number FROM cases LIMIT 5
    `;
    
    // Check the type of the id column
    const typeResult = await sql`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cases' AND column_name = 'id'
    `;
    
    return NextResponse.json({
      success: true,
      cases: casesResult.rows,
      idType: typeResult.rows[0]?.data_type || 'unknown',
      sampleId: casesResult.rows[0]?.id,
      sampleIdType: typeof casesResult.rows[0]?.id
    });
    
  } catch (error) {
    console.error('Check cases error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}