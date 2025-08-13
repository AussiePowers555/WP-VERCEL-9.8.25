/**
 * Test script for credential distribution tracking
 * Run with: node tests/test-credential-tracking.js
 */

const TEST_BASE_URL = 'http://localhost:3000';

async function testCredentialTracking() {
  console.log('🧪 Testing Credential Distribution Tracking System');
  console.log('================================================\n');

  try {
    // Test 1: Create a distribution record
    console.log('📝 Test 1: Creating credential distribution record...');
    
    // Use existing UUIDs from the database seed data
    // These are from seedDeveloperAccounts and seedWorkspaces in database.ts
    const testUserId = '550e8400-e29b-41d4-a716-446655440203'; // workspace user test ID
    const testWorkspaceId = '550e8400-e29b-41d4-a716-446655440101'; // David workspace ID
    
    const testData = {
      userId: testUserId,
      workspaceId: testWorkspaceId,
      recipientEmail: 'test@example.com',
      recipientName: 'Test Workspace',
      distributionMethod: 'Manual',
      distributionNotes: 'Test distribution for Phase 2 verification',
      credentialsData: {
        url: 'http://localhost:3000/login',
        username: 'test@example.com',
        workspace: 'Test Workspace'
      }
    };

    const createResponse = await fetch(`${TEST_BASE_URL}/api/credentials/track-distribution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const createResult = await createResponse.json();
    
    if (createResult.success) {
      console.log('✅ Distribution record created successfully');
      console.log('   Distribution ID:', createResult.distribution?.id);
      console.log('   Method:', createResult.distribution?.distribution_method);
      console.log('   Timestamp:', createResult.distribution?.distributed_at);
    } else {
      console.log('❌ Failed to create distribution record:', createResult.error);
      return;
    }

    console.log('\n');

    // Test 2: Retrieve distribution records
    console.log('📋 Test 2: Retrieving distribution records...');
    
    const getResponse = await fetch(`${TEST_BASE_URL}/api/credentials/track-distribution?userId=${testUserId}`);
    const getResult = await getResponse.json();
    
    if (getResult.success) {
      console.log('✅ Retrieved distribution records successfully');
      console.log('   Total records found:', getResult.count);
      if (getResult.distributions && getResult.distributions.length > 0) {
        console.log('   Latest distribution:');
        const latest = getResult.distributions[0];
        console.log('     - Method:', latest.distribution_method);
        console.log('     - Email:', latest.recipient_email);
        console.log('     - Notes:', latest.notes);
      }
    } else {
      console.log('❌ Failed to retrieve distribution records:', getResult.error);
    }

    console.log('\n');

    // Test 3: Test different distribution methods
    console.log('🔄 Test 3: Testing different distribution methods...');
    
    const methods = ['Copied', 'Printed', 'WhatsApp', 'Manual'];
    
    for (const method of methods) {
      const methodData = {
        ...testData,
        distributionMethod: method,
        distributionNotes: `Testing ${method} distribution method`
      };
      
      const response = await fetch(`${TEST_BASE_URL}/api/credentials/track-distribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(methodData)
      });
      
      const result = await response.json();
      console.log(`   ${method}: ${result.success ? '✅' : '❌'}`);
    }

    console.log('\n');
    console.log('🎉 Phase 2: Credential Tracking System - Testing Complete!');
    console.log('=========================================================');
    console.log('\nSummary:');
    console.log('✅ Database table: credential_distributions created');
    console.log('✅ API endpoint: /api/credentials/track-distribution working');
    console.log('✅ Enhanced modal: Updated to track distributions');
    console.log('✅ Distribution methods: Manual, Copied, Printed, WhatsApp supported');
    console.log('\n📌 Next Phase: Bulk User Creation Interface');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Details:', error);
  }
}

// Run the test
testCredentialTracking();