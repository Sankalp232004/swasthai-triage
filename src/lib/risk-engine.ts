import { TriageInputs } from "./triage-schema";

export type RiskBand = "EMERGENCY" | "RED" | "AMBER" | "GREEN";

export interface RiskResult {
  band: RiskBand;
  reason: string;
  action: string;
  explanation: string;
  ui_color: string;
}

export function calculatePriority(data: TriageInputs): RiskResult {
  // 1. EMERGENCY: Life-threatening
  if (data.spo2 < 90) {
    return {
      band: "EMERGENCY",
      reason: "Hypoxia",
      action: "Immediate oxygen and physician attention",
      explanation: "Low oxygen level detected.",
      ui_color: "#000000"
    };
  }
  if (data.chest_pain && data.breathlessness) {
    return {
      band: "EMERGENCY",
      reason: "Cardiac risk",
      action: "Immediate ECG and physician attention",
      explanation: "Chest pain with breathing difficulty.",
      ui_color: "#000000"
    };
  }
  if (data.bleeding) {
    return {
      band: "EMERGENCY",
      reason: "Active bleeding",
      action: "Immediate hemostasis and IV access",
      explanation: "Active bleeding requires urgent control.",
      ui_color: "#000000"
    };
  }
  if (data.altered_sensorium) {
    return {
      band: "EMERGENCY",
      reason: "Mental status",
      action: "Immediate physician assessment",
      explanation: "Altered consciousness detected.",
      ui_color: "#000000"
    };
  }
  if (data.eye_injury) {
    return {
      band: "EMERGENCY",
      reason: "Eye trauma",
      action: "Immediate ophthalmology consult",
      explanation: "Eye injury needs urgent care.",
      ui_color: "#000000"
    };
  }

  // 2. SCORING Engine (Internal only)
  let score = 0;
  const reasons: string[] = [];

  // RED conditions
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
  if (data.pain_score >= 7) {
    score += 15;
    if (!reasons.includes("Severe pain")) reasons.push("High pain");
  }
  if (data.chronic_conditions && score > 0) {
    score += 10;
    // Only add if not main driver
    if (reasons.length < 2) reasons.push("Comorbidity");
  }

  const primaryReason = reasons.length > 0 ? reasons[0] : "Assessment";

  // 3. BAND MAPPING
  if (score >= 50) {
    return {
      band: "RED",
      reason: primaryReason,
      action: "Physician review within 30 minutes",
      explanation: `${primaryReason} requires urgent attention.`,
      ui_color: "#EF4444"
    };
  } else if (score >= 25) {
    return {
      band: "AMBER",
      reason: primaryReason || "Moderate concern",
      action: "Physician review within 2 hours",
      explanation: `${primaryReason || "Symptoms"} needs timely care.`,
      ui_color: "#F59E0B"
    };
  }

  return {
    band: "GREEN",
    reason: "Stable",
    action: "Standard queue assessment",
    explanation: "No urgent concerns detected.",
    ui_color: "#10B981"
  };
}
