
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return NextResponse.json({
        status: 'error',
        message: 'DATABASE_URL not configured',
        database: 'not_configured'
      }, { status: 500 });
    }

    // Test PostgreSQL connection with TLS configuration
    const connectionUrl = process.env.NODE_ENV === 'production' && databaseUrl.includes('-pooler.') 
      ? databaseUrl 
      : databaseUrl.replace('-pooler.', '.');
    
    const pool = new Pool({
      connectionString: connectionUrl,
      max: 1,
      connectionTimeoutMillis: 8000, // Increased timeout
      // acquireTimeoutMillis is not in PoolConfig types
      ssl: {
        rejectUnauthorized: false // Allow self-signed certificates in development
      }
    });

    try {
      const client = await pool.connect();
      
      // Test basic query
      const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
      client.release();
      
      await pool.end();

      return NextResponse.json({
        status: 'healthy',
        message: 'PostgreSQL connection successful',
        database: 'postgresql',
        server_time: result.rows[0].current_time,
        postgres_version: result.rows[0].postgres_version.split(' ')[0],
        database_url_configured: !!databaseUrl,
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (dbError) {
      await pool.end();
      throw dbError;
    }
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed',
      database: 'postgresql',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
