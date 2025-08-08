// Test script for temporary password flow
const baseUrl = 'http://localhost:3000';

async function testTempPasswordFlow() {
  console.log('Testing temporary password flow...\n');
  
  // Step 1: Create a user with temporary password
  const email = `test-${Date.now()}@example.com`;
  console.log(`1. Creating user: ${email}`);
  
  const createRes = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      role: 'workspace_user',
      send_email: false
    })
  });
  
  const createData = await createRes.json();
  
  if (!createData.success) {
    console.error('Failed to create user:', createData.error);
    return;
  }
  
  const tempPassword = createData.credentials?.password;
  console.log(`   User created with temp password: ${tempPassword}`);
  console.log(`   User status: ${createData.user.status}`);
  
  // Step 2: Login with temporary password
  console.log('\n2. Logging in with temporary password...');
  
  const loginRes = await fetch(`${baseUrl}/api/auth/simple-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: tempPassword
    })
  });
  
  const loginData = await loginRes.json();
  
  if (!loginData.success) {
    console.error('Failed to login:', loginData.error);
    return;
  }
  
  console.log(`   Login successful!`);
  console.log(`   First login: ${loginData.firstLogin}`);
  
  // Extract cookies from response
  const setCookieHeader = loginRes.headers.get('set-cookie');
  const cookies = setCookieHeader ? setCookieHeader.split(',').map(c => c.trim()) : [];
  const authToken = cookies.find(c => c.includes('auth-token'))?.split(';')[0] || '';
  const wpaAuth = cookies.find(c => c.includes('wpa_auth'))?.split(';')[0] || '';
  
  // Step 3: Change password
  console.log('\n3. Changing password...');
  
  const newPassword = 'NewSecurePass123!';
  
  const changeRes = await fetch(`${baseUrl}/api/auth/change-password`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': `${authToken}; ${wpaAuth}`
    },
    body: JSON.stringify({
      newPassword,
      isFirstLogin: true
    })
  });
  
  const changeData = await changeRes.json();
  
  if (!changeData.success) {
    console.error('Failed to change password:', changeData.error);
    console.log('Response status:', changeRes.status);
    return;
  }
  
  console.log(`   Password changed successfully!`);
  
  // Step 4: Login with new password
  console.log('\n4. Logging in with new password...');
  
  const newLoginRes = await fetch(`${baseUrl}/api/auth/simple-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: newPassword
    })
  });
  
  const newLoginData = await newLoginRes.json();
  
  if (!newLoginData.success) {
    console.error('Failed to login with new password:', newLoginData.error);
    return;
  }
  
  console.log(`   Login successful with new password!`);
  console.log(`   First login: ${newLoginData.firstLogin}`);
  
  console.log('\n✅ Temporary password flow test completed successfully!');
}

// Run the test
testTempPasswordFlow().catch(console.error);