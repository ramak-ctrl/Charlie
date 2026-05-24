import Anthropic from "@anthropic-ai/sdk";
import type { Evaluation, Job, ScreeningQuestion, TranscriptEntry } from "./types";

function buildPrompts(params: {
  transcript: TranscriptEntry[];
  job: Pick<Job, "title" | "key_skills">;
  screeningQuestions: ScreeningQuestion[];
}) {
  const { transcript, job, screeningQuestions } = params;

  const transcriptText = transcript
    .map((t) => `${t.role === "agent" ? "Charlie" : "Candidate"}: ${t.content}`)
    .join("\n");

  const skillsList = job.key_skills.join(", ");
  const questionsList = screeningQuestions.map((q, i) => `${i + 1}. ${q.question}`).join("\n");

  const system = `You are an expert recruitment analyst. Analyze the interview transcript for a ${job.title} position and provide a structured evaluation. Return ONLY valid JSON matching the schema exactly.`;

  const user = `
## Job: ${job.title}
## Key Skills: ${skillsList}

## Screening Questions Asked:
${questionsList}

## Full Interview Transcript:
${transcriptText}

## Task
Analyze this interview and return a JSON object with exactly this structure:
{
  "communication_score": <1-10>,
  "seriousness_score": <1-10>,
  "composure_score": <1-10>,
  "professionalism_score": <1-10>,
  "reliability_score": <1-10>,
  "overall_score": <1-10 with one decimal>,
  "recommendation": <"strong_yes"|"yes"|"maybe"|"no">,
  "summary": "<2-3 sentence executive summary>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "concerns": ["<concern1>", "<concern2>"],
  "evidence_quotes": {
    "communication": ["<direct quote>"],
    "seriousness": ["<direct quote>"],
    "composure": ["<direct quote>"],
    "professionalism": ["<direct quote>"],
    "reliability": ["<direct quote>"]
  },
  "screening_data": {
    "total_experience_years": <number or null>,
    "relevant_experience_years": <number or null>,
    "notice_period": "<string or null>",
    "existing_offers": <boolean or null>,
    "current_ctc": "<string or null>",
    "expected_ctc": "<string or null>",
    "current_location": "<string or null>",
    "open_to_relocate": <boolean or null>,
    "skill_ratings": {<skill_name>: <1-5 rating from candidate self-assessment>}
  }
}

## Scoring Guidelines
- Communication (1-10): Clarity, articulation, logical structure of answers
- Seriousness (1-10): Preparation level, depth of engagement, thoughtfulness
- Composure (1-10): Handling of pressure/ambiguity, emotional regulation
- Professionalism (1-10): Tone, courtesy, appropriate conduct
- Reliability (1-10): Consistency of story, specificity of examples, self-awareness
- Recommendation: strong_yes (8+), yes (6.5-7.9), maybe (5-6.4), no (<5)

Return ONLY the JSON object, no markdown fences or explanation.
`;

  return { system, user };
}

// Strips markdown code fences that local models sometimes add despite instructions
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) return text.slice(firstBrace, lastBrace + 1);
  return text.trim();
}

async function analyzeWithGroq(params: Parameters<typeof buildPrompts>[0]) {
  const { system, user } = buildPrompts(params);
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return JSON.parse(extractJson(text));
}

async function analyzeWithOllama(params: Parameters<typeof buildPrompts>[0]) {
  const { system, user } = buildPrompts(params);
  const model = process.env.OLLAMA_MODEL ?? "mistral:7b";
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      format: "json",
      stream: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.message?.content ?? "";
  return JSON.parse(extractJson(text));
}

async function analyzeWithClaude(params: Parameters<typeof buildPrompts>[0]) {
  const { system, user } = buildPrompts(params);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJson(text));
}

export async function analyzeInterview(
  params: {
    transcript: TranscriptEntry[];
    job: Pick<Job, "title" | "key_skills">;
    screeningQuestions: ScreeningQuestion[];
  }
): Promise<Omit<Evaluation, "id" | "interview_id" | "recruiter_confirmed" | "recruiter_notes" | "created_at">> {
  const provider = process.env.ANALYSIS_PROVIDER ?? (
    process.env.ANTHROPIC_API_KEY ? "anthropic" :
    process.env.GROQ_API_KEY ? "groq" :
    "ollama"
  );

  if (provider === "groq") return analyzeWithGroq(params);
  if (provider === "ollama") return analyzeWithOllama(params);
  return analyzeWithClaude(params);
}
