import { config } from 'dotenv';
import { chromium } from 'playwright';
import * as fs from 'fs';

config({ path: '.env.local' });

async function debugDescription() {
  console.log('🔍 Debugging WG-Gesucht description extraction...\n');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  try {
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'de-DE'
    });

    // Override navigator properties
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10017642.html';
    
    console.log(`📡 Fetching: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // Wait for content
    await page.waitForTimeout(3000);

    // Try to find description using browser context
    const descriptionData = await page.evaluate(() => {
      const results: any = {
        selectors: {}
      };

      // Test various selectors
      const selectors = [
        '.freitext',
        '.freitext .wordbreak',
        '.freitext-section',
        '.panel-body .wordbreak',
        '#ad_description_text',
        '.section_panel_body',
        '.section_panel_content',
        'div[id*="freitext"]',
        '.col-sm-8.col-sm-pull-4.col-xs-12',
        '.section.section-panel-body',
        '.wordbreak'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.selectors[selector] = {
            count: elements.length,
            firstText: elements[0].textContent?.trim().substring(0, 200)
          };
        }
      });

      // Try to find the main description panel
      const panels = document.querySelectorAll('.panel.panel-default');
      panels.forEach((panel, idx) => {
        const heading = panel.querySelector('.panel-heading')?.textContent?.trim();
        if (heading && (heading.includes('Beschreibung') || heading.includes('Description'))) {
          const body = panel.querySelector('.panel-body');
          if (body) {
            results.descriptionPanel = {
              heading,
              text: body.textContent?.trim()
            };
          }
        }
      });

      return results;
    });

    console.log('\n📊 Found selectors:');
    Object.entries(descriptionData.selectors).forEach(([selector, data]: [string, any]) => {
      console.log(`\n${selector}:`);
      console.log(`  Count: ${data.count}`);
      console.log(`  Preview: ${data.firstText}`);
    });

    if (descriptionData.descriptionPanel) {
      console.log('\n✅ Found description panel:');
      console.log('Heading:', descriptionData.descriptionPanel.heading);
      console.log('Full text:', descriptionData.descriptionPanel.text);
    }

    // Save HTML for manual inspection
    const html = await page.content();
    fs.writeFileSync('debug-wg-description.html', html);
    console.log('\n📄 Saved HTML to debug-wg-description.html');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

debugDescription()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });