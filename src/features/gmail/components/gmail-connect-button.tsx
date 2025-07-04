'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Loader2, Check, X } from 'lucide-react'
import { GmailClient } from '@/lib/gmail/client'
import { disconnectGmail } from '@/features/gmail/actions'
import { toast } from 'sonner'

interface GmailConnectButtonProps {
  isConnected: boolean
  connectedEmail?: string
}

export function GmailConnectButton({ isConnected, connectedEmail }: GmailConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const handleConnect = () => {
    const gmailClient = new GmailClient()
    const authUrl = gmailClient.getAuthUrl()
    window.location.href = authUrl
  }
  
  const handleDisconnect = async () => {
    setIsLoading(true)
    
    try {
      const result = await disconnectGmail()
      
      if (result.success) {
        toast.success('Gmail disconnected successfully')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to disconnect Gmail')
      }
    } catch (error) {
      toast.error('Failed to disconnect Gmail')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Integration
        </CardTitle>
        <CardDescription>
          Connect your Gmail account to send and track apartment applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Connected</p>
                  <p className="text-xs text-gray-600">{connectedEmail}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect'
                )}
              </Button>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>✓ Send applications from your Gmail account</p>
              <p>✓ Track replies and conversations</p>
              <p>✓ Automatic message syncing</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Button 
              onClick={handleConnect}
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              Connect Gmail Account
            </Button>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Applications sent from your personal email</p>
              <p>• Landlords see your real email address</p>
              <p>• All conversations backed up in Gmail</p>
              <p>• Full control over your data</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}