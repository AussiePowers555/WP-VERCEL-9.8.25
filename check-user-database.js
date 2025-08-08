const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'whitepointer.db');
const db = new Database(dbPath);

// Check user details
const user = db.prepare('SELECT * FROM user_accounts WHERE email = ?').get('meehansoftwaredev555@gmail.com');

if (user) {
  console.log('User found in database:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Role:', user.role);
  console.log('  Status:', user.status);
  console.log('  Workspace ID:', user.workspace_id);
  console.log('  Contact ID:', user.contact_id);
  console.log('  First Login:', user.first_login);
  console.log('  Created At:', user.created_at);
  console.log('  Updated At:', user.updated_at);
  console.log('  Last Login:', user.last_login);
} else {
  console.log('User not found in database');
}

db.close();