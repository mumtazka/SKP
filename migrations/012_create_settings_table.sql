-- Migration: 012_create_settings_table.sql
-- Description: Add settings table for system configuration (e.g., SKP period settings)
-- Date: 2026-01-29

-- ============================================
-- CREATE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read settings" 
ON settings FOR SELECT 
USING (true);

-- Authenticated users can manage settings (you may restrict to admin role in app logic)
CREATE POLICY "Authenticated users can manage settings" 
ON settings FOR ALL 
USING (true);

-- ============================================
-- INSERT DEFAULT SKP PERIOD (Optional)
-- ============================================
INSERT INTO settings (key, value)
VALUES (
    'skp_period',
    '{
        "type": "annual",
        "year": 2026,
        "startDate": "2026-01-01",
        "endDate": "2026-12-31"
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- HELPER FUNCTION: Update timestamp on change
-- ============================================
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_timestamp();
