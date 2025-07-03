"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell,
  BellOff,
  Home,
  Euro,
  MessageSquare,
  Calendar,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  Trash2,
  ExternalLink,
  MapPin,
  Star
} from "lucide-react"
import Link from "next/link"

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

const notifications: Notification[] = [
  {
    id: "1",
    type: "new_message",
    title: "New landlord reply",
    message: "Anna Schmidt replied to your application for the apartment in Prenzlauer Berg",
    timestamp: "2024-01-13T15:20:00",
    read: false,
    actionUrl: "/dashboard/applications/1?tab=messages",
    actionLabel: "View Reply",
    metadata: {
      applicationId: "1"
    }
  },
  {
    id: "2",
    type: "new_match",
    title: "New apartment match!",
    message: "Found 3 new apartments matching your preferences in Friedrichshain",
    timestamp: "2024-01-13T10:00:00",
    read: false,
    actionUrl: "/dashboard/listings?filter=new",
    actionLabel: "View Matches"
  },
  {
    id: "3",
    type: "price_drop",
    title: "Price dropped on saved listing",
    message: "The studio in Kreuzberg dropped from €1000 to €950",
    timestamp: "2024-01-12T16:30:00",
    read: true,
    actionUrl: "/dashboard/saved",
    actionLabel: "View Listing",
    metadata: {
      listingId: "listing-5",
      oldPrice: 1000,
      newPrice: 950
    }
  },
  {
    id: "4",
    type: "viewing_reminder",
    title: "Viewing tomorrow at 5:00 PM",
    message: "Don't forget your apartment viewing at Stargarder Straße 15",
    timestamp: "2024-01-11T09:00:00",
    read: true,
    actionUrl: "/dashboard/applications/1",
    actionLabel: "View Details",
    metadata: {
      viewingDate: "2024-01-12T17:00:00"
    }
  },
  {
    id: "5",
    type: "application_update",
    title: "Application viewed",
    message: "Your application for the flat in Charlottenburg was viewed by the landlord",
    timestamp: "2024-01-10T14:15:00",
    read: true,
    actionUrl: "/dashboard/applications/2",
    actionLabel: "Track Application",
    metadata: {
      applicationId: "2"
    }
  },
  {
    id: "6",
    type: "subscription",
    title: "Upgrade for unlimited applications",
    message: "You've used 4 out of 5 free applications this month",
    timestamp: "2024-01-09T10:00:00",
    read: true,
    actionUrl: "/dashboard/billing",
    actionLabel: "Upgrade Plan"
  }
]

const notificationTypeConfig = {
  new_match: { icon: Home, color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  price_drop: { icon: TrendingDown, color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  new_message: { icon: MessageSquare, color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  viewing_reminder: { icon: Calendar, color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  application_update: { icon: Clock, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
  subscription: { icon: Star, color: "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300" }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "new_message",
      title: "New landlord reply",
      message: "Anna Schmidt replied to your application for the apartment in Prenzlauer Berg",
      timestamp: "2024-01-13T15:20:00",
      read: false,
      actionUrl: "/dashboard/applications/1?tab=messages",
      actionLabel: "View Reply",
      metadata: {
        applicationId: "1"
      }
    },
    {
      id: "2",
      type: "new_match",
      title: "New apartment match!",
      message: "Found 3 new apartments matching your preferences in Friedrichshain",
      timestamp: "2024-01-13T10:00:00",
      read: false,
      actionUrl: "/dashboard/listings?filter=new",
      actionLabel: "View Matches"
    },
    {
      id: "3",
      type: "price_drop",
      title: "Price dropped on saved listing",
      message: "The studio in Kreuzberg dropped from €1000 to €950",
      timestamp: "2024-01-12T16:30:00",
      read: true,
      actionUrl: "/dashboard/saved",
      actionLabel: "View Listing",
      metadata: {
        listingId: "listing-5",
        oldPrice: 1000,
        newPrice: 950
      }
    },
    {
      id: "4",
      type: "viewing_reminder",
      title: "Viewing tomorrow at 5:00 PM",
      message: "Don't forget your apartment viewing at Stargarder Straße 15",
      timestamp: "2024-01-11T09:00:00",
      read: true,
      actionUrl: "/dashboard/applications/1",
      actionLabel: "View Details",
      metadata: {
        viewingDate: "2024-01-12T17:00:00"
      }
    },
    {
      id: "5",
      type: "application_update",
      title: "Application viewed",
      message: "Your application for the flat in Charlottenburg was viewed by the landlord",
      timestamp: "2024-01-10T14:15:00",
      read: true,
      actionUrl: "/dashboard/applications/2",
      actionLabel: "Track Application",
      metadata: {
        applicationId: "2"
      }
    },
    {
      id: "6",
      type: "subscription",
      title: "Upgrade for unlimited applications",
      message: "You've used 4 out of 5 free applications this month",
      timestamp: "2024-01-09T10:00:00",
      read: true,
      actionUrl: "/dashboard/billing",
      actionLabel: "Upgrade Plan"
    }
  ])

  const [activeTab, setActiveTab] = useState("all")

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !n.read
    return n.type === activeTab
  })

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated on your apartment search
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="default">{unreadCount} unread</Badge>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/preferences?tab=notifications">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      {unreadCount > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
              </p>
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="new_match">Matches</TabsTrigger>
          <TabsTrigger value="new_message">Messages</TabsTrigger>
          <TabsTrigger value="price_drop" className="hidden lg:block">Prices</TabsTrigger>
          <TabsTrigger value="viewing_reminder" className="hidden lg:block">Viewings</TabsTrigger>
          <TabsTrigger value="application_update" className="hidden lg:block">Updates</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BellOff className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications to show</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {filteredNotifications.map((notification) => {
                const typeConfig = notificationTypeConfig[notification.type]
                const Icon = typeConfig.icon

                return (
                  <Card 
                    key={notification.id} 
                    className={!notification.read ? "border-primary/50" : ""}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className={`p-2 rounded-lg ${typeConfig.color} flex-shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-medium">
                              {notification.title}
                              {!notification.read && (
                                <Badge variant="default" className="ml-2 text-xs">
                                  New
                                </Badge>
                              )}
                            </h3>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {notification.message}
                          </p>

                          {/* Metadata */}
                          {notification.metadata && (
                            <div className="mb-3">
                              {notification.metadata.oldPrice && notification.metadata.newPrice && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="line-through text-muted-foreground">
                                    €{notification.metadata.oldPrice}
                                  </span>
                                  <span className="font-semibold text-green-600">
                                    €{notification.metadata.newPrice}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    -{Math.round((1 - notification.metadata.newPrice / notification.metadata.oldPrice) * 100)}%
                                  </Badge>
                                </div>
                              )}
                              {notification.metadata.viewingDate && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{new Date(notification.metadata.viewingDate).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            {notification.actionUrl && (
                              <Button size="sm" variant="outline" asChild>
                                <Link href={notification.actionUrl}>
                                  {notification.actionLabel || "View"}
                                  <ExternalLink className="ml-2 h-3 w-3" />
                                </Link>
                              </Button>
                            )}
                            {!notification.read && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle className="mr-2 h-3 w-3" />
                                Mark as read
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {filteredNotifications.length > 0 && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={clearAll}>
                    Clear all notifications
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Notification Settings Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Settings</CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifs">Email notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive important updates via email
              </p>
            </div>
            <Switch id="email-notifs" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifs">Push notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get instant alerts on your device
              </p>
            </div>
            <Switch id="push-notifs" defaultChecked />
          </div>

          <div className="pt-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/preferences?tab=notifications">
                View all notification settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}