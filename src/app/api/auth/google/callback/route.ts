import { NextRequest, NextResponse } from 'next/server'
import { connectGmail } from '@/features/gmail/actions'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings?gmail_error=access_denied', request.url)
    )
  }
  
  // Validate code
  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?gmail_error=no_code', request.url)
    )
  }
  
  try {
    // Connect Gmail account
    const result = await connectGmail(code)
    
    if (result.success) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?gmail_connected=true', request.url)
      )
    } else {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?gmail_error=${encodeURIComponent(result.error || 'unknown')}`, request.url)
      )
    }
  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings?gmail_error=callback_failed', request.url)
    )
  }
}