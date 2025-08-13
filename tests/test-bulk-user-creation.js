// Test script for bulk user creation functionality
const TEST_ADMIN_EMAIL = 'michaelalanwilson365@gmail.com';
const TEST_ADMIN_PASSWORD = 'Daisy23111962.';
const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('\n=== Testing Admin Login ===');
  
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD,
      }),
      credentials: 'include', // Important for cookies
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ Login successful');
      console.log('User:', loginData.user?.email);
      console.log('Role:', loginData.user?.role);
      
      // Get cookies from the response headers
      const cookies = loginResponse.headers.get('set-cookie');
      return { success: true, cookies, token: loginData.token };
    } else {
      console.error('❌ Login failed:', loginData.error || loginData.message);
      return { success: false, error: loginData.error };
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testBulkUserCreation(authToken) {
  console.log('\n=== Testing Bulk User Creation ===');
  
  // Test workspace ID from seed data
  const workspaceId = '550e8400-e29b-41d4-a716-446655440001'; // Main Workspace
  
  const testUsers = [
    { email: 'testuser1@example.com', name: 'Test User 1', workspaceId },
    { email: 'testuser2@example.com', name: 'Test User 2', workspaceId },
    { email: 'testuser3@example.com', name: 'Test User 3', workspaceId },
  ];
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/users/bulk-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ users: testUsers }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Bulk user creation successful');
      console.log(`Created: ${result.createdUsers.length} users`);
      console.log(`Failed: ${result.errors.length} users`);
      
      if (result.createdUsers.length > 0) {
        console.log('\n📋 Created Users:');
        result.createdUsers.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.name} (${user.email})`);
          console.log(`     Password: ${user.password}`);
          console.log(`     Workspace: ${user.workspace}`);
        });
      }
      
      if (result.errors.length > 0) {
        console.log('\n⚠️ Errors:');
        result.errors.forEach(error => {
          console.log(`  - ${error.email}: ${error.error}`);
        });
      }
      
      return { success: true, data: result };
    } else {
      console.error('❌ Bulk creation failed:', result.error || result.message);
      if (result.details) {
        console.error('Details:', result.details);
      }
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Bulk creation error:', error.message);
    return { success: false, error: error.message };
  }
}

async function cleanupTestUsers(authToken) {
  console.log('\n=== Cleaning Up Test Users ===');
  
  try {
    // Get all users
    const response = await fetch(`${BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (response.ok) {
      const users = await response.json();
      const testUsers = users.filter(u => u.email.includes('testuser') && u.email.includes('@example.com'));
      
      for (const user of testUsers) {
        const deleteResponse = await fetch(`${BASE_URL}/api/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
        
        if (deleteResponse.ok) {
          console.log(`✅ Deleted test user: ${user.email}`);
        } else {
          console.log(`⚠️ Failed to delete: ${user.email}`);
        }
      }
    }
  } catch (error) {
    console.error('⚠️ Cleanup error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Bulk User Creation Tests');
  console.log('=====================================');
  
  // Step 1: Test login
  const loginResult = await testLogin();
  if (!loginResult.success) {
    console.error('\n❌ Tests failed: Unable to authenticate');
    process.exit(1);
  }
  
  const authToken = loginResult.token;
  
  // Step 2: Test bulk user creation
  const bulkResult = await testBulkUserCreation(authToken);
  
  // Step 3: Clean up test users
  await cleanupTestUsers(authToken);
  
  // Summary
  console.log('\n=====================================');
  console.log('📊 Test Summary:');
  console.log(`  Login: ${loginResult.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  Bulk Creation: ${bulkResult.success ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (loginResult.success && bulkResult.success) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});