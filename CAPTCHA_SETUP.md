# CAPTCHA Solver Setup Guide

This guide explains how to set up and use the CAPTCHA solver service for WG-Gesucht scraping.

## 🔑 Getting Started

### 1. Create a 2captcha Account

1. Visit [2captcha.com](https://2captcha.com)
2. Register for a new account
3. Verify your email address
4. Add funds to your account (minimum $1-2 recommended for testing)

### 2. Get Your API Key

1. Log into your 2captcha dashboard
2. Go to the "API" section
3. Copy your API key (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 3. Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# CAPTCHA Solving Service (2captcha)
CAPTCHA_SOLVER_API_KEY=your_2captcha_api_key_here
CAPTCHA_SOLVER_PROVIDER=2captcha
```

## 🧪 Testing the Setup

Run the test script to verify everything is working:

```bash
npx tsx test-captcha.ts
```

This will:
- ✅ Verify your API key is valid
- 💰 Check your account balance
- 🤖 Test API communication
- 📊 Show configuration status

## 💰 Pricing Information

2captcha pricing (as of 2024):
- **reCAPTCHA v2**: ~$1 per 1000 solves
- **reCAPTCHA v3**: ~$2 per 1000 solves
- **hCaptcha**: ~$1 per 1000 solves
- **Image CAPTCHA**: ~$0.50 per 1000 solves

**Recommended starting balance**: $5-10 for testing and initial usage.

## 🚀 Usage in Scraping

The CAPTCHA solver is automatically integrated into the WG-Gesucht stealth scraper:

```typescript
import { WGGesuchtStealthScraper } from './src/features/scraping/scrapers/wg-gesucht-stealth';

// CAPTCHA solver will be automatically initialized if API key is present
const scraper = new WGGesuchtStealthScraper({
  headless: false, // Set to true for production
  maxRetries: 3
});

// Scraper will automatically detect and solve CAPTCHAs during operation
const listings = await scraper.scrapeListings({
  minRent: 300,
  maxRent: 800,
  maxPages: 3
});
```

## 🔧 Supported CAPTCHA Types

The solver supports:

1. **reCAPTCHA v2** - Standard "I'm not a robot" checkbox
2. **reCAPTCHA v3** - Invisible reCAPTCHA with score-based verification
3. **hCaptcha** - Alternative CAPTCHA service
4. **Image CAPTCHA** - Traditional image-based challenges

## 📊 Monitoring and Optimization

### Check Solve Rates

```typescript
// Get scraper statistics
const stats = scraper.getStats();
console.log(`CAPTCHA rate: ${stats.captchaRate}`);
console.log(`Success rate: ${stats.successRate}`);
```

### Balance Monitoring

```typescript
import { createCaptchaSolver } from './src/features/scraping/services/captcha-solver';

const solver = createCaptchaSolver({
  provider: '2captcha',
  apiKey: process.env.CAPTCHA_SOLVER_API_KEY!
});

const balance = await solver.getBalance();
console.log(`Remaining balance: $${balance}`);
```

## ⚡ Performance Tips

1. **Rate Limiting**: The scraper includes built-in rate limiting to reduce CAPTCHA frequency
2. **Session Persistence**: Cookies are saved to avoid repeated login CAPTCHAs
3. **Human-like Behavior**: Random delays and mouse movements reduce detection
4. **Batch Processing**: Process multiple listings in controlled batches

## 🛠️ Troubleshooting

### Common Issues

**"Invalid API key" error:**
- Double-check your API key is correct
- Ensure no extra spaces or characters
- Verify your 2captcha account is active

**"Insufficient balance" error:**
- Add funds to your 2captcha account
- Check minimum balance requirements

**High CAPTCHA rates:**
- Increase delays between requests
- Use session persistence
- Enable stealth mode features
- Consider using residential proxies

**Timeouts:**
- Increase solver timeout (default: 120 seconds)
- Monitor 2captcha service status
- Check your internet connection

### Debug Mode

Enable detailed logging:

```typescript
const solver = createCaptchaSolver({
  provider: '2captcha',
  apiKey: process.env.CAPTCHA_SOLVER_API_KEY!,
  enableLogging: true, // Enable debug logs
  timeout: 180000      // Increase timeout to 3 minutes
});
```

## 🔒 Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all secrets
3. **Monitor usage** regularly to detect anomalies
4. **Rotate API keys** periodically
5. **Set spending limits** on your 2captcha account

## 📈 Scaling for Production

For high-volume usage:

1. **Multiple API keys**: Rotate between different accounts
2. **Load balancing**: Distribute requests across providers
3. **Caching**: Cache successful sessions longer
4. **Monitoring**: Set up alerts for balance and error rates
5. **Backup providers**: Configure fallback to anticaptcha or manual solving

## 🆘 Support

- **2captcha Support**: https://2captcha.com/support
- **API Documentation**: https://2captcha.com/2captcha-api
- **Status Page**: https://status.2captcha.com

## 📋 Cost Optimization Checklist

- [ ] Set up balance alerts
- [ ] Monitor solve success rates
- [ ] Optimize request delays
- [ ] Use session persistence
- [ ] Configure appropriate timeouts
- [ ] Regular balance top-ups
- [ ] Track cost per successful scrape