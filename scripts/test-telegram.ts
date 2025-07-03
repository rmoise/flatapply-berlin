import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

async function testTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in .env.local')
    process.exit(1)
  }

  console.log('🤖 Testing Telegram Bot...')
  console.log(`Bot Username: @${botUsername}`)

  try {
    // Create bot instance
    const bot = new TelegramBot(token, { polling: true })

    // Get bot info
    const botInfo = await bot.getMe()
    console.log('\n✅ Bot connected successfully!')
    console.log(`Bot Name: ${botInfo.first_name}`)
    console.log(`Bot Username: @${botInfo.username}`)
    console.log(`Bot ID: ${botInfo.id}`)

    console.log('\n📱 To test your bot:')
    console.log(`1. Open Telegram and go to: https://t.me/${botInfo.username}`)
    console.log('2. Send /start to the bot')
    console.log('3. You should see your chat ID below:')
    console.log('\nListening for messages... (Press Ctrl+C to stop)\n')

    // Listen for messages
    bot.on('message', (msg) => {
      const chatId = msg.chat.id
      const text = msg.text
      const username = msg.from?.username || msg.from?.first_name || 'User'

      console.log(`📨 New message from @${username} (Chat ID: ${chatId}): ${text}`)

      // Respond to /start
      if (text === '/start') {
        bot.sendMessage(chatId, `Welcome to FlatApply Berlin! 🏠\n\nYour Chat ID is: \`${chatId}\`\n\nTo connect this account to FlatApply:\n1. Copy your Chat ID above\n2. Go to your FlatApply dashboard\n3. Navigate to Notifications settings\n4. Paste your Chat ID there`, {
          parse_mode: 'Markdown'
        })
      }
    })

    // Handle errors
    bot.on('error', (error) => {
      console.error('❌ Bot error:', error.message)
    })

  } catch (error) {
    console.error('❌ Failed to connect to Telegram:', error)
    process.exit(1)
  }
}

// Run the test
testTelegramBot()