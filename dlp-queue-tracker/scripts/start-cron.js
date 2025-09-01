const cron = require('node-cron');
const https = require('https');

// Configuration
const SYNC_INTERVAL = '*/5 * * * *'; // Every 5 minutes
const SYNC_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/sync`
  : 'http://localhost:3001/api/sync';

console.log('🚀 Starting DLP Queue Tracker Cron Service');
console.log(`📍 Sync URL: ${SYNC_URL}`);
console.log(`⏰ Schedule: Every 5 minutes`);

// Function to trigger sync
async function triggerSync() {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Triggering data sync...`);
  
  try {
    const url = new URL(SYNC_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Add authentication if CRON_SECRET is set
    if (process.env.CRON_SECRET) {
      options.headers['Authorization'] = `Bearer ${process.env.CRON_SECRET}`;
    }
    
    const protocol = url.protocol === 'https:' ? https : require('http');
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log(`✅ Sync successful: ${result.recordsInserted} records inserted`);
          } else {
            console.error(`❌ Sync failed: ${result.error}`);
          }
        } catch (e) {
          console.error(`❌ Error parsing response: ${e.message}`);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Request error: ${error.message}`);
    });
    
    req.end();
  } catch (error) {
    console.error(`❌ Sync error: ${error.message}`);
  }
}

// Schedule the cron job
const task = cron.schedule(SYNC_INTERVAL, triggerSync, {
  scheduled: true,
  timezone: "Europe/Paris"
});

// Run immediately on startup
console.log('🔄 Running initial sync...');
triggerSync();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping cron service...');
  task.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping cron service...');
  task.stop();
  process.exit(0);
});

console.log('✅ Cron service started successfully\n');