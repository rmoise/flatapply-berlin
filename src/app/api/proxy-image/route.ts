import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');
  
  if (!imageUrl) {
    return new NextResponse('Missing image URL', { status: 400 });
  }
  
  try {
    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(imageUrl);
    
    // Fetch the image with proper headers
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.wg-gesucht.de/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      // If direct fetch fails, return a placeholder
      return NextResponse.redirect('/placeholder-apartment.jpg');
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.redirect('/placeholder-apartment.jpg');
  }
}