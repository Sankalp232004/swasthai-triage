# SwasthAI - Clinic Triage Pilot (MVP)

A streamlined, rule-based triage system designed for high-volume OPD clinics.

## 🏗 Architecture (Explicit Pipeline)

This system avoids "black box" logic. It uses a strictly defined pipeline:

1.  **PWA (Patient)**: Collects structured inputs (Vitals, Red Flags).
2.  **API Route (Thin Executor)**: Validates input -> Runs deterministic rules -> Writes to DB.
3.  **Database (Supabase)**: Stores anonymous `IntakeEvent`. No PII.
4.  **Realtime**: Pushes new high-priority events to the Doctor dashboard instantly.
5.  **Doctor UI**: Sorts by `Medical Priority` (Band) -> `Wait Time` (FIFO).

**Constraint:** No background jobs, no ML scores, no backend services.

## 🛠 Tech Stack

*   **Frontend**: Next.js 16 (App Router)
*   **Database**: Supabase (PostgreSQL + Realtime)
*   **Validation**: Zod (Strict Data Contract)
*   **Styling**: Tailwind CSS

## 🩺 Logic & Safety

*   **Priority-Based**: Bands (Emergency, Red, Amber, Green) are assigned by matching clinical rules.
*   **First-Match Wins**: The most severe rule always takes precedence.
*   **No Scoring**: Numerical scores are removed to ensure transparency and doctor trust.
*   **No PII**: No names or phone numbers are stored.

## 🚀 Setup

1.  **Environment Variables**:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=...
    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    ```

2.  **Database Schema**:
    Run the SQL script located in `supabase/setup_mvp.sql` to initialize the database.

3.  **Run Development**:
    ```bash
    npm run dev
    ```
