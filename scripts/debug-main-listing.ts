import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function debugMainListing() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    const url = 'https://www.wg-gesucht.de/wohnungen-in-Berlin-Friedrichshain.10138526.html';
    
    console.log('Finding main listing details...');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mainDetails = await page.evaluate(() => {
      const results = {
        breadcrumb: null,
        pageHeader: null,
        mainPanel: null,
        detailView: null,
        firstBoldWithZimmer: null
      };
      
      // Check breadcrumb area
      const breadcrumb = document.querySelector('.breadcrumb');
      if (breadcrumb) {
        results.breadcrumb = breadcrumb.textContent?.trim();
      }
      
      // Check page header area
      const pageHeader = document.querySelector('.page-header, .detail-header, .listing-header');
      if (pageHeader) {
        results.pageHeader = pageHeader.textContent?.trim().substring(0, 200);
      }
      
      // Check main panel
      const mainPanel = document.querySelector('.panel-body');
      if (mainPanel) {
        const firstBold = mainPanel.querySelector('b');
        if (firstBold) {
          results.mainPanel = {
            firstBoldText: firstBold.textContent?.trim(),
            parentText: firstBold.parentElement?.textContent?.trim()
          };
        }
      }
      
      // Check detail view panel
      const detailPanels = document.querySelectorAll('.panel');
      detailPanels.forEach(panel => {
        const title = panel.querySelector('.panel-title')?.textContent?.trim();
        if (title && (title.includes('Details') || title.includes('Objektbeschreibung'))) {
          const body = panel.querySelector('.panel-body');
          if (body) {
            const boldTags = Array.from(body.querySelectorAll('b'));
            const zimmerBold = boldTags.find(b => b.textContent?.includes('Zimmer'));
            if (zimmerBold) {
              results.detailView = {
                panelTitle: title,
                zimmerText: zimmerBold.textContent?.trim(),
                parentText: zimmerBold.parentElement?.textContent?.trim()
              };
            }
          }
        }
      });
      
      // Look for the first bold with Zimmer that's NOT in a map_card
      const allBolds = document.querySelectorAll('b');
      for (const bold of allBolds) {
        if (bold.textContent?.includes('Zimmer')) {
          // Check if it's not in a map card or similar listing
          let parent = bold.parentElement;
          let isInMapCard = false;
          while (parent && parent !== document.body) {
            if (parent.className.includes('map_card') || 
                parent.className.includes('similar') ||
                parent.className.includes('listing-item')) {
              isInMapCard = true;
              break;
            }
            parent = parent.parentElement;
          }
          
          if (!isInMapCard) {
            results.firstBoldWithZimmer = {
              text: bold.textContent?.trim(),
              parentClass: bold.parentElement?.className,
              grandparentClass: bold.parentElement?.parentElement?.className,
              surroundingText: bold.parentElement?.textContent?.trim().substring(0, 200)
            };
            break;
          }
        }
      }
      
      return results;
    });
    
    console.log('\n=== Main Listing Details ===');
    console.log(JSON.stringify(mainDetails, null, 2));
    
    // Now let's try to find the main details section more precisely
    const detailsSection = await page.evaluate(() => {
      // Look for elements that contain both size and rooms info
      const elements = Array.from(document.querySelectorAll('*'));
      const candidates = [];
      
      elements.forEach(el => {
        const text = el.textContent || '';
        if (text.includes('m²') && text.includes('Zimmer') && text.length < 500) {
          // Check if it's not in a list of other listings
          const classList = el.className || '';
          if (!classList.includes('map_card') && !classList.includes('listing-item')) {
            candidates.push({
              tag: el.tagName,
              class: el.className,
              text: text.trim(),
              hasPrice: text.includes('€'),
              childrenCount: el.children.length
            });
          }
        }
      });
      
      // Return top 5 candidates
      return candidates.slice(0, 5);
    });
    
    console.log('\n=== Elements with both m² and Zimmer ===');
    console.log(JSON.stringify(detailsSection, null, 2));
    
  } finally {
    await browser.close();
  }
}

debugMainListing();