import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const park = searchParams.get('park') || 'all';
  const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  
  const targetDate = new Date(date);
  const startDate = startOfDay(targetDate);
  const endDate = endOfDay(targetDate);
  
  try {
    // Build park filter
    let parkFilter: string | null = null;
    if (park === 'disneyland') {
      parkFilter = 'dae968d5-630d-4719-8b06-3d107e944401';
    } else if (park === 'studios') {
      parkFilter = 'ca888437-ebb4-4d50-aed2-d227f7096968';
    }
    
    // Get queue data for the selected date
    let queueQuery = supabase
      .from('queue_data')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .eq('status', 'OPERATING')
      .not('wait_time', 'is', null);
    
    if (parkFilter) {
      queueQuery = queueQuery.eq('park_id', parkFilter);
    }
    
    const { data: queueData, error: queueError } = await queueQuery;
    
    if (queueError) {
      console.error('Error fetching queue data:', queueError);
      throw queueError;
    }
    
    // Calculate hourly averages
    const hourlyData: any[] = [];
    if (queueData && queueData.length > 0) {
      const hourlyMap = new Map<number, number[]>();
      
      queueData.forEach(item => {
        const hour = new Date(item.timestamp).getHours();
        if (!hourlyMap.has(hour)) {
          hourlyMap.set(hour, []);
        }
        if (item.wait_time !== null) {
          hourlyMap.get(hour)!.push(item.wait_time);
        }
      });
      
      hourlyMap.forEach((waitTimes, hour) => {
        const avgWait = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
        const maxWait = Math.max(...waitTimes);
        hourlyData.push({
          hour: hour.toString().padStart(2, '0'),
          avgWait: Math.round(avgWait),
          maxWait,
          attractions: new Set(queueData.filter(d => new Date(d.timestamp).getHours() === hour).map(d => d.attraction_id)).size
        });
      });
      
      hourlyData.sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    }
    
    // Get top attractions by current wait time
    let topQuery = supabase
      .from('latest_queue_data')
      .select('*')
      .eq('status', 'OPERATING')
      .not('wait_time', 'is', null)
      .order('wait_time', { ascending: false })
      .limit(10);
    
    if (parkFilter) {
      topQuery = topQuery.eq('park_id', parkFilter);
    }
    
    const { data: topAttractions, error: topError } = await topQuery;
    
    if (topError) {
      console.error('Error fetching top attractions:', topError);
    }
    
    // Get 7-day trend data
    const sevenDaysAgo = subDays(new Date(), 7);
    
    // Get daily stats if available, otherwise calculate from queue data
    let dailyTrends: any[] = [];
    
    const { data: dailyStats, error: statsError } = await supabase
      .from('daily_stats')
      .select('*')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    if (dailyStats && dailyStats.length > 0) {
      // Group by date and calculate averages
      const dailyMap = new Map<string, { avgWait: number[], maxWait: number[] }>();
      
      dailyStats.forEach(stat => {
        const dateStr = stat.date;
        if (!dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, { avgWait: [], maxWait: [] });
        }
        if (stat.avg_wait_time) dailyMap.get(dateStr)!.avgWait.push(stat.avg_wait_time);
        if (stat.max_wait_time) dailyMap.get(dateStr)!.maxWait.push(stat.max_wait_time);
      });
      
      dailyMap.forEach((values, date) => {
        dailyTrends.push({
          date: format(new Date(date), 'MM/dd'),
          avgWait: Math.round(values.avgWait.reduce((a, b) => a + b, 0) / values.avgWait.length),
          maxWait: Math.max(...values.maxWait),
          minWait: Math.min(...values.maxWait)
        });
      });
    }
    
    // Calculate current statistics
    const { data: currentData } = await supabase
      .from('latest_queue_data')
      .select('*');
    
    const operatingAttractions = currentData?.filter(s => s.status === 'OPERATING').length || 0;
    const waitTimes = currentData
      ?.filter(s => s.status === 'OPERATING' && s.wait_time !== null)
      .map(s => s.wait_time as number) || [];
    
    const avgWaitTime = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;
    
    const maxWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
    const totalAttractions = currentData?.length || 0;
    
    return NextResponse.json({
      hourlyAverage: hourlyData,
      topAttractions: topAttractions?.map(a => ({
        name: a.attraction_name,
        waitTime: a.wait_time
      })) || [],
      dailyTrends,
      currentStats: {
        avgWaitTime,
        maxWaitTime,
        totalAttractions,
        operatingAttractions
      }
    });
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}