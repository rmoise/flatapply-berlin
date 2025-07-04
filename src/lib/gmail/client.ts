import { google, gmail_v1 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { Database } from '@/types/database'

type GmailCredentials = Database['public']['Tables']['gmail_credentials']['Row']

interface ParsedMessage {
  id: string
  threadId: string
  subject: string
  from: string
  to: string
  date: string
  body: string
  attachments: Array<{
    filename: string
    mimeType: string
    size: number
  }>
}

interface EmailAttachment {
  filename: string
  content: Buffer
}

export class GmailClient {
  private oauth2Client: OAuth2Client
  
  constructor(credentials?: GmailCredentials) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    
    if (credentials?.refresh_token) {
      this.oauth2Client.setCredentials({
        refresh_token: credentials.refresh_token,
        access_token: credentials.access_token,
        token_type: 'Bearer',
        expiry_date: credentials.token_expiry ? new Date(credentials.token_expiry).getTime() : undefined
      })
    }
  }
  
  /**
   * Get authorization URL for OAuth flow
   */
  getAuthUrl(state?: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state
    })
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code)
    this.oauth2Client.setCredentials(tokens)
    return tokens
  }
  
  /**
   * Get user's email address
   */
  async getUserEmail(): Promise<string> {
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client })
    const { data } = await oauth2.userinfo.get()
    if (!data.email) {
      throw new Error('Could not retrieve user email')
    }
    return data.email
  }
  
  /**
   * Send an email
   */
  async sendEmail(to: string, subject: string, body: string, attachments?: EmailAttachment[]) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
    
    // Create message
    const boundary = 'boundary_' + Date.now()
    const messageParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(body).toString('base64'),
    ]
    
    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        messageParts.push(
          `--${boundary}`,
          `Content-Type: application/octet-stream; name="${attachment.filename}"`,
          'Content-Transfer-Encoding: base64',
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          '',
          attachment.content.toString('base64')
        )
      }
    }
    
    messageParts.push(`--${boundary}--`)
    
    const message = messageParts.join('\n')
    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    })
    
    return result.data
  }
  
  /**
   * Get email thread
   */
  async getThread(threadId: string) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
    const result = await gmail.users.threads.get({
      userId: 'me',
      id: threadId
    })
    return result.data
  }
  
  /**
   * List threads
   */
  async listThreads(query?: string, maxResults = 20) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
    const result = await gmail.users.threads.list({
      userId: 'me',
      q: query,
      maxResults
    })
    return result.data
  }
  
  /**
   * Get message details
   */
  async getMessage(messageId: string) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
    const result = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    })
    return result.data
  }
  
  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[]) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
    await gmail.users.messages.batchModify({
      userId: 'me',
      requestBody: {
        ids: messageIds,
        removeLabelIds: ['UNREAD']
      }
    })
  }
  
  /**
   * Parse message content
   */
  parseMessage(message: gmail_v1.Schema$Message): ParsedMessage {
    const headers = message.payload?.headers || []
    const getHeader = (name: string) => {
      const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
      return header?.value || ''
    }
    
    const result: ParsedMessage = {
      id: message.id || '',
      threadId: message.threadId || '',
      subject: getHeader('subject'),
      from: getHeader('from'),
      to: getHeader('to'),
      date: getHeader('date'),
      body: '',
      attachments: []
    }
    
    // Extract body
    const extractBody = (parts: gmail_v1.Schema$MessagePart[]): string => {
      for (const part of parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
        if (part.parts) {
          const body = extractBody(part.parts)
          if (body) return body
        }
      }
      return ''
    }
    
    if (message.payload?.parts) {
      result.body = extractBody(message.payload.parts)
    } else if (message.payload?.body?.data) {
      result.body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
    }
    
    // Extract attachments
    const extractAttachments = (parts: gmail_v1.Schema$MessagePart[]) => {
      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          result.attachments.push({
            filename: part.filename,
            mimeType: part.mimeType || 'application/octet-stream',
            size: part.body.size || 0
          })
        }
        if (part.parts) {
          extractAttachments(part.parts)
        }
      }
    }
    
    if (message.payload?.parts) {
      extractAttachments(message.payload.parts)
    }
    
    return result
  }
  
  /**
   * Refresh access token if needed
   */
  async refreshAccessToken() {
    const tokens = await this.oauth2Client.refreshAccessToken()
    return tokens.credentials
  }
}