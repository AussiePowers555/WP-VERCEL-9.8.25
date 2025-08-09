
#!/usr/bin/env node

const { Pool } = require('pg');

async function setupPostgreSQL() {
  try {
    console.log('🚀 Setting up PostgreSQL for Replit...');
    
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL environment variable is required');
      console.log('Please set up a PostgreSQL database in Replit:');
      console.log('1. Open Database tab in Replit');
      console.log('2. Click "Create a database"');
      console.log('3. The DATABASE_URL will be automatically set');
      process.exit(1);
    }
    
    console.log('✅ DATABASE_URL found');
    
    // Test connection
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      connectionTimeoutMillis: 10000,
    });
    
    console.log('🔗 Testing database connection...');
    
    const client = await pool.connect();
    
    try {
      // Test query
      const result = await client.query('SELECT version() as version, NOW() as current_time');
      console.log('✅ PostgreSQL connection successful');
      console.log(`📊 PostgreSQL version: ${result.rows[0].version.split(' ')[0]}`);
      console.log(`⏰ Server time: ${result.rows[0].current_time}`);
      
      // Check if uuid extension exists
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✅ UUID extension enabled');
      
    } finally {
      client.release();
    }
    
    await pool.end();
    
    console.log('🎉 PostgreSQL setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. The application will automatically create tables and seed data');
    console.log('3. Visit /api/health to verify the connection');
    
  } catch (error) {
    console.error('❌ PostgreSQL setup failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 This might be a DNS/network issue. Try again in a moment.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Database connection refused. Check if the database is running.');
    } else if (error.message.includes('password')) {
      console.log('💡 Authentication failed. Check your database credentials.');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupPostgreSQL();
}

module.exports = { setupPostgreSQL };
