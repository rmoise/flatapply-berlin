import TelegramBot from 'node-telegram-bot-api'

// Initialize bot only if token is provided
let bot: TelegramBot | null = null

if (process.env.TELEGRAM_BOT_TOKEN) {
  // Use polling in development, webhook in production
  const options = process.env.NODE_ENV === 'production' 
    ? { webhook: { port: parseInt(process.env.PORT || '3000') } }
    : { polling: false } // We'll handle updates via webhook API route
    
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, options)
} else {
  console.warn('TELEGRAM_BOT_TOKEN is not set. Telegram notifications will not work.')
}

export const telegramBot = bot

// Message formatters
export const telegramMessages = {
  welcome: (userName: string) => `
🎉 Welcome to FlatApply Berlin!

Hi ${userName}, your Telegram notifications are now active.

You'll receive instant alerts when:
• New apartments match your preferences
• Landlords view your applications  
• You receive replies from landlords

To stop notifications, use /stop
To check your status, use /status
`,

  newListing: (data: {
    listingTitle: string
    district: string
    price: number
    rooms: number
    size: number
    listingUrl: string
  }) => `
🏠 *New Apartment Match!*

*${data.listingTitle}*
📍 ${data.district}
💶 €${data.price}/month
🏠 ${data.rooms} rooms, ${data.size}m²

[View Listing](${data.listingUrl})

⚡ _Act fast! Good apartments go quickly in Berlin._
`,

  applicationSent: (data: {
    listingTitle: string
    applicationUrl: string
  }) => `
✅ *Application Sent!*

Your application for *${data.listingTitle}* has been sent successfully.

We'll notify you when the landlord views or responds.

[View Application](${data.applicationUrl})
`,

  landlordReply: (data: {
    listingTitle: string
    landlordName: string
    messagePreview: string
    applicationUrl: string
  }) => `
🎉 *You got a reply!*

${data.landlordName} replied to your application for:
*${data.listingTitle}*

_"${data.messagePreview}..."_

[Read Full Reply & Respond](${data.applicationUrl})

💡 _Tip: Respond quickly to show your interest!_
`,

  applicationViewed: (data: {
    listingTitle: string
    applicationUrl: string
  }) => `
👀 *Application Viewed*

The landlord has viewed your application for:
*${data.listingTitle}*

This is a good sign! They might reply soon.

[View Application](${data.applicationUrl})
`
}

// Helper to escape markdown special characters
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
}

// Send message with proper error handling
export async function sendTelegramMessage(
  chatId: string, 
  message: string,
  options: { parse_mode?: 'Markdown' | 'HTML', disable_web_page_preview?: boolean } = {}
): Promise<boolean> {
  if (!bot) {
    console.error('Telegram bot not initialized')
    return false
  }

  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
      ...options
    })
    return true
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return false
  }
}

// Verify chat ID by sending a test message
export async function verifyTelegramChatId(chatId: string, userName: string): Promise<boolean> {
  return sendTelegramMessage(chatId, telegramMessages.welcome(userName))
}