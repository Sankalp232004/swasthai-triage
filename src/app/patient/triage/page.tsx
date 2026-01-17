"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, AlertTriangle, CheckCircle2, ChevronLeft, RefreshCw } from "lucide-react";
import { type TriageInputs } from "@/lib/triage-schema";

// --- Types & Constants ---
type Language = "en" | "hi";

type StepData = {
  id: string;
  type: "select" | "number" | "boolean" | "scale" | "grid";
  field: keyof TriageInputs;
  options?: string[];
  min?: number;
  max?: number;
  isRedFlag?: boolean;
};

const QUESTIONS: Record<string, { en: string; hi: string }> = {
  welcome_title: { en: "Patient Check-In", hi: "रोगी पंजीकरण" },
  welcome_desc: { en: "Quick automated health assessment", hi: "त्वरित स्वचालित स्वास्थ्य मूल्यांकन" },
  consent: { en: "I consent to provide my health information for triage assessment.", hi: "मैं ट्रायज मूल्यांकन के लिए अपनी स्वास्थ्य जानकारी देने की सहमति देता/देती हूँ।" },
  start: { en: "Start", hi: "शुरू करें" },
  next: { en: "Next", hi: "अगला" },
  back: { en: "Back", hi: "पीछे" },
  submit: { en: "Submit", hi: "जमा करें" },
  yes: { en: "Yes", hi: "हाँ" },
  no: { en: "No", hi: "नहीं" },
  male: { en: "Male", hi: "पुरुष" },
  female: { en: "Female", hi: "महिला" },
  other: { en: "Other", hi: "अन्य" },
  urgent_title: { en: "URGENT ALERT", hi: "अत्यावश्यक चेतावनी" },
  urgent_msg: { en: "Please inform clinic staff immediately.", hi: "कृपया तुरंत क्लिनिक स्टाफ को सूचित करें।" },
  loading: { en: "Analyzing...", hi: "विश्लेषण कर रहा है..." },
  draft_saved: { en: "Progress saved", hi: "प्रगति सहेजी गई" },
  
  // Field Labels
  q_age: { en: "Patient's Age", hi: "रोगी की उम्र" },
  q_gender: { en: "Gender", hi: "लिंग" },
  q_temp: { en: "Temperature (°F)", hi: "तापमान (°F)" },
  q_pulse: { en: "Heart Rate (BPM)", hi: "दिल की धड़कन (BPM)" },
  q_spo2: { en: "Oxygen Level (%)", hi: "ऑक्सीजन स्तर (%)" },
  q_complaint: { en: "Main Complaint", hi: "मुख्य समस्या" },
  q_duration: { en: "Duration (Days)", hi: "कितने दिनों से?" },
  q_pain: { en: "Pain Severity (0-10)", hi: "दर्द कितना है (0-10)?" },
  q_chronic: { en: "Any Chronic Disease?", hi: "क्या पहले से कोई बीमारी है?" },
  
  // Red Flags
  q_chest: { en: "Do you have Chest Pain?", hi: "क्या छाती में दर्द है?" },
  q_breath: { en: "Difficulty Breathing?", hi: "क्या सांस लेने में तकलीफ है?" },
  q_bleed: { en: "Heavy Bleeding?", hi: "क्या भारी रक्तस्राव हो रहा है?" },
  q_confused: { en: "Confusion or Slurred Speech?", hi: "क्या उलझन या बोलने में दिक्कत है?" },
  q_stomach: { en: "Severe Stomach Pain?", hi: "क्या पेट में बहुत तेज दर्द है?" },
  q_eye: { en: "Eye Injury?", hi: "क्या आंख में चोट लगी है?" },
};

const CHIEF_COMPLAINTS_LIST = [
  "Fever", "Cough", "Headache", "Body Ache", "Abdominal Pain", 
  "Indigestion", "Loose Motion", "Vomiting", "Urinary Issues", 
  "Skin Rash", "Ear Pain", "Eye Pain", "Dental Pain", 
  "Injury", "Weakness", "Other"
];

const RED_SCREEN_STYLE = "fixed inset-0 z-50 bg-red-600 flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in duration-300";

