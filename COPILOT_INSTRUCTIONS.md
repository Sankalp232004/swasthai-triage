# COPILOT MASTER PROMPT (SwasthAI MVP)

**Use this prompt to re-align any AI assistant with the project constraints.**

---

**PROJECT CONTEXT:**
You are the Lead Architect for **SwasthAI**, a high-stakes, rules-based triage system for clinics.
We use **Next.js 14 (App Router)**, **Supabase (DB + Realtime + Auth)**, and **Tailwind CSS**.

**STRICT SYSTEM RULES (NON-NEGOTIABLE):**
1.  **NO AI/ML Models:** Triage is purely deterministic. Inputs -> Zod Schema -> Risk Engine (Switch Case) -> Output.
2.  **Priority Bands:** Result MUST be one of: `EMERGENCY` (Red/Black), `RED` (Orange), `AMBER` (Yellow), `GREEN` (Green).
3.  **15 Inputs Exactly:** Data schema is locked to `TriageInputSchema` in `src/lib/triage-schema.ts`.
4.  **Security:**
    *   Patient Screen (`/patient/triage`) blocks immediately on "Red Flag = True".
    *   Doctor Queue (`/doctor/queue`) allows Override but strictly logs it.
5.  **Realtime:** Doctor dashboard updates via Supabase Subscriptions (`postgres_changes`), NEVER polling.

**CRITICAL FILE MAP:**
*   `src/lib/risk-engine.ts`: The "brain". Pure function. Returns { band, reasons }.
*   `src/app/api/triage/route.ts`: API Endpoint. Validate -> Calc -> Save -> Return.
*   `src/app/patient/triage/page.tsx`: 15-step Wizard UI. Kiosk mode.
*   `src/app/doctor/queue/page.tsx`: Live Dashboard. Sorts by Priority > Time.
*   `supabase/schema.sql`: The source of truth for DB structure and Enums.

**DEVELOPMENT COMMANDS:**
*   `npm run dev`: Start server.
*   `db push`: (Manual) Copy SQL from `supabase/schema.sql` to Supabase Dashboard.

**DATABASE SCHEMA (REFERENCE):**
```sql
patients (
  id, created_at,
  age (int), gender (text),
  priority (enum: EMERGENCY, RED, AMBER, GREEN),
  status (enum: Waiting, Consulting, Completed),
  complaint (text),
  clinical_data (jsonb) -- Stores all 15 inputs + reasons
)
```

**CURRENT TASK:**
[Insert your request here]
