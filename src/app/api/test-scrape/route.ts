import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Test scrape endpoint called');
    
    // TODO: Implement test scraping
    // The job-runner reference was from an old cron job implementation
    
    return NextResponse.json({
      success: false,
      error: 'Test scraping is currently being reimplemented'
    }, { status: 501 });
  } catch (error) {
    console.error('Test scrape error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}