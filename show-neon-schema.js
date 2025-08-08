const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function showNeonSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('🚀 NEON POSTGRESQL DATABASE SCHEMA');
    console.log('=' .repeat(80));
    
    // Get all tables with row counts
    const tablesResult = await client.query(`
      SELECT 
        t.table_name,
        obj_description(c.oid) as table_comment,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = t.table_name) as count
      FROM information_schema.tables t
      JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema = 'public'
      ORDER BY t.table_name
    `);
    
    console.log('\n📊 TABLES IN DATABASE:');
    console.log('-'.repeat(80));
    
    for (const table of tablesResult.rows) {
      // Get row count for each table
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
      console.log(`• ${table.table_name} (${countResult.rows[0].count} rows)`);
    }
    
    // Get detailed schema for each table
    console.log('\n📋 DETAILED TABLE SCHEMAS:');
    console.log('=' .repeat(80));
    
    for (const table of tablesResult.rows) {
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          column_default,
          is_nullable,
          CASE 
            WHEN column_name IN (
              SELECT column_name 
              FROM information_schema.key_column_usage 
              WHERE table_name = $1 AND constraint_name LIKE '%_pkey'
            ) THEN 'PRIMARY KEY'
            ELSE ''
          END as key_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
      
      console.log(`\n${table.table_name.toUpperCase()} (${countResult.rows[0].count} rows):`);
      console.log('-'.repeat(80));
      
      columnsResult.rows.forEach(col => {
        const type = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';
        const key = col.key_type || '';
        
        console.log(`  ${col.column_name}: ${type} ${nullable} ${key} ${defaultVal}`.trim());
      });
      
      // Show indexes
      const indexesResult = await client.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = $1 AND schemaname = 'public'
      `, [table.table_name]);
      
      if (indexesResult.rows.length > 0) {
        console.log(`  Indexes:`);
        indexesResult.rows.forEach(idx => {
          if (!idx.indexname.includes('_pkey')) {
            console.log(`    - ${idx.indexname}`);
          }
        });
      }
    }
    
    // Sample queries
    console.log('\n📝 SAMPLE POSTGRESQL QUERIES:');
    console.log('=' .repeat(80));
    console.log(`
-- Find all active users:
SELECT * FROM user_accounts WHERE status = 'active';

-- Get all cases with their status:
SELECT case_number, status, naf_name, af_name, created_at 
FROM cases 
ORDER BY created_at DESC 
LIMIT 10;

-- Find available bikes:
SELECT * FROM bikes WHERE status = 'available';

-- Get cases with outstanding payments:
SELECT case_number, invoiced, agreed, paid, (invoiced - paid) as outstanding 
FROM cases 
WHERE paid < invoiced;

-- Join cases with workspaces:
SELECT c.case_number, c.status, w.name as workspace_name
FROM cases c
LEFT JOIN workspaces w ON c.workspace_id = w.id
ORDER BY c.created_at DESC;

-- Insert a new user:
INSERT INTO user_accounts (id, email, password_hash, role, status) 
VALUES (gen_random_uuid(), 'user@example.com', 'hash', 'admin', 'active')
RETURNING id;

-- Update case status:
UPDATE cases 
SET status = 'Bike Delivered', updated_at = NOW() 
WHERE case_number = '12345';

-- Create a new case with auto-generated UUID:
INSERT INTO cases (id, case_number, naf_name, af_name, status, created_at)
VALUES (gen_random_uuid(), '50111', 'John Doe', 'Jane Smith', 'New Matter', NOW())
RETURNING *;
    `);
    
    // Node.js helper functions
    console.log('\n🔧 NODE.JS HELPER FUNCTIONS:');
    console.log('=' .repeat(80));
    console.log(`
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create a new user
async function createUser(email, passwordHash, role = 'workspace_user') {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'INSERT INTO user_accounts (id, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [crypto.randomUUID(), email, passwordHash, role, 'active']
    );
    return result.rows[0];
  } finally {
    client.release();
  }
}

// Find cases by status
async function findCasesByStatus(status) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM cases WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

// Create migration function
async function createMissingTables() {
  const client = await pool.connect();
  try {
    await client.query(\`
      CREATE TABLE IF NOT EXISTS financial_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_number VARCHAR(10) REFERENCES cases(case_number),
        record_date TIMESTAMP DEFAULT NOW(),
        description TEXT,
        invoiced DECIMAL(10,2) DEFAULT 0,
        settled DECIMAL(10,2) DEFAULT 0,
        paid DECIMAL(10,2) DEFAULT 0,
        outstanding DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    \`);
  } finally {
    client.release();
  }
}
    `);
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Schema inspection complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

showNeonSchema();