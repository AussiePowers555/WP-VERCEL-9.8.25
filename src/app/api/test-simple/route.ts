import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 Simple test endpoint called');
  return NextResponse.json({ 
    success: true, 
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Simple POST test endpoint called');
    const body = await request.json();
    console.log('🧪 Request body:', body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Simple POST test endpoint working',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🧪 Simple POST test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}