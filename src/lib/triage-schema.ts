import { z } from "zod";

export const CHIEF_COMPLAINTS = [
  "Fever",
  "Cough",
  "Headache",
  "Body Ache",
  "Abdominal Pain",
  "Indigestion",
  "Loose Motion",
  "Vomiting",
  "Urinary Issues",
  "Skin Rash",
  "Ear Pain",
  "Eye Pain",
  "Dental Pain",
  "Injury",
  "Weakness",
  "Other"
] as const;

export const TriageInputSchema = z.object({
  // 1. Demographics (2)
  age: z.coerce.number().min(0).max(120),
  gender: z.enum(["Male", "Female", "Other"]),

  // 2. Vitals (3)
  temperature: z.coerce.number().min(90).max(110),
  spo2: z.coerce.number().min(0).max(100),
  pulse: z.coerce.number().min(0).max(250),

  // 3. Red Flags - Booleans (6)
  chest_pain: z.boolean(),
  breathlessness: z.boolean(),
  bleeding: z.boolean(),
  altered_sensorium: z.boolean(),
  severe_abdominal_pain: z.boolean(),
  eye_injury: z.boolean(),

  // 4. Clinical Details (4)
  complaint: z.enum(CHIEF_COMPLAINTS),
  duration_days: z.coerce.number().min(0).max(365),
  pain_score: z.coerce.number().min(0).max(10),
  chronic_conditions: z.boolean(),
});

export type TriageInputs = z.infer<typeof TriageInputSchema>;
