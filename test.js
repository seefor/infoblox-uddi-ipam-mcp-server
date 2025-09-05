// test-auth.js
const axios = require('axios');

const apiKey = process.env.INFOBLOX_API_KEY;
const baseUrl = process.env.INFOBLOX_BASE_URL || 'https://csp.infoblox.com';

async function testAuth() {
  try {
    const response = await axios.get(`${baseUrl}/api/ddi/v1/ipam/ip_space?_limit=1`, {
      headers: {
        'Authorization': `Token ${apiKey}`,  // Note: Token, not Bearer
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Authentication successful!');
    console.log(`Found ${response.data.results?.length || 0} IP spaces`);
    if (response.data.results?.length > 0) {
      console.log('First IP space:', response.data.results[0].name);
    }
  } catch (error) {
    console.error('❌ Authentication failed:');
    console.error(`Status: ${error.response?.status}`);
    console.error(`Message: ${error.response?.data?.message || error.message}`);
    console.error('Headers sent:', error.config?.headers);
  }
}

testAuth();
