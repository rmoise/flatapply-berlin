# Notification System Setup

FlatApply Berlin uses email (Resend) and Telegram for notifications. WhatsApp support can be added later once the business verification process is complete.

## Email Notifications (Resend)

### 1. Create a Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (10,000 emails/month free)
3. Verify your email

### 2. Get Your API Key
1. Go to API Keys in your Resend dashboard
2. Create a new API key
3. Add it to your `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 3. Configure Your Domain (Production)
For production, you'll want to send from your own domain:
1. Add your domain in Resend dashboard
2. Add the DNS records they provide
3. Wait for verification (usually < 1 hour)
4. Update the "from" address in `/src/lib/email/resend.ts`

## Telegram Notifications

### 1. Create a Telegram Bot
1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Choose a name (e.g., "FlatApply Berlin")
4. Choose a username (e.g., "FlatApplyBerlinBot")
5. Save the bot token you receive

### 2. Configure Your Bot
Add to your `.env.local`:
```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=FlatApplyBerlinBot
```

### 3. Set Up Webhook (Production)
In production, set up a webhook so Telegram sends updates to your server:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/api/webhooks/telegram"}'
```

### 4. Test Your Bot
1. Search for your bot in Telegram
2. Send `/start`
3. The bot should respond with a welcome message

## How Users Connect Telegram

1. Users go to Dashboard > Notifications
2. Click "Connect Telegram" 
3. This opens Telegram with a special start link
4. User sends `/start` to the bot
5. Bot connects their Telegram account to their FlatApply account

## Testing Notifications

### Test Email
```typescript
import { sendNotification } from '@/features/notifications/actions'

// Send a test notification
await sendNotification({
  userId: 'user-id-here',
  type: 'new_listing',
  listingId: 'listing-id',
  data: {
    listingTitle: 'Beautiful apartment in Mitte',
    district: 'Mitte',
    price: 1200,
    rooms: 2,
    size: 65,
    listingUrl: 'https://example.com/listing'
  }
})
```

### Test Telegram
Same as above - if the user has Telegram connected, they'll receive the notification there too.

## Notification Types

1. **new_listing** - When a new apartment matches user preferences
2. **application_sent** - Confirmation when application is sent
3. **landlord_reply** - When landlord responds to application
4. **application_viewed** - When landlord views the application

## Database Schema

The notification system uses these tables:
- `notifications` - Stores all sent notifications
- `notification_settings` - User preferences for each channel
- `listings` - Apartment listings
- `user_matches` - Matches between users and listings
- `applications` - Application history

Run migrations:
```bash
supabase db push
```

## Monitoring

Check notification delivery:
```sql
-- See recent notifications
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 20;

-- Check delivery success rate
SELECT 
  channel,
  status,
  COUNT(*) as count
FROM notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY channel, status;
```

## Troubleshooting

### Email not sending
- Check RESEND_API_KEY is set correctly
- Verify domain if using custom domain
- Check Resend dashboard for errors

### Telegram not working
- Verify bot token is correct
- Check webhook is set (production)
- Make sure user has started conversation with bot
- Check `/api/webhooks/telegram` logs

### Rate Limits
- Resend: 10,000/month free tier
- Telegram: 30 messages/second per user
- We implement daily limits per user (default: 20/day)