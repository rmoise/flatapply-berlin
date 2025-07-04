'use client'

import { formatDistanceToNow } from 'date-fns'
import { MapPin, Euro, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
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

interface ThreadListProps {
  applications: Application[]
  selectedApplication: Application | null
  onSelectApplication: (app: Application) => void
}

export function ThreadList({ applications, selectedApplication, onSelectApplication }: ThreadListProps) {
  return (
    <div>
      {applications.map((app) => {
        const listing = app.listings
        const lastMessage = app.application_messages?.[0]
        const hasUnread = app.unread_count > 0
        
        return (
          <div
            key={app.id}
            onClick={() => onSelectApplication(app)}
            className={cn(
              "p-4 border-b border-gray-100 cursor-pointer transition-colors",
              selectedApplication?.id === app.id ? "bg-blue-50" : "hover:bg-gray-50",
              hasUnread && "bg-blue-50/50"
            )}
          >
            <div className="flex gap-3">
              {/* Listing Image */}
              {listing?.images?.[0] && (
                <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className={cn(
                    "font-medium text-sm truncate",
                    hasUnread ? "text-gray-900" : "text-gray-700"
                  )}>
                    {listing?.title || 'Unknown Listing'}
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {app.last_reply_at 
                      ? formatDistanceToNow(new Date(app.last_reply_at), { addSuffix: true })
                      : formatDistanceToNow(new Date(app.sent_at), { addSuffix: true })
                    }
                  </span>
                </div>
                
                {/* Listing Details */}
                <div className="flex items-center gap-3 text-xs text-gray-600 mb-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {listing?.district}
                  </span>
                  <span className="flex items-center gap-1">
                    <Euro className="h-3 w-3" />
                    {listing?.warm_rent || listing?.price}
                  </span>
                  <span className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    {listing?.rooms} rooms
                  </span>
                </div>
                
                {/* Last Message Preview */}
                {lastMessage && (
                  <p className={cn(
                    "text-xs truncate",
                    hasUnread ? "text-gray-900 font-medium" : "text-gray-600"
                  )}>
                    {lastMessage.is_from_user ? 'You: ' : ''}
                    {lastMessage.body_text?.replace(/<[^>]*>/g, '').substring(0, 100)}
                  </p>
                )}
                
                {/* Status */}
                <div className="flex items-center gap-2 mt-1">
                  {hasUnread && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-medium">
                      {app.unread_count}
                    </span>
                  )}
                  <span className={cn(
                    "text-xs",
                    app.status === 'replied' ? "text-green-600" : "text-gray-500"
                  )}>
                    {app.status === 'sent' && 'Sent'}
                    {app.status === 'viewed' && 'Viewed'}
                    {app.status === 'replied' && 'Replied'}
                    {app.status === 'rejected' && 'Rejected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}