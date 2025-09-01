-- Create parks table
CREATE TABLE IF NOT EXISTS parks (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attractions table
CREATE TABLE IF NOT EXISTS attractions (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  park_id UUID REFERENCES parks(id) ON DELETE CASCADE,
  entity_type TEXT,
  area TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create queue_data table for storing historical queue data
CREATE TABLE IF NOT EXISTS queue_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attraction_id UUID REFERENCES attractions(id) ON DELETE CASCADE,
  park_id UUID REFERENCES parks(id) ON DELETE CASCADE,
  wait_time INTEGER,
  status TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_queue_data_attraction_timestamp 
  ON queue_data(attraction_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_queue_data_park_timestamp 
  ON queue_data(park_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_queue_data_timestamp 
  ON queue_data(timestamp DESC);

-- Create daily_stats table for aggregated statistics
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attraction_id UUID REFERENCES attractions(id) ON DELETE CASCADE,
  park_id UUID REFERENCES parks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  avg_wait_time DECIMAL,
  max_wait_time INTEGER,
  min_wait_time INTEGER,
  peak_hour INTEGER,
  total_samples INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attraction_id, date)
);

-- Create index for daily stats
CREATE INDEX IF NOT EXISTS idx_daily_stats_park_date 
  ON daily_stats(park_id, date DESC);

-- Insert the two Disney parks
INSERT INTO parks (id, name, timezone) VALUES 
  ('dae968d5-630d-4719-8b06-3d107e944401', 'Disneyland Park', 'Europe/Paris'),
  ('ca888437-ebb4-4d50-aed2-d227f7096968', 'Walt Disney Studios Park', 'Europe/Paris')
ON CONFLICT (id) DO NOTHING;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_parks_updated_at BEFORE UPDATE ON parks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attractions_updated_at BEFORE UPDATE ON attractions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for the latest queue data per attraction
CREATE OR REPLACE VIEW latest_queue_data AS
SELECT DISTINCT ON (qd.attraction_id) 
  qd.id,
  qd.attraction_id,
  qd.wait_time,
  qd.status,
  qd.timestamp,
  qd.created_at,
  a.name as attraction_name,
  a.park_id,
  p.name as park_name
FROM queue_data qd
JOIN attractions a ON qd.attraction_id = a.id
JOIN parks p ON a.park_id = p.id
ORDER BY qd.attraction_id, qd.timestamp DESC;

-- Enable Row Level Security
ALTER TABLE parks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public can read parks" ON parks FOR SELECT USING (true);
CREATE POLICY "Public can read attractions" ON attractions FOR SELECT USING (true);
CREATE POLICY "Public can read queue_data" ON queue_data FOR SELECT USING (true);
CREATE POLICY "Public can read daily_stats" ON daily_stats FOR SELECT USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role can insert parks" ON parks FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update parks" ON parks FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete parks" ON parks FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert attractions" ON attractions FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update attractions" ON attractions FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete attractions" ON attractions FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert queue_data" ON queue_data FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update queue_data" ON queue_data FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete queue_data" ON queue_data FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert daily_stats" ON daily_stats FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update daily_stats" ON daily_stats FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete daily_stats" ON daily_stats FOR DELETE USING (auth.role() = 'service_role');