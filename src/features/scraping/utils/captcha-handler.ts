import { Page } from 'playwright';

export class CaptchaHandler {
  private static readonly CAPTCHA_SELECTORS = [
    // Google reCAPTCHA
    '.g-recaptcha',
    '#g-recaptcha',
    'iframe[src*="recaptcha"]',
    'iframe[title*="reCAPTCHA"]',
    'div[id*="recaptcha"]',
    
    // hCaptcha
    '.h-captcha',
    'iframe[src*="hcaptcha"]',
    
    // Generic captcha selectors
    '.captcha',
    '#captcha',
    'div[class*="captcha"]',
    'img[src*="captcha"]',
    'input[name*="captcha"]',
    
    // WG-Gesucht specific
    '.captcha-container',
    '#captcha-wrapper',
    'div[id*="captcha-box"]'
  ];

  static async detectCaptcha(page: Page): Promise<{
    found: boolean;
    type: string;
    selector?: string;
  }> {
    console.log('🔍 Checking for CAPTCHA...');
    
    for (const selector of this.CAPTCHA_SELECTORS) {
      try {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible({ timeout: 1000 })) {
          // Determine captcha type
          let type = 'unknown';
          if (selector.includes('recaptcha')) {
            type = 'recaptcha';
          } else if (selector.includes('hcaptcha')) {
            type = 'hcaptcha';
          } else if (selector.includes('captcha')) {
            type = 'generic';
          }
          
          console.log(`🤖 CAPTCHA detected! Type: ${type}, Selector: ${selector}`);
          return { found: true, type, selector };
        }
      } catch (e) {
        // Continue checking other selectors
      }
    }
    
    // Also check for CAPTCHA in page content - but be more specific
    try {
      const pageContent = await page.content();
      
      // Only consider it a CAPTCHA if we find specific CAPTCHA-related elements
      const specificCaptchaPatterns = [
        /<div[^>]*class="[^"]*g-recaptcha[^"]*"/i,
        /<iframe[^>]*src="[^"]*recaptcha[^"]*"/i,
        /<div[^>]*class="[^"]*h-captcha[^"]*"/i,
        /data-sitekey="[^"]+"/i,
        /Bitte lösen Sie das CAPTCHA/i,
        /Please solve the CAPTCHA/i
      ];
      
      for (const pattern of specificCaptchaPatterns) {
        if (pattern.test(pageContent)) {
          console.log(`🤖 Specific CAPTCHA pattern detected: ${pattern}`);
          return { found: true, type: 'content-based' };
        }
      }
      
      // Check for CAPTCHA form elements
      const captchaForm = await page.locator('form[action*="captcha"], input[name*="captcha_response"]').count();
      if (captchaForm > 0) {
        console.log('🤖 CAPTCHA form elements detected');
        return { found: true, type: 'form-based' };
      }
    } catch (e) {
      // Ignore content check errors
    }
    
    return { found: false, type: 'none' };
  }

  static async waitForCaptchaSolution(
    page: Page, 
    options: {
      timeout?: number;
      checkInterval?: number;
      takeScreenshot?: boolean;
    } = {}
  ): Promise<boolean> {
    const {
      timeout = 300000, // 5 minutes default
      checkInterval = 5000, // Check every 5 seconds
      takeScreenshot = true
    } = options;
    
    console.log('⏳ Waiting for CAPTCHA to be solved...');
    console.log(`  ⏱️ Timeout: ${timeout / 1000} seconds`);
    console.log('  👤 Please solve the CAPTCHA manually in the browser window');
    
    if (takeScreenshot) {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = `captcha-${timestamp}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`  📸 Screenshot saved: ${screenshotPath}`);
      } catch (e) {
        console.log('  ⚠️ Could not take screenshot');
      }
    }
    
    const startTime = Date.now();
    let lastStatus = '';
    
    while (Date.now() - startTime < timeout) {
      // Check if CAPTCHA is still present
      const captchaStatus = await this.detectCaptcha(page);
      
      if (!captchaStatus.found) {
        console.log('✅ CAPTCHA solved or disappeared!');
        return true;
      }
      
      // Check if we're on a different page (might indicate success)
      const currentUrl = page.url();
      if (currentUrl.includes('success') || currentUrl.includes('dashboard')) {
        console.log('✅ Navigation detected, CAPTCHA likely solved');
        return true;
      }
      
      // Check for success indicators
      const successSelectors = [
        'a[href*="logout"]',
        '.logout-button',
        '.user-menu',
        '.dashboard',
        '.success-message'
      ];
      
      for (const selector of successSelectors) {
        if (await page.locator(selector).count() > 0) {
          console.log(`✅ Success indicator found: ${selector}`);
          return true;
        }
      }
      
      // Show progress
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.floor((timeout - (Date.now() - startTime)) / 1000);
      const status = `⏳ Waiting... ${elapsed}s elapsed, ${remaining}s remaining`;
      
      if (status !== lastStatus) {
        console.log(status);
        lastStatus = status;
      }
      
      await page.waitForTimeout(checkInterval);
    }
    
    console.log('❌ CAPTCHA solution timeout');
    return false;
  }

  static async checkForCaptchaAndHandle(
    page: Page,
    options?: Parameters<typeof CaptchaHandler.waitForCaptchaSolution>[1]
  ): Promise<boolean> {
    const captchaStatus = await this.detectCaptcha(page);
    
    if (captchaStatus.found) {
      console.log(`\n🚨 CAPTCHA Detected: ${captchaStatus.type}`);
      console.log('━'.repeat(50));
      
      const solved = await this.waitForCaptchaSolution(page, options);
      
      if (solved) {
        console.log('━'.repeat(50));
        console.log('🎉 Continuing after CAPTCHA...\n');
        return true;
      } else {
        console.log('━'.repeat(50));
        console.log('❌ CAPTCHA not solved, cannot continue\n');
        throw new Error('CAPTCHA not solved within timeout');
      }
    }
    
    return true;
  }

  static async monitorForCaptcha(
    page: Page,
    callback?: (captchaInfo: { found: boolean; type: string }) => void
  ): Promise<void> {
    // Set up continuous monitoring for CAPTCHAs
    page.on('framenavigated', async () => {
      const captchaStatus = await this.detectCaptcha(page);
      if (captchaStatus.found && callback) {
        callback(captchaStatus);
      }
    });
    
    page.on('load', async () => {
      const captchaStatus = await this.detectCaptcha(page);
      if (captchaStatus.found && callback) {
        callback(captchaStatus);
      }
    });
  }
}