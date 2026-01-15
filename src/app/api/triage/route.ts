import { NextResponse } from "next/server";
import { TriageInputSchema } from "@/lib/triage-schema";
import { calculatePriority } from "@/lib/risk-engine";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    // 1. Parse JSON body
    const body = await request.json();

    // 2. Validate with Zod schema
    const result = TriageInputSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // 3. Run risk engine
    const riskResult = calculatePriority(data);

    // 4. Insert into Supabase patients table
    const { data: insertData, error: insertError } = await supabase
      .from("patients")
      .insert([
        {
          age: data.age,
          gender: data.gender,
          complaint: data.complaint,
          priority: riskResult.band,
          status: "Waiting",
          clinical_data: {
            reasons: riskResult.reasons, // Storing calculated reasons
            temperature: data.temperature,
            spo2: data.spo2,
            pulse: data.pulse,
            chest_pain: data.chest_pain,
            breathlessness: data.breathlessness,
            bleeding: data.bleeding,
            altered_sensorium: data.altered_sensorium,
            severe_abdominal_pain: data.severe_abdominal_pain,
            eye_injury: data.eye_injury,
            duration_days: data.duration_days,
            pain_score: data.pain_score,
            chronic_conditions: data.chronic_conditions,
          },
        },
      ])
      .select("id");

    if (insertError || !insertData || insertData.length === 0) {
      return NextResponse.json(
        { error: "Failed to save triage" },
        { status: 500 }
      );
    }

    const triageId = insertData[0].id;

    // 5. Return triage_id + risk band + reasons (NEVER return score)
    return NextResponse.json(
      {
        triage_id: triageId,
        band: riskResult.band,
        reasons: riskResult.reasons,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Triage API Error]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
