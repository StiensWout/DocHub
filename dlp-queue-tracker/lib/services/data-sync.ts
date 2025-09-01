import { supabaseAdmin } from '@/lib/supabase/server';
import { themeparksAPI } from '@/lib/api/themeparks';
import { DowntimeTracker } from './downtime-tracker';

export class DataSyncService {
  static async syncQueueData() {
    console.log('[DataSync] Starting queue data sync...');
    
    try {
      // Fetch live data from ThemeParks API
      const liveData = await themeparksAPI.getAllDisneylandParisLiveData();
      
      if (!liveData) {
        console.error('[DataSync] No data received from API');
        return { success: false, error: 'No data received' };
      }
      
      const timestamp = new Date().toISOString();
      let recordsInserted = 0;
      
      // Process Disneyland Park attractions
      for (const attraction of liveData.disneyland) {
        try {
          // First, ensure the attraction exists in the database
          const { error: upsertError } = await supabaseAdmin
            .from('attractions')
            .upsert({
              id: attraction.id,
              name: attraction.name,
              park_id: 'dae968d5-630d-4719-8b06-3d107e944401',
              updated_at: timestamp
            }, {
              onConflict: 'id'
            });
          
          if (upsertError) {
            console.error(`[DataSync] Error upserting attraction ${attraction.name}:`, upsertError);
            continue;
          }
          
          // Get previous status for downtime tracking
          const previousStatus = await DowntimeTracker.getPreviousStatus(attraction.id);
          
          // Insert queue data
          const { error: insertError } = await supabaseAdmin
            .from('queue_data')
            .insert({
              attraction_id: attraction.id,
              park_id: 'dae968d5-630d-4719-8b06-3d107e944401',
              wait_time: attraction.waitTime,
              status: attraction.status,
              timestamp: timestamp
            });
          
          if (insertError) {
            console.error(`[DataSync] Error inserting queue data for ${attraction.name}:`, insertError);
          } else {
            recordsInserted++;
            
            // Track downtime if status changed
            if (previousStatus && previousStatus !== attraction.status) {
              await DowntimeTracker.trackDowntime(
                attraction.id,
                'dae968d5-630d-4719-8b06-3d107e944401',
                attraction.status,
                previousStatus
              );
            }
          }
        } catch (error) {
          console.error(`[DataSync] Error processing attraction ${attraction.name}:`, error);
        }
      }
      
      // Process Walt Disney Studios Park attractions
      for (const attraction of liveData.studios) {
        try {
          // First, ensure the attraction exists in the database
          const { error: upsertError } = await supabaseAdmin
            .from('attractions')
            .upsert({
              id: attraction.id,
              name: attraction.name,
              park_id: 'ca888437-ebb4-4d50-aed2-d227f7096968',
              updated_at: timestamp
            }, {
              onConflict: 'id'
            });
          
          if (upsertError) {
            console.error(`[DataSync] Error upserting attraction ${attraction.name}:`, upsertError);
            continue;
          }
          
          // Get previous status for downtime tracking
          const previousStatus = await DowntimeTracker.getPreviousStatus(attraction.id);
          
          // Insert queue data
          const { error: insertError } = await supabaseAdmin
            .from('queue_data')
            .insert({
              attraction_id: attraction.id,
              park_id: 'ca888437-ebb4-4d50-aed2-d227f7096968',
              wait_time: attraction.waitTime,
              status: attraction.status,
              timestamp: timestamp
            });
          
          if (insertError) {
            console.error(`[DataSync] Error inserting queue data for ${attraction.name}:`, insertError);
          } else {
            recordsInserted++;
            
            // Track downtime if status changed
            if (previousStatus && previousStatus !== attraction.status) {
              await DowntimeTracker.trackDowntime(
                attraction.id,
                'ca888437-ebb4-4d50-aed2-d227f7096968',
                attraction.status,
                previousStatus
              );
            }
          }
        } catch (error) {
          console.error(`[DataSync] Error processing attraction ${attraction.name}:`, error);
        }
      }
      
      console.log(`[DataSync] Sync completed. Inserted ${recordsInserted} records at ${timestamp}`);
      
      // Clean up old data (keep only last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { error: cleanupError } = await supabaseAdmin
        .from('queue_data')
        .delete()
        .lt('timestamp', thirtyDaysAgo.toISOString());
      
      if (cleanupError) {
        console.error('[DataSync] Error cleaning up old data:', cleanupError);
      }
      
      return { 
        success: true, 
        recordsInserted, 
        timestamp 
      };
    } catch (error) {
      console.error('[DataSync] Sync failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  static async calculateDailyStats() {
    console.log('[DataSync] Calculating daily statistics...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get all attractions
      const { data: attractions, error: attractionsError } = await supabaseAdmin
        .from('attractions')
        .select('id, park_id');
      
      if (attractionsError || !attractions) {
        console.error('[DataSync] Error fetching attractions:', attractionsError);
        return;
      }
      
      for (const attraction of attractions) {
        // Get today's data for this attraction
        const { data: queueData, error: queueError } = await supabaseAdmin
          .from('queue_data')
          .select('wait_time, timestamp')
          .eq('attraction_id', attraction.id)
          .eq('status', 'OPERATING')
          .gte('timestamp', today.toISOString())
          .lt('timestamp', tomorrow.toISOString())
          .not('wait_time', 'is', null);
        
        if (queueError || !queueData || queueData.length === 0) {
          continue;
        }
        
        // Calculate statistics
        const waitTimes = queueData.map(d => d.wait_time).filter(w => w !== null) as number[];
        const avgWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
        const maxWaitTime = Math.max(...waitTimes);
        const minWaitTime = Math.min(...waitTimes);
        
        // Find peak hour
        const hourlyData = new Map<number, number[]>();
        queueData.forEach(d => {
          const hour = new Date(d.timestamp).getHours();
          if (!hourlyData.has(hour)) {
            hourlyData.set(hour, []);
          }
          if (d.wait_time !== null) {
            hourlyData.get(hour)!.push(d.wait_time);
          }
        });
        
        let peakHour = 0;
        let peakAvg = 0;
        hourlyData.forEach((times, hour) => {
          const avg = times.reduce((a, b) => a + b, 0) / times.length;
          if (avg > peakAvg) {
            peakAvg = avg;
            peakHour = hour;
          }
        });
        
        // Insert or update daily stats
        const { error: statsError } = await supabaseAdmin
          .from('daily_stats')
          .upsert({
            attraction_id: attraction.id,
            park_id: attraction.park_id,
            date: today.toISOString().split('T')[0],
            avg_wait_time: avgWaitTime,
            max_wait_time: maxWaitTime,
            min_wait_time: minWaitTime,
            peak_hour: peakHour,
            total_samples: queueData.length
          }, {
            onConflict: 'attraction_id,date'
          });
        
        if (statsError) {
          console.error(`[DataSync] Error updating daily stats for attraction ${attraction.id}:`, statsError);
        }
      }
      
      console.log('[DataSync] Daily statistics calculation completed');
    } catch (error) {
      console.error('[DataSync] Error calculating daily stats:', error);
    }
  }
}