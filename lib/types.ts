export type JobStatus = "draft" | "active" | "paused" | "closed";
export type JobType = "C2H" | "FTE" | "D2H";
export type Priority = "P0" | "P1" | "P2" | "P3";
export type CandidateStatus = "invited" | "started" | "completed" | "reviewed";
export type InterviewStatus = "pending" | "in_progress" | "completed" | "failed" | "no_show";
export type Recommendation = "strong_yes" | "yes" | "maybe" | "no";
export type QuestionType = "open" | "numeric" | "boolean" | "scale";

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  org_id: string | null;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

export interface Job {
  id: string;
  org_id: string | null;
  created_by: string;
  title: string;
  job_type: JobType;
  client: string | null;
  category: string | null;
  experience_min: number | null;
  experience_max: number | null;
  notice_period: string | null;
  positions: number;
  location: string | null;
  priority: Priority;
  expiry_date: string | null;
  expected_start_date: string | null;
  publish_on_careers: boolean;
  account_manager: string | null;
  description: string | null;
  company_intro: string | null;
  must_have_skills: string | null;
  nice_to_have_skills: string | null;
  key_skills: string[];
  status: JobStatus;
  created_at: string;
  updated_at: string;
  screening_questions?: ScreeningQuestion[];
  _count?: { candidates: number };
}

export interface ScreeningQuestion {
  id: string;
  job_id: string;
  question: string;
  question_type: QuestionType;
  order_index: number;
  is_default: boolean;
  created_at: string;
}

export interface Candidate {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string | null;
  experience: string | null;
  relevant_experience: string | null;
  notice_period: string | null;
  current_ctc: string | null;
  expected_ctc: string | null;
  current_location: string | null;
  linkedin_url: string | null;
  primary_skills: string[];
  status: CandidateStatus;
  invited_at: string;
  created_at: string;
  interview?: Interview;
  evaluation?: Evaluation;
}

export interface InterviewToken {
  id: string;
  candidate_id: string;
  job_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface Interview {
  id: string;
  token_id: string;
  candidate_id: string;
  job_id: string;
  retell_call_id: string | null;
  status: InterviewStatus;
  recording_url: string | null;
  transcript: TranscriptEntry[] | null;
  duration_secs: number | null;
  consent_given: boolean;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface TranscriptEntry {
  role: "agent" | "user";
  content: string;
  timestamp?: number;
}

export interface Evaluation {
  id: string;
  interview_id: string;
  communication_score: number;
  seriousness_score: number;
  composure_score: number;
  professionalism_score: number;
  reliability_score: number;
  overall_score: number;
  recommendation: Recommendation;
  summary: string;
  strengths: string[];
  concerns: string[];
  evidence_quotes: Record<string, string[]>;
  screening_data: ScreeningData;
  recruiter_confirmed: boolean;
  recruiter_notes: string | null;
  created_at: string;
}

export interface ScreeningData {
  total_experience_years?: number;
  relevant_experience_years?: number;
  notice_period?: string;
  existing_offers?: boolean;
  current_ctc?: string;
  expected_ctc?: string;
  current_location?: string;
  open_to_relocate?: boolean;
  skill_ratings?: Record<string, number>;
  [key: string]: unknown;
}

export interface CandidateWithDetails extends Candidate {
  interview_tokens?: InterviewToken[];
  interview?: Interview & { evaluation?: Evaluation };
}

export interface JobWithCandidates extends Job {
  candidates: CandidateWithDetails[];
  screening_questions: ScreeningQuestion[];
}

// API request/response types
export interface CreateJobRequest {
  title: string;
  job_type?: JobType;
  experience_min?: number;
  experience_max?: number;
  notice_period?: string;
  positions?: number;
  location?: string;
  priority?: Priority;
  expiry_date?: string;
  description?: string;
  company_intro?: string;
  key_skills: string[];
  screening_questions: Omit<ScreeningQuestion, "id" | "job_id" | "created_at">[];
}

export interface SendInviteRequest {
  candidates: {
    name: string;
    email: string;
    phone?: string;
    experience?: string;
    notice_period?: string;
    current_ctc?: string;
    expected_ctc?: string;
    current_location?: string;
    linkedin_url?: string;
    primary_skills?: string[];
  }[];
}

export interface CreateCallResponse {
  access_token: string;
  call_id: string;
}

export interface InterviewPageData {
  job: Pick<Job, "id" | "title" | "company_intro" | "key_skills">;
  candidate: Pick<Candidate, "id" | "name" | "email">;
  token: InterviewToken;
  interview: Interview | null;
}
