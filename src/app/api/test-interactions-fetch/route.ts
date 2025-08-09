import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Fetch interactions with case details
    const result = await sql`
      SELECT 
        i.id,
        i.case_number as "caseNumber",
        i.case_id as "caseId",
        i.interaction_type as "interactionType",
        i.timestamp,
        i.contact_name as "contactName",
        i.contact_phone as "contactPhone",
        i.contact_email as "contactEmail",
        i.situation,
        i.action_taken as "actionTaken",
        i.outcome,
        i.priority,
        i.status,
        i.tags,
        i.attachments,
        i.created_at as "createdAt",
        i.updated_at as "updatedAt",
        i.workspace_id as "workspaceId",
        c.client_name as "caseHirerName",
        c.accident_date as "incidentDate",
        c.status as "caseStatus",
        c.client_insurance_company as "insuranceCompany",
        c.lawyer as "lawyerAssigned",
        c.rental_company as "rentalCompany"
      FROM interactions i
      LEFT JOIN cases c ON i.case_id = c.id
      ORDER BY i.timestamp DESC
      LIMIT 20
    `;
    
    return NextResponse.json({
      success: true,
      count: result.rows.length,
      interactions: result.rows
    });
    
  } catch (error) {
    console.error('Test interactions fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}