import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // Revalidate the cases page to refresh ISR cache
    revalidatePath('/cases');
    
    console.log('✅ Cases page revalidated successfully');
    
    return NextResponse.json(
      { 
        revalidated: true, 
        path: '/cases',
        timestamp: new Date().toISOString()
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error('❌ Error revalidating cases page:', error);
    return NextResponse.json(
      { 
        error: 'Failed to revalidate', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Cases revalidation endpoint - use POST to trigger revalidation',
      endpoint: '/api/revalidate/cases',
      method: 'POST'
    },
    { status: 200 }
  );
}