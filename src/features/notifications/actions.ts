"use server"

import { createServerClient } from "@/lib/supabase/server"
import { resend, emailTemplates } from "@/lib/email/resend"
import { sendTelegramMessage, telegramMessages } from "./services/telegram"

export type NotificationType = 'new_listing' | 'application_sent' | 'landlord_reply' | 'application_viewed'

interface NotificationData {
  userId: string
  type: NotificationType
  listingId?: string
  matchId?: string
  data: Record<string, any>
}

export async function sendNotification({ userId, type, listingId, matchId, data }: NotificationData) {
  const supabase = await createServerClient()
  
  // Get user profile and notification preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()
    
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()
    
  if (!profile || !settings) {
    console.error('User profile or notification settings not found')
    return { success: false, error: 'User settings not found' }
  }
  
  // Check quiet hours
  if (settings.quiet_hours_start && settings.quiet_hours_end) {
    const now = new Date()
    const currentHour = now.getHours()
    const startHour = parseInt(settings.quiet_hours_start.split(':')[0])
    const endHour = parseInt(settings.quiet_hours_end.split(':')[0])
    
    if (startHour <= endHour) {
      if (currentHour >= startHour && currentHour < endHour) {
        return { success: false, error: 'Quiet hours active' }
      }
    } else {
      if (currentHour >= startHour || currentHour < endHour) {
        return { success: false, error: 'Quiet hours active' }
      }
    }
  }
  
  // Check daily limit
  const today = new Date().toISOString().split('T')[0]
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today)
    
  if (count && count >= (settings.max_notifications_per_day || 20)) {
    return { success: false, error: 'Daily notification limit reached' }
  }
  
  const results = []
  
  // Send email notification
  if (settings.email_enabled) {
    try {
      let emailContent
      const baseData = { userName: profile.full_name || 'there', ...data }
      
      switch (type) {
        case 'new_listing':
          emailContent = emailTemplates.newListing(baseData)
          break
        case 'application_sent':
          emailContent = emailTemplates.applicationSent(baseData)
          break
        case 'landlord_reply':
          emailContent = emailTemplates.landlordReply(baseData)
          break
        default:
          throw new Error(`Unknown notification type: ${type}`)
      }
      
      const emailResult = await resend.emails.send({
        from: 'FlatApply Berlin <notifications@flatapply.de>',
        to: profile.email,
        ...emailContent
      })
      
      // Record notification
      await supabase.from('notifications').insert({
        user_id: userId,
        listing_id: listingId,
        match_id: matchId,
        channel: 'email',
        status: emailResult.error ? 'failed' : 'sent',
        sent_at: new Date().toISOString(),
        error_message: emailResult.error?.message,
        metadata: { messageId: emailResult.data?.id }
      })
      
      results.push({ channel: 'email', success: !emailResult.error })
    } catch (error) {
      console.error('Email notification error:', error)
      results.push({ channel: 'email', success: false, error })
    }
  }
  
  // Send Telegram notification
  if (settings.telegram_enabled && settings.telegram_chat_id) {
    try {
      let message
      
      switch (type) {
        case 'new_listing':
          message = telegramMessages.newListing(data)
          break
        case 'application_sent':
          message = telegramMessages.applicationSent(data)
          break
        case 'landlord_reply':
          message = telegramMessages.landlordReply(data)
          break
        case 'application_viewed':
          message = telegramMessages.applicationViewed(data)
          break
        default:
          throw new Error(`Unknown notification type: ${type}`)
      }
      
      const success = await sendTelegramMessage(settings.telegram_chat_id, message)
      
      // Record notification
      await supabase.from('notifications').insert({
        user_id: userId,
        listing_id: listingId,
        match_id: matchId,
        channel: 'telegram',
        status: success ? 'sent' : 'failed',
        sent_at: success ? new Date().toISOString() : null,
        metadata: {}
      })
      
      results.push({ channel: 'telegram', success })
    } catch (error) {
      console.error('Telegram notification error:', error)
      results.push({ channel: 'telegram', success: false, error })
    }
  }
  
  return {
    success: results.some(r => r.success),
    results
  }
}

export async function updateNotificationSettings(settings: {
  email_enabled?: boolean
  telegram_enabled?: boolean
  telegram_username?: string
  telegram_chat_id?: string
  quiet_hours_start?: string
  quiet_hours_end?: string
  max_notifications_per_day?: number
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { error } = await supabase
    .from('notification_settings')
    .upsert({
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString()
    })
    
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}

export async function getNotificationHistory(limit = 50) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }
  
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      listings (
        title,
        district,
        price
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
    
  if (error) {
    return { error: error.message }
  }
  
  return { data }
}

export async function markNotificationClicked(notificationId: string) {
  const supabase = await createServerClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ 
      clicked_at: new Date().toISOString(),
      status: 'clicked'
    })
    .eq('id', notificationId)
    
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}