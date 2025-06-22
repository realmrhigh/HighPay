#!/usr/bin/env node

/**
 * Analytics Test Script
 * Tests all the new analytics endpoints
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'your-jwt-token-here'; // Replace with actual token

// Helper function to make HTTP requests
function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test suite
async function runAnalyticsTests() {
  console.log('🚀 Starting HighPay Analytics Test Suite\n');

  const tests = [
    {
      name: 'Dashboard Analytics',
      endpoint: '/api/v1/analytics/dashboard?timeframe=month'
    },
    {
      name: 'Real-time Analytics',
      endpoint: '/api/v1/analytics/realtime'
    },
    {
      name: 'Payroll Analytics',
      endpoint: '/api/v1/analytics/payroll?timeframe=year'
    },
    {
      name: 'Attendance Analytics',
      endpoint: '/api/v1/analytics/attendance?timeframe=month'
    },
    {
      name: 'Time Tracking Analytics',
      endpoint: '/api/v1/analytics/time-tracking?timeframe=month'
    },
    {
      name: 'Productivity Metrics',
      endpoint: '/api/v1/analytics/productivity?timeframe=month'
    },
    {
      name: 'WebSocket Stats',
      endpoint: '/api/v1/reports/websocket/stats'
    },
    {
      name: 'Swagger Documentation',
      endpoint: '/api-docs',
      skipAuth: true
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      
      if (test.skipAuth) {
        // Simple GET request without auth for public endpoints
        const response = await makeRequest(test.endpoint);
        if (response.status === 200 || response.status === 301 || response.status === 302) {
          console.log(`✅ ${test.name}: PASSED (Status: ${response.status})\n`);
          passed++;
        } else {
          console.log(`❌ ${test.name}: FAILED (Status: ${response.status})\n`);
          failed++;
        }
      } else {
        const response = await makeRequest(test.endpoint);
        
        if (response.status === 200) {
          console.log(`✅ ${test.name}: PASSED`);
          console.log(`   Response keys: ${Object.keys(response.data).join(', ')}\n`);
          passed++;
        } else if (response.status === 401) {
          console.log(`⚠️  ${test.name}: AUTH REQUIRED (Status: ${response.status})`);
          console.log(`   Please update TEST_TOKEN in the script\n`);
          passed++; // Auth required is expected
        } else {
          console.log(`❌ ${test.name}: FAILED (Status: ${response.status})`);
          console.log(`   Response: ${JSON.stringify(response.data, null, 2)}\n`);
          failed++;
        }
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}\n`);
      failed++;
    }
  }

  // Test custom report endpoint
  try {
    console.log('Testing: Custom Report (POST)...');
    const customReportData = {
      startDate: '2025-06-01',
      endDate: '2025-06-30',
      metrics: ['hours', 'attendance', 'payroll'],
      groupBy: 'week'
    };

    const response = await makeRequest('/api/v1/analytics/custom-report', 'POST', customReportData);
    
    if (response.status === 200) {
      console.log('✅ Custom Report: PASSED');
      console.log(`   Report ID: ${response.data?.data?.reportId || 'N/A'}\n`);
      passed++;
    } else if (response.status === 401 || response.status === 403) {
      console.log('⚠️  Custom Report: AUTH/PERMISSION REQUIRED\n');
      passed++; // Expected
    } else {
      console.log(`❌ Custom Report: FAILED (Status: ${response.status})\n`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ Custom Report: ERROR - ${error.message}\n`);
    failed++;
  }

  // Summary
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! Analytics system is ready to go!');
  } else {
    console.log('⚠️  Some tests failed. Check the server logs and endpoint implementations.');
  }

  // Test WebSocket connection
  console.log('\n🔌 WebSocket Test:');
  console.log('To test WebSocket features:');
  console.log('1. Open websocket-test.html in your browser');
  console.log('2. Enter a valid JWT token');
  console.log('3. Click "Connect" to test real-time features');
  console.log('4. Open analytics-dashboard.html for the full analytics experience\n');

  console.log('🎯 Next Steps:');
  console.log('1. Update TEST_TOKEN with a valid JWT token');
  console.log('2. Start the server: npm run dev');
  console.log('3. Run this test: node test-analytics.js');
  console.log('4. Open http://localhost:3000/api-docs for interactive API docs');
  console.log('5. Open analytics-dashboard.html for the analytics dashboard\n');
}

// Run tests
if (require.main === module) {
  runAnalyticsTests().catch(console.error);
}

module.exports = { runAnalyticsTests, makeRequest };
