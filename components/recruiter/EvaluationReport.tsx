"use client";
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { recommendationColor, recommendationLabel, scoreColor, formatDuration } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, MessageSquareQuote } from "lucide-react";
import type { Evaluation, Interview, Candidate, Recommendation } from "@/lib/types";

interface Props {
  interviewId: string;
  onClose: () => void;
}

interface ReportData {
  interview: Interview & { candidates: Candidate };
  evaluation: Evaluation | null;
}

const AXES = [
  { key: "communication_score", label: "Communication", desc: "Clarity, articulation, structure" },
  { key: "seriousness_score", label: "Seriousness", desc: "Preparation, engagement, depth" },
  { key: "composure_score", label: "Composure", desc: "Handling pressure and ambiguity" },
  { key: "professionalism_score", label: "Professionalism", desc: "Tone, courtesy, conduct" },
  { key: "reliability_score", label: "Reliability", desc: "Story consistency, specificity, self-eval gap" },
] as const;

export default function EvaluationReport({ interviewId, onClose }: Props) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reports/${interviewId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load report"))
      .finally(() => setLoading(false));
  }, [interviewId]);

  const ev = data?.evaluation;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evaluation Report</DialogTitle>
          <DialogDescription>
            {data?.interview?.candidates?.name ?? "Candidate"} · {formatDuration(data?.interview?.duration_secs ?? null)}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {error && (
          <div className="text-rose-400 text-sm bg-rose-500/10 px-4 py-3 rounded-lg">{error}</div>
        )}

        {ev && (
          <div className="space-y-6 text-sm">
            {/* Recommendation Banner */}
            <div className={`flex items-center justify-between rounded-xl p-5 border-2 ${recommendationColor(ev.recommendation as Recommendation)}`}>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-70 mb-1">Overall Recommendation</p>
                <p className="text-2xl font-bold">{recommendationLabel(ev.recommendation as Recommendation)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70 mb-1">Overall Score</p>
                <p className="text-3xl font-bold">{Number(ev.overall_score).toFixed(1)}</p>
                <p className="text-xs opacity-70">/ 10</p>
              </div>
            </div>

            {/* Summary */}
            <div>
              <h3 className="font-semibold text-white mb-2">Summary</h3>
              <p className="text-slate-300 leading-relaxed text-base">{ev.summary}</p>
            </div>

            <Separator />

            {/* 5-Axis Scores */}
            <div>
              <h3 className="font-semibold text-white mb-3">Evaluation Axes</h3>
              <div className="space-y-3">
                {AXES.map(({ key, label, desc }) => {
                  const score = ev[key as keyof Evaluation] as number;
                  const axisKey = label.toLowerCase();
                  const quotes = ev.evidence_quotes?.[axisKey] ?? [];
                  return (
                    <div key={key} className="rounded-lg border border-white/10 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-medium text-white">{label}</span>
                          <span className="text-slate-400 text-xs ml-2">{desc}</span>
                        </div>
                        <span className={`text-lg font-bold ${scoreColor(score)}`}>{score}<span className="text-xs text-slate-500 font-normal">/10</span></span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
                        <div
                          className={`h-1.5 rounded-full ${score >= 8 ? "bg-green-500" : score >= 6 ? "bg-blue-500" : score >= 4 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${score * 10}%` }}
                        />
                      </div>
                      {quotes.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {quotes.slice(0, 2).map((q, i) => (
                            <blockquote key={i} className="flex gap-2 text-xs text-slate-300 italic border-l-2 border-white/15 pl-2">
                              <MessageSquareQuote className="h-3 w-3 shrink-0 mt-0.5 text-slate-500" />
                              {q}
                            </blockquote>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Strengths & Concerns */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Strengths
                </h3>
                <ul className="space-y-1.5">
                  {ev.strengths?.map((s, i) => (
                    <li key={i} className="text-slate-300 text-sm flex gap-2">
                      <span className="text-green-400 mt-0.5">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Concerns
                </h3>
                <ul className="space-y-1.5">
                  {ev.concerns?.map((c, i) => (
                    <li key={i} className="text-slate-300 text-sm flex gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />

            {/* Screening Data */}
            {ev.screening_data && Object.keys(ev.screening_data).length > 0 && (
              <div>
                <h3 className="font-semibold text-white mb-3">Screening Data</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {ev.screening_data.total_experience_years != null && (
                    <ScreeningRow label="Total Experience" value={`${ev.screening_data.total_experience_years} yrs`} />
                  )}
                  {ev.screening_data.relevant_experience_years != null && (
                    <ScreeningRow label="Relevant Experience" value={`${ev.screening_data.relevant_experience_years} yrs`} />
                  )}
                  {ev.screening_data.notice_period && (
                    <ScreeningRow label="Notice Period" value={String(ev.screening_data.notice_period)} />
                  )}
                  {ev.screening_data.existing_offers != null && (
                    <ScreeningRow label="Existing Offers" value={ev.screening_data.existing_offers ? "Yes" : "No"} />
                  )}
                  {ev.screening_data.current_ctc && (
                    <ScreeningRow label="Current CTC" value={String(ev.screening_data.current_ctc)} />
                  )}
                  {ev.screening_data.expected_ctc && (
                    <ScreeningRow label="Expected CTC" value={String(ev.screening_data.expected_ctc)} />
                  )}
                  {ev.screening_data.current_location && (
                    <ScreeningRow label="Current Location" value={String(ev.screening_data.current_location)} />
                  )}
                  {ev.screening_data.open_to_relocate != null && (
                    <ScreeningRow label="Open to Relocate" value={ev.screening_data.open_to_relocate ? "Yes" : "No"} />
                  )}
                </div>

                {ev.screening_data.skill_ratings && Object.keys(ev.screening_data.skill_ratings).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-400 mb-2">Self-rated Skills (1–5)</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ev.screening_data.skill_ratings).map(([skill, rating]) => (
                        <div key={skill} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded px-2.5 py-1">
                          <span className="text-xs text-slate-300">{skill}</span>
                          <span className="text-xs font-bold text-indigo-400">{rating}/5</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recruiter note — display only */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-xs text-amber-300">
              <strong>Note:</strong> This report is generated by AI. The final hiring decision must be made by a human recruiter.
            </div>
          </div>
        )}

        {!loading && !error && !ev && (
          <div className="text-center py-8 text-slate-400">
            <p>Analysis is being generated. Refresh in a moment.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScreeningRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-white/10">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
