/**
 * Print live PostgreSQL schema (public) from Neon
 * - Respects process.env.DATABASE_URL
 * - Falls back to repo connection string if not set
 */
const { Pool } = require('pg');

function maskConnectionString(connStr) {
  try {
    const url = new URL(connStr);
    const user = url.username || '';
    const host = url.host || '';
    const db = url.pathname?.slice(1) || '';
    return `${user}@${host}/${db}`;
  } catch (_) {
    return 'Unknown-DSN';
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required to print schema.');
    process.exit(1);
  }
  console.log('Connecting to:', maskConnectionString(connectionString));

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    const tablesQ = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    const columnsQ = `
      SELECT c.table_name, c.column_name, c.data_type, c.is_nullable, c.column_default
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
      ORDER BY c.table_name, c.ordinal_position;
    `;
    const pkQ = `
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.ordinal_position;
    `;
    const fkQ = `
      SELECT tc.table_name, kcu.column_name,
             ccu.table_name AS foreign_table_name,
             ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.ordinal_position;
    `;
    const idxQ = `
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    const [tables, cols, pks, fks, idxs] = await Promise.all([
      client.query(tablesQ),
      client.query(columnsQ),
      client.query(pkQ),
      client.query(fkQ),
      client.query(idxsQ = idxQ),
    ]);

    const byTable = cols.rows.reduce((map, r) => {
      (map[r.table_name] ||= []).push(r);
      return map;
    }, {});
    const pkByTable = pks.rows.reduce((map, r) => {
      (map[r.table_name] ||= []).push(r.column_name);
      return map;
    }, {});
    const fkByTable = fks.rows.reduce((map, r) => {
      (map[r.table_name] ||= []).push(r);
      return map;
    }, {});
    const idxByTable = idxs.rows.reduce((map, r) => {
      (map[r.tablename] ||= []).push(r);
      return map;
    }, {});

    for (const t of tables.rows.map(r => r.table_name)) {
      console.log(`\n=== TABLE: ${t} ===`);
      const pkCols = pkByTable[t] || [];
      if (pkCols.length) console.log('PK:', pkCols.join(', '));
      const fks = fkByTable[t] || [];
      for (const fk of fks) {
        console.log(`FK: ${fk.column_name} -> ${fk.foreign_table_name}(${fk.foreign_column_name})`);
      }
      const idxs = idxByTable[t] || [];
      for (const idx of idxs) {
        console.log(`INDEX: ${idx.indexname} :: ${idx.indexdef}`);
      }
      const cols = byTable[t] || [];
      for (const c of cols) {
        const nullable = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`${c.column_name} ${c.data_type} ${nullable} DEFAULT ${c.column_default || 'NULL'}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Schema introspection failed:', err);
  process.exit(1);
});


