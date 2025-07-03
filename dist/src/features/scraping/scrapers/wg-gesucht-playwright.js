"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WGGesuchtPlaywrightScraper = void 0;
const playwright_1 = require("playwright");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = require("dotenv");
dotenv_1.default.config({ path: '.env.local' });
class WGGesuchtPlaywrightScraper {
    browser = null;
    context = null;
    supabase;
    proxyConfig;
    constructor(proxyConfig) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        this.proxyConfig = proxyConfig || {};
    }
    async init() {
        const launchOptions = {
            headless: false, // Set to true in production
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process',
                '--no-sandbox'
            ]
        };
        // Add proxy if configured
        if (this.proxyConfig.server) {
            launchOptions.proxy = {
                server: this.proxyConfig.server,
                username: this.proxyConfig.username,
                password: this.proxyConfig.password
            };
        }
        this.browser = await playwright_1.chromium.launch(launchOptions);
        // Create context with realistic settings
        this.context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'de-DE',
            timezoneId: 'Europe/Berlin',
            permissions: ['geolocation'],
            geolocation: { latitude: 52.520008, longitude: 13.404954 }, // Berlin
            extraHTTPHeaders: {
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        // Add stealth scripts - using ES5 syntax
        await this.context.addInitScript(function () {
            // Override navigator.webdriver
            Object.defineProperty(navigator, 'webdriver', {
                get: function () { return undefined; }
            });
            // Override plugins
            Object.defineProperty(navigator, 'plugins', {
                get: function () { return [1, 2, 3, 4, 5]; }
            });
            // Override languages
            Object.defineProperty(navigator, 'languages', {
                get: function () { return ['de-DE', 'de', 'en-US', 'en']; }
            });
        });
    }
    async scrapeSearchResults(limit = 20) {
        const page = await this.context.newPage();
        const listings = [];
        try {
            console.log('🔍 Navigating to WG-Gesucht Berlin...');
            await page.goto('https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html', {
                waitUntil: 'networkidle',
                timeout: 30000
            });
            // Wait for content to load
            await page.waitForSelector('.wgg_card', { timeout: 10000 });
            // Random delay to appear more human
            await page.waitForTimeout(2000 + Math.random() * 2000);
            // Get all listing cards
            const listingCards = await page.$$('.wgg_card');
            console.log(`Found ${listingCards.length} listings on page`);
            for (let i = 0; i < Math.min(listingCards.length, limit); i++) {
                try {
                    const card = listingCards[i];
                    // Extract basic info from card
                    const linkEl = await card.$('a[href^="/wg-zimmer"]');
                    const listingUrl = linkEl ? await linkEl.getAttribute('href') : null;
                    const fullUrl = listingUrl ? `https://www.wg-gesucht.de${listingUrl}` : null;
                    if (!fullUrl)
                        continue;
                    const externalId = this.extractIdFromUrl(fullUrl);
                    // Extract data from card
                    const titleEl = await card.$('h3');
                    const title = titleEl ? await titleEl.textContent() : '';
                    const priceEl = await card.$('.col-xs-3');
                    const priceText = priceEl ? await priceEl.textContent() : '';
                    const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
                    console.log(`\n📄 Scraping listing ${i + 1}/${limit}: ${title}`);
                    // Visit detailed page for full data
                    const detailData = await this.scrapeDetailPage(page, fullUrl);
                    listings.push({
                        platform: 'wg_gesucht',
                        externalId,
                        url: fullUrl,
                        title: detailData.title || title || '',
                        description: detailData.description,
                        price: detailData.price || price,
                        size: detailData.size,
                        rooms: detailData.rooms,
                        district: detailData.district,
                        availableFrom: detailData.availableFrom,
                        contactName: detailData.contactName,
                        contactPhone: detailData.contactPhone,
                        contactEmail: detailData.contactEmail,
                        contactProfileImage: detailData.contactProfileImage,
                        images: detailData.images,
                        amenities: detailData.amenities,
                        scrapedAt: new Date(),
                        allowsAutoApply: false
                    });
                    // Random delay between listings
                    await page.waitForTimeout(1500 + Math.random() * 2000);
                }
                catch (error) {
                    console.error(`Error scraping listing ${i + 1}:`, error);
                }
            }
        }
        catch (error) {
            console.error('Error during search scraping:', error);
        }
        finally {
            await page.close();
        }
        return listings;
    }
    async scrapeDetailPage(page, url) {
        const newPage = await this.context.newPage();
        try {
            await newPage.goto(url, {
                waitUntil: 'networkidle',
                timeout: 30000
            });
            // Wait for main content
            await newPage.waitForSelector('.headline-detailed-view-title, h1', { timeout: 10000 });
            // Extract all data
            const data = await newPage.evaluate(() => {
                // Simple helper functions without TypeScript types
                function getText(selector) {
                    var el = document.querySelector(selector);
                    return el && el.textContent ? el.textContent.trim() : '';
                }
                function getTexts(selector) {
                    var elements = document.querySelectorAll(selector);
                    var texts = [];
                    for (var i = 0; i < elements.length; i++) {
                        var text = elements[i].textContent;
                        if (text)
                            texts.push(text.trim());
                    }
                    return texts;
                }
                // Title
                var title = getText('.headline-detailed-view-title') || getText('h1');
                // Description - get full text
                var description = '';
                var descSection = document.querySelector('#ad_description_text');
                if (descSection) {
                    // Remove script tags and ads
                    var clone = descSection.cloneNode(true);
                    var toRemove = clone.querySelectorAll('script, ins, .adsbygoogle');
                    for (var i = 0; i < toRemove.length; i++) {
                        toRemove[i].remove();
                    }
                    description = clone.textContent ? clone.textContent.trim() : '';
                }
                // Price
                var priceText = getText('.headline-detailed-view-price-info');
                var price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
                // Size and rooms
                var size = 0;
                var rooms = 0;
                var basicData = getTexts('.headline-detailed-view-data-item');
                for (var j = 0; j < basicData.length; j++) {
                    var text = basicData[j];
                    if (text.includes('m²')) {
                        size = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                    }
                    if (text.includes('Zimmer')) {
                        rooms = parseFloat(text.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                    }
                }
                // District
                var addressText = getText('.headline-detailed-view-location');
                var district = addressText.split(',')[0] ? addressText.split(',')[0].trim() : '';
                // Available from
                var availableFrom = '';
                for (var k = 0; k < basicData.length; k++) {
                    if (basicData[k].includes('.2024') || basicData[k].includes('.2025') || basicData[k].includes('sofort')) {
                        availableFrom = basicData[k];
                        break;
                    }
                }
                // Contact info
                var contactName = getText('.headline-detailed-view-contact-name') ||
                    getText('.contact-box-name') || '';
                // Images
                var imageElements = document.querySelectorAll('.gallery-image img');
                var images = [];
                for (var m = 0; m < imageElements.length; m++) {
                    var src = imageElements[m].src;
                    if (src && !src.includes('placeholder')) {
                        images.push(src.replace(/\.sized\.|\.large\./, '.'));
                    }
                }
                // Amenities
                var amenities = {};
                var facilityTags = document.querySelectorAll('.facilities-tag');
                for (var n = 0; n < facilityTags.length; n++) {
                    var tagText = facilityTags[n].textContent;
                    if (tagText)
                        amenities[tagText.trim()] = true;
                }
                // Remove duplicate images
                var uniqueImages = [];
                for (var p = 0; p < images.length; p++) {
                    if (uniqueImages.indexOf(images[p]) === -1) {
                        uniqueImages.push(images[p]);
                    }
                }
                return {
                    title: title,
                    description: description,
                    price: price,
                    size: size,
                    rooms: rooms,
                    district: district,
                    availableFrom: availableFrom,
                    contactName: contactName,
                    images: uniqueImages,
                    amenities: amenities
                };
            });
            // Try to get phone number if available
            let contactPhone = '';
            try {
                await newPage.click('.contact-box-phone-button', { timeout: 3000 });
                await newPage.waitForTimeout(1000);
                const phoneEl = await newPage.$('.contact-box-phone-number');
                if (phoneEl) {
                    const phoneText = await phoneEl.textContent();
                    contactPhone = phoneText ? phoneText.trim() : '';
                }
            }
            catch (e) {
                // Phone not available
            }
            return {
                ...data,
                contactPhone
            };
        }
        catch (error) {
            console.error('Error scraping detail page:', error);
            return {
                title: '',
                description: '',
                price: 0,
                size: 0,
                rooms: 0,
                district: '',
                availableFrom: '',
                contactName: '',
                images: [],
                amenities: {}
            };
        }
        finally {
            await newPage.close();
        }
    }
    async scrape() {
        try {
            await this.init();
            const limit = process.env.TEST_LIMIT ? parseInt(process.env.TEST_LIMIT) : 20;
            console.log(`🚀 Starting Playwright scraper (limit: ${limit} listings)...\n`);
            const listings = await this.scrapeSearchResults(limit);
            console.log(`\n✅ Successfully scraped ${listings.length} listings`);
            // Save to database with automatic match creation
            if (listings.length > 0) {
                await this.saveListingsWithMatches(listings);
            }
            return { success: true, listings };
        }
        catch (error) {
            console.error('Scraping failed:', error);
            return { success: false, listings: [] };
        }
        finally {
            await this.cleanup();
        }
    }
    async saveListingsWithMatches(listings) {
        console.log('\n💾 Saving listings to database...');
        // Get all profiles for match creation
        const { data: profiles } = await this.supabase
            .from('profiles')
            .select('id, email');
        let savedCount = 0;
        let updatedCount = 0;
        const newListingIds = [];
        for (const listing of listings) {
            try {
                const { data: existing } = await this.supabase
                    .from('listings')
                    .select('id')
                    .eq('platform', listing.platform)
                    .eq('external_id', listing.externalId)
                    .single();
                const listingData = {
                    platform: listing.platform,
                    external_id: listing.externalId,
                    url: listing.url,
                    title: listing.title,
                    description: listing.description,
                    price: listing.price,
                    size_sqm: listing.size,
                    rooms: listing.rooms,
                    district: listing.district,
                    available_from: listing.availableFrom,
                    contact_name: listing.contactName,
                    contact_phone: listing.contactPhone,
                    contact_email: listing.contactEmail,
                    contact_profile_image: listing.contactProfileImage,
                    images: listing.images,
                    amenities: listing.amenities,
                    scraped_at: new Date().toISOString(),
                    is_active: true
                };
                if (existing) {
                    await this.supabase
                        .from('listings')
                        .update(listingData)
                        .eq('id', existing.id);
                    updatedCount++;
                }
                else {
                    const { data: newListing } = await this.supabase
                        .from('listings')
                        .insert(listingData)
                        .select()
                        .single();
                    if (newListing) {
                        savedCount++;
                        newListingIds.push(newListing.id);
                    }
                }
            }
            catch (error) {
                console.error(`Error saving listing:`, error);
            }
        }
        console.log(`✅ Saved ${savedCount} new, updated ${updatedCount} existing listings`);
        // Create matches for new listings
        if (newListingIds.length > 0 && profiles?.length > 0) {
            console.log(`\n🔗 Creating matches for new listings...`);
            for (const profile of profiles) {
                const matchData = newListingIds.map(listingId => ({
                    user_id: profile.id,
                    listing_id: listingId,
                    match_score: Math.floor(Math.random() * 20) + 80,
                    matched_at: new Date().toISOString()
                }));
                await this.supabase
                    .from('user_matches')
                    .insert(matchData)
                    .select();
            }
            console.log(`✅ Created matches for ${profiles.length} users`);
        }
    }
    extractIdFromUrl(url) {
        const match = url.match(/([0-9]+)\.html/);
        return match ? `wg_${match[1]}` : `wg_${Date.now()}`;
    }
    async cleanup() {
        if (this.context)
            await this.context.close();
        if (this.browser)
            await this.browser.close();
    }
}
exports.WGGesuchtPlaywrightScraper = WGGesuchtPlaywrightScraper;
