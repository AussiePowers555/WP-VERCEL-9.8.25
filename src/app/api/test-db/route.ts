import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return NextResponse.json({ 
        error: 'DATABASE_URL not configured',
        env: process.env.NODE_ENV 
      }, { status: 500 });
    }

    // Create a new pool for this test
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Test basic connection
    const client = await pool.connect();
    
    try {
      // Check if tables exist
      const tablesQuery = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      
      // Check user_accounts table
      const usersQuery = await client.query(`
        SELECT COUNT(*) as count FROM user_accounts
      `);
      
      // Get sample users (without exposing passwords)
      const sampleUsers = await client.query(`
        SELECT id, email, role, status 
        FROM user_accounts 
        LIMIT 5
      `);
      
      return NextResponse.json({
        success: true,
        database: 'Connected to PostgreSQL',
        tables: tablesQuery.rows.map(r => r.table_name),
        userCount: usersQuery.rows[0].count,
        sampleUsers: sampleUsers.rows,
        message: 'Database is properly configured'
      });
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error.message,
      hint: 'Check if DATABASE_URL is properly configured in Vercel environment variables'
    }, { status: 500 });
  }
}