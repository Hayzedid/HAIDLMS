/**
 * Quick test script for GitHub integration
 * Run with: node test-github.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4002/api/github';

// Test without authentication (will fail - for demo purposes)
// In production, you need to authenticate first

async function testGitHubIntegration() {
  console.log('🧪 Testing GitHub Integration Feature\n');

  try {
    // Test 1: Parse GitHub URL
    console.log('Test 1: Parsing GitHub URL...');
    const parseResponse = await axios.post(`${API_BASE}/parse`, {
      url: 'https://github.com/facebook/react/tree/main/packages',
    });
    console.log('✅ Parse Result:', JSON.stringify(parseResponse.data.data, null, 2));
    console.log('');

    // Test 2: Process GitHub URL (get repo structure)
    console.log('Test 2: Processing GitHub repository...');
    const processResponse = await axios.post(`${API_BASE}/process`, {
      url: 'https://github.com/vercel/next.js',
      includeContent: false,
    });
    console.log('✅ Repository:', processResponse.data.data.info.full_name);
    console.log('✅ Stars:', processResponse.data.data.info.stargazers_count);
    console.log('✅ Files found:', processResponse.data.data.files.length);
    console.log('✅ Branch:', processResponse.data.data.branch);
    console.log('');

    // Test 3: Get specific file content
    console.log('Test 3: Fetching README.md...');
    const fileResponse = await axios.get(
      `${API_BASE}/vercel/next.js/file?path=README.md`
    );
    console.log('✅ File size:', fileResponse.data.data.size, 'bytes');
    console.log('✅ First 100 chars:', fileResponse.data.data.content.substring(0, 100));
    console.log('');

    console.log('🎉 All tests passed!');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Authentication required!');
      console.log('💡 This is expected - endpoints require Bearer token');
      console.log('');
      console.log('To test with authentication:');
      console.log('1. Start auth-service: npm run dev --workspace=services/auth-service');
      console.log('2. Register a user via /api/auth/register');
      console.log('3. Login via /api/auth/login to get a token');
      console.log('4. Add Authorization header: Bearer <token>');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Service not running!');
      console.log('💡 Start the course service:');
      console.log('   cd Backend/services/course-service');
      console.log('   npm run dev');
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

// Alternative: Test directly with GitHub API (no auth needed)
async function testGitHubAPIDirect() {
  console.log('🧪 Testing GitHub API directly (no auth)\n');

  try {
    const response = await axios.get(
      'https://api.github.com/repos/facebook/react',
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'TechLearn-LMS',
        },
      }
    );

    console.log('✅ Repository:', response.data.full_name);
    console.log('✅ Description:', response.data.description);
    console.log('✅ Stars:', response.data.stargazers_count);
    console.log('✅ Language:', response.data.language);
    console.log('✅ Default branch:', response.data.default_branch);
    console.log('');
    console.log('🎉 GitHub API is accessible!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run tests
console.log('════════════════════════════════════════════════════════\n');
testGitHubAPIDirect().then(() => {
  console.log('\n════════════════════════════════════════════════════════\n');
  return testGitHubIntegration();
});
