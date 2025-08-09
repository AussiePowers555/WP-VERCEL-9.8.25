import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    const result = await sql`
      SELECT 
        c.id, 
        c.case_number, 
        c.workspace_id,
        c.client_name,
        w.name as workspace_name
      FROM cases c
      LEFT JOIN workspaces w ON c.workspace_id = w.id
      ORDER BY c.created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      cases: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}