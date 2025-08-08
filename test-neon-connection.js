const { Pool } = require('pg');

async function testNeonConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Set DATABASE_URL to run this test.');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Testing Neon PostgreSQL connection...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to Neon!');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📊 Database info:', {
      currentTime: result.rows[0].current_time,
      version: result.rows[0].postgres_version.split(' ')[0]
    });
    
    // Test if our tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('🗃️  Existing tables:', tablesResult.rows.map(row => row.table_name));
    } else {
      console.log('📋 No tables found - database needs initialization');
    }
    
    client.release();
    await pool.end();
    
    console.log('🎉 Neon connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Neon connection failed:', error.message);
    process.exit(1);
  }
}

testNeonConnection();