-- Migration: Add realisasi (realization) fields to SKPs table
-- This allows dosen to fill in their actual achievements for approved SKPs
-- and allows kepegawaian staff to provide feedback

-- Add realisasi columns to skps table
ALTER TABLE skps ADD COLUMN IF NOT EXISTS realisasi JSONB DEFAULT NULL;
ALTER TABLE skps ADD COLUMN IF NOT EXISTS realisasi_status VARCHAR(50) DEFAULT NULL;
ALTER TABLE skps ADD COLUMN IF NOT EXISTS realisasi_submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE skps ADD COLUMN IF NOT EXISTS realisasi_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE skps ADD COLUMN IF NOT EXISTS realisasi_reviewer_id UUID REFERENCES users(id) DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN skps.realisasi IS 'JSONB containing realization data for each section with feedback';
COMMENT ON COLUMN skps.realisasi_status IS 'Status of realization: NULL/Draft, Pending, Reviewed';
COMMENT ON COLUMN skps.realisasi_submitted_at IS 'When the realization was submitted for review';
COMMENT ON COLUMN skps.realisasi_reviewed_at IS 'When the realization was reviewed by staff';
COMMENT ON COLUMN skps.realisasi_reviewer_id IS 'ID of the staff who reviewed the realization';
