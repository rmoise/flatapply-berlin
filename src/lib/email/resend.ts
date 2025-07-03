import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set. Email notifications will not work.')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Email templates
export const emailTemplates = {
  newListing: (data: {
    userName: string
    listingTitle: string
    listingUrl: string
    district: string
    price: number
    rooms: number
    size: number
  }) => ({
    subject: `New apartment match: ${data.listingTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hi ${data.userName},</h2>
        
        <p>We found a new apartment that matches your preferences!</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${data.listingTitle}</h3>
          <p style="color: #666;">
            📍 ${data.district}<br>
            💶 €${data.price}/month<br>
            🏠 ${data.rooms} rooms, ${data.size}m²
          </p>
          <a href="${data.listingUrl}" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            View Listing
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Don't wait! Popular apartments in Berlin get rented quickly.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          You're receiving this because you have email notifications enabled. 
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/notifications">Manage preferences</a>
        </p>
      </div>
    `
  }),

  applicationSent: (data: {
    userName: string
    listingTitle: string
    applicationUrl: string
  }) => ({
    subject: `Application sent: ${data.listingTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Application Sent Successfully!</h2>
        
        <p>Hi ${data.userName},</p>
        
        <p>Your application for <strong>${data.listingTitle}</strong> has been sent.</p>
        
        <p>We'll notify you when the landlord views or responds to your application.</p>
        
        <a href="${data.applicationUrl}" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
          View Application
        </a>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/notifications">Manage notification preferences</a>
        </p>
      </div>
    `
  }),

  landlordReply: (data: {
    userName: string
    listingTitle: string
    landlordName: string
    messagePreview: string
    applicationUrl: string
  }) => ({
    subject: `🎉 Reply received: ${data.listingTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">You got a reply!</h2>
        
        <p>Hi ${data.userName},</p>
        
        <p>${data.landlordName} has replied to your application for <strong>${data.listingTitle}</strong>.</p>
        
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p style="margin: 0; color: #666;">
            "${data.messagePreview}..."
          </p>
        </div>
        
        <a href="${data.applicationUrl}" style="display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
          Read Full Reply & Respond
        </a>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          <strong>Tip:</strong> Respond quickly to show your interest!
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/notifications">Manage notification preferences</a>
        </p>
      </div>
    `
  })
}