import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Get the latest queue data from Supabase using the view
    const { data: latestData, error } = await supabase
      .from('latest_queue_data')
      .select('*')
      .order('park_name', { ascending: true })
      .order('attraction_name', { ascending: true });
    
    if (error) {
      console.error('Error fetching from Supabase:', error);
      throw error;
    }
    
    // If no data, trigger a sync and try again
    if (!latestData || latestData.length === 0) {
      console.log('No data in database, triggering sync...');
      
      // Trigger sync
      try {
        const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'}/api/sync`, {
          method: 'GET',
        });
        
        if (syncResponse.ok) {
          // Wait a moment for data to be inserted
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try fetching again
          const { data: retryData } = await supabase
            .from('latest_queue_data')
            .select('*');
          
          if (retryData && retryData.length > 0) {
            latestData.push(...retryData);
          }
        }
      } catch (syncError) {
        console.error('Error triggering sync:', syncError);
      }
    }
    
    // Transform data to match our frontend format
    const disneylandData = latestData
      ?.filter(item => item.park_id === 'dae968d5-630d-4719-8b06-3d107e944401')
      .map(item => ({
        id: item.attraction_id,
        name: item.attraction_name,
        waitTime: item.wait_time,
        status: item.status,
        lastUpdated: item.timestamp
      })) || [];
    
    const studiosData = latestData
      ?.filter(item => item.park_id === 'ca888437-ebb4-4d50-aed2-d227f7096968')
      .map(item => ({
        id: item.attraction_id,
        name: item.attraction_name,
        waitTime: item.wait_time,
        status: item.status,
        lastUpdated: item.timestamp
      })) || [];
    
    // Get the most recent timestamp
    const mostRecentTimestamp = latestData && latestData.length > 0
      ? Math.max(...latestData.map(item => new Date(item.timestamp).getTime()))
      : Date.now();
    
    return NextResponse.json({
      disneyland: disneylandData,
      studios: studiosData,
      timestamp: new Date(mostRecentTimestamp).toISOString(),
      dataSource: 'supabase'
    });
  } catch (error) {
    console.error('Failed to fetch queue times:', error);
    
    // Return mock data as absolute fallback
    const { mockLiveData } = await import('@/lib/api/mockData');
    return NextResponse.json({
      ...mockLiveData,
      dataSource: 'mock',
      error: 'Using mock data due to database error'
    });
  }
}