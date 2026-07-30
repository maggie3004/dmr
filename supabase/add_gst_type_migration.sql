-- Add gst_type column to dmr_entries table
ALTER TABLE dmr_entries
ADD COLUMN IF NOT EXISTS gst_type VARCHAR(50);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