// --- Wizard Configuration ---
const STEPS: StepData[] = [
  { id: "gender", field: "gender", type: "select", options: ["Male", "Female", "Other"] },
  { id: "age", field: "age", type: "number", min: 0, max: 120 },
  { id: "temperature", field: "temperature", type: "number", min: 90, max: 110 },
  { id: "pulse", field: "pulse", type: "number", min: 30, max: 250 },
  { id: "spo2", field: "spo2", type: "number", min: 50, max: 100 },
  { id: "complaint", field: "complaint", type: "grid", options: CHIEF_COMPLAINTS_LIST },
  { id: "duration", field: "duration_days", type: "number", min: 0, max: 365 },
  { id: "pain", field: "pain_score", type: "scale", min: 0, max: 10 },
  { id: "chronic", field: "chronic_conditions", type: "boolean" },
  // Red Flags
  { id: "chest_pain", field: "chest_pain", type: "boolean", isRedFlag: true },
  { id: "breathlessness", field: "breathlessness", type: "boolean", isRedFlag: true },
  { id: "bleeding", field: "bleeding", type: "boolean", isRedFlag: true },
  { id: "altered_sensorium", field: "altered_sensorium", type: "boolean", isRedFlag: true },
  { id: "severe_abdominal_pain", field: "severe_abdominal_pain", type: "boolean", isRedFlag: true },
  { id: "eye_injury", field: "eye_injury", type: "boolean", isRedFlag: true },
];

