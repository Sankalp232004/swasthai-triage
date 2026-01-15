# SwasthAI - Intelligent Triage System (MVP)

Production-ready Next.js application for clinic triage.

## 🚀 Deployment (Day 1 Ready)

### 1. Push to GitHub
Initialize a repository and push this code:
```bash
git init
git add .
git commit -m "Initial MVP"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Import to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import your GitHub repository.
3. Keep default settings (Framework Preset: Next.js).

### 3. Environment Variables
Add the following variables in Vercel Project Settings > Environment Variables:

| Name | Value Source |
|------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings > API |

> **Note:** Do NOT add the Service Role Key. This is a client-side app.

### 4. Deploy
Click **Deploy**. Your Triage System will be live in ~1 minute.

---

## 🛠 Project Structure
- `src/app/patient/triage` - Public Kiosk (15-step Wizard)
- `src/app/doctor/queue` - Realtime Dashboard (Auth Required)
- `src/app/login` - Role-based Access
- `src/app/api/triage` - Logic & DB Interaction
- `src/lib/risk-engine.ts` - Deterministic Rules
- `src/lib/triage-schema.ts` - Zod Validation
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
