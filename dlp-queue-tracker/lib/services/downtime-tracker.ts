import { supabaseAdmin } from '@/lib/supabase/server';

export class DowntimeTracker {
  static async trackDowntime(attractionId: string, parkId: string, currentStatus: string, previousStatus?: string) {
    const timestamp = new Date().toISOString();
    
    try {
      // Check if attraction is going DOWN or into REFURBISHMENT
      if ((currentStatus === 'DOWN' || currentStatus === 'REFURBISHMENT') && 
          previousStatus === 'OPERATING') {
        // Start a new downtime period
        const { error } = await supabaseAdmin
          .from('downtime_periods')
          .insert({
            attraction_id: attractionId,
            park_id: parkId,
            down_start: timestamp,
            reason: currentStatus
          });
        
        if (error) {
          console.error(`[DowntimeTracker] Error starting downtime for ${attractionId}:`, error);
        } else {
          console.log(`[DowntimeTracker] Started downtime tracking for ${attractionId} - Reason: ${currentStatus}`);
        }
      }
      
      // Check if attraction is coming back ONLINE
      else if (currentStatus === 'OPERATING' && 
               (previousStatus === 'DOWN' || previousStatus === 'REFURBISHMENT')) {
        // End the current downtime period
        const { data: activeDowntime, error: fetchError } = await supabaseAdmin
          .from('downtime_periods')
          .select('*')
          .eq('attraction_id', attractionId)
          .is('down_end', null)
          .order('down_start', { ascending: false })
          .limit(1)
          .single();
        
        if (fetchError) {
          console.error(`[DowntimeTracker] Error fetching active downtime for ${attractionId}:`, fetchError);
          return;
        }
        
        if (activeDowntime) {
          const downStart = new Date(activeDowntime.down_start);
          const downEnd = new Date(timestamp);
          const durationMinutes = Math.round((downEnd.getTime() - downStart.getTime()) / 60000);
          
          const { error: updateError } = await supabaseAdmin
            .from('downtime_periods')
            .update({
              down_end: timestamp,
              duration_minutes: durationMinutes
            })
            .eq('id', activeDowntime.id);
          
          if (updateError) {
            console.error(`[DowntimeTracker] Error ending downtime for ${attractionId}:`, updateError);
          } else {
            console.log(`[DowntimeTracker] Ended downtime for ${attractionId} - Duration: ${durationMinutes} minutes`);
            
            // Update daily downtime stats
            await this.updateDowntimeStats(attractionId, parkId, durationMinutes);
          }
        }
      }
    } catch (error) {
      console.error(`[DowntimeTracker] Error tracking downtime for ${attractionId}:`, error);
    }
  }
  
  static async updateDowntimeStats(attractionId: string, parkId: string, durationMinutes: number) {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Get existing stats for today
      const { data: existingStats, error: fetchError } = await supabaseAdmin
        .from('downtime_stats')
        .select('*')
        .eq('attraction_id', attractionId)
        .eq('date', today)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`[DowntimeTracker] Error fetching downtime stats:`, fetchError);
        return;
      }
      
      if (existingStats) {
        // Update existing stats
        const { error: updateError } = await supabaseAdmin
          .from('downtime_stats')
          .update({
            total_downtime_minutes: (existingStats.total_downtime_minutes || 0) + durationMinutes,
            downtime_count: (existingStats.downtime_count || 0) + 1,
            longest_downtime_minutes: Math.max(existingStats.longest_downtime_minutes || 0, durationMinutes),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStats.id);
        
        if (updateError) {
          console.error(`[DowntimeTracker] Error updating downtime stats:`, updateError);
        }
      } else {
        // Create new stats record
        const { error: insertError } = await supabaseAdmin
          .from('downtime_stats')
          .insert({
            attraction_id: attractionId,
            park_id: parkId,
            date: today,
            total_downtime_minutes: durationMinutes,
            downtime_count: 1,
            longest_downtime_minutes: durationMinutes,
            operating_minutes: 0 // Will be calculated at end of day
          });
        
        if (insertError) {
          console.error(`[DowntimeTracker] Error creating downtime stats:`, insertError);
        }
      }
    } catch (error) {
      console.error(`[DowntimeTracker] Error updating downtime stats:`, error);
    }
  }
  
  static async getPreviousStatus(attractionId: string): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('queue_data')
        .select('status')
        .eq('attraction_id', attractionId)
        .order('timestamp', { ascending: false })
        .limit(2);
      
      if (error || !data || data.length < 2) {
        return null;
      }
      
      return data[1].status;
    } catch (error) {
      console.error(`[DowntimeTracker] Error getting previous status:`, error);
      return null;
    }
  }
}