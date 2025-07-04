import { getUser } from '@/lib/auth/utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Home,
  TrendingDown,
  MessageSquare,
  Calendar,
  Clock,
  Star,
  Check,
  Trash2
} from 'lucide-react'

type NotificationType = "new_match" | "price_drop" | "new_message" | "viewing_reminder" | "application_update" | "subscription"

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: {
    listingId?: string
    applicationId?: string
    oldPrice?: number
    newPrice?: number
    viewingDate?: string
  }
}

// Mock data - in production, fetch from database
const notifications: Notification[] = [
  {
    id: "1",
    type: "new_message",
    title: "New landlord reply",
    message: "Anna Schmidt replied to your application for the apartment in Prenzlauer Berg",
    timestamp: new Date().toISOString(),
    read: false,
    actionUrl: "/dashboard/applications/1?tab=messages",
    actionLabel: "View reply"
  },
  {
    id: "2",
    type: "new_match",
    title: "3 new apartment matches",
    message: "Found new apartments matching your preferences in Friedrichshain",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    read: false,
    actionUrl: "/",
    actionLabel: "View matches"
  },
  {
    id: "3",
    type: "price_drop",
    title: "Price dropped on saved listing",
    message: "The studio in Kreuzberg dropped from €1,000 to €950",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    read: true,
    actionUrl: "/dashboard/saved",
    actionLabel: "View listing",
    metadata: {
      oldPrice: 1000,
      newPrice: 950
    }
  },
  {
    id: "4",
    type: "viewing_reminder",
    title: "Viewing tomorrow at 5:00 PM",
    message: "Don't forget your apartment viewing at Stargarder Straße 15",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    read: true,
    actionUrl: "/dashboard/applications/1",
    actionLabel: "View details"
  },
  {
    id: "5",
    type: "application_update",
    title: "Application viewed",
    message: "Your application for the flat in Charlottenburg was viewed by the landlord",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    read: true,
    actionUrl: "/dashboard/applications/2",
    actionLabel: "Track status"
  },
  {
    id: "6",
    type: "subscription",
    title: "Upgrade for unlimited applications",
    message: "You've used 4 out of 5 free applications this month",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    read: true,
    actionUrl: "/dashboard/billing",
    actionLabel: "Upgrade plan"
  }
]

const notificationIcons = {
  new_match: Home,
  price_drop: TrendingDown,
  new_message: MessageSquare,
  viewing_reminder: Calendar,
  application_update: Clock,
  subscription: Star
}

const notificationColors = {
  new_match: "text-green-600",
  price_drop: "text-blue-600",
  new_message: "text-purple-600",
  viewing_reminder: "text-orange-600",
  application_update: "text-amber-600",
  subscription: "text-gray-600"
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays} days ago`
  return date.toLocaleDateString()
}

function getTimeGroup(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return "Today"
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return "This Week"
  return "Older"
}

function groupNotificationsByTime(notifications: Notification[]) {
  const groups: Record<string, Notification[]> = {}
  
  notifications.forEach(notification => {
    const group = getTimeGroup(notification.timestamp)
    if (!groups[group]) groups[group] = []
    groups[group].push(notification)
  })
  
  return groups
}

export default async function NotificationsPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const unreadCount = notifications.filter(n => !n.read).length
  const groupedNotifications = groupNotificationsByTime(notifications)
  const timeGroups = ["Today", "Yesterday", "This Week", "Older"]
  
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({unreadCount} unread)
                </span>
              )}
            </h1>
            {unreadCount > 0 && (
              <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Mark all as read
              </button>
            )}
          </div>
          
          {/* Filter buttons */}
          <div className="flex gap-2 mt-4">
            <button className="px-3 py-1.5 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              All
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Unread
            </button>
          </div>
        </div>
        
        {/* Notification list */}
        <div className="space-y-6">
          {timeGroups.map(group => {
            const groupNotifications = groupedNotifications[group]
            if (!groupNotifications || groupNotifications.length === 0) return null
            
            return (
              <div key={group}>
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  {group}
                </h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  {groupNotifications.map((notification, index) => {
                    const Icon = notificationIcons[notification.type]
                    const iconColor = notificationColors[notification.type]
                    
                    return (
                      <div
                        key={notification.id}
                        className={`
                          group relative px-6 py-4 hover:bg-gray-50 transition-colors
                          ${!notification.read ? 'bg-white' : 'bg-gray-50/50'}
                          ${index < groupNotifications.length - 1 ? 'border-b border-gray-100' : ''}
                        `}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`mt-0.5 ${iconColor}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-0.5">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-xs text-gray-500">
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                  {notification.actionUrl && (
                                    <>
                                      <span className="text-xs text-gray-400">•</span>
                                      <Link 
                                        href={notification.actionUrl}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                      >
                                        {notification.actionLabel || 'View'}
                                      </Link>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.read && (
                                  <button
                                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Empty state */}
        {notifications.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-gray-600">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-1">
              We'll notify you when something important happens
            </p>
          </div>
        )}
      </div>
    </div>
  )
}