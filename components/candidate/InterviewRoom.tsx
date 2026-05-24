"use client";
import { useState } from "react";
import ConsentScreen from "./ConsentScreen";
import ActiveInterview from "./ActiveInterview";
import CompletionScreen from "./CompletionScreen";

interface PageData {
  token: { id: string; token: string; expires_at: string; used_at: string | null };
  candidate: { id: string; name: string; email: string };
  job: { id: string; title: string; company_intro: string | null; key_skills: string[] };
  interview: { id: string; status: string } | null;
  expired: boolean;
}

type Phase = "consent" | "active" | "completed";

export default function InterviewRoom({ pageData }: { pageData: PageData }) {
  const { token, candidate, job, interview, expired } = pageData;

  const initialPhase: Phase =
    expired ? "completed" :
    interview?.status === "completed" ? "completed" :
    "consent";

  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);

  if (expired && phase !== "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-rose-900/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⏰</span>
          </div>
          <h1 className="text-2xl font-bold mb-3">Link Expired</h1>
          <p className="text-gray-400">This interview link has expired. Please contact the recruiter for a new link.</p>
        </div>
      </div>
    );
  }

  async function handleConsentAccepted() {
    const res = await fetch(`/api/interviews/${token.token}/create-call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ consent_given: true }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Failed to start interview");
    }

    const data = await res.json();
    setAccessToken(data.access_token);
    setCallId(data.call_id);
    setPhase("active");
  }

  function handleCallEnded() {
    setPhase("completed");
  }

  return (
    <>
      {phase === "consent" && (
        <ConsentScreen
          candidateName={candidate.name}
          jobTitle={job.title}
          companyIntro={job.company_intro}
          onAccept={handleConsentAccepted}
        />
      )}
      {phase === "active" && accessToken && (
        <ActiveInterview
          accessToken={accessToken}
          callId={callId!}
          candidateName={candidate.name}
          jobTitle={job.title}
          onCallEnded={handleCallEnded}
        />
      )}
      {phase === "completed" && (
        <CompletionScreen candidateName={candidate.name} jobTitle={job.title} isExpired={expired} />
      )}
    </>
  );
}
