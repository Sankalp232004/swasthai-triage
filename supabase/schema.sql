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

-- Security Policies for Patients Table
-- 1. Patients can be created by anyone (Public check-in kiosk)
CREATE POLICY "Public create patients" ON public.patients
FOR INSERT WITH CHECK (TRUE);

-- 2. Only authenticated staff/doctors can view patients
CREATE POLICY "Staff read patients" ON public.patients
FOR SELECT TO authenticated USING (TRUE);

-- 3. Only authenticated staff/doctors can update status/priority
CREATE POLICY "Staff update patients" ON public.patients
FOR UPDATE TO authenticated USING (TRUE);

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

