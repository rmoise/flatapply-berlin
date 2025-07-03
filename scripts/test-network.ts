import { config } from 'dotenv';

config({ path: '.env.local' });

async function testNetwork() {
  console.log('🔍 Testing network access to WG-Gesucht...\n');

  const urls = [
    'https://www.wg-gesucht.de',
    'https://www.google.com',
    'https://httpbin.org/status/200'
  ];

  for (const url of urls) {
    console.log(`Testing: ${url}`);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      clearTimeout(timeout);
      console.log(`✅ Status: ${response.status} ${response.statusText}`);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('❌ Request timed out after 10 seconds');
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    console.log('');
  }
}

testNetwork()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });