import { getUser } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MailboxView } from '@/features/mailbox/components/mailbox-view'
import { syncGmailMessages } from '@/features/gmail/actions'

export default async function MailboxPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const supabase = await createClient()
  
  // Check if Gmail is connected
  const { data: gmailCredentials } = await supabase
    .from('gmail_credentials')
    .select('*')
    .eq('user_id', user.id)
    .single()
  
  if (!gmailCredentials) {
    redirect('/dashboard/settings?connect_gmail=true')
  }
  
  // Sync messages in the background
  syncGmailMessages()
  
  // Get applications with messages
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      listings (
        id,
        title,
        address,
        district,
        price,
        warm_rent,
        size_sqm,
        rooms,
        images,
        platform
      ),
      application_messages (
        id,
        gmail_message_id,
        from_email,
        from_name,
        to_email,
        subject,
        body_text,
        sent_at,
        is_unread,
        is_from_user,
        has_attachments
      )
    `)
    .eq('user_id', user.id)
    .not('gmail_thread_id', 'is', null)
    .order('last_reply_at', { ascending: false, nullsFirst: false })
  
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Application Mailbox
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage all your apartment application conversations in one place
          </p>
        </div>
        
        {/* Mailbox */}
        <MailboxView 
          applications={applications || []} 
          userEmail={gmailCredentials.email}
        />
      </div>
    </div>
  )
}