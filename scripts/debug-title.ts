import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function debugTitle() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10138526.html';
    
    console.log('🔍 Debugging title extraction for:', url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const titleInfo = await page.evaluate(() => {
      const info: any = {
        h1Tags: [],
        metaTitle: document.title,
        ogTitle: '',
        headlineClasses: []
      };
      
      // Get all h1 tags
      document.querySelectorAll('h1').forEach(h1 => {
        info.h1Tags.push({
          text: h1.textContent?.trim(),
          class: h1.className,
          id: h1.id,
          parent: h1.parentElement?.className
        });
      });
      
      // Get Open Graph title
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        info.ogTitle = ogTitle.getAttribute('content');
      }
      
      // Find elements with headline classes
      const headlineElements = document.querySelectorAll('[class*="headline"]');
      headlineElements.forEach(el => {
        if (el.textContent?.trim() && el.textContent.trim().length > 10) {
          info.headlineClasses.push({
            tag: el.tagName,
            class: el.className,
            text: el.textContent.trim().substring(0, 100)
          });
        }
      });
      
      return info;
    });
    
    console.log('\n📋 Title Debug Info:');
    console.log('\nMeta Title:', titleInfo.metaTitle);
    console.log('OG Title:', titleInfo.ogTitle);
    
    console.log('\nH1 Tags:');
    titleInfo.h1Tags.forEach(h1 => {
      console.log(`  - "${h1.text}"`);
      console.log(`    class: "${h1.class}"`);
      console.log(`    parent: "${h1.parent}"`);
    });
    
    console.log('\nHeadline Elements:');
    titleInfo.headlineClasses.forEach(el => {
      console.log(`  - ${el.tag}.${el.class}`);
      console.log(`    "${el.text}"`);
    });
    
  } finally {
    await browser.close();
  }
}

debugTitle();
