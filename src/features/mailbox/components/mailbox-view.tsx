'use client'

import { useState } from 'react'
import { Database } from '@/types/database'
import { ThreadList } from './thread-list'
import { ThreadView } from './thread-view'
import { EmptyMailbox } from './empty-mailbox'

type Application = Database['public']['Tables']['applications']['Row'] & {
  listings: {
    id: string
    title: string
    address: string
    district: string
    price: number
    warm_rent: number
    size_sqm: number
    rooms: number
    images: string[]
    platform: string
  } | null
  application_messages: Array<{
    id: string
    gmail_message_id: string
    from_email: string
    from_name: string | null
    to_email: string
    subject: string | null
    body_text: string | null
    sent_at: string
    is_unread: boolean
    is_from_user: boolean
    has_attachments: boolean
  }>
}

interface MailboxViewProps {
  applications: Application[]
  userEmail: string
}

export function MailboxView({ applications, userEmail }: MailboxViewProps) {
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(
    applications.length > 0 ? applications[0] : null
  )
  
  if (applications.length === 0) {
    return <EmptyMailbox />
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-16rem)]">
        {/* Thread List */}
        <div className="lg:col-span-1 border-r border-gray-200 overflow-y-auto">
          <ThreadList
            applications={applications}
            selectedApplication={selectedApplication}
            onSelectApplication={setSelectedApplication}
          />
        </div>
        
        {/* Thread View */}
        <div className="lg:col-span-2 overflow-y-auto">
          {selectedApplication ? (
            <ThreadView
              application={selectedApplication}
              userEmail={userEmail}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a conversation to view
            </div>
          )}
        </div>
      </div>
    </div>
  )
}