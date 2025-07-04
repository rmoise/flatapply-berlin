'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, X, Loader2 } from 'lucide-react'
import { sendApplicationViaGmail } from '@/features/gmail/actions'
import { toast } from 'sonner'

interface MessageComposerProps {
  applicationId: string
  recipientEmail: string
  subject: string
  onClose: () => void
}

export function MessageComposer({ 
  applicationId, 
  recipientEmail, 
  subject, 
  onClose 
}: MessageComposerProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()
  
  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please write a message')
      return
    }
    
    setSending(true)
    
    try {
      const result = await sendApplicationViaGmail(
        applicationId,
        recipientEmail,
        subject,
        message
      )
      
      if (result.success) {
        toast.success('Message sent successfully')
        setMessage('')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to send message')
      }
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Reply to {recipientEmail}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={sending}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your reply..."
        rows={4}
        disabled={sending}
        className="resize-none"
      />
      
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={sending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          disabled={sending || !message.trim()}
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send
            </>
          )}
        </Button>
      </div>
    </div>
  )
}