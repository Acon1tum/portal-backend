const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3200';

// Test data
const testBusiness = {
  name: "Test Maritime Solutions",
  domain: "testmaritime.com",
  logo: "https://example.com/test-logo.png",
  industry: "Maritime Services",
  description: "Test maritime solutions provider",
  location: "Test City",
  phoneNumber: "+65 1234 5678",
  email: "test@testmaritime.com",
  websiteUrl: "https://testmaritime.com",
  userId: "test-user-id" // You'll need to replace this with a real user ID
};

const testUser = {
  email: "testuser@example.com",
  name: "Test User",
  sex: "MALE",
  role: "JOBSEEKER",
  userType: "SEAFARER",
  currentJobStatus: "ACTIVELY_LOOKING",
  account: {
    email: "testuser@example.com",
    password: "testpassword123"
  }
};

// Helper function to make API calls
async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error.message);
    return { status: 500, data: { error: error.message } };
  }
}

// Test functions
async function testLogin() {
  console.log('\n=== Testing Login ===');
  const result = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'superadmin@maritime.com',
      password: 'test123'
    })
  });
  console.log('Login Result:', result);
  return result;
}

async function testGetBusinesses() {
  console.log('\n=== Testing Get All Businesses ===');
  const result = await makeRequest('/businesses');
  console.log('Get Businesses Result:', result);
  return result;
}

async function testCreateBusiness() {
  console.log('\n=== Testing Create Business ===');
  const result = await makeRequest('/businesses/create', {
    method: 'POST',
    body: JSON.stringify(testBusiness)
  });
  console.log('Create Business Result:', result);
  return result;
}

async function testCreateUser() {
  console.log('\n=== Testing Create User ===');
  const result = await makeRequest('/users/create', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });
  console.log('Create User Result:', result);
  return result;
}

async function testGetUsers() {
  console.log('\n=== Testing Get All Users ===');
  const result = await makeRequest('/users');
  console.log('Get Users Result:', result);
  return result;
}

async function testGetRoles() {
  console.log('\n=== Testing Get Roles ===');
  const result = await makeRequest('/roles');
  console.log('Get Roles Result:', result);
  return result;
}

async function testGetTaglines() {
  console.log('\n=== Testing Get Taglines ===');
  const result = await makeRequest('/taglines');
  console.log('Get Taglines Result:', result);
  return result;
}

async function testCheckSession() {
  console.log('\n=== Testing Check Session ===');
  const result = await makeRequest('/auth/check-session');
  console.log('Check Session Result:', result);
  return result;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Tests...');
  
  try {
    // Test authentication
    await testLogin();
    await testCheckSession();
    
    // Test user management
    await testCreateUser();
    await testGetUsers();
    
    // Test business management
    await testCreateBusiness();
    await testGetBusinesses();
    
    // Test other endpoints
    await testGetRoles();
    await testGetTaglines();
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  makeRequest,
  testLogin,
  testCreateBusiness,
  testCreateUser,
  testGetBusinesses,
  testGetUsers,
  testGetRoles,
  testGetTaglines,
  testCheckSession,
  runTests
}; 