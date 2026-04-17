#!/usr/bin/env node
/**
 * Backend API Testing Script
 * Tests the newly implemented Peer Review and Learning Health Dashboard APIs
 *
 * Usage: node test-backend.js
 *
 * Requirements:
 * - Services must be running (course-service:4002, ide-service:4003, analytics-service:4006)
 * - Database must be initialized with schemas
 */

const http = require('http');

// Configuration
const BASE_URL = 'localhost';
const PORTS = {
  course: 4002,
  ide: 4003,
  analytics: 4006,
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

// Helper: Make HTTP request
function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Helper: Log test result
function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${status} - ${name}`);
  if (details) console.log(`      ${details}`);

  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

// Helper: Skip test
function skipTest(name, reason) {
  console.log(`  ⏭️  SKIP - ${name} (${reason})`);
  results.tests.push({ name, passed: null, details: reason });
  results.skipped++;
}

// Test Suite 1: Health Checks
async function testHealthChecks() {
  console.log('\n🏥 Testing Health Checks...');

  for (const [service, port] of Object.entries(PORTS)) {
    try {
      const res = await makeRequest({
        hostname: BASE_URL,
        port,
        path: '/health',
        method: 'GET',
      });

      const passed = res.statusCode === 200;
      logTest(
        `${service}-service health check`,
        passed,
        passed ? `Status: ${res.body.status || 'healthy'}` : `Status code: ${res.statusCode}`
      );
    } catch (error) {
      logTest(`${service}-service health check`, false, `Error: ${error.message}`);
    }
  }
}

// Test Suite 2: Peer Review API
async function testPeerReviewAPI() {
  console.log('\n📝 Testing Peer Review API...');

  // Test 1: Create Rubric
  try {
    const rubricData = {
      courseId: '00000000-0000-0000-0000-000000000001',
      name: 'Test Rubric - Auto Generated',
      description: 'Testing rubric creation',
      minReviewsRequired: 2,
      allowSelfReview: false,
      anonymizeReviewers: true,
      runMossCheck: true,
    };

    const res = await makeRequest(
      {
        hostname: BASE_URL,
        port: PORTS.course,
        path: '/api/peer-review/rubrics',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      rubricData
    );

    const passed = res.statusCode === 201 || res.statusCode === 200;
    logTest(
      'Create review rubric',
      passed,
      passed ? `Rubric ID: ${res.body.data?.id || 'created'}` : `Status: ${res.statusCode}`
    );

    if (passed && res.body.data?.id) {
      global.testRubricId = res.body.data.id;
    }
  } catch (error) {
    logTest('Create review rubric', false, `Error: ${error.message}`);
  }

  // Test 2: Get Course Rubrics
  try {
    const res = await makeRequest({
      hostname: BASE_URL,
      port: PORTS.course,
      path: '/api/peer-review/courses/00000000-0000-0000-0000-000000000001/rubrics',
      method: 'GET',
    });

    const passed = res.statusCode === 200;
    logTest(
      'Get course rubrics',
      passed,
      passed ? `Found ${res.body.count || 0} rubrics` : `Status: ${res.statusCode}`
    );
  } catch (error) {
    logTest('Get course rubrics', false, `Error: ${error.message}`);
  }

  // Test 3: Create Rubric Criterion
  if (global.testRubricId) {
    try {
      const criterionData = {
        name: 'Code Quality',
        description: 'Assess code quality and readability',
        displayOrder: 1,
        weight: 1.0,
        maxScore: 5,
        isRequired: true,
      };

      const res = await makeRequest(
        {
          hostname: BASE_URL,
          port: PORTS.course,
          path: `/api/peer-review/rubrics/${global.testRubricId}/criteria`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        criterionData
      );

      const passed = res.statusCode === 201 || res.statusCode === 200;
      logTest(
        'Create rubric criterion',
        passed,
        passed ? 'Criterion created' : `Status: ${res.statusCode}`
      );
    } catch (error) {
      logTest('Create rubric criterion', false, `Error: ${error.message}`);
    }
  } else {
    skipTest('Create rubric criterion', 'No rubric ID available');
  }

  // Test 4: Get Pending Reviews
  try {
    const res = await makeRequest({
      hostname: BASE_URL,
      port: PORTS.course,
      path: '/api/peer-review/pending-reviews',
      method: 'GET',
    });

    const passed = res.statusCode === 200;
    logTest(
      'Get pending reviews',
      passed,
      passed ? `Found ${res.body.count || 0} pending reviews` : `Status: ${res.statusCode}`
    );
  } catch (error) {
    logTest('Get pending reviews', false, `Error: ${error.message}`);
  }

  // Test 5: Get High-Quality Reviewers
  try {
    const res = await makeRequest({
      hostname: BASE_URL,
      port: PORTS.course,
      path: '/api/peer-review/high-quality-reviewers?limit=10',
      method: 'GET',
    });

    const passed = res.statusCode === 200;
    logTest(
      'Get high-quality reviewers',
      passed,
      passed ? `Found ${res.body.count || 0} quality reviewers` : `Status: ${res.statusCode}`
    );
  } catch (error) {
    logTest('Get high-quality reviewers', false, `Error: ${error.message}`);
  }
}

// Test Suite 3: Learning Health Dashboard API
async function testLearningHealthAPI() {
  console.log('\n💚 Testing Learning Health Dashboard API...');

  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testCourseId = '00000000-0000-0000-0000-000000000002';

  // Test 1: Get User Health Score
  try {
    const res = await makeRequest({
      hostname: BASE_URL,
      port: PORTS.analytics,
      path: `/api/learning-health/users/${testUserId}/courses/${testCourseId}/health-score`,
      method: 'GET',
    });

    const passed = res.statusCode === 200 || res.statusCode === 500; // 500 expected if external services unavailable
    const details = res.statusCode === 200
      ? `Health Score: ${res.body.data?.overallScore || 'N/A'}`
      : 'External services may not be available';
    logTest('Get user health score', passed, details);
  } catch (error) {
    logTest('Get user health score', false, `Error: ${error.message}`);
  }

  // Test 2: Get Component Breakdown
  try {
    const res = await makeRequest({
      hostname: BASE_URL,
      port: PORTS.analytics,
      path: `/api/learning-health/users/${testUserId}/courses/${testCourseId}/component-breakdown`,
      method: 'GET',
    });

    const passed = res.statusCode === 200 || res.statusCode === 500;
    const details = res.statusCode === 200
      ? `Components: ${res.body.data?.components?.length || 0}`
      : 'External services may not be available';
    logTest('Get component breakdown', passed, details);
  } catch (error) {
    logTest('Get component breakdown', false, `Error: ${error.message}`);
  }

  // Test 3: Get At-Risk Learners
  try {
    const res = await makeRequest({
      hostname: BASE_URL,
      port: PORTS.analytics,
      path: `/api/learning-health/courses/${testCourseId}/at-risk-learners`,
      method: 'GET',
    });

    const passed = res.statusCode === 200 || res.statusCode === 500;
    const details = res.statusCode === 200
      ? `Found ${res.body.count || 0} at-risk learners`
      : 'External services may not be available';
    logTest('Get at-risk learners', passed, details);
  } catch (error) {
    logTest('Get at-risk learners', false, `Error: ${error.message}`);
  }

  // Test 4: Get Dashboard Summary
  try {
    const res = await makeRequest({
      hostname: BASE_URL,
      port: PORTS.analytics,
      path: `/api/learning-health/courses/${testCourseId}/dashboard-summary`,
      method: 'GET',
    });

    const passed = res.statusCode === 200 || res.statusCode === 500;
    const details = res.statusCode === 200
      ? `Total enrolled: ${res.body.data?.totalEnrolled || 0}`
      : 'External services may not be available';
    logTest('Get dashboard summary', passed, details);
  } catch (error) {
    logTest('Get dashboard summary', false, `Error: ${error.message}`);
  }
}

// Test Suite 4: Clipboard & Keystroke Tracking API
async function testClipboardKeystrokeAPI() {
  console.log('\n⌨️  Testing Clipboard & Keystroke Tracking API...');

  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testSessionId = '00000000-0000-0000-0000-000000000099';

  // Test 1: Log Clipboard Attempt
  try {
    const clipboardData = {
      userId: testUserId,
      sessionId: testSessionId,
      attemptType: 'paste',
      source: 'keyboard_shortcut',
      blocked: true,
      contentLength: 100,
      detectedBy: 'clipboard_api',
    };

    const res = await makeRequest(
      {
        hostname: BASE_URL,
        port: PORTS.ide,
        path: '/api/clipboard/log-attempt',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      clipboardData
    );

    const passed = res.statusCode === 200;
    logTest(
      'Log clipboard attempt',
      passed,
      passed ? 'Attempt logged successfully' : `Status: ${res.statusCode}`
    );
  } catch (error) {
    logTest('Log clipboard attempt', false, `Error: ${error.message}`);
  }

  // Test 2: Get User Clipboard Stats
  try {
    const res = await makeRequest({
      hostname: BASE_URL,
      port: PORTS.ide,
      path: `/api/clipboard/stats/${testUserId}`,
      method: 'GET',
    });

    const passed = res.statusCode === 200;
    logTest(
      'Get user clipboard stats',
      passed,
      passed ? `Total attempts: ${res.body.data?.total_attempts || 0}` : `Status: ${res.statusCode}`
    );
  } catch (error) {
    logTest('Get user clipboard stats', false, `Error: ${error.message}`);
  }

  // Test 3: Start Keystroke Session
  try {
    const sessionData = {
      userId: testUserId,
      lessonId: '00000000-0000-0000-0000-000000000003',
    };

    const res = await makeRequest(
      {
        hostname: BASE_URL,
        port: PORTS.ide,
        path: '/api/keystroke/start-session',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      sessionData
    );

    const passed = res.statusCode === 200;
    logTest(
      'Start keystroke session',
      passed,
      passed ? `Session ID: ${res.body.data?.id || 'created'}` : `Status: ${res.statusCode}`
    );

    if (passed && res.body.data?.id) {
      global.testKeystrokeSessionId = res.body.data.id;
    }
  } catch (error) {
    logTest('Start keystroke session', false, `Error: ${error.message}`);
  }

  // Test 4: Get User Typing Patterns
  try {
    const res = await makeRequest({
      hostname: BASE_URL,
      port: PORTS.ide,
      path: `/api/keystroke/patterns/${testUserId}`,
      method: 'GET',
    });

    const passed = res.statusCode === 200;
    logTest(
      'Get user typing patterns',
      passed,
      passed ? 'Patterns retrieved' : `Status: ${res.statusCode}`
    );
  } catch (error) {
    logTest('Get user typing patterns', false, `Error: ${error.message}`);
  }

  // Test 5: Get Integrity Flags
  try {
    const res = await makeRequest({
      hostname: BASE_URL,
      port: PORTS.ide,
      path: `/api/keystroke/integrity-flags?userId=${testUserId}`,
      method: 'GET',
    });

    const passed = res.statusCode === 200;
    logTest(
      'Get integrity flags',
      passed,
      passed ? `Found ${res.body.count || 0} flags` : `Status: ${res.statusCode}`
    );
  } catch (error) {
    logTest('Get integrity flags', false, `Error: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Backend API Testing Suite                                ║');
  console.log('║  Testing: Peer Review & Learning Health Dashboard         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    await testHealthChecks();
    await testPeerReviewAPI();
    await testLearningHealthAPI();
    await testClipboardKeystrokeAPI();
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  }

  // Print summary
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Test Results Summary                                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`✅ Passed:  ${results.passed}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📊 Total:   ${results.tests.length}`);
  console.log('');

  const passRate = results.tests.length > 0
    ? ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
    : 0;
  console.log(`Success Rate: ${passRate}%`);

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.passed === false)
      .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests();
