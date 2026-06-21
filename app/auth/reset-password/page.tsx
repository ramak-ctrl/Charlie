"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import CharlieLogo from "@/components/CharlieLogo";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); }
    else {
      setDone(true);
      setTimeout(() => { window.location.href = "/auth/login"; }, 2500);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <CharlieLogo size="xl" href="/" />
        </div>

        <div style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "36px 32px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.5px", marginBottom: 4 }}>
            Set new password
          </h2>
          <p style={{ fontSize: 13, color: "#71717a", marginBottom: 28 }}>
            Choose a strong password for your account.
          </p>

          {done ? (
            <div style={{ fontSize: 14, color: "#34d399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
              Password updated! Redirecting to sign in…
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* New password */}
              <div>
                <Label htmlFor="password" style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa", display: "block", marginBottom: 6 }}>New password</Label>
                <div style={{ position: "relative" }}>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required minLength={8} autoComplete="new-password"
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

              {/* Confirm password */}
              <div>
                <Label htmlFor="confirm" style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa", display: "block", marginBottom: 6 }}>Confirm password</Label>
                <div style={{ position: "relative" }}>
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    required minLength={8} autoComplete="new-password"
                    style={{ background: "#18181d", border: "1px solid rgba(255,255,255,0.1)", color: "#fafaf9", borderRadius: 8, fontSize: 14, paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#71717a", display: "flex", alignItems: "center", padding: 0 }}
                  >
                    {showConfirm ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ fontSize: 13, color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ background: "#7c3aed", color: "#fff", border: "1px solid rgba(124,58,237,0.8)", borderRadius: 9, padding: "12px 0", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(124,58,237,0.3)", marginTop: 4 }}
              >
                {loading && <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />}
                Update password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
