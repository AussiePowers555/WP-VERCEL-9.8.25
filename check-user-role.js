import { DatabaseService, ensureDatabaseInitialized } from './src/lib/database.js';

async function checkUser() {
  await ensureDatabaseInitialized();
  
  const user = await DatabaseService.getUserByEmail('meehansoftwaredev555@gmail.com');
  
  if (user) {
    console.log('\nUser found in database:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    console.log('Workspace ID:', user.workspace_id);
    console.log('Contact ID:', user.contact_id);
    console.log('First Login:', user.first_login);
    
    if (user.workspace_id) {
      const workspace = await DatabaseService.getWorkspaceById(user.workspace_id);
      if (workspace) {
        console.log('\nWorkspace details:');
        console.log('Workspace Name:', workspace.name);
        console.log('Workspace Type:', workspace.type);
      }
    }
  } else {
    console.log('User not found in database');
  }
  
  process.exit(0);
}

checkUser().catch(console.error);