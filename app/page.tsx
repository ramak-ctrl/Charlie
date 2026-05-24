import Link from "next/link";
import CharlieLogo from "@/components/CharlieLogo";

export default function LandingPage() {
  return (
    <div style={{ background: "#09090b", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: "#fafaf9" }}>

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", padding: "20px 40px" }}>
        <CharlieLogo size="md" />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="#features" style={{ padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#a1a1aa", border: "1px solid rgba(255,255,255,0.07)", transition: "color .2s" }}>Features</Link>
          <Link href="#how" style={{ padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#a1a1aa", border: "1px solid rgba(255,255,255,0.07)" }}>How it works</Link>
          <Link href="/auth/login" style={{ padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, color: "#fff", background: "#7c3aed", border: "1px solid rgba(124,58,237,0.8)", boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.4)" }}>Sign In</Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 65%)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 40px 80px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#18181d", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 500, color: "#a1a1aa", marginBottom: 36 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block", boxShadow: "0 0 6px #34d399" }} />
            AI-powered recruitment · available 24/7
          </div>

          <h1 style={{ fontSize: "clamp(44px, 7vw, 76px)", fontWeight: 900, letterSpacing: "-3px", lineHeight: 1.0, color: "#fafaf9", marginBottom: 24 }}>
            First-round interviews,<br />
            <span style={{ background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              fully automated.
            </span>
          </h1>

          <p style={{ fontSize: 17, color: "#a1a1aa", maxWidth: 440, margin: "0 auto 44px", lineHeight: 1.8 }}>
            Charlie conducts structured AI voice interviews, scores every candidate across 5 dimensions, and delivers detailed reports — instantly.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#7c3aed", color: "#fff", padding: "13px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15, border: "1px solid rgba(124,58,237,0.8)", boxShadow: "0 4px 24px rgba(124,58,237,0.35)" }}>
              Get started free
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <Link href="#how" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#18181d", color: "#a1a1aa", padding: "13px 28px", borderRadius: 10, fontWeight: 600, fontSize: 15, border: "1px solid rgba(255,255,255,0.12)" }}>
              See how it works
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", maxWidth: 720, margin: "64px auto 0", background: "#111115", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
            {[
              { n: "24/7", l: "Always available" },
              { n: "<60s", l: "Report after call" },
              { n: "5 axes", l: "Structured scoring" },
              { n: "Free", l: "No card required" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "24px 20px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-1px", background: "linear-gradient(135deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{s.n}</div>
                <div style={{ fontSize: 11, color: "#52525b", marginTop: 5, fontWeight: 500 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "90px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#a78bfa", marginBottom: 12 }}>Features</div>
            <div style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-1.5px", color: "#fafaf9", lineHeight: 1.1 }}>Everything you need<br />to screen at scale</div>
          </div>
          <p style={{ fontSize: 15, color: "#a1a1aa", lineHeight: 1.8, maxWidth: 440, paddingTop: 4 }}>From invite to evaluation report — Charlie manages the entire first-round process without any human involvement.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 52 }}>
          {[
            { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="6" y="1" width="6" height="10" rx="3" stroke="#a78bfa" strokeWidth="1.5"/><path d="M3 9a6 6 0 0012 0" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="15" x2="9" y2="17" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: "AI Voice Interviews", desc: "Charlie conducts structured voice interviews — natural, professional, and consistent for every candidate." },
            { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="11" rx="2" stroke="#a78bfa" strokeWidth="1.5"/><path d="M5 8h8M5 11h5" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 1v3M12 1v3" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: "Instant Evaluation Reports", desc: "Scored reports with communication, composure, professionalism, seriousness, and reliability — auto-generated." },
            { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1 9h3L5.5 3 8 15l2.5-7L12 11l1.5-2H17" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, title: "Screen at Scale", desc: "Invite hundreds of candidates at once. Charlie screens them simultaneously, day or night, without fatigue." },
            { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M6 9a3 3 0 106 0 3 3 0 00-6 0z" stroke="#a78bfa" strokeWidth="1.5"/><path d="M2 9h1m12 0h1M9 2v1m0 12v1M4.2 4.2l.7.7m8-8l.7.7M4.2 13.8l.7-.7m8 0l.7.7" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: "One-click Invites", desc: "Generate a unique interview link per candidate. Share it instantly — no scheduling, no back-and-forth." },
            { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#a78bfa" strokeWidth="1.5"/><path d="M6 9l2 2 4-4" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, title: "LLM-Powered Analysis", desc: "Fast, accurate, structured evaluation tailored to your job's key skills and custom screening questions." },
            { icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="4" y="8" width="10" height="8" rx="1.5" stroke="#a78bfa" strokeWidth="1.5"/><path d="M6 8V6a3 3 0 016 0v2" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="12" r="1" fill="#a78bfa"/></svg>, title: "Private & Secure", desc: "All candidate data lives in your own database. Row-level security enforced. Nothing shared externally." },
          ].map((f) => (
            <div key={f.title} style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 28 }}>
              <div style={{ width: 40, height: 40, borderRadius: 9, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fafaf9", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.75 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)" }} />

      {/* HOW IT WORKS */}
      <div id="how" style={{ maxWidth: 1200, margin: "0 auto", padding: "90px 40px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "#a78bfa", marginBottom: 12 }}>How it works</div>
        <div style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-1.5px", color: "#fafaf9", lineHeight: 1.1, maxWidth: 480, margin: "0 auto 52px" }}>
          Three steps to your first AI interview
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: 760, margin: "0 auto" }}>
          {[
            { n: "STEP 01", title: "Create a job", desc: "Define the role, key skills, and screening questions. Charlie learns exactly what to ask each candidate." },
            { n: "STEP 02", title: "Invite candidates", desc: "Add candidates and share their unique link. They complete the interview at their own convenience." },
            { n: "STEP 03", title: "Review reports", desc: "Receive a scored report with full transcript, strengths, concerns, and a clear hiring recommendation." },
          ].map((s) => (
            <div key={s.n} style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "32px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "#a78bfa", marginBottom: 16 }}>{s.n}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fafaf9", marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.75 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.07)" }} />

      {/* CTA */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 40px 100px" }}>
        <div style={{ background: "#111115", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "72px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-2px", color: "#fafaf9", marginBottom: 12, position: "relative" }}>Ready to screen smarter?</h2>
          <p style={{ color: "#a1a1aa", fontSize: 15, marginBottom: 36, position: "relative" }}>Free to start. No credit card. No scheduling headaches.</p>
          <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#7c3aed", color: "#fff", padding: "16px 44px", borderRadius: 12, fontWeight: 700, fontSize: 16, border: "1px solid rgba(124,58,237,0.8)", boxShadow: "0 8px 32px rgba(124,58,237,0.35)", position: "relative" }}>
            Get started free
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", maxWidth: 1200, margin: "0 auto", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <CharlieLogo size="sm" />
        <span style={{ fontSize: 12, color: "#3f3f46" }}>© 2026 Charlie · AI-powered recruitment screening</span>
      </footer>
    </div>
  );
}
