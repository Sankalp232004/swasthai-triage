"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase, type IntakeEvent } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  Users, 
  Clock, 
  AlertOctagon, 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  MoreHorizontal, 
  Check,
  ArrowRight
} from "lucide-react";

// --- Configuration ---
const PRIORITY_ORDER = {
  EMERGENCY: 1,
  RED: 2,
  AMBER: 3,
  GREEN: 4
};

const DISPLAY_MAP = {
  EMERGENCY: { label: "Emergency", color: "bg-red-600 border-red-700 text-white", icon: AlertOctagon },
  RED: { label: "High", color: "bg-orange-500 border-orange-600 text-white", icon: AlertTriangle },
  AMBER: { label: "Medium", color: "bg-yellow-400 border-yellow-500 text-black", icon: Activity },
  GREEN: { label: "Low", color: "bg-emerald-500 border-emerald-600 text-white", icon: CheckCircle2 },
};

const OVERRIDE_REASONS = [
  "Clinical Judgement - Higher Acuity",
  "Clinical Judgement - Lower Acuity",
  "Incorrect Vitals Entry",
  "Patient Condition Changed",
  "Other"
];

export default function DoctorQueue() {
  const [patients, setPatients] = useState<IntakeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<IntakeEvent | null>(null); // For Override
  const [overrideBand, setOverrideBand] = useState<string>("RED");
  const [overrideReason, setOverrideReason] = useState(OVERRIDE_REASONS[0]);
  const [currentTime, setCurrentTime] = useState("");

  // --- Data Fetching ---
  const fetchQueue = async () => {
    const { data, error } = await supabase
      .from("intake_events")
      .select("*")
      .neq("status", "Seen"); // Show all except Seen (Waiting, Consulting, etc)

    if (error) {
      toast.error("Connection Error");
      return;
    }
    setPatients(data as IntakeEvent[]);
    setLoading(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      
      fetchQueue();
      // Clock Ticker (UI only)
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };

    checkAuth();

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    // Realtime Sub (Optimized for INSERT/UPDATE)
    const channel = supabase
      .channel("doctor_queue")
      .on('postgres_changes', { event: '*', schema: 'public', table: 'intake_events' }, fetchQueue)
      .subscribe();

    return () => { 
      supabase.removeChannel(channel);
      clearInterval(timer); 
    }
  }, []);

  // --- Logic ---
  const sortedQueue = useMemo(() => {
    return [...patients].sort((a, b) => {
      // 1. Priority Rank (Band - Emergency -> Red -> Amber -> Green)
      const rankA = PRIORITY_ORDER[a.risk_band as keyof typeof PRIORITY_ORDER] || 99;
      const rankB = PRIORITY_ORDER[b.risk_band as keyof typeof PRIORITY_ORDER] || 99;
      if (rankA !== rankB) return rankA - rankB;
      
      // 2. Time (FIFO - Oldest first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [patients]);

  const handleMarkSeen = async (id: string) => {
    const { error } = await supabase
      .from("intake_events")
      .update({ status: 'Seen' })
      .eq('id', id);

    if (error) toast.error("Action Failed");
    else toast.success("Patient Seen");
  };

  const handleOverride = async () => {
    if (!selectedPatient || !overrideReason) return;
    
    // Log audit in separate table ideally, but updating record for MVP
    const { error } = await supabase
      .from("intake_events")
      .update({ 
        risk_band: overrideBand,
        // Append override note to explanation or store in separate field if schema allows.
        // For MVP, we'll append to explanation to keep it visible
        explanation: `[Override: ${overrideReason}] ${selectedPatient.explanation}`
      })
      .eq('id', selectedPatient.id);

    if (error) toast.error("Override Failed");
    else {
      toast.success("Priority Updated");
      setSelectedPatient(null);
      setOverrideReason(OVERRIDE_REASONS[0]);
    }
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">Live Triage Queue</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">CLINIC MAIN • {sortedQueue.length} WAITING</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold text-slate-700">
            {currentTime}
          </p>
        </div>
      </header>

      {/* Main Grid */}
      <main className="p-6">
        {loading ? (
          <div className="flex justify-center pt-20 text-slate-400 animate-pulse">Loading Live Data...</div>
        ) : sortedQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 text-slate-400">
            <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No patients waiting</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedQueue.map((patient) => {
              const style = DISPLAY_MAP[patient.risk_band as keyof typeof DISPLAY_MAP] || DISPLAY_MAP.GREEN;
              const Icon = style.icon;
              const waitMin = Math.floor((Date.now() - new Date(patient.created_at).getTime()) / 60000);

              return (
                <div key={patient.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                  {/* Card Banner */}
                  <div className={`${style.color} px-4 py-3 flex justify-between items-center`}>
                    <div className="flex items-center gap-2">
                       <Icon className="w-5 h-5 fill-current" />
                       <span className="font-bold uppercase tracking-wider text-sm">{style.label}</span>
                    </div>
                    <span className="font-mono font-bold opacity-80">#{patient.id.slice(0, 4)}</span>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800">{patient.age}y / {patient.sex?.[0] || '?'}</h3>
                        <p className="text-slate-500 text-sm truncate w-40" title={patient.chief_complaint}>{patient.chief_complaint}</p>
                      </div>
                      <div className="text-right">
                         <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            <span>Wait</span>
                         </div>
                         <span className={`text-xl font-bold ${waitMin > 30 ? 'text-red-600' : 'text-slate-700'}`}>
                           {waitMin}<span className="text-sm font-normal text-slate-400">m</span>
                         </span>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      {patient.reason && (
                        <div className="bg-slate-50 p-2 rounded border border-slate-100 text-sm font-medium text-slate-700">
                           {patient.reason}
                        </div>
                      )}
                       <div className="px-2 text-xs text-slate-500 line-clamp-2">
                           {patient.explanation}
                        </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                     <button 
                       onClick={() => handleMarkSeen(patient.id)}
                       className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                     >
                       Mark Seen <ArrowRight className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => setSelectedPatient(patient)}
                       className="px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 rounded-lg"
                       title="Override Priority"
                     >
                       <MoreHorizontal className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Override Dialog (Simple Overlay) */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-100 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-lg">Override Priority</h3>
                <p className="text-xs text-slate-500">Patient #{selectedPatient.id.slice(0,4)}</p>
              </div>
              
              <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Priority</label>
                    <select 
                      className="w-full p-3 border rounded-lg bg-white font-medium"
                      value={overrideBand}
                      onChange={(e) => setOverrideBand(e.target.value)}
                    >
                       <option value="EMERGENCY">Emergency (Immediate)</option>
                       <option value="RED">High (Urgent)</option>
                       <option value="AMBER">Medium (Standard)</option>
                       <option value="GREEN">Low (Routine)</option>
                    </select>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason (Mandatory)</label>
                    <textarea 
                      className="w-full p-3 border rounded-lg text-sm min-h-[80px]"
                      placeholder="Clinical judgement..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                    />
                 </div>

                 <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setSelectedPatient(null)}
                      className="flex-1 py-3 font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleOverride}
                      disabled={!overrideReason}
                      className="flex-1 py-3 font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
