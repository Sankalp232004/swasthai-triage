-- RESET (Warning: This deletes all data. Use for MVP setup only)
DROP TABLE IF EXISTS public.patients CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients Table
CREATE TABLE public.patients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Demographics
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  
  -- Triage Result
  priority TEXT CHECK (priority IN ('EMERGENCY', 'RED', 'AMBER', 'GREEN')) NOT NULL,
  complaint TEXT NOT NULL,
  status TEXT CHECK (status IN ('Waiting', 'Consulting', 'Completed')) NOT NULL DEFAULT 'Waiting',
  
  -- Clinical Data (JSON) stores the full 15 data points
  clinical_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  consultation_start_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Allow all access (for MVP, lock down in production)
CREATE POLICY "Enable all access" ON public.patients
FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Index for queue queries
CREATE INDEX idx_patients_status ON public.patients(status);
CREATE INDEX idx_patients_priority ON public.patients(priority);
CREATE INDEX idx_patients_created_at ON public.patients(created_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;

-- Auth & Profiles (MVP Setup)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('doctor', 'staff')) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (TRUE);

-- Trigger to create profile on signup (Optional for MVP, but good for manual inserts)
-- For MVP: Insert manually into profiles after creating user in Auth UI.

