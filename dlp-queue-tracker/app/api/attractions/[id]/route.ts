import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { startOfDay, endOfDay, format } from 'date-fns';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const attractionId = params.id;
  
  try {
    // Get attraction details from latest queue data
    const { data: attraction, error } = await supabase
      .from('latest_queue_data')
      .select('*')
      .eq('attraction_id', attractionId)
      .single();
    
    if (error || !attraction) {
      return NextResponse.json(
        { error: 'Attraction not found' },
        { status: 404 }
      );
    }
    
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    // Get today's data
    const { data: todayData } = await supabase
      .from('queue_data')
      .select('*')
      .eq('attraction_id', attractionId)
      .gte('timestamp', startOfToday.toISOString())
      .lte('timestamp', endOfToday.toISOString())
      .order('timestamp', { ascending: true });
    
    // Calculate statistics
    const operatingData = todayData?.filter(d => d.status === 'OPERATING' && d.wait_time !== null) || [];
    const waitTimes = operatingData.map(d => d.wait_time).filter(w => w !== null) as number[];
    
    const avgWaitTime = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;
    
    const maxWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
    const minWaitTime = waitTimes.length > 0 ? Math.min(...waitTimes) : 0;
    
    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (operatingData.length >= 2) {
      const recentData = operatingData.slice(-10);
      const olderData = operatingData.slice(-20, -10);
      
      if (recentData.length > 0 && olderData.length > 0) {
        const recentAvg = recentData.reduce((sum, d) => sum + (d.wait_time || 0), 0) / recentData.length;
        const olderAvg = olderData.reduce((sum, d) => sum + (d.wait_time || 0), 0) / olderData.length;
        
        if (recentAvg > olderAvg + 5) trend = 'up';
        else if (recentAvg < olderAvg - 5) trend = 'down';
      }
    }
    
    // Format data for chart
    const chartData = (todayData || [])
      .filter((_, index) => index % 3 === 0) // Sample every 3rd point
      .map(d => ({
        time: format(new Date(d.timestamp), 'HH:mm'),
        waitTime: d.wait_time || 0,
        status: d.status
      }));
    
    return NextResponse.json({
      id: attraction.attraction_id,
      name: attraction.attraction_name,
      parkName: attraction.park_name,
      currentWaitTime: attraction.wait_time,
      status: attraction.status || 'CLOSED',
      avgWaitTime,
      maxWaitTime,
      minWaitTime,
      trend,
      todayData: chartData,
      totalSamples: todayData?.length || 0,
      operatingSamples: operatingData.length
    });
  } catch (error) {
    console.error('Failed to fetch attraction details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attraction details' },
      { status: 500 }
    );
  }
}