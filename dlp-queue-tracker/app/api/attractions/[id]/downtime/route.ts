import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Get current downtime if any
    const { data: currentDowntime, error: currentError } = await supabase
      .from('downtime_periods')
      .select('*')
      .eq('attraction_id', id)
      .is('down_end', null)
      .single();
    
    // Get recent downtime periods (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentDowntimes, error: recentError } = await supabase
      .from('downtime_periods')
      .select('*')
      .eq('attraction_id', id)
      .gte('down_start', sevenDaysAgo.toISOString())
      .order('down_start', { ascending: false });
    
    // Get downtime statistics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: downtimeStats, error: statsError } = await supabase
      .from('downtime_stats')
      .select('*')
      .eq('attraction_id', id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });
    
    if (currentError && currentError.code !== 'PGRST116') {
      throw currentError;
    }
    if (recentError) throw recentError;
    if (statsError) throw statsError;
    
    // Calculate aggregate statistics
    const totalDowntimeMinutes = downtimeStats?.reduce((sum, stat) => sum + (stat.total_downtime_minutes || 0), 0) || 0;
    const totalDowntimeCount = downtimeStats?.reduce((sum, stat) => sum + (stat.downtime_count || 0), 0) || 0;
    const avgDowntimePerIncident = totalDowntimeCount > 0 ? Math.round(totalDowntimeMinutes / totalDowntimeCount) : 0;
    
    // Calculate reliability percentage (assuming 14 hours of operation per day)
    const operatingMinutesPerDay = 14 * 60; // 14 hours
    const totalPossibleMinutes = downtimeStats?.length ? downtimeStats.length * operatingMinutesPerDay : operatingMinutesPerDay;
    const reliabilityPercentage = totalPossibleMinutes > 0 
      ? Math.round(((totalPossibleMinutes - totalDowntimeMinutes) / totalPossibleMinutes) * 100)
      : 100;
    
    return NextResponse.json({
      currentDowntime,
      recentDowntimes: recentDowntimes || [],
      stats: {
        totalDowntimeMinutes,
        totalDowntimeCount,
        avgDowntimePerIncident,
        reliabilityPercentage,
        dailyStats: downtimeStats || []
      }
    });
  } catch (error) {
    console.error('Failed to fetch downtime data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch downtime data' },
      { status: 500 }
    );
  }
}