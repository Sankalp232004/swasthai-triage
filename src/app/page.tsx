import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow border border-slate-200">
        <div className="p-6 text-center border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">SwasthAI</h1>
          <p className="text-slate-500 text-sm mt-1">Rules-based triage ONLY (priority-based, not score-based)</p>
        </div>
        <div className="p-6 space-y-4">
          <Link href="/patient/triage" className="block w-full">
            <button className="w-full h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
              Patient Check-In
            </button>
          </Link>
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Staff Only</span>
            </div>
          </div>

          <Link href="/login" className="block w-full">
            <button className="w-full h-10 font-medium bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded transition-colors">
              Staff Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
