"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import CharlieLogo from "@/components/CharlieLogo";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.href = "/dashboard";
    });
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); }
      else { window.location.href = "/dashboard"; }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); }
      else { window.location.href = "/dashboard"; }
    }
  }, [email, password, mode]);

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <CharlieLogo size="xl" href="/" />
        </div>

        {/* Card */}
        <div style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "36px 32px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.5px", marginBottom: 4 }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p style={{ fontSize: 13, color: "#71717a", marginBottom: 28 }}>
            {mode === "login" ? "Sign in to your recruiter dashboard" : "Start screening candidates with AI"}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <Label htmlFor="email" style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa", display: "block", marginBottom: 6 }}>Email</Label>
              <Input
                id="email" type="email" placeholder="you@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email"
                style={{ background: "#18181d", border: "1px solid rgba(255,255,255,0.1)", color: "#fafaf9", borderRadius: 8, fontSize: 14 }}
              />
            </div>
            <div>
              <Label htmlFor="password" style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa", display: "block", marginBottom: 6 }}>Password</Label>
              <Input
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                style={{ background: "#18181d", border: "1px solid rgba(255,255,255,0.1)", color: "#fafaf9", borderRadius: 8, fontSize: 14 }}
              />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px" }}>
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{ fontSize: 13, color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 8, padding: "10px 14px" }}>
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ background: "#7c3aed", color: "#fff", border: "1px solid rgba(124,58,237,0.8)", borderRadius: 9, padding: "12px 0", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(124,58,237,0.3)", marginTop: 4 }}
            >
              {loading && <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 13, color: "#52525b", marginTop: 20 }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
              style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
