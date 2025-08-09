import { Pool } from 'pg';

async function checkSignatureTokens() {
  console.log('Checking signature tokens in database...\n');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const client = await pool.connect();
    const { rows: tokens } = await client.query('SELECT * FROM signature_tokens ORDER BY created_at DESC');
    console.log(`Found ${tokens.length} signature tokens:\n`);
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      console.log(`Token ${index + 1}:`);
      console.log(`  ID: ${token.id}`);
      console.log(`  Token: ${token.token}`);
      console.log(`  Case ID: ${token.case_id}`);
      console.log(`  Status: ${token.status}`);
      console.log(`  Document Type: ${token.document_type}`);
      console.log(`  Client Email: ${token.client_email}`);
      console.log(`  Created At: ${token.created_at}`);
      console.log(`  Expires At: ${token.expires_at}`);
      console.log(`  Form Link: ${token.form_link}`);
      const expiresAt = new Date(token.expires_at);
      const now = new Date();
      const isExpired = now > expiresAt;
      console.log(`  Is Expired: ${isExpired}`);
      console.log('\n');
    }
    const activeTokens = tokens.filter((token: any) => {
      const expiresAt = new Date(token.expires_at);
      const now = new Date();
      return token.status !== 'completed' && now < expiresAt;
    });
    console.log(`Active tokens: ${activeTokens.length}`);
    client.release();
  } catch (error) {
    console.error('Error checking signature tokens:', error);
  } finally {
    await pool.end();
  }
}

checkSignatureTokens();