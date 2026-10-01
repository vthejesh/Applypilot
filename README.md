# ✈️ ApplyPilot

**ApplyPilot** is an open-source, full-stack AI job application assistant tailored for freshers and students. It streamlines the job application pipeline: paste any job posting or screenshot, extract key details, match the best resume, draft a personalized email, and dispatch it directly from your own Gmail after human approval.

---

## ✨ Key Features

1. **Smart Extraction (Multimodal)**:
   - Paste raw LinkedIn posts, upload image flyers/screenshots, or drop PDF JDs.
   - Extracts recruiter emails, required tech stack, work mode, and application guidelines.
   - Built-in Scam Radar & email MX record verification.

2. **Resume Matching & Tailoring**:
   - Manage multiple role-specific resumes (Frontend, Backend, AI/Data).
   - ATS keyword optimization strictly honoring factual resume bullet points (no hallucinations).

3. **Human-First Email Dispatch**:
   - Sends directly through your authenticated Gmail account.
   - Anti-spam randomized delays (30–120 seconds).
   - Daily limit safeguards and automated 5-day follow-up suggestions.

4. **Multi-Source Job Discovery**:
   - Aggregates opportunities across Remotive, Arbeitnow, RemoteOK, Adzuna, and Jooble.
   - Automatically scores and ranks postings against your candidate profile.

5. **Application Pipeline & Reply Tracker**:
   - Kanban board syncing incoming recruiter replies and interview requests.
   - Analytics for reply rates, sent volume, and token costs.

6. **Manifest V3 Chrome Extension**:
   - Highlight text anywhere on the web and send directly into ApplyPilot.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript Strict)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Google Sign-In & Gmail Scopes)
- **Styling**: Tailwind CSS & shadcn/ui
- **AI**: Multi-provider wrapper (Claude 3.5 Sonnet / Gemini 1.5 Flash) with Zod validation
- **Queues**: Inngest & Vercel Cron
- **Testing**: Vitest

---

## 🚀 Quickstart

```bash
git clone https://github.com/your-username/applypilot.git
cd applypilot
npm install
cp .env.example .env.local
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

For full setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).
