import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function debugSelectors() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10138526.html';
    
    console.log('🔍 Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Debug selectors
    const debugInfo = await page.evaluate(() => {
      const info: any = {
        titles: [],
        prices: [],
        sizes: [],
        contactNames: []
      };
      
      // Find all h1 tags
      document.querySelectorAll('h1').forEach(h1 => {
        if (h1.textContent?.trim()) {
          info.titles.push({
            text: h1.textContent.trim(),
            class: h1.className,
            parent: h1.parentElement?.className
          });
        }
      });
      
      // Find price info
      const priceTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.includes('€') || text.includes('Miete') || text.includes('Kaltmiete') || text.includes('Warmmiete');
      }).slice(0, 10);
      
      priceTexts.forEach(el => {
        info.prices.push({
          text: el.textContent?.trim().substring(0, 100),
          tag: el.tagName,
          class: el.className
        });
      });
      
      // Find size info
      const sizeTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.includes('m²') || text.includes('qm') || text.includes('Quadratmeter');
      }).slice(0, 10);
      
      sizeTexts.forEach(el => {
        info.sizes.push({
          text: el.textContent?.trim().substring(0, 100),
          tag: el.tagName,
          class: el.className
        });
      });
      
      // Find contact areas
      const contactAreas = [
        '.rhs_contact_information',
        '.offer_contact_box',
        '.contact_box',
        '.panel_r',
        '[class*="contact"]'
      ];
      
      contactAreas.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
          info.contactNames.push({
            selector,
            html: el.innerHTML.substring(0, 500),
            text: el.textContent?.substring(0, 200)
          });
        }
      });
      
      // Check for headline area
      const headline = document.querySelector('.headline, .headline-wrapper, [class*="headline"]');
      if (headline) {
        info.headlineArea = headline.innerHTML.substring(0, 500);
      }
      
      return info;
    });
    
    console.log('\n📋 Debug Info:');
    console.log('\nTITLES:');
    debugInfo.titles.forEach(t => console.log(`  - "${t.text}" (${t.tag} class="${t.class}")`));
    
    console.log('\nPRICES:');
    debugInfo.prices.forEach(p => console.log(`  - "${p.text}" (${p.tag} class="${p.class}")`));
    
    console.log('\nSIZES:');
    debugInfo.sizes.forEach(s => console.log(`  - "${s.text}" (${s.tag} class="${s.class}")`));
    
    console.log('\nCONTACT AREAS:');
    debugInfo.contactNames.forEach(c => {
      console.log(`\n  Selector: ${c.selector}`);
      console.log(`  Text preview: ${c.text}`);
    });
    
    if (debugInfo.headlineArea) {
      console.log('\nHEADLINE AREA HTML:');
      console.log(debugInfo.headlineArea);
    }
    
    console.log('\n⏰ Browser will close in 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } finally {
    await browser.close();
  }
}

debugSelectors();
