import { TriageInputs } from "./triage-schema";

export type RiskBand = "EMERGENCY" | "RED" | "AMBER" | "GREEN";

export interface RiskResult {
  band: RiskBand;
  reasons: string[];
  score: number;
}

export function calculatePriority(data: TriageInputs): RiskResult {
  // 1. EMERGENCY override (Deterministic checking)
  if (data.spo2 < 90) {
    return { band: "EMERGENCY", score: 100, reasons: ["Hypoxia"] };
  }
  if (data.chest_pain && data.breathlessness) {
    return { band: "EMERGENCY", score: 100, reasons: ["Chest pain dyspnea"] };
  }
  if (data.bleeding) {
    return { band: "EMERGENCY", score: 100, reasons: ["Active bleeding"] };
  }
  if (data.altered_sensorium) {
    return { band: "EMERGENCY", score: 100, reasons: ["Altered sensorium"] };
  }

  // 2. SCORING Engine
  let score = 0;
  const reasons: string[] = [];

  // RED conditions
  // Temperature >= 39C (Input is likely F 90-110, so converting: >= 102.2F)
  if (data.temperature >= 102.2) {
    score += 30;
    reasons.push("High fever");
  }
  if (data.pulse > 120) {
    score += 30;
    reasons.push("Tachycardia");
  }
  if (data.severe_abdominal_pain) {
    score += 40;
    reasons.push("Severe pain");
  }
  if (data.age > 60 && data.duration_days < 3) {
    score += 30;
    reasons.push("Geriatric acute");
  }

  // CONTEXT scoring
  if (data.pain_score >= 7) {
    score += 15;
    if (reasons.length < 2) reasons.push("Severe pain");
  }
  if (data.chronic_conditions) {
    score += 10;
    if (reasons.length < 2) reasons.push("Comorbidity");
  }

  // 3. BAND MAPPING
  let band: RiskBand = "GREEN";
  if (score >= 50) {
    band = "RED";
  } else if (score >= 25) {
    band = "AMBER";
  }

  // Max 2 reasons validation cleanup
  return {
    band,
    score,
    reasons: reasons.slice(0, 2),
  };
}
