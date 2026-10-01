# ApplyPilot — Step-by-Step Setup Guide

Follow this comprehensive setup guide to get ApplyPilot running locally and deploy to production on Vercel.

---

## 1. Prerequisites
- **Node.js**: v18.18+ or v20+
- **PostgreSQL Database**: Supabase (free) or Neon.tech (free)
- **Google Cloud Console Account**: For Gmail API OAuth
- **AI API Key**: Anthropic Claude (`sk-ant-...`) or Google Gemini (`AIza...`)

---

## 2. Google Cloud OAuth & Gmail API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project called **ApplyPilot**.
3. Enable the **Gmail API**:
   - Navigate to **APIs & Services** → **Library**.
   - Search for **Gmail API** and click **Enable**.
4. Configure OAuth Consent Screen:
   - **User Type**: External.
   - **App Name**: ApplyPilot.
   - **Scopes**: Add:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.modify`
     - `openid`, `email`, `profile`
   - **Test Users**: Add your own Google email address as a test user.
5. Create Credentials:
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**.
   - **Application Type**: Web Application.
   - **Authorized JavaScript Origins**: `http://localhost:3000`, `https://your-domain.vercel.app`
   - **Authorized Redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `http://localhost:3000/api/gmail/callback`
     - `https://your-domain.vercel.app/api/auth/callback/google`
     - `https://your-domain.vercel.app/api/gmail/callback`
6. Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

---

## 3. Database Setup (Supabase or Neon)
1. Create a free project on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Grab the PostgreSQL Connection URL (pooled) for `DATABASE_URL` and direct connection for `DIRECT_URL`.

---

## 4. Local Environment Configuration
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Generate an encryption key (32 bytes):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Paste into `ENCRYPTION_KEY`.
3. Generate a NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```
   Paste into `NEXTAUTH_SECRET`.
4. Add your `ANTHROPIC_API_KEY` (or `GEMINI_API_KEY` with `AI_PROVIDER=gemini`).

---

## 5. Install, Migrate & Seed
```bash
# Install dependencies
npm install

# Push database schema
npx prisma db push

# Seed default templates and sample data
npx tsx prisma/seed.ts

# Start development server
npm run dev
```
Visit `http://localhost:3000`.

---

## 6. Vercel Deployment
1. Push repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Add all environment variables from `.env.local`.
4. Enable Vercel Blob Storage in the Vercel Dashboard for resume PDF hosting.
5. Cron jobs defined in `vercel.json` will automatically schedule on deployment.
