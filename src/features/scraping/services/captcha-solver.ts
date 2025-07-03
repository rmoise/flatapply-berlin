import { Solver } from '2captcha';
import { Page } from 'playwright';

export interface CaptchaSolverConfig {
  provider: '2captcha' | 'anticaptcha';
  apiKey: string;
  timeout?: number; // Default: 120 seconds
  enableLogging?: boolean;
}

export interface CaptchaSolution {
  success: boolean;
  solution?: string;
  error?: string;
  cost?: number; // Cost in USD
  timeMs?: number; // Time taken in milliseconds
}

/**
 * Universal CAPTCHA solver service supporting multiple providers
 */
export class CaptchaSolverService {
  private solver: Solver;
  private config: CaptchaSolverConfig;
  private totalCost = 0;
  private solveCount = 0;

  constructor(config: CaptchaSolverConfig) {
    this.config = {
      timeout: 120,
      enableLogging: true,
      ...config
    };

    if (config.provider === '2captcha') {
      this.solver = new Solver(config.apiKey);
    } else {
      throw new Error(`Provider ${config.provider} not yet implemented`);
    }

    if (this.config.enableLogging) {
      console.log(`🤖 CAPTCHA solver initialized: ${config.provider}`);
    }
  }

  /**
   * Solve reCAPTCHA v2 challenge
   */
  async solveRecaptchaV2(siteKey: string, pageUrl: string): Promise<CaptchaSolution> {
    const startTime = Date.now();
    
    try {
      if (this.config.enableLogging) {
        console.log(`🔒 Solving reCAPTCHA v2: ${siteKey.substring(0, 20)}...`);
      }

      const solution = await this.solver.recaptcha({
        googlekey: siteKey,
        pageurl: pageUrl,
        timeout: (this.config.timeout || 120) * 1000
      });

      const timeMs = Date.now() - startTime;
      const cost = 0.002; // Approximate cost for reCAPTCHA v2
      
      this.updateStats(cost);

      if (this.config.enableLogging) {
        console.log(`✅ reCAPTCHA v2 solved in ${Math.round(timeMs / 1000)}s (cost: $${cost.toFixed(4)})`);
      }

      return {
        success: true,
        solution: solution.data,
        cost,
        timeMs
      };

    } catch (error) {
      const timeMs = Date.now() - startTime;

      if (this.config.enableLogging) {
        console.error(`❌ reCAPTCHA v2 failed in ${Math.round(timeMs / 1000)}s:`, error);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timeMs
      };
    }
  }

  /**
   * Solve reCAPTCHA v3 challenge
   */
  async solveRecaptchaV3(siteKey: string, pageUrl: string, action = 'verify', minScore = 0.3): Promise<CaptchaSolution> {
    const startTime = Date.now();
    
    try {
      if (this.config.enableLogging) {
        console.log(`🔒 Solving reCAPTCHA v3: ${siteKey.substring(0, 20)}... (action: ${action})`);
      }

      const solution = await this.solver.recaptcha({
        googlekey: siteKey,
        pageurl: pageUrl,
        version: 'v3',
        action,
        min_score: minScore,
        timeout: (this.config.timeout || 120) * 1000
      });

      const timeMs = Date.now() - startTime;
      const cost = 0.003; // Approximate cost for reCAPTCHA v3
      
      this.updateStats(cost);

      if (this.config.enableLogging) {
        console.log(`✅ reCAPTCHA v3 solved in ${Math.round(timeMs / 1000)}s (cost: $${cost.toFixed(4)})`);
      }

      return {
        success: true,
        solution: solution.data,
        cost,
        timeMs
      };

    } catch (error) {
      const timeMs = Date.now() - startTime;

      if (this.config.enableLogging) {
        console.error(`❌ reCAPTCHA v3 failed in ${Math.round(timeMs / 1000)}s:`, error);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timeMs
      };
    }
  }

  /**
   * Solve hCaptcha challenge
   */
  async solveHCaptcha(siteKey: string, pageUrl: string): Promise<CaptchaSolution> {
    const startTime = Date.now();
    
    try {
      if (this.config.enableLogging) {
        console.log(`🔒 Solving hCaptcha: ${siteKey.substring(0, 20)}...`);
      }

      const solution = await this.solver.hcaptcha({
        sitekey: siteKey,
        pageurl: pageUrl,
        timeout: (this.config.timeout || 120) * 1000
      });

      const timeMs = Date.now() - startTime;
      const cost = 0.001; // Approximate cost for hCaptcha
      
      this.updateStats(cost);

      if (this.config.enableLogging) {
        console.log(`✅ hCaptcha solved in ${Math.round(timeMs / 1000)}s (cost: $${cost.toFixed(4)})`);
      }

      return {
        success: true,
        solution: solution.data,
        cost,
        timeMs
      };

    } catch (error) {
      const timeMs = Date.now() - startTime;

      if (this.config.enableLogging) {
        console.error(`❌ hCaptcha failed in ${Math.round(timeMs / 1000)}s:`, error);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timeMs
      };
    }
  }

