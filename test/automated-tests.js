/**
 * Automated Test Script
 * Run basic API and functionality tests
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let testResults = [];

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}${details ? ' - ' + details : ''}`);
  testResults.push({ name, passed, details });
}

async function testServerHealth() {
  try {
    const response = await axios.get(`${API_BASE}/health`);
    logTest('Server Health Check', response.status === 200);
    return true;
  } catch (error) {
    logTest('Server Health Check', false, error.message);
    return false;
  }
}

async function testUserRegistration() {
  try {
    const testUser = {
      username: `testuser_${Date.now()}`,
      password: 'testpassword123',
      publicKey: '-----BEGIN PUBLIC KEY-----\nTEST_KEY\n-----END PUBLIC KEY-----'
    };

    const response = await axios.post(`${API_BASE}/auth/register`, testUser);
    logTest('User Registration', response.status === 201);
    return response.data.userId;
  } catch (error) {
    logTest('User Registration', false, error.response?.data?.error || error.message);
    return null;
  }
}

async function testAuthenticationLogging() {
  try {
    const response = await axios.get(`${API_BASE}/logs?eventType=AUTH_ATTEMPT&limit=5`);
    logTest('Authentication Logging', response.status === 200 && Array.isArray(response.data.logs));
    return true;
  } catch (error) {
    logTest('Authentication Logging', false, error.message);
    return false;
  }
}

async function testKeyExchangeLogging() {
  try {
    const response = await axios.get(`${API_BASE}/logs?eventType=KEY_EXCHANGE_INITIATED&limit=5`);
    logTest('Key Exchange Logging', response.status === 200);
    return true;
  } catch (error) {
    logTest('Key Exchange Logging', false, error.message);
    return false;
  }
}

async function testAttackLogs() {
  try {
    const response = await axios.get(`${API_BASE}/logs/attacks`);
    logTest('Attack Logs Endpoint', response.status === 200 && Array.isArray(response.data));
    return true;
  } catch (error) {
    logTest('Attack Logs Endpoint', false, error.message);
    return false;
  }
}

async function testMessageStorage() {
  try {
    // This would require a real message, so we'll just check the endpoint exists
    const response = await axios.get(`${API_BASE}/messages/conversation/test/test`);
    // Should return empty array or 404, both are OK
    logTest('Message Storage Endpoint', response.status === 200 || response.status === 404);
    return true;
  } catch (error) {
    logTest('Message Storage Endpoint', false, error.message);
    return false;
  }
}

async function testFileStorage() {
  try {
    const response = await axios.get(`${API_BASE}/files/user/test`);
    logTest('File Storage Endpoint', response.status === 200 && Array.isArray(response.data));
    return true;
  } catch (error) {
    logTest('File Storage Endpoint', false, error.message);
    return false;
  }
}

async function testLogEventCreation() {
  try {
    const response = await axios.post(`${API_BASE}/logs/log`, {
      eventType: 'AUTH_ATTEMPT',
      userId: null,
      details: { test: true }
    });
    logTest('Log Event Creation', response.status === 201);
    return true;
  } catch (error) {
    logTest('Log Event Creation', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('Automated Test Suite');
  console.log('='.repeat(60));
  console.log('');

  // Test 1: Server Health
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('\n❌ Server is not running. Please start the server first.');
    return;
  }

  console.log('');

  // Test 2: User Registration
  await testUserRegistration();
  console.log('');

  // Test 3: Authentication Logging
  await testAuthenticationLogging();
  console.log('');

  // Test 4: Key Exchange Logging
  await testKeyExchangeLogging();
  console.log('');

  // Test 5: Attack Logs
  await testAttackLogs();
  console.log('');

  // Test 6: Message Storage
  await testMessageStorage();
  console.log('');

  // Test 7: File Storage
  await testFileStorage();
  console.log('');

  // Test 8: Log Event Creation
  await testLogEventCreation();
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;
  console.log(`Total Tests: ${testResults.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 All automated tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the details above.');
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };


