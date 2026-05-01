-- Create land_records table
CREATE TABLE IF NOT EXISTS land_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_data TEXT,
  extraction_date TIMESTAMPTZ NOT NULL,
  land_holding_type TEXT NOT NULL DEFAULT '',
  village TEXT NOT NULL DEFAULT '',
  taluka TEXT NOT NULL DEFAULT '',
  district TEXT NOT NULL DEFAULT '',
  last_mutation_number TEXT NOT NULL DEFAULT '',
  fragment_restriction BOOLEAN NOT NULL DEFAULT false,
  ceiling BOOLEAN NOT NULL DEFAULT false,
  forest BOOLEAN NOT NULL DEFAULT false,
  inam BOOLEAN NOT NULL DEFAULT false,
  bhudan BOOLEAN NOT NULL DEFAULT false,
  gavthan BOOLEAN NOT NULL DEFAULT false,
  total_area TEXT NOT NULL DEFAULT '',
  user_id TEXT NOT NULL DEFAULT '',
  raw_text TEXT,
  confidence_score FLOAT,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_land_records_extraction_date ON land_records (extraction_date DESC);
CREATE INDEX IF NOT EXISTS idx_land_records_village ON land_records (village);
CREATE INDEX IF NOT EXISTS idx_land_records_user_id ON land_records (user_id);

-- Enable Row Level Security
ALTER TABLE land_records ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (no auth required)
CREATE POLICY "Allow all operations on land_records"
  ON land_records
  USING (true)
  WITH CHECK (true);