export default function TriageWizard() {
  const router = useRouter();
  const [hasConsent, setHasConsent] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [lang, setLang] = useState<Language>("en");
  const [answers, setAnswers] = useState<Partial<TriageInputs>>({});
  const [isRedFlagTriggered, setIsRedFlagTriggered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("triage_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed);
      } catch (e) {
        console.error("Failed to load draft");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("triage_draft", JSON.stringify(answers));
  }, [answers]);

  const t = (key: string) => QUESTIONS[key]?.[lang] || key;

  const handleAnswer = (value: any) => {
    const step = STEPS[currentStepIndex];
    
    if (step.isRedFlag && value === true) {
      setIsRedFlagTriggered(true);
      return; 
    }

    const newAnswers = { ...answers, [step.field]: value };
    setAnswers(newAnswers);

    // Auto-advance for non-number/non-scale types for smoother UX
    if (step.type !== "number" && step.type !== "scale") {
       if (currentStepIndex < STEPS.length - 1) {
         setTimeout(() => setCurrentStepIndex(prev => prev + 1), 250);
       } else {
         handleSubmit(newAnswers);
       }
    }
  };

  const handleNext = () => {
    const step = STEPS[currentStepIndex];
    // Check if required field is filled for "Next" button cases
    if (answers[step.field] === undefined || answers[step.field] === "") {
      toast.error(t('yes')); 
      return;
    }

    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleSubmit(answers);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) setCurrentStepIndex(prev => prev - 1);
  };

  const handleSubmit = async (finalData: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalData),
      });

      if (!res.ok) throw new Error("Submission failed");
      
      const result = await res.json();
      localStorage.removeItem("triage_draft"); 
      
      toast.success("Triage Completed");
      window.location.href = "/";
      
    } catch (error) {
      console.error(error);
      toast.error("Error submitting form");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRedFlagTriggered) {
    return (
      <div className={RED_SCREEN_STYLE}>
        <AlertTriangle className="w-32 h-32 mb-6 animate-pulse" />
        <h1 className="text-4xl font-extrabold mb-4">{t('urgent_title')}</h1>
        <p className="text-2xl">{t('urgent_msg')}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-12 bg-white text-red-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100"
        >
          Reset System
        </button>
      </div>
    );
  }

  if (!hasConsent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full p-8 rounded-2xl shadow-lg text-center space-y-6">
          <div className="flex justify-center gap-4 mb-4">
            <button 
              onClick={() => setLang("en")} 
              className={`px-4 py-2 rounded-lg font-medium transition ${lang === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              English
            </button>
            <button 
              onClick={() => setLang("hi")} 
              className={`px-4 py-2 rounded-lg font-medium transition ${lang === 'hi' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              हिंदी
            </button>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-800">{t('welcome_title')}</h1>
          <p className="text-slate-500 text-lg">{t('welcome_desc')}</p>
          
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-left">
            <label className="flex items-start gap-4 cursor-pointer">
              <input type="checkbox" className="mt-1 w-5 h-5 accent-blue-600" id="consent" />
              <span className="text-slate-700 text-lg leading-relaxed">{t('consent')}</span>
            </label>
          </div>

          <button 
            onClick={() => {
              const cb = document.getElementById("consent") as HTMLInputElement;
              if (cb?.checked) setHasConsent(true);
              else toast.error("Please provide consent");
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-xl font-bold transition-all shadow-lg shadow-blue-200"
          >
            {t('start')}
          </button>
        </div>
      </div>
    );
  }

  const step = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-400">
            Step {currentStepIndex + 1}/{STEPS.length}
          </span>
        </div>
        <button 
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-2 text-sm font-medium bg-slate-100 px-3 py-1.5 rounded-full"
        >
          <RefreshCw className="w-3 h-3" />
          {lang === 'en' ? 'HI' : 'EN'}
        </button>
      </div>

      <div className="h-2 bg-slate-200 w-full">
        <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full p-4 justify-center pb-24">
        
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
          {step.field.startsWith("q_") ? t(step.field) : t(`q_${step.id}`.replace("q_q_", "q_"))}
        </h2>

        <div className="w-full animate-in zoom-in-95 duration-200">
          
          {step.type === "select" && (
            <div className="grid gap-4">
              {step.options?.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className={`p-6 text-xl font-medium rounded-xl border-2 transition-all
                    ${answers[step.field] === opt 
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md" 
                      : "border-slate-200 bg-white hover:border-blue-300 active:scale-95"
                    }`}
                >
                  {lang === 'hi' && (QUESTIONS as any)[opt.toLowerCase()] ? (QUESTIONS as any)[opt.toLowerCase()].hi : opt}
                </button>
              ))}
            </div>
          )}

          {step.type === "boolean" && (
            <div className="grid grid-cols-2 gap-4 h-32">
              <button
                onClick={() => handleAnswer(true)}
                className="h-full text-xl font-bold rounded-xl border-2 border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all text-slate-700"
              >
                {t('yes')}
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="h-full text-xl font-bold rounded-xl border-2 border-slate-200 bg-white hover:bg-green-50 hover:border-green-200 active:scale-95 transition-all text-slate-700"
              >
                {t('no')}
              </button>
            </div>
          )}

          {step.type === "number" && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border-2 border-blue-100 text-center shadow-inner">
                <span className="text-4xl font-mono font-bold text-slate-800">
                  {answers[step.field] ?? "--"}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, ".", 0, "DEL"].map((k) => (
                  <button
                    key={String(k)}
                    onClick={() => {
                      if (k === "DEL") {
                        const curr = String(answers[step.field] || "");
                        setAnswers({ ...answers, [step.field]: curr.slice(0, -1) } as any);
                      } else {
                        const curr = String(answers[step.field] || "");
                        if (curr.length < 5) setAnswers({ ...answers, [step.field]: curr + k } as any);
                      }
                    }}
                    className={`h-16 text-2xl font-semibold rounded-lg shadow-sm active:scale-95 transition-all
                      ${key === "DEL" ? "bg-red-50 text-red-600" : "bg-white text-slate-700"}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <button 
                 onClick={handleNext}
                 className="w-full bg-blue-600 text-white h-14 rounded-xl text-xl font-bold mt-4 shadow-lg shadow-blue-200"
              >
                {t('next')}
              </button>
            </div>
          )}

          {step.type === "grid" && (
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pb-8">
              {step.options?.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className={`p-3 text-sm font-medium rounded-lg border text-left transition-all
                    ${answers[step.field] === opt 
                      ? "bg-blue-600 text-white border-blue-600" 
                      : "bg-white border-gray-200 hover:border-blue-400"
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {step.type === "scale" && (
             <div className="space-y-6">
                <div className="flex justify-between text-2xl font-bold px-2 text-slate-400">
                   <span>😄 0</span>
                   <span className="text-red-500">10 😫</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="10" 
                  step="1"
                  value={answers[step.field] || 0}
                  onChange={(e) => {
                     setAnswers({ ...answers, [step.field]: Number(e.target.value) });
                  }}
                  className="w-full h-12 accent-blue-600 bg-gray-200 rounded-lg cursor-pointer"
                />
                <div className="text-center">
                  <span className="text-6xl font-bold text-blue-600">{answers[step.field] || 0}</span>
                </div>
                <button 
                 onClick={handleNext}
                 className="w-full bg-blue-600 text-white h-14 rounded-xl text-xl font-bold shadow-lg shadow-blue-200"
              >
                {t('next')}
              </button>
             </div>
          )}
        </div>
      </div>

      {currentStepIndex > 0 && (
         <div className="fixed bottom-0 w-full max-w-md mx-auto left-0 right-0 p-4 bg-gradient-to-t from-slate-50 to-transparent">
            <button 
              onClick={handleBack}
              className="flex items-center text-slate-400 font-medium hover:text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" /> {t('back')}
            </button>
         </div>
      )}
      
      {isSubmitting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-800">{t('loading')}</h3>
        </div>
      )}
    </div>
  );
}
