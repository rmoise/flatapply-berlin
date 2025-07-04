'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/utils'
import { GmailClient } from '@/lib/gmail/client'
import { Database } from '@/types/database'
import { revalidatePath } from 'next/cache'

type GmailCredentials = Database['public']['Tables']['gmail_credentials']['Row']
type ApplicationMessage = Database['public']['Tables']['application_messages']['Insert']

/**
 * Connect Gmail account
 */
export async function connectGmail(code: string) {
  const user = await getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()
  const gmailClient = new GmailClient()

  try {
    // Exchange code for tokens
    const tokens = await gmailClient.getTokens(code)
    
    // Get user email
    const email = await gmailClient.getUserEmail()
    
    // Store credentials
    const { error } = await supabase
      .from('gmail_credentials')
      .upsert({
        user_id: user.id,
        email,
        access_token: tokens.access_token || null,
        refresh_token: tokens.refresh_token || '',
        token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        scope: tokens.scope || null
      })
    
    if (error) {
      console.error('Error storing Gmail credentials:', error)
      return { success: false, error: 'Failed to store credentials' }
    }
    
    revalidatePath('/dashboard/settings')
    revalidatePath('/mailbox')
    
    return { success: true, email }
  } catch (error) {
    console.error('Error connecting Gmail:', error)
    return { success: false, error: 'Failed to connect Gmail account' }
  }
}

/**
 * Disconnect Gmail account
 */
export async function disconnectGmail() {
  const user = await getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()
  
  const { error } = await supabase
    .from('gmail_credentials')
    .delete()
    .eq('user_id', user.id)
  
  if (error) {
    return { success: false, error: 'Failed to disconnect Gmail' }
  }
  
  revalidatePath('/dashboard/settings')
  revalidatePath('/mailbox')
  
  return { success: true }
}

/**
 * Get Gmail credentials
 */
async function getGmailCredentials(userId: string): Promise<GmailCredentials | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('gmail_credentials')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

/**
 * Send application via Gmail
 */
