import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Recommendation } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDuration(secs: number | null) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function recommendationLabel(r: Recommendation) {
  const map: Record<Recommendation, string> = {
    strong_yes: "Strong Yes",
    yes: "Yes",
    maybe: "Maybe",
    no: "No",
  };
  return map[r];
}

export function recommendationColor(r: Recommendation) {
  const map: Record<Recommendation, string> = {
    strong_yes: "bg-green-100 text-green-800 border-green-200",
    yes: "bg-blue-100 text-blue-800 border-blue-200",
    maybe: "bg-amber-100 text-amber-800 border-amber-200",
    no: "bg-rose-100 text-rose-800 border-rose-200",
  };
  return map[r];
}

export function scoreColor(score: number) {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-blue-600";
  if (score >= 4) return "text-amber-600";
  return "text-rose-600";
}

export function isTokenExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date();
}

export const DEFAULT_SCREENING_QUESTIONS = [
  { question: "How many years of total professional experience do you have?", question_type: "open" as const, order_index: 0, is_default: true },
  { question: "How many years of relevant experience do you have for this role?", question_type: "open" as const, order_index: 1, is_default: true },
  { question: "What is your current notice period?", question_type: "open" as const, order_index: 2, is_default: true },
  { question: "Do you have any other active job offers at the moment?", question_type: "boolean" as const, order_index: 3, is_default: true },
  { question: "What is your current CTC (cost to company)?", question_type: "open" as const, order_index: 4, is_default: true },
  { question: "What is your expected CTC?", question_type: "open" as const, order_index: 5, is_default: true },
  { question: "Where are you currently based / working from?", question_type: "open" as const, order_index: 6, is_default: true },
  { question: "Are you open to relocating for this role if required?", question_type: "boolean" as const, order_index: 7, is_default: true },
];
