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
  // ---------------------------------------------------------
  // 1. EMERGENCY (Black) - Life Threatening
  // Immediate resuscitation / intervention required
  // ---------------------------------------------------------

  if (data.spo2 < 90) {
    return {
      band: "EMERGENCY",
      reason: "Critical Hypoxia",
      action: "Immediate oxygen & resuscitation room",
      explanation: `SpO2 at ${data.spo2}% indicates critical respiratory failure.`,
      ui_color: "#000000"
    };
  }

  // Chest pain with breathlessness is a classic cardiac/PE red flag
  if (data.chest_pain && data.breathlessness) {
    return {
      band: "EMERGENCY",
      reason: "Cardiopulmonary Compromise",
      action: "Immediate ECG & physician review",
      explanation: "Chest pain combined with dyspnea suggests acute cardiac event.",
      ui_color: "#000000"
    };
  }

  if (data.bleeding) {
    return {
      band: "EMERGENCY",
      reason: "Active Hemorrhage",
      action: "Immediate hemostasis & fluids",
      explanation: "Active uncontrolled bleeding reported.",
      ui_color: "#000000"
    };
  }

  if (data.altered_sensorium) {
    return {
      band: "EMERGENCY",
      reason: "Altered Mental Status",
      action: "Secure airway & immediate neurological check",
      explanation: "Patient reports confusion or reduced consciousness.",
      ui_color: "#000000"
    };
  }

  // Eye injuries can be vision-threatening emergencies
  if (data.eye_injury) {
    return {
      band: "EMERGENCY",
      reason: "Ocular Emergnecy",
      action: "Immediate ophthalmology/ED assessment",
      explanation: "Potential vision-threatening eye trauma.",
      ui_color: "#000000"
    };
  }

  // ---------------------------------------------------------
  // 2. RED (High) - Urgent
  // Assessment within 15-30 minutes
  // ---------------------------------------------------------

  // Isolated Chest Pain (without breathlessness)
  if (data.chest_pain) {
    return {
      band: "RED",
      reason: "Chest Pain",
      action: "Urgent ECG within 15 mins",
      explanation: "Chest pain requires urgent exclusion of ACS.",
      ui_color: "#EF4444"
    };
  }

  // Severe Abdominal Pain (Acute surgical?)
  if (data.severe_abdominal_pain || (data.complaint === "abdominal_pain" && data.pain_score >= 8)) {
     return {
      band: "RED",
      reason: "Severe Abdominal Pain",
      action: "Urgent surgical assessment & pain management",
      explanation: "Severe intensity abdominal pain.",
      ui_color: "#EF4444"
    };
  }

  // Breathlessness (without chest pain, but still urgent)
  if (data.breathlessness) {
    return {
      band: "RED",
      reason: "Respiratory Distress",
      action: "Urgent nebulization/assessment",
      explanation: "Difficulty breathing reported.",
      ui_color: "#EF4444"
    };
  }

  // Very High Fever
  if (data.temperature > 103) {
    return {
      band: "RED",
      reason: "Hyperpyrexia",
      action: "Urgent antipyretics & evaluation",
      explanation: `Temperature of ${data.temperature}°F is dangerously high.`,
      ui_color: "#EF4444"
    };
  }

  // Tachycardia
  if (data.pulse > 120) {
    return {
      band: "RED",
      reason: "Signifcant Tachycardia",
      action: "Urgent vitals monitoring",
      explanation: `Resting heart rate of ${data.pulse} bpm is elevated.`,
      ui_color: "#EF4444"
    };
  }

  // Severe Pain (General)
  if (data.pain_score >= 8) {
    return {
      band: "RED",
      reason: "Severe Pain",
      action: "Urgent analgesia & assessment",
      explanation: `Pain score of ${data.pain_score}/10 requires urgent relief.`,
      ui_color: "#EF4444"
    };
  }

  // ---------------------------------------------------------
  // 3. AMBER (Medium)
  // Assessment within 60 minutes
  // ---------------------------------------------------------

  // Moderate Fever
  if (data.temperature > 100.4) {
    return {
      band: "AMBER",
      reason: "Febrile",
      action: "Doctor review within 60 mins",
      explanation: "Moderate fever present.",
      ui_color: "#F59E0B"
    };
  }

  // Moderate Pain
  if (data.pain_score >= 5) {
    return {
      band: "AMBER",
      reason: "Moderate Pain",
      action: "Analgesia & assessment",
      explanation: `Pain score ${data.pain_score}/10.`,
      ui_color: "#F59E0B"
    };
  }

  // Elevated Pulse
  if (data.pulse > 100) {
    return {
      band: "AMBER",
      reason: "Tachycardia",
      action: "Check dehydration/infection",
      explanation: "Heart rate is mildly elevated.",
      ui_color: "#F59E0B"
    };
  }

  // Vulnerable Group: Elderly with acute issue
  if (data.age >= 60 && data.duration_days < 7) {
     return {
      band: "AMBER",
      reason: "Geriatric Risk",
      action: "Prioritize slightly for age",
      explanation: "Senior patient with acute onset symptoms.",
      ui_color: "#F59E0B"
    };
  }

  // Comorbidities with acute symptoms
  if (data.chronic_conditions && data.duration_days < 7) {
    return {
      band: "AMBER",
      reason: "Comorbidity Factor",
      action: "Review concurrent med/conditions",
      explanation: "New symptoms in patient with chronic history.",
      ui_color: "#F59E0B"
    };
  }

  // ---------------------------------------------------------
  // 4. GREEN (Low)
  // Standard Queue
  // ---------------------------------------------------------
  
  return {
    band: "GREEN",
    reason: "Non-Urgent",
    action: "Routine OPD Consult",
    explanation: "Vitals stable, no red flags detected.",
    ui_color: "#10B981"
  };
}
