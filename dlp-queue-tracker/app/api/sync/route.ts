import { NextRequest, NextResponse } from 'next/server';
import { DataSyncService } from '@/lib/services/data-sync';

// This endpoint will be called by a cron job every 5 minutes
export async function GET(request: NextRequest) {
  // Optional: Add authentication to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    console.log('[API] Starting data sync...');
    const result = await DataSyncService.syncQueueData();
    
    // Calculate daily stats once per day (at midnight or first sync of the day)
    const hour = new Date().getHours();
    if (hour === 0 || hour === 23) {
      await DataSyncService.calculateDailyStats();
    }
    
    return NextResponse.json({
      success: result.success,
      ...result
    });
  } catch (error) {
    console.error('[API] Sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}