import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService, ensureDatabaseInitialized } from '@/lib/database';
import { importedBikes } from '@/data/imported-bikes';

export async function GET(request: NextRequest) {
  try {
    // Initialize database
    await ensureDatabaseInitialized();
    
    // Check if bikes already exist
    const existingBikes = await DatabaseService.getBikes();
    
    if (existingBikes.length > 0) {
      return NextResponse.json({
        message: 'Bikes already exist in database',
        count: existingBikes.length,
        bikes: existingBikes
      });
    }
    
    // Import bikes from CSV data
    console.log('Importing bikes from CSV data...');
    await DatabaseService.bulkInsertBikes(importedBikes);
    
    // Get the imported bikes
    const bikes = await DatabaseService.getBikes();
    
    return NextResponse.json({
      message: 'Bikes imported successfully',
      count: bikes.length,
      bikes: bikes
    });
  } catch (error) {
    console.error('Error initializing bikes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize bikes', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}