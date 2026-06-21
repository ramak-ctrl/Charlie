import Link from "next/link";
import CharlieLogo from "@/components/CharlieLogo";

const C = {
  bg:     "#F0EDE4",
  dark:   "#1C3829",
  mid:    "#3D6B54",
  muted:  "#7A9E8E",
  lime:   "#B8E04A",
  card:   "#FFFFFF",
  border: "rgba(28, 56, 41, 0.1)",
};

const FEATURES = [
  {
    title: "AI Voice Interviews",
    desc: "Charlie conducts structured voice interviews — natural, professional, and consistent for every candidate.",
    icon: <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><rect x="6" y="1" width="6" height="10" rx="3" stroke={C.dark} strokeWidth="1.5"/><path d="M3 9a6 6 0 0012 0" stroke={C.dark} strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="15" x2="9" y2="17" stroke={C.dark} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    title: "Instant Evaluation Reports",
    desc: "Scored reports with communication, composure, professionalism, seriousness, and reliability — auto-generated.",
    icon: <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="11" rx="2" stroke={C.dark} strokeWidth="1.5"/><path d="M5 8h8M5 11h5" stroke={C.dark} strokeWidth="1.5" strokeLinecap="round"/><path d="M6 1v3M12 1v3" stroke={C.dark} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    title: "Screen at Scale",
    desc: "Invite hundreds of candidates at once. Charlie screens them simultaneously, day or night, without fatigue.",
    icon: <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M1 9h3L5.5 3 8 15l2.5-7L12 11l1.5-2H17" stroke={C.dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    title: "One-click Invites",
    desc: "Generate a unique interview link per candidate. Share it instantly — no scheduling, no back-and-forth.",
    icon: <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><path d="M6 9a3 3 0 106 0 3 3 0 00-6 0z" stroke={C.dark} strokeWidth="1.5"/><path d="M2 9h1m12 0h1M9 2v1m0 12v1M4.2 4.2l.7.7m8-8l.7.7M4.2 13.8l.7-.7m8 0l.7.7" stroke={C.dark} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    title: "LLM-Powered Analysis",
    desc: "Fast, accurate, structured evaluation tailored to your job's key skills and custom screening questions.",
    icon: <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke={C.dark} strokeWidth="1.5"/><path d="M6 9l2 2 4-4" stroke={C.dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    title: "Private & Secure",
    desc: "All candidate data lives in your own database. Row-level security enforced. Nothing shared externally.",
    icon: <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><rect x="4" y="8" width="10" height="8" rx="1.5" stroke={C.dark} strokeWidth="1.5"/><path d="M6 8V6a3 3 0 016 0v2" stroke={C.dark} strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="12" r="1" fill={C.dark}/></svg>,
  },
];

const STEPS = [
  { title: "Create a job",       desc: "Define the role, key skills, and screening questions. Charlie learns exactly what to ask each candidate." },
  { title: "Invite candidates",  desc: "Add candidates and share their unique link. They complete the interview at their own convenience." },
  { title: "Review reports",     desc: "Receive a scored report with full transcript, strengths, concerns, and a clear hiring recommendation." },
];

export default function LandingPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: C.dark }}>

      {/* ── NAV ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", padding: "22px 40px" }}>
        <CharlieLogo size="xl" color={C.dark} />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Link href="#features" style={{ padding: "8px 16px", fontSize: 14, fontWeight: 500, color: C.mid, borderRadius: 100, textDecoration: "none" }}>Features</Link>
          <Link href="#how"      style={{ padding: "8px 16px", fontSize: 14, fontWeight: 500, color: C.mid, borderRadius: 100, textDecoration: "none" }}>How it works</Link>
          <Link href="/auth/login" style={{ padding: "8px 16px", fontSize: 14, fontWeight: 500, color: C.mid, borderRadius: 100, textDecoration: "none" }}>Sign in</Link>
          <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.dark, color: "#fff", padding: "9px 22px", borderRadius: 100, fontWeight: 600, fontSize: 14, textDecoration: "none", marginLeft: 8 }}>
            Get started
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 40px 80px", textAlign: "center" }}>

        {/* Social proof pill */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 100, padding: "6px 18px 6px 6px", fontSize: 13, fontWeight: 500, color: C.mid, marginBottom: 40, boxShadow: "0 2px 12px rgba(28,56,41,0.07)" }}>
          <span style={{ background: C.lime, borderRadius: 100, padding: "2px 12px", fontSize: 11, fontWeight: 700, color: C.dark, letterSpacing: "0.5px" }}>NEW</span>
          AI voice interviews · no scheduling required
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(44px, 7vw, 76px)", fontWeight: 900, letterSpacing: "-3px", lineHeight: 1.05, color: C.dark, marginBottom: 28 }}>
          First-round interviews,<br />
          <span style={{ position: "relative", display: "inline-block" }}>
            fully automated.
            {/* Hand-drawn lime underline */}
            <svg viewBox="0 0 480 18" style={{ position: "absolute", bottom: -6, left: 0, width: "100%", height: 18, overflow: "visible" }} preserveAspectRatio="none">
              <path d="M4 13 Q80 4 160 11 Q260 18 360 10 Q420 6 476 13" stroke={C.lime} strokeWidth="5" fill="none" strokeLinecap="round"/>
            </svg>
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: 17, color: C.mid, maxWidth: 480, margin: "0 auto 44px", lineHeight: 1.85 }}>
          Charlie conducts structured AI voice interviews, scores every candidate across 5 dimensions, and delivers detailed reports — instantly.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.dark, color: "#fff", padding: "14px 32px", borderRadius: 100, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
            Get started free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Link href="#how" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", color: C.dark, padding: "14px 32px", borderRadius: 100, fontWeight: 600, fontSize: 15, border: `1.5px solid rgba(28,56,41,0.25)`, textDecoration: "none" }}>
            See how it works
          </Link>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", maxWidth: 720, margin: "64px auto 0", background: C.dark, borderRadius: 22, overflow: "hidden" }}>
          {[
            { n: "24/7",   l: "Always available" },
            { n: "<60s",   l: "Report after call" },
            { n: "5 axes", l: "Structured scoring" },
            { n: "Free",   l: "No card required" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "28px 20px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-1px", color: C.lime }}>{s.n}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6, fontWeight: 500 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── dark bg section */}
      <div id="features" style={{ background: C.dark }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "90px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40, flexWrap: "wrap", marginBottom: 52 }}>
            <div>
              <div style={{ display: "inline-block", background: C.lime, color: C.dark, fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", borderRadius: 100, padding: "4px 14px", marginBottom: 16 }}>Features</div>
              <div style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-1.5px", color: "#fff", lineHeight: 1.1 }}>
                Everything you need<br />to screen at scale
              </div>
            </div>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.85, maxWidth: 420, paddingTop: 4 }}>
              From invite to evaluation report — Charlie manages the entire first-round process without any human involvement.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: C.lime, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", lineHeight: 1.8 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── cream bg */}
      <div id="how" style={{ maxWidth: 1200, margin: "0 auto", padding: "90px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: C.lime, color: C.dark, fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", borderRadius: 100, padding: "4px 14px", marginBottom: 16 }}>How it works</div>
        <div style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-1.5px", color: C.dark, lineHeight: 1.1, maxWidth: 480, margin: "0 auto 52px" }}>
          Three steps to your first AI interview
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: 860, margin: "0 auto" }}>
          {STEPS.map((s, i) => (
            <div key={s.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: "36px 28px", boxShadow: "0 4px 24px rgba(28,56,41,0.06)", textAlign: "left" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: C.lime, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: C.dark, marginBottom: 20 }}>
                0{i + 1}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: C.mid, lineHeight: 1.8 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA BANNER ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px 100px" }}>
        <div style={{ background: C.dark, borderRadius: 28, padding: "80px 40px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: C.lime, color: C.dark, fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", borderRadius: 100, padding: "4px 14px", marginBottom: 20 }}>Get started</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-2px", color: "#fff", marginBottom: 12 }}>
            Ready to screen smarter?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, marginBottom: 36 }}>
            Free to start. No credit card. No scheduling headaches.
          </p>
          <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: C.lime, color: C.dark, padding: "16px 44px", borderRadius: 100, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
            Get started free
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, maxWidth: 1200, margin: "0 auto", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <CharlieLogo size="md" color={C.dark} />
        <span style={{ fontSize: 12, color: C.muted }}>© 2026 Charlie · AI-powered recruitment screening</span>
      </footer>
    </div>
  );
}
