"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
      else { window.location.href = "/dashboard"; }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); }
      else { window.location.href = "/dashboard"; }
    }
  }, [email, password, mode]);

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";
  const subtitle = mode === "login" ? "Sign in to your recruiter dashboard" : mode === "signup" ? "Start screening candidates with AI" : "We'll send a reset link to your email";
  const btnLabel = mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link";

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
            {title}
          </h2>
          <p style={{ fontSize: 13, color: "#71717a", marginBottom: 28 }}>
            {subtitle}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Email */}
            <div>
              <Label htmlFor="email" style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa", display: "block", marginBottom: 6 }}>Email</Label>
              <Input
                id="email" type="email" placeholder="you@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email"
                style={{ background: "#18181d", border: "1px solid rgba(255,255,255,0.1)", color: "#fafaf9", borderRadius: 8, fontSize: 14 }}
              />
            </div>

            {/* Password — hidden in forgot mode */}
            {mode !== "forgot" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Label htmlFor="password" style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa" }}>Password</Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 500, cursor: "pointer", fontSize: 12 }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required autoComplete={mode === "login" ? "current-password" : "new-password"}
                    minLength={8}
                    style={{ background: "#18181d", border: "1px solid rgba(255,255,255,0.1)", color: "#fafaf9", borderRadius: 8, fontSize: 14, paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#71717a", display: "flex", alignItems: "center", padding: 0 }}
                  >
                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>
            )}

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
              {btnLabel}
            </button>
          </form>

          {/* Footer link */}
          <p style={{ textAlign: "center", fontSize: 13, color: "#52525b", marginTop: 20 }}>
            {mode === "forgot" ? (
              <>
                Remember it?{" "}
                <button type="button" onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                  Back to sign in
                </button>
              </>
            ) : mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => switchMode("signup")} style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "#a78bfa", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
