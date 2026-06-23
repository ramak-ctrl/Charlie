"use client";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import {
  PipecatClientProvider,
  PipecatClientAudio,
  usePipecatClient,
  usePipecatClientTransportState,
  usePipecatClientMicControl,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";
import { PipecatClient, RTVIEvent } from "@pipecat-ai/client-js";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import { Mic, MicOff, PhoneOff } from "lucide-react";

interface Props {
  botUrl: string;
  config: Record<string, unknown>;
  candidateName: string;
  jobTitle: string;
  onCallEnded: () => void;
}

type AgentStatus = "connecting" | "listening" | "speaking" | "idle";

// ── Inner: runs inside PipecatClientProvider ──────────────────────────────────
function Inner({ botUrl, config, candidateName, jobTitle, onCallEnded }: Props) {
  const client = usePipecatClient();
  const transportState = usePipecatClientTransportState();
  const { isMicEnabled, enableMic } = usePipecatClientMicControl();

  const [agentStatus, setAgentStatus] = useState<AgentStatus>("connecting");
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef = useRef(false);
  const startedRef = useRef(false);
  const wasLiveRef = useRef(false);

  const isLive = transportState === "connected" || transportState === "ready";

  useRTVIClientEvent(RTVIEvent.BotStartedSpeaking, () => setAgentStatus("speaking"));
  useRTVIClientEvent(RTVIEvent.BotStoppedSpeaking, () => setAgentStatus("listening"));
  useRTVIClientEvent(RTVIEvent.BotDisconnected, () => endCall());

  // Start the call once on mount
  useEffect(() => {
    if (startedRef.current || !client) return;
    startedRef.current = true;

    // NOTE: no "active" abort flag here. Under React StrictMode the component is
    // mounted → unmounted → remounted; an abort flag would cancel the only connect
    // attempt. The startedRef guard above already ensures we connect exactly once.
    (async () => {
      // Pre-request mic so the stream is ready before WebRTC publishes.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch (e) {
        console.error("Microphone error:", e);
        setError("Microphone access denied. Please allow microphone access and refresh.");
        return;
      }
      try {
        await client.startBotAndConnect({
          endpoint: `${botUrl}/start`,
          requestData: { body: config },
        });
      } catch (e) {
        console.error("Voice connect error:", e);
        setError("Failed to connect. Please check your connection and try again.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  // Drive status + timer off transport state
  useEffect(() => {
    if (isLive) {
      wasLiveRef.current = true;
      if (agentStatus === "connecting") setAgentStatus("listening");
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setElapsedSecs((s) => s + 1), 1000);
      }
      return;
    }
    // Only treat a drop as "interview over" once we've actually connected — the
    // transport starts in "disconnected", so don't end on the initial state.
    if (transportState === "disconnected" && wasLiveRef.current) {
      endCall();
    } else if (transportState === "error") {
      if (wasLiveRef.current) endCall();
      else setError("Failed to connect. Please check your microphone and try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transportState]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function endCall() {
    if (endedRef.current) return;
    endedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      client?.disconnect();
    } catch {
      /* noop */
    }
    onCallEnded();
  }

  function toggleMute() {
    enableMic(!isMicEnabled);
  }

  const mins = Math.floor(elapsedSecs / 60).toString().padStart(2, "0");
  const secs = (elapsedSecs % 60).toString().padStart(2, "0");

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <PipecatClientAudio />
      <div className="w-full max-w-sm text-center">
        {/* Header */}
        <div className="mb-10">
          <p className="text-gray-500 text-sm">{jobTitle}</p>
          <p className="text-white font-medium mt-0.5">{candidateName}</p>
        </div>

        {/* Agent visual */}
        <div className="relative inline-flex items-center justify-center mb-10">
          {agentStatus === "speaking" && (
            <>
              <div className="absolute inset-0 rounded-full bg-indigo-600/20 animate-pulse-ring" />
              <div className="absolute inset-0 rounded-full bg-indigo-600/10 animate-pulse-ring [animation-delay:0.5s]" />
            </>
          )}
          <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
            agentStatus === "speaking" ? "bg-indigo-600 scale-110" :
            agentStatus === "listening" ? "bg-gray-800" :
            "bg-gray-900"
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
        <p className="text-gray-500 text-sm font-mono mb-12">{mins}:{secs}</p>

        {error && (
          <div className="mb-6 text-rose-400 text-sm bg-rose-900/20 border border-rose-800 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={toggleMute}
            aria-label={!isMicEnabled ? "Unmute microphone" : "Mute microphone"}
            aria-pressed={!isMicEnabled}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              !isMicEnabled ? "bg-rose-800 text-rose-200" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {!isMicEnabled ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <button
            onClick={endCall}
            aria-label="End interview"
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all shadow-lg shadow-rose-900/30"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>

        <p className="text-gray-600 text-xs mt-8">
          This interview is conducted by an AI agent and is being recorded.
        </p>
      </div>
    </div>
  );
}

// ── Outer: owns the PipecatClient instance + provider ─────────────────────────
export default function ActiveInterviewPipecat(props: Props) {
  const clientRef = useRef<PipecatClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = new PipecatClient({
      transport: new SmallWebRTCTransport(),
      enableMic: true,
      enableCam: false,
    });
  }

  // client-react inlines its own PipecatClient type, so cast to exactly what the
  // provider expects (same runtime class — only a nominal-type mismatch).
  const providerClient = clientRef.current as unknown as ComponentProps<typeof PipecatClientProvider>["client"];

  return (
    <PipecatClientProvider client={providerClient}>
      <Inner {...props} />
    </PipecatClientProvider>
  );
}
