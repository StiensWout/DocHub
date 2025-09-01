import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { startOfDay, endOfDay, format } from 'date-fns';

export async function GET() {
  try {
    // Get all attractions with their latest queue data
    const { data: attractions, error } = await supabase
      .from('latest_queue_data')
      .select('*')
      .order('park_name', { ascending: true })
      .order('attraction_name', { ascending: true });
    
    if (error) {
      console.error('Error fetching attractions:', error);
      throw error;
    }
    
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    // Transform data for the frontend
    const attractionsWithData = await Promise.all(
      (attractions || []).map(async (attraction) => {
        // Get today's data for trend and average
        const { data: todayData } = await supabase
          .from('queue_data')
          .select('*')
          .eq('attraction_id', attraction.attraction_id)
          .gte('timestamp', startOfToday.toISOString())
          .lte('timestamp', endOfToday.toISOString())
          .eq('status', 'OPERATING')
          .not('wait_time', 'is', null)
          .order('timestamp', { ascending: true });
        
        // Calculate average wait time
        const waitTimes = todayData?.map(d => d.wait_time).filter(w => w !== null) || [];
        const avgWaitTime = waitTimes.length > 0
          ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
          : 0;
        
        // Determine trend
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (todayData && todayData.length >= 2) {
          const recentData = todayData.slice(-10);
          const olderData = todayData.slice(-20, -10);
          
          if (recentData.length > 0 && olderData.length > 0) {
            const recentAvg = recentData.reduce((sum, d) => sum + (d.wait_time || 0), 0) / recentData.length;
            const olderAvg = olderData.reduce((sum, d) => sum + (d.wait_time || 0), 0) / olderData.length;
            
            if (recentAvg > olderAvg + 5) trend = 'up';
            else if (recentAvg < olderAvg - 5) trend = 'down';
          }
        }
        
        // Format today's data for chart
        const chartData = (todayData || [])
          .filter((_, index) => index % 5 === 0) // Sample every 5th point
          .map(d => ({
            time: format(new Date(d.timestamp), 'HH:mm'),
            waitTime: d.wait_time || 0
          }));
        
        return {
          id: attraction.attraction_id,
          name: attraction.attraction_name,
          parkName: attraction.park_name,
          currentWaitTime: attraction.wait_time,
          status: attraction.status || 'CLOSED',
          avgWaitTime,
          trend,
          todayData: chartData
        };
      })
    );
    
    return NextResponse.json(attractionsWithData);
  } catch (error) {
    console.error('Failed to fetch attractions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attractions' },
      { status: 500 }
    );
  }
}