import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/database';

export async function GET() {
  try {
    console.log('Starting database initialization...');
    
    // Initialize the database (creates tables and seeds data)
    await initializeDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      info: 'Tables created and initial data seeded',
      accounts: [
        { email: 'whitepointer2016@gmail.com', password: 'Tr@ders84', role: 'developer' },
        { email: 'michaelalanwilson@gmail.com', password: 'Tr@ders84', role: 'developer' },
        { email: 'aussiepowers555@gmail.com', password: 'abc123', role: 'workspace_user' }
      ]
    });
    
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      error: 'Database initialization failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}