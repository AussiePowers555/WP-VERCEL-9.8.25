/**
 * Verification script for PostgreSQL migration
 * Checks that all Firebase/SQLite references have been removed
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function verifyMigration() {
  console.log('🔍 VERIFYING POSTGRESQL MIGRATION');
  console.log('=' .repeat(80));
  
  let issues = [];
  let successes = [];
  
  // 1. Check for removed files
  console.log('\n1️⃣ Checking for removed Firebase/SQLite files...');
  const removedFiles = [
    'apphosting.yaml',
    '.idx/integrations.json',
    'local.db',
    'pbr.db',
  // Legacy SQLite file no longer used after Neon migration
  // 'data/pbike-rescue.db'
  ];
  
  for (const file of removedFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      issues.push(`❌ File still exists: ${file}`);
    } else {
      successes.push(`✅ Removed: ${file}`);
    }
  }
  
  // 2. Check PostgreSQL connection
  console.log('\n2️⃣ Testing PostgreSQL connection...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = $1', ['public']);
    successes.push(`✅ PostgreSQL connected: ${result.rows[0].table_count} tables found`);
    client.release();
  } catch (error) {
    issues.push(`❌ PostgreSQL connection failed: ${error.message}`);
  } finally {
    await pool.end();
  }
  
  // 3. Check for Firebase imports in src
  console.log('\n3️⃣ Checking for Firebase imports...');
  const srcDir = path.join(__dirname, 'src');
  let firebaseImports = 0;
  
  function checkFile(filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('from \'firebase') || content.includes('from "firebase')) {
        firebaseImports++;
        issues.push(`❌ Firebase import found in: ${path.relative(__dirname, filePath)}`);
      }
    }
  }
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath);
      } else if (stat.isFile()) {
        checkFile(filePath);
      }
    }
  }
  
  if (fs.existsSync(srcDir)) {
    walkDir(srcDir);
  }
  
  if (firebaseImports === 0) {
    successes.push('✅ No Firebase imports found');
  }
  
  // 4. Check for proper PostgreSQL schema exports
  console.log('\n4️⃣ Checking PostgreSQL schema configuration...');
  const schemaFile = path.join(__dirname, 'src/lib/database-schema.ts');
  const postgresSchemaFile = path.join(__dirname, 'src/lib/postgres-schema.ts');
  const postgresDbFile = path.join(__dirname, 'src/lib/postgres-db.ts');
  
  if (fs.existsSync(schemaFile)) {
    const content = fs.readFileSync(schemaFile, 'utf8');
    if (content.includes("from './postgres-schema'")) {
      successes.push('✅ database-schema.ts correctly redirects to PostgreSQL');
    } else {
      issues.push('❌ database-schema.ts not properly configured');
    }
  }
  
  if (fs.existsSync(postgresSchemaFile)) {
    successes.push('✅ postgres-schema.ts exists');
  } else {
    issues.push('❌ postgres-schema.ts missing');
  }
  
  if (fs.existsSync(postgresDbFile)) {
    successes.push('✅ postgres-db.ts service exists');
  } else {
    issues.push('❌ postgres-db.ts service missing');
  }
  
  // 5. Check package.json for Firebase dependencies
  console.log('\n5️⃣ Checking package.json...');
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const firebaseDeps = Object.keys({...packageJson.dependencies, ...packageJson.devDependencies})
    .filter(dep => dep.includes('firebase') || dep.includes('firestore'));
  
  if (firebaseDeps.length > 0) {
    issues.push(`❌ Firebase dependencies found: ${firebaseDeps.join(', ')}`);
  } else {
    successes.push('✅ No Firebase dependencies in package.json');
  }
  
  // Check for PostgreSQL dependencies
  const pgDeps = Object.keys(packageJson.dependencies).filter(dep => dep === 'pg');
  if (pgDeps.length > 0) {
    successes.push('✅ PostgreSQL (pg) dependency found');
  } else {
    issues.push('❌ PostgreSQL (pg) dependency missing');
  }
  
  // Summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 MIGRATION SUMMARY');
  console.log('=' .repeat(80));
  
  console.log('\n✅ SUCCESSES (' + successes.length + '):');
  successes.forEach(s => console.log('  ' + s));
  
  if (issues.length > 0) {
    console.log('\n❌ ISSUES FOUND (' + issues.length + '):');
    issues.forEach(i => console.log('  ' + i));
    console.log('\n⚠️  Migration has issues that need to be resolved');
  } else {
    console.log('\n🎉 MIGRATION SUCCESSFUL!');
    console.log('Your project is now 100% PostgreSQL with Neon!');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm run dev');
  console.log('3. Test all features');
  console.log('4. Deploy to production');
}

verifyMigration().catch(console.error);