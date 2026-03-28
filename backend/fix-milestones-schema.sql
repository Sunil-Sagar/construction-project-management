-- Add missing columns to milestones table
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS actual_completion_date DATE,
ADD COLUMN IF NOT EXISTS original_status VARCHAR(50);

-- Drop the restrictive CHECK constraint on phase column
-- This allows flexible phase names like 'Slab Work', 'Brickwork', etc.
ALTER TABLE milestones 
DROP CONSTRAINT IF EXISTS milestones_phase_check;

-- Update the phase column to VARCHAR(100) for longer phase names
ALTER TABLE milestones 
ALTER COLUMN phase TYPE VARCHAR(100);
