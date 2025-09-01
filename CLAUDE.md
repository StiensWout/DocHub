# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DLP Queue Tracker is a Next.js application that tracks and displays queue times for Disneyland Paris attractions. It uses the ThemeParks Wiki API for data collection and Supabase for data storage.

## Essential Commands

### Development
```bash
cd dlp-queue-tracker
npm run dev          # Start Next.js dev server on port 3001
npm run cron         # Start cron job for API data sync (runs every 5 minutes)
npm run dev:all      # Run both dev server and cron job concurrently
npm run sync         # Manually trigger data sync from API to Supabase
```

### Production
```bash
npm run build        # Build production application
npm run start        # Start production server
npm run lint         # Run Next.js linter
```

## Architecture

### Data Flow
1. **ThemeParks Wiki API → Supabase (Server-side)**
   - Cron job fetches from API every 5 minutes via `/api/sync`
   - Data stored in Supabase PostgreSQL database
   - Old data (>30 days) automatically cleaned up

2. **Supabase → Client (Client-side)**
   - All client requests read from Supabase, never directly from API
   - Provides consistent data and reduces API load
   - Falls back to mock data if Supabase unavailable

### Key Services & Configuration

#### Supabase Setup
- URL: `https://bthqgsjbnvghccxtdihe.supabase.co`
- Two clients: `lib/supabase/client.ts` (public) and `lib/supabase/server.ts` (admin)
- Schema defined in `supabase/schema.sql`
- Tables: `parks`, `attractions`, `queue_data`, `daily_stats`
- View: `latest_queue_data` for current attraction status

#### API Integration
- ThemeParks Wiki API client: `lib/api/themeparks.ts`
- Data sync service: `lib/services/data-sync.ts`
- Cron script: `scripts/start-cron.js`

### Environment Variables (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://bthqgsjbnvghccxtdihe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_KEY=[service_key]
CRON_SECRET=[optional_for_sync_endpoint_auth]
```

## API Routes

All routes read from Supabase database:
- `/api/queue-times` - Latest queue times for all attractions
- `/api/statistics` - Historical statistics and aggregations
- `/api/attractions` - All attractions with detailed data
- `/api/attractions/[id]` - Single attraction details
- `/api/sync` - Trigger data sync (protected by CRON_SECRET if set)

## Key Dependencies

- **Next.js 15.5** - React framework with App Router
- **Supabase** - Database and real-time subscriptions
- **Prisma** - ORM for local SQLite development (legacy, now using Supabase)
- **Recharts** - Data visualization for statistics
- **next-themes** - Dark/light mode support
- **node-cron** - Scheduled data fetching
- **shadcn/ui components** - UI components (Button, Card, etc.)

## Database Access

When working with database queries:
- Use `supabase` client from `lib/supabase/client.ts` for public reads
- Use `supabaseAdmin` from `lib/supabase/server.ts` for writes (sync only)
- The `latest_queue_data` view provides denormalized current status
- Raw historical data in `queue_data` table

## Park IDs

Fixed IDs used throughout the application:
- Disneyland Park: `dae968d5-630d-4719-8b06-3d107e944401`
- Walt Disney Studios: `ca888437-ebb4-4d50-aed2-d227f7096968`

## Testing Data Sync

To test the sync functionality:
```bash
# Manual sync via API
curl http://localhost:3001/api/sync

# Check cron logs
npm run cron  # Watch console for sync status

# Verify in Supabase dashboard
# Check queue_data table for recent timestamps
```

## Common Issues

1. **No data showing**: Check if sync has run (`npm run sync` or wait for cron)
2. **API errors**: ThemeParks Wiki API may be down, app falls back to mock data
3. **Port 3000 in use**: Next.js will auto-select 3001
4. **Supabase connection**: Verify environment variables are set correctly