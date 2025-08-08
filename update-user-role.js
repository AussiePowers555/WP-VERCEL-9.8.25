// Script to update user role directly in the database
// Usage: node update-user-role.js <email> <role>

const email = process.argv[2];
const newRole = process.argv[3];

if (!email || !newRole) {
  console.log('Usage: node update-user-role.js <email> <role>');
  console.log('Valid roles: admin, developer, workspace_user, rental_company, lawyer');
  process.exit(1);
}

const validRoles = ['admin', 'developer', 'workspace_user', 'rental_company', 'lawyer'];
if (!validRoles.includes(newRole)) {
  console.log('Invalid role. Valid roles are:', validRoles.join(', '));
  process.exit(1);
}

console.log(`Updating role for ${email} to ${newRole}...`);

// Make API call to update user
const updateUser = async () => {
  try {
    // First get all users to find the user ID
    const getUsersRes = await fetch('http://localhost:9015/api/users');
    const usersData = await getUsersRes.json();
    
    if (!usersData.success || !usersData.users) {
      console.error('Failed to fetch users');
      process.exit(1);
    }
    
    const user = usersData.users.find(u => u.email === email);
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    console.log(`Current role: ${user.role}`);
    console.log(`Updating to: ${newRole}`);
    
    // Update the user role
    const updateRes = await fetch(`http://localhost:9015/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
    
    const updateData = await updateRes.json();
    
    if (updateData.success) {
      console.log('✅ Success!', updateData.message);
      console.log('Updated user:', updateData.user);
    } else {
      console.error('❌ Failed to update user:', updateData.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure the dev server is running on port 9015:');
    console.log('  npm run dev');
  }
};

updateUser();