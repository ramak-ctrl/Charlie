"use client";
import { useEffect, useRef, useState } from "react";
import { RetellWebClient } from "retell-client-js-sdk";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  accessToken: string;
  callId: string;
  candidateName: string;
  jobTitle: string;
  onCallEnded: () => void;
}

type AgentStatus = "connecting" | "listening" | "speaking" | "idle";

export default function ActiveInterview({ accessToken, callId, candidateName, jobTitle, onCallEnded }: Props) {
  const clientRef = useRef<RetellWebClient | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let active = true;
    let callLive = false;
    const client = new RetellWebClient();
    clientRef.current = client;

    client.on("call_started", () => {
      callLive = true;
      setAgentStatus("listening");
      timerRef.current = setInterval(() => setElapsedSecs((s) => s + 1), 1000);
    });

    client.on("agent_start_talking", () => setAgentStatus("speaking"));
    client.on("agent_stop_talking", () => setAgentStatus("listening"));

    client.on("call_ended", () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callLive && active) onCallEnded();
    });

    client.on("error", (err) => {
      console.error("[retell] SDK error:", err);
      if (timerRef.current) clearInterval(timerRef.current);
      if (active && !callLive) {
        const msg = err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err ?? "Unknown error");
        setError(`Connection failed: ${msg}. Please check your microphone and try again.`);
      }
    });

    async function initCall() {
      // Pre-warm mic permission and capture the device ID.
      // We pass captureDeviceId to startCall so the SDK reuses the same device
      // rather than calling getUserMedia cold — avoids a race condition where the
      // OS hasn't released the mic by the time the SDK re-acquires it (which would
      // create a call with no audio input track, making the agent appear to talk
      // without listening).
      let captureDeviceId: string | undefined;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        captureDeviceId = stream.getAudioTracks()[0]?.getSettings?.().deviceId;
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        if (active) setError("Microphone access denied. Please allow microphone access and refresh.");
        return;
      }

      if (!active) return;

      // Give the OS ~150ms to fully release the mic before the SDK re-acquires it.
      await new Promise((r) => setTimeout(r, 150));
      if (!active) return;

      try {
        await client.startCall({ accessToken, captureDeviceId });
      } catch (err) {
        console.error("[retell] startCall error:", err);
        if (active) setError("Failed to connect. Please check your connection and try again.");
      }
    }

    initCall();

    return () => {
      active = false;
      if (timerRef.current) clearInterval(timerRef.current);
      client.stopCall();
    };
  }, [accessToken]);

  function toggleMute() {
    if (!clientRef.current) return;
    if (isMuted) {
      clientRef.current.unmute();
    } else {
      clientRef.current.mute();
    }
    setIsMuted(!isMuted);
  }

  function endCall() {
    clientRef.current?.stopCall();
    if (timerRef.current) clearInterval(timerRef.current);
    onCallEnded();
  }

  const mins = Math.floor(elapsedSecs / 60).toString().padStart(2, "0");
  const secs = (elapsedSecs % 60).toString().padStart(2, "0");

  return (
    <div className="min-h-screen bg-[#0B1711] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[#8FA89A] text-sm">{jobTitle}</p>
          <p className="text-white font-medium mt-0.5">{candidateName}</p>
        </div>

        {/* Agent visual */}
        <div className="relative inline-flex items-center justify-center mb-10">
          {agentStatus === "speaking" && (
            <>
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse-ring" />
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse-ring [animation-delay:0.5s]" />
            </>
          )}
          <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
            agentStatus === "speaking" ? "bg-emerald-500 scale-110" :
            agentStatus === "listening" ? "bg-[#1A2E22]" :
            "bg-[#11231A]"
          }`}>
            <span className="text-4xl font-bold text-white">C</span>
          </div>
        </div>

        {/* Status */}
        <div className="mb-2">
          <p className="text-white text-lg font-semibold">
            {agentStatus === "connecting" && "Connecting..."}
            {agentStatus === "speaking" && "Charlie is speaking"}
            {agentStatus === "listening" && "Listening..."}
            {agentStatus === "idle" && "Ready"}
          </p>
        </div>

        {/* Timer */}
        <p className="text-[#8FA89A] text-sm font-mono mb-12">{mins}:{secs}</p>

        {error && (
          <div className="mb-6 text-rose-300 text-sm bg-rose-900/20 border border-rose-800/60 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            aria-pressed={isMuted}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted ? "bg-rose-800 text-rose-200" : "bg-[#1A2E22] text-[#D6E4DC] hover:bg-[#234032]"
            }`}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            onClick={endCall}
            aria-label="End interview"
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all shadow-lg shadow-rose-900/30"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>

        <p className="text-[#5E7A6C] text-xs mt-8">
          This interview is conducted by an AI agent and is being recorded.
        </p>
      </div>
    </div>
  );
}
