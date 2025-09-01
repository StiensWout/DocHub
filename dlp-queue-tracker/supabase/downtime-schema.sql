-- Create downtime_periods table to track when attractions go down
CREATE TABLE IF NOT EXISTS downtime_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attraction_id UUID REFERENCES attractions(id) ON DELETE CASCADE,
  park_id UUID REFERENCES parks(id) ON DELETE CASCADE,
  down_start TIMESTAMP WITH TIME ZONE NOT NULL,
  down_end TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  reason TEXT, -- DOWN, REFURBISHMENT, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_downtime_attraction_start 
  ON downtime_periods(attraction_id, down_start DESC);
CREATE INDEX IF NOT EXISTS idx_downtime_park_start 
  ON downtime_periods(park_id, down_start DESC);

-- Create downtime_stats table for aggregated statistics
CREATE TABLE IF NOT EXISTS downtime_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attraction_id UUID REFERENCES attractions(id) ON DELETE CASCADE,
  park_id UUID REFERENCES parks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_downtime_minutes INTEGER DEFAULT 0,
  downtime_count INTEGER DEFAULT 0,
  longest_downtime_minutes INTEGER DEFAULT 0,
  operating_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attraction_id, date)
);

-- Create index for downtime stats
CREATE INDEX IF NOT EXISTS idx_downtime_stats_attraction_date 
  ON downtime_stats(attraction_id, date DESC);

-- Enable Row Level Security
ALTER TABLE downtime_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE downtime_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public can read downtime_periods" ON downtime_periods FOR SELECT USING (true);
CREATE POLICY "Public can read downtime_stats" ON downtime_stats FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role can insert downtime_periods" ON downtime_periods FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update downtime_periods" ON downtime_periods FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete downtime_periods" ON downtime_periods FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert downtime_stats" ON downtime_stats FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update downtime_stats" ON downtime_stats FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete downtime_stats" ON downtime_stats FOR DELETE USING (auth.role() = 'service_role');

-- Create a view for current downtime information
CREATE OR REPLACE VIEW current_downtimes AS
SELECT 
  dp.id,
  dp.attraction_id,
  a.name as attraction_name,
  dp.park_id,
  p.name as park_name,
  dp.down_start,
  dp.reason,
  EXTRACT(EPOCH FROM (NOW() - dp.down_start))/60 as downtime_minutes
FROM downtime_periods dp
JOIN attractions a ON dp.attraction_id = a.id
JOIN parks p ON dp.park_id = p.id
WHERE dp.down_end IS NULL
ORDER BY dp.down_start DESC;