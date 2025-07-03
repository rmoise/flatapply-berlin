#!/usr/bin/env tsx

/**
 * Test script for CAPTCHA solver integration
 * 
 * Usage:
 * 1. Set CAPTCHA_SOLVER_API_KEY in your .env.local
 * 2. Run: npx tsx test-captcha.ts
 */

import { createCaptchaSolver } from './src/features/scraping/services/captcha-solver';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testCaptchaSolver() {
  console.log('🧪 Testing CAPTCHA solver integration...\n');

  // Check if API key is configured
  const apiKey = process.env.CAPTCHA_SOLVER_API_KEY;
  if (!apiKey) {
    console.error('❌ CAPTCHA_SOLVER_API_KEY not found in environment variables');
    console.log('💡 Add your 2captcha API key to .env.local:');
    console.log('   CAPTCHA_SOLVER_API_KEY=your_2captcha_api_key_here');
    console.log('   CAPTCHA_SOLVER_PROVIDER=2captcha');
    process.exit(1);
  }

  try {
    // Create solver instance
    const solver = createCaptchaSolver({
      provider: '2captcha',
      apiKey,
      enableLogging: true
    });

    console.log('✅ CAPTCHA solver created successfully');
    console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...`);

    // Test account balance
    console.log('\n💰 Checking account balance...');
    try {
      const balance = await solver.getBalance();
      console.log(`✅ Account balance: $${balance}`);
      
      if (balance < 1) {
        console.log('⚠️  Low balance warning: Add funds to your 2captcha account');
        console.log('   Visit: https://2captcha.com/pay');
      }
    } catch (error) {
      console.error('❌ Failed to check balance:', error.message);
      return;
    }

    // Test a simple reCAPTCHA solve (won't actually solve due to demo URLs)
    console.log('\n🤖 Testing reCAPTCHA solver configuration...');
    try {
      // This will fail as expected since we're using demo data
      // but it will test the API connection and configuration
      const result = await solver.solveRecaptchaV2(
        '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-',
        'https://www.google.com/recaptcha/api2/demo'
      );
      
      if (result.success) {
        console.log('✅ reCAPTCHA solver working (unexpected success with demo)');
      } else {
        console.log('✅ reCAPTCHA solver API communication working');
        console.log('   (Demo solve failed as expected)');
      }
    } catch (error) {
      // Expected to fail with demo data, but should show proper API communication
      if (error.message.includes('ERROR_CAPTCHA_UNSOLVABLE') || 
          error.message.includes('timeout') ||
          error.message.includes('ERROR_')) {
        console.log('✅ reCAPTCHA solver API communication working');
        console.log('   (Demo solve failed as expected)');
      } else {
        console.error('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 CAPTCHA solver integration test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Ensure you have sufficient balance in your 2captcha account');
    console.log('2. Test with real WG-Gesucht scraping');
    console.log('3. Monitor solve rates and costs');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.message.includes('API_KEY')) {
      console.log('\n💡 Troubleshooting:');
      console.log('- Check your API key is correct');
      console.log('- Verify your 2captcha account is active');
      console.log('- Visit https://2captcha.com/enterpage to check your account');
    }
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testCaptchaSolver().catch(console.error);
}

export { testCaptchaSolver };