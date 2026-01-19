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
          details: result.error.issues.map((e) => ({
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

    // 4. Insert into Supabase intake_events table
    const { data: insertData, error: insertError } = await supabase
      .from("intake_events")
      .insert([
        {
          age: data.age,
          sex: data.gender, // Mapping gender to sex
          chief_complaint: data.complaint,
          duration_days: data.duration_days,
          chronic_conditions: data.chronic_conditions,
          vitals: {
            temperature: data.temperature,
            spo2: data.spo2,
            pulse: data.pulse,
            pain_score: data.pain_score,
          },
          red_flags: {
            chest_pain: data.chest_pain,
            breathlessness: data.breathlessness,
            bleeding: data.bleeding,
            altered_sensorium: data.altered_sensorium,
            severe_abdominal_pain: data.severe_abdominal_pain,
            eye_injury: data.eye_injury,
          },
          risk_band: riskResult.band,
          reason: riskResult.reason,
          explanation: riskResult.explanation,
          actions: riskResult.action, // doctor instruction
          ui_color: riskResult.ui_color,
          status: "Waiting",
        },
      ])
      .select("id");

    if (insertError || !insertData || insertData.length === 0) {
      console.error("DB Insert Error:", insertError);
      return NextResponse.json(
        { error: "Failed to save triage" },
        { status: 500 }
      );
    }

    const triageId = insertData[0].id;

    // 5. Return clean result (No score, No probability)
    return NextResponse.json(
      {
        triage_id: triageId,
        band: riskResult.band,
        reason: riskResult.reason,
        action: riskResult.action,
        explanation: riskResult.explanation,
        ui_color: riskResult.ui_color,
      },
      { status: 201 }
    );
  } catch (error) {
    // Log error internally but don't expose details to client
    console.error("[Triage API Error]", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
