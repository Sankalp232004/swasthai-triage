import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Patient = {
  id: string;
  created_at: string;
  age: number;
  gender: string;
  priority: "EMERGENCY" | "RED" | "AMBER" | "GREEN";
  status: "Waiting" | "Consulting" | "Completed";
  complaint: string;
  clinical_data: Record<string, any>;
};
