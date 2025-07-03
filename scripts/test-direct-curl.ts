import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testDirectAccess() {
  console.log('🔍 Testing direct access to WG-Gesucht...\n');

  // Test with curl
  console.log('1. Testing with curl:');
  try {
    const { stdout, stderr } = await execAsync(
      'curl -I -s -m 10 "https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"'
    );
    console.log('Response headers:');
    console.log(stdout);
    if (stderr) console.log('Errors:', stderr);
  } catch (error) {
    console.error('Curl failed:', error);
  }

  // Test with fetch
  console.log('\n2. Testing with Node.js fetch:');
  try {
    const response = await fetch('https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log(`HTML length: ${html.length} characters`);
      
      // Check for specific content
      const checks = {
        'Contains "wgg_card"': html.includes('wgg_card'),
        'Contains "offer_list_item"': html.includes('offer_list_item'),
        'Contains listings': html.includes('class="list') || html.includes('offer_list'),
        'Contains "WG-Zimmer"': html.includes('WG-Zimmer'),
        'Contains Cloudflare': html.includes('cloudflare') || html.includes('cf-browser-verification'),
        'Contains captcha': html.toLowerCase().includes('captcha'),
      };
      
      console.log('\nContent checks:');
      Object.entries(checks).forEach(([check, result]) => {
        console.log(`  ${check}: ${result ? '✅' : '❌'}`);
      });
      
      // Save a sample of the HTML
      const fs = await import('fs');
      await fs.promises.writeFile('wg-response.html', html);
      console.log('\n📄 Full HTML saved to wg-response.html');
    }
  } catch (error) {
    console.error('Fetch failed:', error);
  }

  // Test DNS resolution
  console.log('\n3. Testing DNS resolution:');
  try {
    const { stdout } = await execAsync('nslookup www.wg-gesucht.de');
    console.log(stdout);
  } catch (error) {
    console.error('DNS lookup failed:', error);
  }
}

testDirectAccess()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });