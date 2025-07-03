import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { telegramBot, telegramMessages, verifyTelegramChatId } from '@/features/notifications/services/telegram'

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    
    // Handle different update types
    if (update.message) {
      const message = update.message
      const chatId = message.chat.id.toString()
      const text = message.text
      const username = message.from.username || message.from.first_name
      
      // Handle commands
      if (text === '/start') {
        // User wants to connect their Telegram
        const startParam = text.split(' ')[1] // May contain user ID
        
        if (startParam) {
          // Connect Telegram to user account
          const supabase = await createServerClient()
          
          // Verify the user ID (in production, use a signed token)
          const { error } = await supabase
            .from('notification_settings')
            .update({
              telegram_chat_id: chatId,
              telegram_username: username,
              telegram_enabled: true
            })
            .eq('user_id', startParam)
            
          if (!error) {
            await telegramBot?.sendMessage(
              chatId,
              telegramMessages.welcome(username)
            )
          } else {
            await telegramBot?.sendMessage(
              chatId,
              '❌ Failed to connect. Please try again from the FlatApply dashboard.'
            )
          }
        } else {
          await telegramBot?.sendMessage(
            chatId,
            `Welcome! To connect your FlatApply account:\n\n1. Go to your dashboard\n2. Click on Notifications\n3. Follow the Telegram setup instructions`
          )
        }
      } else if (text === '/stop') {
        // Disable notifications
        const supabase = await createServerClient()
        
        await supabase
          .from('notification_settings')
          .update({ telegram_enabled: false })
          .eq('telegram_chat_id', chatId)
          
        await telegramBot?.sendMessage(
          chatId,
          '🔕 Notifications disabled. You can re-enable them anytime from your FlatApply dashboard.'
        )
      } else if (text === '/status') {
        // Check connection status
        const supabase = await createServerClient()
        
        const { data } = await supabase
          .from('notification_settings')
          .select('user_id, telegram_enabled')
          .eq('telegram_chat_id', chatId)
          .single()
          
        if (data) {
          await telegramBot?.sendMessage(
            chatId,
            `✅ Connected to FlatApply\n🔔 Notifications: ${data.telegram_enabled ? 'Enabled' : 'Disabled'}`
          )
        } else {
          await telegramBot?.sendMessage(
            chatId,
            '❌ Not connected to any FlatApply account'
          )
        }
      }
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Verify webhook is from Telegram (optional but recommended)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    webhook: 'telegram',
    timestamp: new Date().toISOString()
  })
}