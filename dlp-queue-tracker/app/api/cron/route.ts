import { NextResponse } from 'next/server';
import { themeparksAPI } from '@/lib/api/themeparks';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // This endpoint can be called by a cron job service like Vercel Cron or external service
  // For local development, you can call this endpoint manually
  
  try {
    // Fetch live data
    const data = await themeparksAPI.getAllDisneylandParisLiveData();
    
    const disneylandParkId = 'dae968d5-630d-4719-8b06-3d107e944401';
    const studiosParkId = '8601174b-3ab1-43ae-b021-6e86a6a398c6';
    
    let recordsCreated = 0;
    
    // Process Disneyland Park data
    for (const attraction of data.disneyland) {
      await prisma.attraction.upsert({
        where: { id: attraction.id },
        update: { name: attraction.name },
        create: {
          id: attraction.id,
          name: attraction.name,
          parkId: disneylandParkId,
        }
      });
      
      await prisma.queueData.create({
        data: {
          attractionId: attraction.id,
          parkId: disneylandParkId,
          waitTime: attraction.waitTime,
          status: attraction.status,
        }
      });
      recordsCreated++;
    }
    
    // Process Studios data
    for (const attraction of data.studios) {
      await prisma.attraction.upsert({
        where: { id: attraction.id },
        update: { name: attraction.name },
        create: {
          id: attraction.id,
          name: attraction.name,
          parkId: studiosParkId,
        }
      });
      
      await prisma.queueData.create({
        data: {
          attractionId: attraction.id,
          parkId: studiosParkId,
          waitTime: attraction.waitTime,
          status: attraction.status,
        }
      });
      recordsCreated++;
    }
    
    // Calculate and store daily statistics (run once per day)
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    // Check if we've already calculated stats for today
    const existingStats = await prisma.dailyStats.findFirst({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        }
      }
    });
    
    if (!existingStats) {
      // Calculate daily stats for each attraction
      const attractions = await prisma.attraction.findMany();
      
      for (const attraction of attractions) {
        const todayData = await prisma.queueData.findMany({
          where: {
            attractionId: attraction.id,
            timestamp: {
              gte: startOfToday,
              lte: endOfToday
            },
            status: 'OPERATING',
            waitTime: { not: null }
          }
        });
        
        if (todayData.length > 0) {
          const waitTimes = todayData.map(d => d.waitTime!).filter(w => w !== null);
          const avgWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;
          const maxWaitTime = Math.max(...waitTimes);
          const minWaitTime = Math.min(...waitTimes);
          
          // Find peak hour
          const hourlyData = new Map<number, number[]>();
          todayData.forEach(d => {
            const hour = new Date(d.timestamp).getHours();
            if (!hourlyData.has(hour)) {
              hourlyData.set(hour, []);
            }
            if (d.waitTime !== null) {
              hourlyData.get(hour)!.push(d.waitTime);
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
          
          await prisma.dailyStats.create({
            data: {
              attractionId: attraction.id,
              parkId: attraction.parkId,
              date: startOfToday,
              avgWaitTime,
              maxWaitTime,
              minWaitTime,
              peakHour,
              totalSamples: todayData.length
            }
          });
        }
      }
    }
    
    // Clean up old data (keep only last 30 days of detailed data)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await prisma.queueData.deleteMany({
      where: {
        timestamp: {
          lt: thirtyDaysAgo
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      recordsCreated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch and store data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Alternative endpoint for triggering data collection
  return GET(request);
}