export async function sendApplicationViaGmail(
  applicationId: string,
  to: string,
  subject: string,
  body: string,
  attachments?: Array<{ filename: string; url: string }>
) {
  const user = await getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()
  
  // Get Gmail credentials
  const credentials = await getGmailCredentials(user.id)
  if (!credentials) {
    return { success: false, error: 'Gmail not connected' }
  }
  
  const gmailClient = new GmailClient(credentials)
  
  try {
    // Convert attachment URLs to buffers
    const attachmentBuffers = await Promise.all(
      (attachments || []).map(async (att) => ({
        filename: att.filename,
        content: await fetch(att.url).then(res => res.arrayBuffer()).then(buf => Buffer.from(buf))
      }))
    )
    
    // Send email
    const message = await gmailClient.sendEmail(to, subject, body, attachmentBuffers)
    
    // Update application with Gmail IDs
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        gmail_message_id: message.id,
        gmail_thread_id: message.threadId,
        thread_subject: subject,
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_via: 'auto_email'
      })
      .eq('id', applicationId)
    
    if (updateError) {
      console.error('Error updating application:', updateError)
    }
    
    // Store the sent message
    if (message.id && message.threadId) {
      const messageData: ApplicationMessage = {
        application_id: applicationId,
        gmail_message_id: message.id,
        gmail_thread_id: message.threadId,
        from_email: credentials.email,
        to_email: to,
        subject,
        body_text: body,
        body_html: body,
        sent_at: new Date().toISOString(),
        is_from_user: true,
        has_attachments: attachmentBuffers.length > 0
      }
      
      await supabase.from('application_messages').insert(messageData)
    }
    
    revalidatePath('/dashboard/applications')
    revalidatePath('/mailbox')
    
    return { success: true, messageId: message.id, threadId: message.threadId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Sync Gmail messages for applications
 */
export async function syncGmailMessages() {
  const user = await getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()
  const credentials = await getGmailCredentials(user.id)
  
  if (!credentials) {
    return { success: false, error: 'Gmail not connected' }
  }
  
  const gmailClient = new GmailClient(credentials)
  
  try {
    // Get all applications with Gmail threads
    const { data: applications } = await supabase
      .from('applications')
      .select('id, gmail_thread_id')
      .eq('user_id', user.id)
      .not('gmail_thread_id', 'is', null)
    
    if (!applications || applications.length === 0) {
      return { success: true, synced: 0 }
    }
    
    let syncedCount = 0
    
    for (const app of applications) {
      if (!app.gmail_thread_id) continue
      
      try {
        // Get thread from Gmail
        const thread = await gmailClient.getThread(app.gmail_thread_id)
        
        if (!thread.messages) continue
        
        let unreadCount = 0
        let lastReplyAt: string | null = null
        
        // Process each message in the thread
        for (const message of thread.messages) {
          if (!message.id) continue
          
          // Check if we already have this message
          const { data: existingMessage } = await supabase
            .from('application_messages')
            .select('id')
            .eq('gmail_message_id', message.id)
            .single()
          
          if (!existingMessage) {
            // Parse and store new message
            const parsed = gmailClient.parseMessage(message)
            const isFromUser = parsed.from.includes(credentials.email)
            
            const messageData: ApplicationMessage = {
              application_id: app.id,
              gmail_message_id: parsed.id,
              gmail_thread_id: parsed.threadId,
              from_email: parsed.from,
              to_email: parsed.to,
              subject: parsed.subject,
              body_text: parsed.body,
              body_html: parsed.body,
              sent_at: new Date(parsed.date).toISOString(),
              is_from_user: isFromUser,
              is_unread: message.labelIds?.includes('UNREAD') || false,
              has_attachments: parsed.attachments.length > 0,
              attachments: parsed.attachments
            }
            
            await supabase.from('application_messages').insert(messageData)
            
            if (!isFromUser && messageData.is_unread) {
              unreadCount++
            }
            
            if (!isFromUser) {
              lastReplyAt = messageData.sent_at
            }
            
            syncedCount++
          }
        }
        
        // Update application with latest info
        if (unreadCount > 0 || lastReplyAt) {
          await supabase
            .from('applications')
            .update({
              unread_count: unreadCount,
              last_reply_at: lastReplyAt,
              status: unreadCount > 0 ? 'replied' : 'viewed'
            })
            .eq('id', app.id)
        }
      } catch (error) {
        console.error(`Error syncing thread ${app.gmail_thread_id}:`, error)
      }
    }
    
    // Update last sync time
    await supabase
      .from('gmail_credentials')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', user.id)
    
    revalidatePath('/mailbox')
    revalidatePath('/dashboard/applications')
    
    return { success: true, synced: syncedCount }
  } catch (error) {
    console.error('Error syncing Gmail messages:', error)
    return { success: false, error: 'Failed to sync messages' }
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(messageIds: string[]) {
  const user = await getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const supabase = await createClient()
  const credentials = await getGmailCredentials(user.id)
  
  if (!credentials) {
    return { success: false, error: 'Gmail not connected' }
  }
  
  const gmailClient = new GmailClient(credentials)
  
  try {
    // Mark as read in Gmail
    await gmailClient.markAsRead(messageIds)
    
    // Update local database
    await supabase
      .from('application_messages')
      .update({ is_unread: false })
      .in('gmail_message_id', messageIds)
    
    // Update unread counts
    const { data: applications } = await supabase
      .from('application_messages')
      .select('application_id')
      .in('gmail_message_id', messageIds)
    
    if (applications) {
      const applicationIds = [...new Set(applications.map(a => a.application_id))]
      
      for (const appId of applicationIds) {
        const { count } = await supabase
          .from('application_messages')
          .select('*', { count: 'exact', head: true })
          .eq('application_id', appId)
          .eq('is_unread', true)
          .eq('is_from_user', false)
        
        await supabase
          .from('applications')
          .update({ unread_count: count || 0 })
          .eq('id', appId)
      }
    }
    
    revalidatePath('/mailbox')
    
    return { success: true }
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return { success: false, error: 'Failed to mark as read' }
  }
}