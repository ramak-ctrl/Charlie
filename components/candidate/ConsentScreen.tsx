"use client";
import { useRef, useState } from "react";
import { Loader2, Mic, Shield, Clock, Volume2 } from "lucide-react";

interface Props {
  candidateName: string;
  jobTitle: string;
  companyIntro: string | null;
  onAccept: () => Promise<void>;
}

export default function ConsentScreen({ candidateName, jobTitle, companyIntro: _companyIntro, onAccept }: Props) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const [starting, setStarting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  async function handleStart() {
    if (starting) return;
    if (!checkboxRef.current?.checked) {
      setShowError(true);
      return;
    }
    setShowError(false);
    setApiError(null);
    setStarting(true);
    try {
      await onAccept();
    } catch (err) {
      setStarting(false);
      setApiError(err instanceof Error ? err.message : "Failed to start interview. Please try again.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#030712", overflowY: "auto" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "48px 16px 64px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "56px", height: "56px", borderRadius: "14px",
            backgroundColor: "#4f46e5", marginBottom: "12px",
          }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: "22px" }}>C</span>
          </div>
          <h1 style={{ color: "white", fontWeight: 700, fontSize: "22px", margin: 0 }}>Charlie</h1>
          <p style={{ color: "#9ca3af", fontSize: "13px", marginTop: "4px" }}>AI Screening Interview</p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: "#111827", borderRadius: "16px",
          border: "1px solid #1f2937", padding: "28px 28px 24px",
        }}>
          <h2 style={{ color: "white", fontSize: "19px", fontWeight: 600, margin: "0 0 4px" }}>
            Hi {candidateName}
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "14px", margin: "0 0 24px" }}>
            You&apos;ve been invited to interview for{" "}
            <strong style={{ color: "white" }}>{jobTitle}</strong>
          </p>

          {/* What to expect */}
          <p style={{ color: "#6b7280", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>
            What to expect
          </p>
          <div style={{ marginBottom: "28px" }}>
            {[
              { icon: Clock,   text: "12–15 minute voice conversation" },
              { icon: Mic,     text: "AI voice agent named Charlie will ask questions" },
              { icon: Shield,  text: "Your responses are recorded and analyzed" },
              { icon: Volume2, text: "Find a quiet space with a working microphone" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "8px", backgroundColor: "#1f2937",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={14} color="#9ca3af" />
                </div>
                <span style={{ color: "#d1d5db", fontSize: "14px" }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Consent */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
            <input
              ref={checkboxRef}
              id="consent-cb"
              type="checkbox"
              onChange={() => setShowError(false)}
              style={{ marginTop: "3px", width: "17px", height: "17px", flexShrink: 0, cursor: "pointer", accentColor: "#4f46e5" }}
            />
            <label htmlFor="consent-cb" style={{ color: "#9ca3af", fontSize: "13px", lineHeight: "1.55", cursor: "pointer" }}>
              I understand this interview is conducted by an AI agent and that my voice responses will be recorded, transcribed, and analyzed. I consent to proceed.
            </label>
          </div>

          {showError && (
            <p style={{ color: "#f87171", fontSize: "12px", marginBottom: "12px", marginLeft: "27px" }}>
              Please check the box above to continue.
            </p>
          )}

          {apiError && (
            <div style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px", padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px" }}>
              {apiError}
            </div>
          )}

          <div style={{ marginTop: "20px" }}>
            <button
              onClick={handleStart}
              disabled={starting}
              style={{
                width: "100%", height: "48px", borderRadius: "10px", border: "none",
                backgroundColor: starting ? "#374151" : "#4f46e5",
                color: "white", fontSize: "15px", fontWeight: 600,
                cursor: starting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                transition: "background-color 0.15s",
              }}
            >
              {starting ? (
                <><Loader2 size={18} className="animate-spin" /> Starting interview...</>
              ) : (
                <><Mic size={18} /> Start Interview</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
