"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell, 
  Mail, 
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateNotificationSettings } from "../actions"

interface NotificationSettingsProps {
  initialSettings?: {
    email_enabled: boolean
    telegram_enabled: boolean
    telegram_username?: string
    telegram_chat_id?: string
    quiet_hours_start?: string
    quiet_hours_end?: string
    max_notifications_per_day: number
  }
  userId: string
}

export function NotificationSettings({ initialSettings, userId }: NotificationSettingsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    email_enabled: true,
    telegram_enabled: false,
    telegram_username: "",
    telegram_chat_id: "",
    quiet_hours_start: "",
    quiet_hours_end: "",
    max_notifications_per_day: 20,
    ...initialSettings
  })

  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "FlatApplyBot"
  const telegramConnectUrl = `https://t.me/${telegramBotUsername}?start=${userId}`

  const handleSave = async () => {
    setLoading(true)
    try {
      const result = await updateNotificationSettings(settings)
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Settings saved",
          description: "Your notification preferences have been updated"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyTelegramLink = () => {
    navigator.clipboard.writeText(telegramConnectUrl)
    toast({
      title: "Copied!",
      description: "Telegram link copied to clipboard"
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email-enabled">Email notifications</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive notifications to your registered email
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={settings.email_enabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, email_enabled: checked }))
              }
            />
          </div>

          {/* Telegram Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="telegram-enabled">Telegram notifications</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get instant notifications via Telegram
                </p>
              </div>
              <Switch
                id="telegram-enabled"
                checked={settings.telegram_enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, telegram_enabled: checked }))
                }
                disabled={!settings.telegram_chat_id}
              />
            </div>

            {/* Telegram Setup */}
            {!settings.telegram_chat_id ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <p>To enable Telegram notifications:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Click the button below or copy the link</li>
                      <li>Open Telegram and start a chat with our bot</li>
                      <li>Send /start to connect your account</li>
                    </ol>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" asChild>
                        <a href={telegramConnectUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Connect Telegram
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" onClick={copyTelegramLink}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Telegram connected</p>
                      <p className="text-sm">@{settings.telegram_username || "User"}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSettings(prev => ({ 
                        ...prev, 
                        telegram_chat_id: "",
                        telegram_username: "",
                        telegram_enabled: false 
                      }))}
                    >
                      Disconnect
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Set times when you don't want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quiet-start">Start time</Label>
              <Input
                id="quiet-start"
                type="time"
                value={settings.quiet_hours_start}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, quiet_hours_start: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-end">End time</Label>
              <Input
                id="quiet-end"
                type="time"
                value={settings.quiet_hours_end}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, quiet_hours_end: e.target.value }))
                }
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Leave empty to receive notifications 24/7
          </p>
        </CardContent>
      </Card>

      {/* Notification Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Limits</CardTitle>
          <CardDescription>
            Control how many notifications you receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="max-notifications">Maximum notifications per day</Label>
            <div className="flex items-center gap-4">
              <Input
                id="max-notifications"
                type="number"
                min="1"
                max="100"
                value={settings.max_notifications_per_day}
                onChange={(e) => 
                  setSettings(prev => ({ 
                    ...prev, 
                    max_notifications_per_day: parseInt(e.target.value) || 20 
                  }))
                }
                className="w-24"
              />
              <p className="text-sm text-muted-foreground">
                Recommended: 20-30 per day
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  )
}