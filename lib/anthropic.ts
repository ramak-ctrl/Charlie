import Anthropic from "@anthropic-ai/sdk";
import type { Evaluation, Job, ScreeningQuestion, TranscriptEntry } from "./types";
import { getSetting } from "./settings";

function buildPrompts(params: {
  transcript: TranscriptEntry[];
  job: Pick<Job, "title" | "key_skills" | "role_criteria">;
  screeningQuestions: ScreeningQuestion[];
}) {
  const { transcript, job, screeningQuestions } = params;

  const transcriptText = transcript
    .map((t) => `${t.role === "agent" ? "Charlie" : "Candidate"}: ${t.content}`)
    .join("\n");

  const skillsList = job.key_skills.join(", ");
  const questionsList = screeningQuestions.map((q, i) => `${i + 1}. ${q.question}`).join("\n");

  const hasCriteria = job.role_criteria && job.role_criteria.length > 0;
  const criteriaList = hasCriteria
    ? job.role_criteria.map((c, i) => `${i + 1}. ${c}`).join("\n")
    : "";

  const criteriaSchema = hasCriteria ? `
  "criteria_results": [
    {
      "criterion": "<exact criterion text from the list above>",
      "status": "<met|unmet|unconfirmed>",
      "evidence": "<direct quote from candidate, or null if unconfirmed>"
    }
  ],` : `
  "criteria_results": [],`;

  const criteriaInstructions = hasCriteria ? `
## Role Fit Criteria to Check:
${criteriaList}

For each criterion above, search the transcript carefully and classify:
- "met": Candidate explicitly confirmed or demonstrated this (cite exact quote)
- "unmet": Candidate explicitly contradicted or denied this (cite exact quote)
- "unconfirmed": Not discussed, unclear, or cannot be determined without inference

IMPORTANT: Do not infer or assume. Only mark "met" or "unmet" if the candidate actually said something that directly addresses the criterion. If in doubt, mark "unconfirmed". Never fabricate or paraphrase a quote — use the candidate's actual words.
` : "";

  const system = `You are an expert recruitment analyst. Analyze the interview transcript for a ${job.title} position and provide a structured evaluation. Return ONLY valid JSON matching the schema exactly. Do not output hiring decisions, "hire"/"reject" language, or any binary pass/fail verdict.`;

  const user = `
## Job: ${job.title}
## Key Skills: ${skillsList}

## Screening Questions Asked:
${questionsList}
${criteriaInstructions}
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
  "summary": "<2-3 sentence executive summary of what the candidate actually said — factual, no hire/reject language>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "concerns": ["<concern1>", "<concern2>"],
  "evidence_quotes": {
    "communication": ["<direct quote>"],
    "seriousness": ["<direct quote>"],
    "composure": ["<direct quote>"],
    "professionalism": ["<direct quote>"],
    "reliability": ["<direct quote>"]
  },${criteriaSchema}
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
- criteria_results: must contain one entry per criterion in the list above, in the same order

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

async function analyzeWithGroq(params: Parameters<typeof buildPrompts>[0], apiKey: string) {
  const { system, user } = buildPrompts(params);
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
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

async function analyzeWithClaude(params: Parameters<typeof buildPrompts>[0], apiKey: string) {
  const { system, user } = buildPrompts(params);
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJson(text));
}

async function analyzeWithGemini(params: Parameters<typeof buildPrompts>[0], apiKey: string) {
  const { system, user } = buildPrompts(params);
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { response_mime_type: "application/json", temperature: 0.3 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const parts: { text?: string }[] = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? "").join("");
  return JSON.parse(extractJson(text));
}

export async function analyzeInterview(
  params: {
    transcript: TranscriptEntry[];
    job: Pick<Job, "title" | "key_skills" | "role_criteria">;
    screeningQuestions: ScreeningQuestion[];
  }
): Promise<Omit<Evaluation, "id" | "interview_id" | "recruiter_confirmed" | "recruiter_notes" | "created_at">> {
  const anthropicKey = await getSetting("ANTHROPIC_API_KEY");
  const groqKey = await getSetting("GROQ_API_KEY");
  const geminiKey = await getSetting("GEMINI_API_KEY");
  const provider = (await getSetting("ANALYSIS_PROVIDER")) || (
    geminiKey ? "gemini" :
    anthropicKey ? "anthropic" :
    groqKey ? "groq" :
    "ollama"
  );

  if (provider === "gemini") return analyzeWithGemini(params, geminiKey);
  if (provider === "groq") return analyzeWithGroq(params, groqKey);
  if (provider === "ollama") return analyzeWithOllama(params);
  return analyzeWithClaude(params, anthropicKey);
}
