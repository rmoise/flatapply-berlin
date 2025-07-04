'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  MapPin, 
  Euro, 
  Home, 
  Calendar,
  ExternalLink,
  Reply,
  Paperclip,
  Check,
  X
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageComposer } from './message-composer'
import { markMessagesAsRead } from '@/features/gmail/actions'
import { Database } from '@/types/database'

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

interface ThreadViewProps {
  application: Application
  userEmail: string
}

export function ThreadView({ application, userEmail }: ThreadViewProps) {
  const [showComposer, setShowComposer] = useState(false)
  const listing = application.listings
  const messages = application.application_messages || []
  
  // Sort messages by date
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
  )
  
  // Mark unread messages as read
  const unreadMessageIds = messages
    .filter(m => m.is_unread && !m.is_from_user)
    .map(m => m.gmail_message_id)
  
  if (unreadMessageIds.length > 0) {
    markMessagesAsRead(unreadMessageIds)
  }
  
  if (!listing) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Listing information not available</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Listing Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex gap-4">
          {listing.images?.[0] && (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={listing.images[0]}
                alt={listing.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {listing.title}
            </h2>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {listing.address}
              </span>
              <span className="flex items-center gap-1">
                <Euro className="h-4 w-4" />
                {listing.warm_rent}/month warm
              </span>
              <span className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                {listing.rooms} rooms, {listing.size_sqm}m²
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <Link href={`/dashboard/listings/${listing.id}`}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Listing
                </Button>
              </Link>
              
              <Badge variant={
                application.status === 'replied' ? 'default' :
                application.status === 'rejected' ? 'destructive' :
                'secondary'
              }>
                {application.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {sortedMessages.map((message) => {
          const isFromUser = message.is_from_user
          
          return (
            <div
              key={message.id}
              className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isFromUser ? 'text-right' : 'text-left'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {isFromUser ? 'You' : message.from_name || message.from_email}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(message.sent_at), 'MMM d, h:mm a')}
                  </span>
                </div>
                
                <div className={`rounded-lg p-4 ${
                  isFromUser 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div 
                    className="text-sm"
                    dangerouslySetInnerHTML={{ 
                      __html: message.body_text || '' 
                    }}
                  />
                  
                  {message.has_attachments && (
                    <div className={`flex items-center gap-1 mt-2 text-xs ${
                      isFromUser ? 'text-blue-100' : 'text-gray-600'
                    }`}>
                      <Paperclip className="h-3 w-3" />
                      Attachments
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Actions */}
      <div className="border-t border-gray-200 p-4">
        {showComposer ? (
          <MessageComposer
            applicationId={application.id}
            recipientEmail={messages.find(m => !m.is_from_user)?.from_email || ''}
            subject={`Re: ${application.thread_subject || 'Your apartment application'}`}
            onClose={() => setShowComposer(false)}
          />
        ) : (
          <Button 
            onClick={() => setShowComposer(true)}
            className="w-full"
          >
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
        )}
      </div>
    </div>
  )
}