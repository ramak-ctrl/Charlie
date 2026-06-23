"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import CharlieLogo from "@/components/CharlieLogo";

export const dynamic = "force-dynamic";

const C = {
  bg:     "#F8F5EE",
  dark:   "#1C3829",
  mid:    "#3D6B54",
  muted:  "#7A9E8E",
  lime:   "#B8E04A",
  sidebar:"#172F22",
  border: "rgba(28,56,41,0.12)",
};

const FEATURES = [
  "AI voice interviews — no scheduling",
  "5-axis candidate scoring in under 60s",
  "Role-fit criteria checked against transcripts",
  "Automatic candidate ranking per role",
];

export default function LoginPage() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.href = "/dashboard";
    });
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function switchMode(next: "login" | "signup" | "forgot") {
    setMode(next);
    setError(null);
    setSuccessMsg(null);
    setShowPassword(false);
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    const supabase = createClient();

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) setError(error.message);
      else setSuccessMsg("Reset link sent — check your inbox.");
      setLoading(false);
      return;
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); }
      else window.location.href = "/dashboard";
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); }
      else window.location.href = "/dashboard";
    }
  }, [email, password, mode]);

  const title    = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";
  const subtitle = mode === "login" ? "Sign in to your recruiter dashboard" : mode === "signup" ? "Start screening candidates with AI" : "We'll send a reset link to your email";
  const btnLabel = mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link";

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      fontFamily: "'Inter', system-ui, sans-serif",
      background: C.bg,
    }}>

      {/* ── Left panel: brand ── */}
      <div style={{
        width: "42%", flexShrink: 0,
        background: C.sidebar,
        display: "flex", flexDirection: "column",
        padding: "48px 52px",
        position: "relative", overflow: "hidden",
      }}>
        {/* bg texture dots */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`, backgroundSize: "24px 24px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.lime}14, transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <CharlieLogo size="xl" href="/" />
        </div>

        {/* Main copy */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <h1 style={{
            fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 900,
            letterSpacing: "-2px", lineHeight: 1.1,
            color: "#fff", marginBottom: 20,
          }}>
            Screen candidates<br />
            <span style={{ color: C.lime }}>10× faster.</span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, marginBottom: 40, maxWidth: 340 }}>
            Charlie runs first-round voice interviews, scores every candidate, and hands you a ranked shortlist — automatically.
          </p>

          {/* Feature list */}
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {FEATURES.map((f, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${C.lime}20`, border: `1px solid ${C.lime}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 style={{ width: 12, height: 12, color: C.lime }} />
                </div>
                <span style={{ fontSize: 13.5, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ width: 32, height: 2, background: C.lime, borderRadius: 2, marginBottom: 14 }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.75, fontStyle: "italic", maxWidth: 340 }}>
            &ldquo;Charlie conducted meaningful screening conversations that helped us efficiently gather relevant candidate insights.&rdquo;
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 10, fontWeight: 600 }}>— Mechispike</p>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div style={{
        flex: 1,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px 40px",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Mode tabs */}
          <div style={{ display: "flex", gap: 0, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, marginBottom: 36 }}>
            {(["login", "signup"] as const).map(m => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600, borderRadius: 9,
                  border: "none", cursor: "pointer", transition: "all 0.18s",
                  background: mode === m ? C.dark : "transparent",
                  color: mode === m ? "#fff" : C.muted,
                  boxShadow: mode === m ? "0 2px 8px rgba(28,56,41,0.18)" : "none",
                }}>
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Title */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.dark, letterSpacing: "-0.8px", marginBottom: 4 }}>{title}</h2>
            <p style={{ fontSize: 13, color: C.muted }}>{subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div>
              <Label htmlFor="email" style={{ fontSize: 12.5, fontWeight: 600, color: C.dark, display: "block", marginBottom: 6 }}>Email address</Label>
              <Input
                id="email" type="email" placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email"
                style={{
                  background: "#fff",
                  border: `1px solid ${C.border}`,
                  color: C.dark, borderRadius: 10, fontSize: 14,
                  height: 44, padding: "0 14px",
                  boxShadow: "0 1px 4px rgba(28,56,41,0.06)",
                  outline: "none",
                }}
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Label htmlFor="password" style={{ fontSize: 12.5, fontWeight: 600, color: C.dark }}>Password</Label>
                  {mode === "login" && (
                    <button type="button" onClick={() => switchMode("forgot")}
                      style={{ background: "none", border: "none", color: C.mid, fontWeight: 500, cursor: "pointer", fontSize: 12, textDecoration: "underline", textUnderlineOffset: 2 }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    required autoComplete={mode === "login" ? "current-password" : "new-password"}
                    minLength={8}
                    style={{ background: "#fff", border: `1px solid ${C.border}`, color: C.dark, borderRadius: 10, fontSize: 14, height: 44, paddingLeft: 14, paddingRight: 44, boxShadow: "0 1px 4px rgba(28,56,41,0.06)" }}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", padding: 0 }}>
                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div style={{ fontSize: 13, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px" }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{ fontSize: 13, color: "#065F46", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, padding: "10px 14px" }}>
                {successMsg}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                background: C.dark, color: "#fff",
                border: "none", borderRadius: 10, padding: "13px 0",
                fontWeight: 700, fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 16px rgba(28,56,41,0.22)", marginTop: 4,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(28,56,41,0.28)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(28,56,41,0.22)"; }}>
              {loading && <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
              {btnLabel}
            </button>
          </form>

          {/* Forgot password back link */}
          {mode === "forgot" && (
            <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 20 }}>
              Remember it?{" "}
              <button type="button" onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: C.mid, fontWeight: 600, cursor: "pointer", fontSize: 13, textDecoration: "underline", textUnderlineOffset: 2 }}>
                Back to sign in
              </button>
            </p>
          )}

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0" }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12, color: C.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* Back to landing */}
          <a href="/" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, fontWeight: 500, color: C.mid, textDecoration: "none", padding: "11px 0", border: `1px solid ${C.border}`, borderRadius: 10, background: "#fff", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.muted; e.currentTarget.style.color = C.dark; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.mid; }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M7 3l-4 4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to homepage
          </a>
        </div>
      </div>
    </div>
  );
}
