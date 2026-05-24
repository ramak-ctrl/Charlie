# Charlie — Setup Guide

## Prerequisites
- Node.js 18+ (installed)
- A Supabase project
- A Retell AI account (free tier)
- An Anthropic API key
- A Resend account (for emails)

---

## 1. Clone & Install

```bash
cd charlie
npm install
```

---

## 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API |
| `RETELL_API_KEY` | Retell Dashboard → API Keys |
| `RETELL_AGENT_ID` | See Step 4 below |
| `RETELL_WEBHOOK_SECRET` | Retell Dashboard → Webhooks |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `RESEND_API_KEY` | resend.com → API Keys |
| `EMAIL_FROM` | Your verified sender (e.g. charlie@yourdomain.com) |
| `NEXT_PUBLIC_APP_URL` | http://localhost:3000 (dev) or your Vercel URL |

---

## 3. Supabase Setup

1. Create a new Supabase project
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial.sql`
3. Enable **Email auth** in Authentication → Providers

---

## 4. Retell AI Setup

1. Go to [Retell Dashboard](https://app.retellai.com)
2. Create a new **LLM** → select **Claude Sonnet** as the model
3. Set the system prompt:

```
You are Charlie, a professional AI recruitment screening interviewer for {{job_title}}.

Company Introduction: {{company_intro}}

Key Skills Required: {{key_skills}}

You will conduct a structured screening interview following these phases:
1. OPENING: Greet {{candidate_name}} warmly. Confirm this is an AI interview and ask for verbal consent to proceed.
2. SCREENING QUESTIONS: Ask each question from this list naturally:
{{screening_questions}}
   - Also ask candidates to rate themselves on each key skill (1-5 scale)
   - Ask them to describe their experience with the key skills
3. BEHAVIORAL (2-3 questions in STAR format): Ask about teamwork challenges, handling pressure, or conflict resolution relevant to the role.
4. PRESSURE TEST: Give a realistic scenario relevant to the role. Observe how they think through it.
5. CLOSE: Ask if they have questions for the company. Thank them professionally and explain next steps.

Guidelines:
- Be warm, professional, and encouraging
- Use natural follow-up questions when answers are vague
- Never make hiring decisions — you only collect information
- Keep the total interview to 12-15 minutes
- If the candidate is uncomfortable, acknowledge it and continue gently
```

4. Create a new **Agent** using the LLM above
5. Copy the **Agent ID** to `RETELL_AGENT_ID`
6. Set up a **Webhook** pointing to `https://your-domain.com/api/retell/webhook`
7. Copy the **Webhook Secret** to `RETELL_WEBHOOK_SECRET`

---

## 5. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

---

## 6. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

- Add all environment variables in Vercel Dashboard → Settings → Environment Variables
- Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
- Update the Retell webhook URL to your Vercel URL

---

## Architecture

```
Recruiter creates job → Sends invite emails (Resend)
                              ↓
                     Candidate gets link
                              ↓
                   Candidate opens /interview/[token]
                              ↓
              Consent screen → API creates Retell web call
                              ↓
               Voice interview (Retell AI ↔ Candidate)
                              ↓
              Retell webhook → /api/retell/webhook
                              ↓
              Claude analysis → /api/analyze
                              ↓
              Evaluation stored in Supabase
                              ↓
              Recruiter views report in dashboard
```
