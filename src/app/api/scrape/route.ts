import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Check for API key or admin authorization
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SCRAPING_API_KEY;
    
    if (!authHeader || !apiKey || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { platforms, filters, notify } = body;

    console.log('🔧 Manual scraping job triggered via API');

    // TODO: Implement scraping job
    // The job-runner reference was from an old cron job implementation
    
    return NextResponse.json({
      error: 'Scraping API is currently being reimplemented',
      success: false
    }, { status: 501 });

  } catch (error) {
    console.error('❌ Scraping API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check for API key
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SCRAPING_API_KEY;
    
    if (!authHeader || !apiKey || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'status') {
      // Return recent scraping sessions
      const supabase = await createClient();
      
      const { data: sessions, error } = await supabase
        .from('scraper_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching scraper logs:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      return NextResponse.json({ sessions });
    }

    if (action === 'platforms') {
      // Return supported platforms
      const platforms = ['wg_gesucht', 'immoscout24'];
      return NextResponse.json({ platforms });
    }

    // Default: return not implemented
    return NextResponse.json({
      error: 'Scraping API is currently being reimplemented',
      success: false
    }, { status: 501 });

  } catch (error) {
    console.error('❌ Scraping API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function logScrapingSession(result: any) {
  try {
    const supabase = await createClient();
    
    for (const platformResult of result.platformResults) {
      await supabase
        .from('scraper_logs')
        .insert({
          platform: platformResult.platform,
          started_at: new Date(Date.now() - platformResult.processingTime).toISOString(),
          completed_at: new Date().toISOString(),
          listings_found: platformResult.found,
          new_listings: platformResult.saved,
          errors: platformResult.errors,
          status: platformResult.errors.length > 0 ? 'completed' : 'failed'
        });
    }
  } catch (error) {
    console.error('Error logging scraping session:', error);
  }
}