import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type IntakeEvent = {
  id: string;
  created_at: string;
  clinic_id?: string;
  age: number;
  sex: string;
  chief_complaint: string;
  duration_days: number;
  vitals: {
    temperature: number;
    spo2: number;
    pulse: number;
    pain_score: number;
  };
  red_flags: {
    chest_pain: boolean;
    breathlessness: boolean;
    bleeding: boolean;
    altered_sensorium: boolean;
    severe_abdominal_pain: boolean;
    eye_injury: boolean;
  };
  chronic_conditions: boolean;
  risk_band: "EMERGENCY" | "RED" | "AMBER" | "GREEN";
  reason: string;
  explanation: string;
  status: "Waiting" | "Seen";
  actions: string; // Doctor instruction
  ui_color: string;
};
