-- Migration: Switch to anonymous intake_events
-- Run this in Supabase SQL Editor

-- 1. Create intake_events table
CREATE TABLE IF NOT EXISTS intake_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  clinic_id TEXT DEFAULT 'default',
  age INTEGER NOT NULL,
  sex TEXT NOT NULL,
  chief_complaint TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  vitals JSONB NOT NULL,
  red_flags JSONB NOT NULL,
  chronic_conditions BOOLEAN NOT NULL,
  risk_band TEXT NOT NULL, -- EMERGENCY, RED, AMBER, GREEN
  reason TEXT NOT NULL,
  explanation TEXT NOT NULL,
  status TEXT DEFAULT 'Waiting' -- Waiting, Seen
);

-- 2. Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID REFERENCES intake_events(id),
  action TEXT NOT NULL, -- 'AUTO_TRIAGE', 'DOCTOR_OVERRIDE', 'MARKED_SEEN'
  actor_role TEXT NOT NULL, -- 'SYSTEM', 'DOCTOR'
  override_reason TEXT,
  previous_band TEXT,
  new_band TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Realtime for intake_events
ALTER PUBLICATION supabase_realtime ADD TABLE intake_events;

-- 4. Create cron policy (conceptual - configurable 72h retention)
-- delete from intake_events where created_at < now() - interval '72 hours';