  /**
   * Solve image-based CAPTCHA
   */
  async solveImageCaptcha(imageUrl: string): Promise<CaptchaSolution> {
    const startTime = Date.now();
    
    try {
      if (this.config.enableLogging) {
        console.log(`🔒 Solving image CAPTCHA: ${imageUrl.substring(0, 50)}...`);
      }

      const solution = await this.solver.normal({
        url: imageUrl,
        timeout: (this.config.timeout || 120) * 1000
      });

      const timeMs = Date.now() - startTime;
      const cost = 0.0005; // Approximate cost for image CAPTCHA
      
      this.updateStats(cost);

      if (this.config.enableLogging) {
        console.log(`✅ Image CAPTCHA solved in ${Math.round(timeMs / 1000)}s (cost: $${cost.toFixed(4)})`);
      }

      return {
        success: true,
        solution: solution.data,
        cost,
        timeMs
      };

    } catch (error) {
      const timeMs = Date.now() - startTime;

      if (this.config.enableLogging) {
        console.error(`❌ Image CAPTCHA failed in ${Math.round(timeMs / 1000)}s:`, error);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timeMs
      };
    }
  }

  /**
   * Auto-detect and solve CAPTCHA on page
   */
  async autoSolveCaptcha(page: Page): Promise<CaptchaSolution> {
    const pageUrl = page.url();

    try {
      // Check for reCAPTCHA v2
      const recaptchaV2Element = await page.$('.g-recaptcha');
      if (recaptchaV2Element) {
        const siteKey = await recaptchaV2Element.getAttribute('data-sitekey');
        if (siteKey) {
          const result = await this.solveRecaptchaV2(siteKey, pageUrl);
          if (result.success) {
            await this.submitRecaptchaV2Solution(page, result.solution!);
            return result;
          }
        }
      }

      // Check for reCAPTCHA v3
      const recaptchaV3Scripts = await page.$$eval('script[src*="recaptcha"]', scripts => 
        scripts.map(s => s.src)
      );
      
      if (recaptchaV3Scripts.length > 0) {
        // Try to extract site key from page source
        const pageContent = await page.content();
        const siteKeyMatch = pageContent.match(/data-sitekey="([^"]+)"|sitekey:\s*["']([^"']+)["']/);
        
        if (siteKeyMatch) {
          const siteKey = siteKeyMatch[1] || siteKeyMatch[2];
          const result = await this.solveRecaptchaV3(siteKey, pageUrl);
          if (result.success) {
            await this.submitRecaptchaV3Solution(page, result.solution!);
            return result;
          }
        }
      }

      // Check for hCaptcha
      const hcaptchaElement = await page.$('.h-captcha');
      if (hcaptchaElement) {
        const siteKey = await hcaptchaElement.getAttribute('data-sitekey');
        if (siteKey) {
          const result = await this.solveHCaptcha(siteKey, pageUrl);
          if (result.success) {
            await this.submitHCaptchaSolution(page, result.solution!);
            return result;
          }
        }
      }

      return {
        success: false,
        error: 'No supported CAPTCHA found on page'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Submit reCAPTCHA v2 solution to page
   */
  private async submitRecaptchaV2Solution(page: Page, solution: string): Promise<void> {
    await page.evaluate((token) => {
      const textarea = document.querySelector('textarea[name="g-recaptcha-response"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = token;
        textarea.style.display = 'block';
        
        // Trigger callback if exists
        if (window.grecaptcha && window.grecaptcha.getResponse) {
          const callback = window.grecaptcha.getResponse();
          if (callback) {
            callback(token);
          }
        }
      }
    }, solution);

    // Wait a bit for the form to process
    await page.waitForTimeout(1000);
  }

  /**
   * Submit reCAPTCHA v3 solution to page
   */
  private async submitRecaptchaV3Solution(page: Page, solution: string): Promise<void> {
    await page.evaluate((token) => {
      // Set the token in any hidden input fields
      const inputs = document.querySelectorAll('input[name*="recaptcha"], input[name*="g-recaptcha"]');
      inputs.forEach((input: any) => {
        input.value = token;
      });

      // Try to trigger any global recaptcha callback
      if (window.grecaptcha) {
        window.grecaptcha.execute = () => Promise.resolve(token);
      }
    }, solution);

    await page.waitForTimeout(1000);
  }

  /**
   * Submit hCaptcha solution to page
   */
  private async submitHCaptchaSolution(page: Page, solution: string): Promise<void> {
    await page.evaluate((token) => {
      const textarea = document.querySelector('textarea[name="h-captcha-response"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = token;
        
        // Trigger callback if exists
        if (window.hcaptcha) {
          const callback = window.hcaptcha.getResponse();
          if (callback) {
            callback(token);
          }
        }
      }
    }, solution);

    await page.waitForTimeout(1000);
  }

  /**
   * Update usage statistics
   */
  private updateStats(cost: number): void {
    this.totalCost += cost;
    this.solveCount++;
  }

  /**
   * Get usage statistics
   */
  getStats() {
    return {
      totalSolves: this.solveCount,
      totalCost: this.totalCost,
      averageCost: this.solveCount > 0 ? this.totalCost / this.solveCount : 0,
      provider: this.config.provider
    };
  }

  /**
   * Check account balance (2captcha only)
   */
  async getBalance(): Promise<number> {
    try {
      const balance = await this.solver.balance();
      return parseFloat(balance.toString());
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('❌ Failed to get balance:', error);
      }
      return 0;
    }
  }
}

// Export singleton factory
let captchaSolver: CaptchaSolverService | null = null;

export function createCaptchaSolver(config: CaptchaSolverConfig): CaptchaSolverService {
  if (!captchaSolver) {
    captchaSolver = new CaptchaSolverService(config);
  }
  return captchaSolver;
}

export function getCaptchaSolver(): CaptchaSolverService | null {
  return captchaSolver;
}