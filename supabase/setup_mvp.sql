-- MVP SETUP SCRIPT
-- Run this entire script in the Supabase SQL Editor to reset and initialize the database.

-- 1. CLEANUP: Remove old 'patients' table and ensuring clean slate
DROP TABLE IF EXISTS patients CASCADE;

-- 2. CREATE TABLE: intake_events (Anonymous Triage Data)
CREATE TABLE IF NOT EXISTS intake_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  clinic_id TEXT DEFAULT 'default',
  
  -- Demographics
  age INTEGER NOT NULL,
  sex TEXT NOT NULL, -- 'male', 'female', 'other'
  
  -- Clinical Data
  chief_complaint TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  vitals JSONB NOT NULL,
  red_flags JSONB NOT NULL,
  chronic_conditions BOOLEAN NOT NULL,
  
  -- Risk Assessment (The Result)
  risk_band TEXT NOT NULL, -- 'EMERGENCY', 'RED', 'AMBER', 'GREEN'
  reason TEXT NOT NULL,
  explanation TEXT NOT NULL,
  
  -- Workflow
  status TEXT DEFAULT 'Waiting' -- 'Waiting', 'Seen'
);

-- 3. PERMISSIONS: Enable Realtime (for Doctor Queue)
ALTER PUBLICATION supabase_realtime ADD TABLE intake_events;
