#!/usr/bin/env node

/**
 * PostgreSQL Database Verification Script for Replit Deployment
 * This script verifies that the PostgreSQL database is properly configured and accessible
 */

const { Pool } = require('pg');

async function verifyPostgreSQLConnection() {
  console.log('🔍 Verifying PostgreSQL Database Connection...\n');

  // Check for DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('📝 Please set DATABASE_URL to your PostgreSQL connection string');
    process.exit(1);
  }

  if (databaseUrl.startsWith('file:')) {
    console.error('❌ DATABASE_URL is set to SQLite (file:) but expecting PostgreSQL');
    console.log('📝 Please update DATABASE_URL to PostgreSQL connection string');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL environment variable found');
  console.log('🔗 Connection string format:', databaseUrl.replace(/:[^:@]*@/, ':***@'));

  // Test connection
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  });

  try {
    console.log('\n🔌 Testing database connection...');
    const client = await pool.connect();
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database connection successful');
    console.log('⏰ Database time:', result.rows[0].current_time);
    console.log('🗄️  Database version:', result.rows[0].db_version.split(' ')[0]);

    // Check if UUID extension is available
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✅ UUID extension available');
    } catch (error) {
      console.warn('⚠️  UUID extension not available:', error.message);
    }

    // Check existing tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📋 Existing tables in database:');
    if (tablesResult.rows.length === 0) {
      console.log('   No tables found (fresh database)');
    } else {
      tablesResult.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    }

    // Check required environment variables
    console.log('\n🔐 Environment Variables Check:');
    const requiredVars = [
      'NODE_ENV',
      'JWT_SECRET',
      'NEXT_PUBLIC_BASE_URL'
    ];

    const optionalVars = [
      'BREVO_API_KEY',
      'JOTFORM_API_KEY',
      'GOOGLE_DRIVE_CLIENT_ID'
    ];

    let allRequiredPresent = true;
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`   ✅ ${varName}: Set`);
      } else {
        console.log(`   ❌ ${varName}: Missing`);
        allRequiredPresent = false;
      }
    });

    optionalVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`   ✅ ${varName}: Set (optional)`);
      } else {
        console.log(`   ⚪ ${varName}: Not set (optional)`);
      }
    });

    client.release();
    await pool.end();

    console.log('\n🎉 PostgreSQL verification completed successfully!');
    
    if (!allRequiredPresent) {
      console.log('\n⚠️  Some required environment variables are missing.');
      console.log('📝 Please set them in your Replit environment before deploying.');
      process.exit(1);
    }

    console.log('\n🚀 Database is ready for deployment!');

  } catch (error) {
    console.error('\n❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Verify DATABASE_URL is correct');
    console.log('2. Check that PostgreSQL is enabled in Replit');
    console.log('3. Ensure network connectivity to database');
    console.log('4. Verify database credentials');
    
    await pool.end();
    process.exit(1);
  }
}

// Run verification
verifyPostgreSQLConnection().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});